import EventEmitter from "events";
import http from "http";
import { URL } from "url";
import {
  WebSocketInitializationError,
  WebSocketHandshakeError,
  WebSocketError,
  WebSocketUnsupportedError,
} from "./exceptions";
import crypto from "crypto";
import * as Utilities from "./utilities";
import { Socket } from "net";
import { assert } from "tsafe";
import {
  WebSocketFrame,
  WebSocketFrameCloseReason,
  WebSocketFrameOpcode,
} from "./frame";

/**
 * Represents the Websocket client's current state.
 */
type WebSocketConnectionState = "connecting" | "open" | "closing" | "closed";

/**
 * List of valid protocol prefixes supported.
 */
const VALID_PROTOCOLS: string[] = ["ws:"];

/**
 * Maps default port to each supported Websocket protocol.
 */
const DEFAULT_PORTS: { [p: string]: number } = {
  ws: 80,
};

/**
 * Maps the websocket protocol to its corresponding HTTP upgrade protocol.
 */
const WS_PROTO_TO_UPGRADE_PROTO: { [ws: string]: string } = {
  "ws:": "http:",
};

/**
 * The length (in bytes) of the Websocket secret nonce.
 */
const WS_SECRET_KEY_NONCE_SIZE = 16;

/**
 * The version of the Websocket secret.
 */
const WS_SECRET_VERSION = 13;

/**
 * The Websocket secret value.
 */
const WS_SECRET_VALUE = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

/**
 * Events supported by the Websocket client.
 */
enum WebSocketClientEvents {
  open = "open",
  message = "message",
  close = "close",
  ping = "ping",
  pong = "pong",
  error = "error",
}

/**
 * External Typescript overwrite of the event listener registration functions
 * of EventEmitter to be typesafe.
 */
export declare interface WebSocketClient {
  on(event: "open", listener: () => void): this;
  on(
    event: "message",
    listener: (data: Buffer, isBinary: boolean) => void
  ): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "close", listener: () => void): this;
  on(event: "ping" | "pong", listener: (data: Buffer) => void): this;
  on(event: "error", listener: (error: Error) => void): this;

  addListener(event: "open", listener: () => void): this;
  addListener(
    event: "message",
    listener: (data: Buffer, isBinary: boolean) => void
  ): this;
  addListener(event: "error", listener: (err: Error) => void): this;
  addListener(event: "close", listener: () => void): this;
  addListener(event: "ping" | "pong", listener: (data: Buffer) => void): this;
  addListener(event: "error", listener: (error: Error) => void): this;

  off(event: "open", listener: () => void): this;
  off(
    event: "message",
    listener: (data: Buffer, isBinary: boolean) => void
  ): this;
  off(event: "error", listener: (err: Error) => void): this;
  off(event: "close", listener: () => void): this;
  off(event: "ping" | "pong", listener: (data: Buffer) => void): this;
  off(event: "error", listener: (error: Error) => void): this;

  removeListener(event: "open", listener: () => void): this;
  removeListener(
    event: "message",
    listener: (data: Buffer, isBinary: boolean) => void
  ): this;
  removeListener(event: "error", listener: (err: Error) => void): this;
  removeListener(event: "close", listener: () => void): this;
  removeListener(
    event: "ping" | "pong",
    listener: (data: Buffer) => void
  ): this;
  removeListener(event: "error", listener: (error: Error) => void): this;
}

/**
 * The Websocket client that manages the Websocket connection to a Websocket
 * server.
 */
export class WebSocketClient extends EventEmitter {
  /** The URL connection string. */
  private readonly urlStr: string;
  /** The parsed URL object of the URL connection string. */
  private readonly url: URL;

  /** The current state of the Websocket client. */
  private state: WebSocketConnectionState;

  /** The TCP socket for the connection. */
  private socket?: Socket;

  constructor(url: string) {
    super();

    this.urlStr = url;
    this.url = this.parseAndValidateUrl(url);

    this.state = "connecting";
    this.socket = undefined;

    this.startConnection();
  }

  /**
   * Randomly generates a new masking key.
   *
   * @returns A masking key.
   */
  private generateMaskingKey(): number {
    return crypto.randomBytes(4).readUInt32BE();
  }

  /**
   * Parses the given URL string and ensures that it is a supported
   * Websocket URL.
   *
   * @param urlStr The URL string.
   * @returns A URL object.
   */
  private parseAndValidateUrl(urlStr: string): URL | never {
    const url = new URL(urlStr);

    if (!VALID_PROTOCOLS.includes(url.protocol))
      throw new WebSocketInitializationError(
        `Invalid protocol '${url.protocol}'`
      );

    if (url.port.length == 0) url.port = DEFAULT_PORTS[url.protocol].toString();

    return url;
  }

  /**
   * Validates that the given HTTP upgrade response is a valid Websocket
   * handshake. Raises an error if it is an invalid handshake response.
   *
   * @param res The HTTP upgrade response.
   * @param nonceB64 The nonce used when initiating the handshake.
   */
  private validateResHandshake(
    res: http.IncomingMessage,
    nonceB64: string
  ): void | never {
    // Invalid response code
    if (res.statusCode !== 101) {
      res.destroy();
      throw new WebSocketHandshakeError(
        `Server replied with status code: ${res.statusCode}`
      );
    }

    // Missing/invalid upgrade header
    const hdrUpgrade = res.headers["upgrade"];
    if (
      !hdrUpgrade ||
      !Utilities.caseInsensitiveEquals(hdrUpgrade, "websocket")
    ) {
      res.destroy();
      throw new WebSocketHandshakeError(`Missing or invalid upgrade header`);
    }

    // Missing/invalid connection header
    const hdrConnection = res.headers["connection"];
    if (
      !hdrConnection ||
      !Utilities.caseInsensitiveEquals(hdrConnection, "Upgrade")
    ) {
      res.destroy();
      throw new WebSocketHandshakeError(`Missing or invalid connection header`);
    }

    const hdrSecWsAccept = res.headers["sec-websocket-accept"];

    // Compute Sec-Websocket-Accept for confirmation
    const secWsAcceptClient = nonceB64 + WS_SECRET_VALUE;
    const secWsAcceptClientHash = crypto.createHash("sha1");
    secWsAcceptClientHash.update(secWsAcceptClient);
    const secWsAcceptClientHashB64 = secWsAcceptClientHash.digest("base64");

    // Missing/invalid Sec-Websocket-Accept header
    if (!hdrSecWsAccept || hdrSecWsAccept != secWsAcceptClientHashB64) {
      res.destroy();
      throw new WebSocketHandshakeError(
        `Missing or non-matching Sec-Websocket-Accept header.`
      );
    }

    // Note: ignoring Sec-WebSocket-Extensions and Sec-WebSocket-Protocol
    // headers since we do not support any extensions
  }

  /**
   * Initializes the WebSocket connection, dealing with the upgrade and setting
   * up initial listeners to the underlying TCP socket.
   */
  private startConnection() {
    const nonce = crypto.randomBytes(WS_SECRET_KEY_NONCE_SIZE);
    const nonceB64 = nonce.toString("base64");

    const req = http.get({
      headers: {
        Connection: "Upgrade",
        Upgrade: "websocket",
        "Sec-WebSocket-Key": nonceB64,
        "Sec-WebSocket-Version": WS_SECRET_VERSION,
      },
      protocol: WS_PROTO_TO_UPGRADE_PROTO[this.url.protocol],
      hash: this.url.hash,
      hostname: this.url.hostname,
      href: this.url.href,
      pathname: this.url.pathname,
      search: this.url.search,
      searchParams: this.url.searchParams,
      host: this.url.host,
      port: this.url.port,
    });

    req.on("upgrade", (res, socket, head) => {
      // Validate the result status code and headers
      this.validateResHandshake(res, nonceB64);

      this.state = "open";
      this.socket = socket;

      assert(this.socket);
      this.socket.once("close", this.onSocketClose.bind(this));
      this.socket.on("end", this.onSocketEnd.bind(this));
      this.socket.on("data", this.onSocketData.bind(this));
      this.socket.on("error", this.onSocketError.bind(this));

      this.emit(WebSocketClientEvents.open);
    });
  }

  /**
   * Handles when the TCP socket closes.
   *
   * @param hadError Indicates that there was an error when closing.
   */
  private onSocketClose(hadError: boolean) {
    if (this.state !== "closed") {
      this.finalizeClose();
    }
  }

  /**
   * Handles when the TCP socket ends.
   */
  private onSocketEnd() {
    if (this.state !== "closed") {
      this.finalizeClose();
    }
  }

  /**
   * Handles when an error occurs with the TCP socket.
   */
  private onSocketError(err: Error) {
    this.emit(WebSocketClientEvents.error, err);
  }

  /**
   * Handles when data is received from the TCP socket. Will parse the data
   * frame and respond accordingly, either emitting websocket ping, pong or
   * message, or handling closing the connection.
   *
   * @param data The data buffer.
   */
  private onSocketData(data: Buffer) {
    try {
      const frame = WebSocketFrame.fromBuffer(data);

      if (frame.opcode === WebSocketFrameOpcode.ping) {
        this.handlePingFrame(frame);
      } else if (frame.opcode === WebSocketFrameOpcode.pong) {
        this.handlePongFrame(frame);
      } else if (
        frame.opcode === WebSocketFrameOpcode.binary ||
        frame.opcode === WebSocketFrameOpcode.text
      ) {
        this.handleMessageFrame(frame);
      } else if (frame.opcode === WebSocketFrameOpcode.continuation) {
        throw new WebSocketUnsupportedError("Fragmentation not supported.");
      } else if (frame.opcode === WebSocketFrameOpcode.conn_close) {
        this.handleCloseFrame(frame);
      } else Utilities.notReached();
    } catch (err) {
      this.emit(WebSocketClientEvents.error, err);
    }
  }

  /**
   * Handles a received ping frame.
   *
   * @param frame The frame.
   */
  private handlePingFrame(frame: WebSocketFrame) {
    assert(frame.opcode === WebSocketFrameOpcode.ping);

    this.emit(WebSocketClientEvents.ping, frame.payloadData);
  }

  /**
   * Handles a received pong frame.
   *
   * @param frame The frame.
   */
  private handlePongFrame(frame: WebSocketFrame) {
    assert(frame.opcode === WebSocketFrameOpcode.pong);

    this.emit(WebSocketClientEvents.pong, frame.payloadData);
  }

  /**
   * Handles a received message frame.
   *
   * @param frame The frame.
   */
  private handleMessageFrame(frame: WebSocketFrame) {
    assert(
      frame.opcode === WebSocketFrameOpcode.binary ||
        frame.opcode === WebSocketFrameOpcode.text
    );

    const isBinary = frame.opcode === WebSocketFrameOpcode.binary;
    this.emit(WebSocketClientEvents.message, frame.payloadData, isBinary);
  }

  /**
   * Handles a received close frame.
   *
   * @param frame The frame.
   */
  private handleCloseFrame(frame: WebSocketFrame) {
    assert(frame.opcode === WebSocketFrameOpcode.conn_close);

    // We did not send a closing frame before so send one back
    if (this.state !== "closing") {
      this.sendFrame(
        WebSocketFrameOpcode.conn_close,
        undefined,
        WebSocketFrameCloseReason.normal
      );
    }

    this.finalizeClose();
  }

  /**
   * Finalizes the closing of the Websocket connection.
   */
  private finalizeClose() {
    this.state = "closed";

    if (this.socket) {
      this.socket.removeAllListeners("close");
      this.socket.removeAllListeners("end");
      this.socket.removeAllListeners("data");
      this.socket.removeAllListeners("error");
    }

    this.emit(WebSocketClientEvents.close);
  }

  /**
   * Sends a ping message.
   *
   * @param data Extra data.
   */
  public ping(data?: any) {
    this.sendFrame(WebSocketFrameOpcode.ping, data);
  }

  /**
   * Sends a pong message.
   *
   * @param data Extra data.
   */
  public pong(data?: any) {
    this.sendFrame(WebSocketFrameOpcode.pong, data);
  }

  /**
   * Sends a Websocket message.
   *
   * @param data The data of the message.
   */
  public send(data: any) {
    assert(this.state === "open");

    if (Utilities.isBuffer(data)) this.sendBuffer(data);
    else if (Utilities.isStringifiable(data))
      this.sendUTF8String(data.toString());
    else
      throw new WebSocketError(
        "Data type must be a buffer or implement toString"
      );
  }

  /**
   * Sends a Websocket buffer message.
   *
   * @param buffer The payload buffer.
   */
  private sendBuffer(buffer: Buffer) {
    this.sendFrame(WebSocketFrameOpcode.binary, buffer);
  }

  /**
   * Sends a Websocket UTF-8 string message.
   *
   * @param buffer The payload string.
   */
  private sendUTF8String(str: string) {
    const buffer = Buffer.from(str, "utf-8");
    this.sendFrame(WebSocketFrameOpcode.text, buffer);
  }

  /**
   * Sends a frame.
   *
   * @param opcode The opcode of the frame.
   * @param payloadData The payload of the frame.
   * @param closeReason The close reason of the frame, if needed.
   */
  private sendFrame(
    opcode: WebSocketFrameOpcode,
    payloadData?: Buffer,
    closeReason?: WebSocketFrameCloseReason
  ) {
    // Outgoing frames from client must always be masked
    const maskingKey = this.generateMaskingKey();

    const frame = new WebSocketFrame({
      fin: true,
      mask: true,
      maskingKey,
      opcode,
      payloadBytesLen: payloadData?.length ?? 0,
      payloadData,
      closeReason,
    });

    // Send the frame
    assert(this.socket);
    this.socket.write(frame.toBuffer());
  }

  /**
   * Closes the Websocket connection with the given close code.
   *
   * @param code The close code.
   * @param data Extra payload data.
   */
  public close(
    code: number = WebSocketFrameCloseReason.normal,
    data?: string | Buffer
  ): void {
    // Do nothing if the client is not already open
    if (this.state !== "open") return;

    this.state = "closing";

    let dataBuffer: Buffer | undefined;
    if (Utilities.isStringifiable(data))
      dataBuffer = Buffer.from(data!.toString(), "utf-8");

    // Send close frame
    this.sendFrame(WebSocketFrameOpcode.conn_close, dataBuffer, code);
  }
}
