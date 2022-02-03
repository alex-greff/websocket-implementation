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
 * Websocket client when we are running on Electron.
 */
export type WebsocketClientElectron = WebsocketClientReference | WebSocketClientD58;

/**
 * Websocket client when we are running on the browser.
 */
export type WebsocketClientBrowser = WebSocket;

/**
 * The possible Websocket client types that we can have.
 */
export type WebsocketClient = WebsocketClientElectron | WebsocketClientBrowser;

/**
 * Represents a chat message.
 */
export interface ChatMessage {
  message: string;
  sender: string;
}