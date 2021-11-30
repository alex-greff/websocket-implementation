/**
 * The generic base Websocket error.
 */
export class WebSocketError extends Error {}

/**
 * A Websocket error related to the initialization of the Websocket client.
 */
export class WebSocketInitializationError extends WebSocketError {}

/**
 * A Websocket error related to the initial Websocket handshake.
 */
export class WebSocketHandshakeError extends WebSocketError {}

/**
 * A Websocket error related to the Websocket frame.
 */
export class WebSocketFrameError extends WebSocketError {}

/**
 * A Websocket error related to unsupported features.
 */
export class WebSocketUnsupportedError extends WebSocketError {}
