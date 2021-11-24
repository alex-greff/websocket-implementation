import { WebSocket as WebsocketClientReference } from "ws";
import { WebSocketClient as WebSocketClientD58 } from "d58-websocket-client";

export type WebsocketServerType = "implemented-server" | "reference-server";
export type WebsocketClientType = "implemented-client" | "reference-client";

export type WebsocketClient = WebsocketClientReference | WebSocketClientD58;

export interface ChatMessage {
  message: string;
  sender: string;
}