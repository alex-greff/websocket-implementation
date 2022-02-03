/// <reference types="node" />
import EventEmitter from "events";
/**
 * External Typescript overwrite of the event listener registration functions
 * of EventEmitter to be typesafe.
 */
export declare interface WebSocketClient {
    on(event: "open", listener: () => void): this;
    on(event: "message", listener: (data: Buffer, isBinary: boolean) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "close", listener: () => void): this;
    on(event: "ping" | "pong", listener: (data: Buffer) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    addListener(event: "open", listener: () => void): this;
    addListener(event: "message", listener: (data: Buffer, isBinary: boolean) => void): this;
    addListener(event: "error", listener: (err: Error) => void): this;
    addListener(event: "close", listener: () => void): this;
    addListener(event: "ping" | "pong", listener: (data: Buffer) => void): this;
    addListener(event: "error", listener: (error: Error) => void): this;
    off(event: "open", listener: () => void): this;
    off(event: "message", listener: (data: Buffer, isBinary: boolean) => void): this;
    off(event: "error", listener: (err: Error) => void): this;
    off(event: "close", listener: () => void): this;
    off(event: "ping" | "pong", listener: (data: Buffer) => void): this;
    off(event: "error", listener: (error: Error) => void): this;
    removeListener(event: "open", listener: () => void): this;
    removeListener(event: "message", listener: (data: Buffer, isBinary: boolean) => void): this;
    removeListener(event: "error", listener: (err: Error) => void): this;
    removeListener(event: "close", listener: () => void): this;
    removeListener(event: "ping" | "pong", listener: (data: Buffer) => void): this;
    removeListener(event: "error", listener: (error: Error) => void): this;
}
/**
 * The Websocket client that manages the Websocket connection to a Websocket
 * server.
 */
export declare class WebSocketClient extends EventEmitter {
    /** The URL connection string. */
    private readonly urlStr;
    /** The parsed URL object of the URL connection string. */
    private readonly url;
    /** The current state of the Websocket client. */
    private state;
    /** The TCP socket for the connection. */
    private socket?;
    constructor(url: string);
    /**
     * Randomly generates a new masking key.
     *
     * @returns A masking key.
     */
    private generateMaskingKey;
    /**
     * Parses the given URL string and ensures that it is a supported
     * Websocket URL.
     *
     * @param urlStr The URL string.
     * @returns A URL object.
     */
    private parseAndValidateUrl;
    /**
     * Validates that the given HTTP upgrade response is a valid Websocket
     * handshake. Raises an error if it is an invalid handshake response.
     *
     * @param res The HTTP upgrade response.
     * @param nonceB64 The nonce used when initiating the handshake.
     */
    private validateResHandshake;
    /**
     * Initializes the WebSocket connection, dealing with the upgrade and setting
     * up initial listeners to the underlying TCP socket.
     */
    private startConnection;
    /**
     * Handles when the TCP socket closes.
     *
     * @param hadError Indicates that there was an error when closing.
     */
    private onSocketClose;
    /**
     * Handles when the TCP socket ends.
     */
    private onSocketEnd;
    /**
     * Handles when an error occurs with the TCP socket.
     */
    private onSocketError;
    /**
     * Handles when data is received from the TCP socket. Will parse the data
     * frame and respond accordingly, either emitting websocket ping, pong or
     * message, or handling closing the connection.
     *
     * @param data The data buffer.
     */
    private onSocketData;
    /**
     * Handles a received ping frame.
     *
     * @param frame The frame.
     */
    private handlePingFrame;
    /**
     * Handles a received pong frame.
     *
     * @param frame The frame.
     */
    private handlePongFrame;
    /**
     * Handles a received message frame.
     *
     * @param frame The frame.
     */
    private handleMessageFrame;
    /**
     * Handles a received close frame.
     *
     * @param frame The frame.
     */
    private handleCloseFrame;
    /**
     * Finalizes the closing of the Websocket connection.
     */
    private finalizeClose;
    /**
     * Sends a ping message.
     *
     * @param data Extra data.
     */
    ping(data?: any): void;
    /**
     * Sends a pong message.
     *
     * @param data Extra data.
     */
    pong(data?: any): void;
    /**
     * Sends a Websocket message.
     *
     * @param data The data of the message.
     */
    send(data: any): void;
    /**
     * Sends a Websocket buffer message.
     *
     * @param buffer The payload buffer.
     */
    private sendBuffer;
    /**
     * Sends a Websocket UTF-8 string message.
     *
     * @param buffer The payload string.
     */
    private sendUTF8String;
    /**
     * Sends a frame.
     *
     * @param opcode The opcode of the frame.
     * @param payloadData The payload of the frame.
     * @param closeReason The close reason of the frame, if needed.
     */
    private sendFrame;
    /**
     * Closes the Websocket connection with the given close code.
     *
     * @param code The close code.
     * @param data Extra payload data.
     */
    close(code?: number, data?: string | Buffer): void;
}
