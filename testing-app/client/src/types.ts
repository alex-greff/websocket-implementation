import { WebSocket as ReferenceWebsocket } from "ws";
import { WebSocketClient as D58WebSocketClient } from "d58-websocket-client";

export type WebsocketServerType = "implemented-server" | "reference-server";
export type WebsocketClientType = "implemented-client" | "reference-client";

// TODO: add type for our Websocket client
// export type WebsocketClient = ReferenceWebsocket; // TODO: remove
export type WebsocketClient = ReferenceWebsocket | D58WebSocketClient;

export interface ChatMessage {
  message: string;
  sender: string;
}