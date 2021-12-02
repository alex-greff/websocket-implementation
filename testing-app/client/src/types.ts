import { WebSocket as WebsocketClientReference } from "ws";
import { WebSocketClient as WebSocketClientD58 } from "d58-websocket-client";

/**
 * Selector for which Websocket server is used.
 */
export type WebsocketServerType = "implemented-server" | "reference-server";

/**
 * Selector for which Websocket client is used.
 */
export type WebsocketClientType = "implemented-client" | "reference-client";

/**
 * Union type to represent either the reference Websocket client or our
 * implemented Websocket client.
 */
export type WebsocketClient = WebsocketClientReference | WebSocketClientD58;

/**
 * Represents a chat message.
 */
export interface ChatMessage {
  message: string;
  sender: string;
}
