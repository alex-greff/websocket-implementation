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

type WebSocketConnectionState = "connecting" | "open" | "closing" | "closed";

const VALID_PROTOCOLS: string[] = ["ws:"];
const DEFAULT_PORTS: { [p: string]: number } = {
  ws: 80,
};
const WS_PROTO_TO_UPGRADE_PROTO: { [ws: string]: string } = {
  "ws:": "http:",
};

const WS_SECRET_KEY_NONCE_SIZE = 16;
const WS_SECRET_VERSION = 13;
const WS_SECRET_VALUE = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

enum WebSocketClientEvents {
  open = "open",
  message = "message",
  close = "close",
  ping = "ping",
  pong = "pong",
  error = "error",
}

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
}

export class WebSocketClient extends EventEmitter {
  private readonly urlStr: string;
  private readonly url: URL;

  private state: WebSocketConnectionState;
  private socket?: Socket;

  constructor(url: string) {
    super();

    this.urlStr = url;
    this.url = this.parseAndValidateUrl(url);

    this.state = "connecting";
    this.socket = undefined;

    this.startConnection();
  }

  private generateMaskingKey(): number {
    return crypto.randomBytes(4).readUInt32BE();
  }

  private parseAndValidateUrl(urlStr: string): URL | never {
    const url = new URL(urlStr);

    if (!VALID_PROTOCOLS.includes(url.protocol))
      throw new WebSocketInitializationError(
        `Invalid protocol '${url.protocol}'`
      );

    if (url.port.length == 0) url.port = DEFAULT_PORTS[url.protocol].toString();

    return url;
  }

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

  private onSocketClose(hadError: boolean) {
    if (this.state !== "closed") {
      this.finalizeClose();
    }
  }

  private onSocketEnd() {
    if (this.state !== "closed") {
      this.finalizeClose();
    }
  }

  private onSocketError(err: Error) {
    this.emit(WebSocketClientEvents.error, err);
  }

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

  private handlePingFrame(frame: WebSocketFrame) {
    assert(frame.opcode === WebSocketFrameOpcode.ping);

    this.emit(WebSocketClientEvents.ping, frame.payloadData);
  }

  private handlePongFrame(frame: WebSocketFrame) {
    assert(frame.opcode === WebSocketFrameOpcode.pong);

    this.emit(WebSocketClientEvents.pong, frame.payloadData);
  }

  private handleMessageFrame(frame: WebSocketFrame) {
    assert(
      frame.opcode === WebSocketFrameOpcode.binary ||
        frame.opcode === WebSocketFrameOpcode.text
    );

    const isBinary = frame.opcode === WebSocketFrameOpcode.binary;
    this.emit(WebSocketClientEvents.message, frame.payloadData, isBinary);
  }

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

  public ping(data?: any) {
    this.sendFrame(WebSocketFrameOpcode.ping);
  }

  public pong(data?: any) {
    this.sendFrame(WebSocketFrameOpcode.pong);
  }

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

  private sendBuffer(buffer: Buffer) {
    this.sendFrame(WebSocketFrameOpcode.binary, buffer);
  }

  private sendUTF8String(str: string) {
    const buffer = Buffer.from(str, "utf-8");
    this.sendFrame(WebSocketFrameOpcode.text, buffer);
  }

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

  public close(code?: number, data?: string | Buffer): void {
    // Do nothing if the client is not already open
    if (this.state !== "open") return;

    this.state = "closing";

    // Send close frame
    this.sendFrame(
      WebSocketFrameOpcode.conn_close,
      undefined,
      WebSocketFrameCloseReason.normal
    );
  }
}
