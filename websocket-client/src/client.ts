import EventEmitter from "events";
import http from "http";
import { URL } from "url";
import { InvalidWebSocketURLError } from "./exceptions";
import crypto from "crypto";

type WebSocketProtocol = "ws";

const VALID_PROTOCOLS: string[] = ["ws:"];
// const DEFAULT_PORTS: { [p: string]: number} = {
//   "ws": 80
// };
const WS_PROTO_TO_UPGRADE_PROTO: { [ws: string]: string} = {
  "ws:": "http:",
};

const WS_SECRET_KEY_NONCE_SIZE = 16;
const WS_SECRET_VERSION = 13;

export class WebSocketClient extends EventEmitter {
  private readonly urlStr: string;
  private readonly url: URL;

  constructor(url: string) {
    super();

    this.urlStr = url;
    this.url = this.parseAndValidateUrl(url);

    this.startConnection();
  }

  private parseAndValidateUrl(urlStr: string): URL {
    const url = new URL(urlStr);

    if (!VALID_PROTOCOLS.includes(url.protocol))
      throw new InvalidWebSocketURLError(`Invalid protocol '${url.protocol}'`);

    // TODO: validate URL
    console.log(url);
    return url;
  }

  private startConnection() {
    const nonce = crypto.randomBytes(WS_SECRET_KEY_NONCE_SIZE);
    const nonceB64 = nonce.toString("base64");

    const req = http.get({
      headers: {
        "Connection": "Upgrade",
        "Upgrade": "websocket",
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
      console.log("> upgrade");
      console.log(res);
    });
    req.on("response", (res) => {
      console.log("> response");
      console.log(res);
    });
  }
}