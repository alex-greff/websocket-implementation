/// <reference types="node" />
/**
 * Represents a Websocket opcode.
 */
export declare enum WebSocketFrameOpcode {
    continuation = 0,
    text = 1,
    binary = 2,
    conn_close = 8,
    ping = 9,
    pong = 10
}
/**
 * Represents a Websocket close reason code.
 */
export declare enum WebSocketFrameCloseReason {
    normal = 1000,
    going_away = 1001,
    protocol_error = 1002,
    unprocessable_input = 1003,
    reserved = 1004,
    reason_not_provided = 1005,
    abnormal = 1006,
    invalid_data = 1007,
    message_too_big = 1009,
    extension_required = 1010,
    internal_server_error = 1011,
    tls_handshake_failed = 1015
}
/**
 * Initial frame values passed into the WebSocketFrame constructor.
 */
export interface WebSocketFrameValues {
    fin: boolean;
    opcode: WebSocketFrameOpcode;
    mask: boolean;
    payloadBytesLen?: number;
    maskingKey?: number;
    payloadData?: Buffer;
    closeReason?: WebSocketFrameCloseReason;
}
/**
 * Represents a Websocket frame.
 */
export declare class WebSocketFrame {
    /** Indicates if the frame is a finished frame. */
    readonly fin: boolean;
    /** The RSV1 field. */
    readonly rsv1: boolean;
    /** The RSV2 field. */
    readonly rsv2: boolean;
    /** The RSV3 field. */
    readonly rsv3: boolean;
    /** The opcode of the frame. */
    readonly opcode: number;
    /** Indicates if the frame is masked. */
    readonly mask: boolean;
    /** The length of the payload in bytes. */
    readonly payloadBytesLen: number;
    /** The masking key of the frame, undefined if not set. */
    readonly maskingKey?: number;
    /** The payload of the frame, undefined if no payload. */
    readonly payloadData?: Buffer;
    /** The close reason value of the frame, only set if a close frame. */
    readonly closeReason?: WebSocketFrameCloseReason;
    constructor(values: WebSocketFrameValues);
    /**
     * Validates that the initial values of the frame are valid. Raises an error
     * if invalid.
     */
    private validateValues;
    /**
     * Validates that the given opcode is a valid opcode. Raises an error if
     * invalid.
     *
     * @param opcode The opcode to validate.
     */
    static validateOpcode(opcode: number): void | never;
    /**
     * Validates that the given close reason code is valid. Raises an error if
     * invalid.
     * @param closeReasonCode The close reason code to validate.
     */
    static validateCloseReasonCode(closeReasonCode: number): void | never;
    /** A getter that gives the payload length level of the current payload. */
    private get payloadLenLevel();
    /**
     * A getter that gives the number of bits for the payload length field based
     * on the current payload length level.
     */
    private get payloadBitsLength();
    /**
     * A getter that gives the masking key field bit length.
     */
    private get maskingKeyBitsLength();
    /**
     * A getter that gives the masking key field bit offset.
     */
    private get maskingKeyBitsOffset();
    /**
     * A getter that gives the number of bits of the payload.
     */
    private get payloadBitsLen();
    /**
     * A getter gets if the frame has a close reason code.
     */
    private get hasCloseReasonCode();
    /**
     * A getter that gives the close reason bit length in the frame.
     */
    private get closeReasonCodeBitsLength();
    /**
     * A getter that gives the total bit length of the frame.
     */
    private get frameBitsLength();
    /**
     * Masks the given buffer with the masking key, starting at startOffset and
     * going for length bytes.
     *
     * @param buffer The buffer to mask.
     * @param maskingKey The masking key to use when masking.
     * @param startOffset The start offset in the buffer to mask.
     * @param length The number of bytes past startOffset to mask.
     */
    static applyMaskToBuffer(buffer: Buffer, maskingKey: number, startOffset?: number, length?: number): void;
    /**
     * Returns the corresponding Websocket frame stored in the buffer.
     *
     * @param buffer The buffer to read the Websocket frame from.
     * @returns Returns a WebSocketFrame.
     */
    static fromBuffer(buffer: Buffer): WebSocketFrame;
    /**
     * Exports the given Websocket frame instance into its corresponding buffer
     * representation that can be sent over the network.
     *
     * @returns a buffer.
     */
    toBuffer(): Buffer;
}
