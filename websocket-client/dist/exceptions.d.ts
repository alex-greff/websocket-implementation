/**
 * The generic base Websocket error.
 */
export declare class WebSocketError extends Error {
}
/**
 * A Websocket error related to the initialization of the Websocket client.
 */
export declare class WebSocketInitializationError extends WebSocketError {
}
/**
 * A Websocket error related to the initial Websocket handshake.
 */
export declare class WebSocketHandshakeError extends WebSocketError {
}
/**
 * A Websocket error related to the Websocket frame.
 */
export declare class WebSocketFrameError extends WebSocketError {
}
/**
 * A Websocket error related to unsupported features.
 */
export declare class WebSocketUnsupportedError extends WebSocketError {
}
