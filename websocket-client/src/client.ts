import EventEmitter from "events";
import http from "http";
import { URL } from "url";
import {
  WebSocketInitializationError,
  WebSocketHandshakeError,
  WebSocketError,
} from "./exceptions";
import crypto from "crypto";
import * as Utilities from "./utilities";
import { Socket } from "net";
import { assert } from "tsafe";
import { WebSocketFrame, WebSocketFrameOpcode } from "./frame";

type WebSocketProtocol = "ws";

type WebSocketConnectionState = "connecting" | "open" | "ending";

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
}

interface WebSocketMessageEvent {
  // TODO: implement
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

    // console.log(url); // TODO: remove

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
    // headers
    // TODO: probably should parse this and confirm it's empty
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
      // TODO: add any socket events

      this.emit(WebSocketClientEvents.open);

      // TODO: remove
      console.log("> upgrade");
      console.log(res);
    });

    req.on("response", (res) => {
      console.log("> response");
      console.log(res);
    });

    req.on("close", () => {
      // TODO: this close is allowed, ignore this
      // TODO: how to handle abnormal close?
      // console.log("> req close");
      // this.socket?.end();
      // this.emit(WebSocketClientEvents.close);
    });
  }

  private onSocketClose(hadError: boolean) {
    console.log("> socket close");

    // this.socket?.off("close", this.onSocketClose);
    // this.emit(WebSocketClientEvents.close);
  }

  private onSocketEnd() {
    console.log("> socket end");
    // TODO: implement
  }

  private onSocketError(err: Error) {
    console.log("> socket error");
    // TODO: implement
  }

  private onSocketData(data: Buffer) {
    // TODO: remove
    console.log("> socket data");
    console.log(data);

    // TODO: error handling
    const frame = WebSocketFrame.fromBuffer(data);

    if (frame.opcode === WebSocketFrameOpcode.ping) {
      this.emit(WebSocketClientEvents.ping, frame.payloadData);
    } else if (frame.opcode === WebSocketFrameOpcode.pong) {
      this.emit(WebSocketClientEvents.pong, frame.payloadData);
    } else if (
      frame.opcode === WebSocketFrameOpcode.binary ||
      frame.opcode === WebSocketFrameOpcode.text
    ) {
      // TODO: implement
    } else if (frame.opcode === WebSocketFrameOpcode.continuation) {
      // TODO: implement
    } else if (frame.opcode === WebSocketFrameOpcode.conn_close) {
      // TODO: implement
    } else Utilities.notReached();
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

  private sendFrame(opcode: WebSocketFrameOpcode, payloadData?: Buffer) {
    // Outgoing frames from client must always be masked
    const maskingKey = this.generateMaskingKey();

    // TODO: remove
    console.log("maskingKey: " + Utilities.dec2bin(maskingKey));

    const frame = new WebSocketFrame({
      fin: true,
      mask: true,
      maskingKey,
      opcode,
      payloadBytesLen: payloadData?.length ?? 0,
      payloadData,
    });

    // TODO: remove
    console.log(">> SENDING FRAME");

    // Send the frame
    assert(this.socket);
    this.socket.write(frame.toBuffer());
  }

  public close(code?: number, data?: string | Buffer): void {
    if (this.state !== "open")
      throw new WebSocketError("Unable to close: connection is not open");

    assert(this.socket !== null);

    // TODO: send close frame

    this.socket!.off("close", this.onSocketClose);
    // TODO: remove any other socket events

    // this.emit(WebSocketClientEvents.close);
  }
}
