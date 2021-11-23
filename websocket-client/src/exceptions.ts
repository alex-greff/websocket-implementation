
export class WebSocketError extends Error {}

export class WebSocketInitializationError extends WebSocketError {}
export class WebSocketHandshakeError extends WebSocketError {}
export class WebSocketFrameError extends WebSocketError {}