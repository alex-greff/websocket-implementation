import { WebSocket as ReferenceWebsocket } from "ws";

export type WebsocketServerType = "implemented-server" | "reference-server";
export type WebsocketClientType = "implemented-client" | "reference-client";

// TODO: add type for our Websocket client
export type WebsocketClient = ReferenceWebsocket;