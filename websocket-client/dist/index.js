'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var EventEmitter = require('events');
var https = require('https');
var url = require('url');
var crypto = require('crypto');
var tsafe = require('tsafe');
var bitBuffer = require('bit-buffer');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var EventEmitter__default = /*#__PURE__*/_interopDefaultLegacy(EventEmitter);
var https__default = /*#__PURE__*/_interopDefaultLegacy(https);
var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

/**
 * The generic base Websocket error.
 */
var WebSocketError = /** @class */ (function (_super) {
    __extends(WebSocketError, _super);
    function WebSocketError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WebSocketError;
}(Error));
/**
 * A Websocket error related to the initialization of the Websocket client.
 */
var WebSocketInitializationError = /** @class */ (function (_super) {
    __extends(WebSocketInitializationError, _super);
    function WebSocketInitializationError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WebSocketInitializationError;
}(WebSocketError));
/**
 * A Websocket error related to the initial Websocket handshake.
 */
var WebSocketHandshakeError = /** @class */ (function (_super) {
    __extends(WebSocketHandshakeError, _super);
    function WebSocketHandshakeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WebSocketHandshakeError;
}(WebSocketError));
/**
 * A Websocket error related to the Websocket frame.
 */
var WebSocketFrameError = /** @class */ (function (_super) {
    __extends(WebSocketFrameError, _super);
    function WebSocketFrameError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WebSocketFrameError;
}(WebSocketError));
/**
 * A Websocket error related to unsupported features.
 */
var WebSocketUnsupportedError = /** @class */ (function (_super) {
    __extends(WebSocketUnsupportedError, _super);
    function WebSocketUnsupportedError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return WebSocketUnsupportedError;
}(WebSocketError));

// Source: https://stackoverflow.com/a/2140723
/**
 * Performs ASCII case-insensitive equality comparison between the two strings.
 * @param a String A
 * @param b String B
 * @returns Returns true iff a and b case insensitive equal each other.
 */
function caseInsensitiveEquals(a, b) {
    return typeof a === "string" && typeof b === "string"
        ? a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0
        : a === b;
}
/**
 * A simple function that always throws. Used as an indicator for a piece of
 * code that should never be reached.
 */
function notReached() {
    throw new Error("Should not be reached");
}
// Source: https://stackoverflow.com/a/7820695
/**
 * Converts a boolean value to its integer representation.
 */
function boolToInt(valBool) {
    return +valBool;
}
// Source: https://www.samanthaming.com/tidbits/19-2-ways-to-convert-to-boolean/
/**
 * Converts an integer value to its boolean representation.
 */
function intToBool(valInt) {
    return Boolean(valInt);
}
/**
 * Returns if the given value is "stringifiable"
 * (i.e. has the toString function).
 */
function isStringifiable(value) {
    if (value === null || value === undefined)
        return false;
    return typeof value["toString"] === "function";
}
/**
 * Returns if the given value is a valid buffer.
 */
function isBuffer(value) {
    return Buffer.isBuffer(value);
}

/**
 * Represents a Websocket opcode.
 */
var WebSocketFrameOpcode;
(function (WebSocketFrameOpcode) {
    WebSocketFrameOpcode[WebSocketFrameOpcode["continuation"] = 0] = "continuation";
    WebSocketFrameOpcode[WebSocketFrameOpcode["text"] = 1] = "text";
    WebSocketFrameOpcode[WebSocketFrameOpcode["binary"] = 2] = "binary";
    WebSocketFrameOpcode[WebSocketFrameOpcode["conn_close"] = 8] = "conn_close";
    WebSocketFrameOpcode[WebSocketFrameOpcode["ping"] = 9] = "ping";
    WebSocketFrameOpcode[WebSocketFrameOpcode["pong"] = 10] = "pong";
})(WebSocketFrameOpcode || (WebSocketFrameOpcode = {}));
/**
 * Represents a Websocket close reason code.
 */
var WebSocketFrameCloseReason;
(function (WebSocketFrameCloseReason) {
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["normal"] = 1000] = "normal";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["going_away"] = 1001] = "going_away";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["protocol_error"] = 1002] = "protocol_error";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["unprocessable_input"] = 1003] = "unprocessable_input";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["reserved"] = 1004] = "reserved";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["reason_not_provided"] = 1005] = "reason_not_provided";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["abnormal"] = 1006] = "abnormal";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["invalid_data"] = 1007] = "invalid_data";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["message_too_big"] = 1009] = "message_too_big";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["extension_required"] = 1010] = "extension_required";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["internal_server_error"] = 1011] = "internal_server_error";
    WebSocketFrameCloseReason[WebSocketFrameCloseReason["tls_handshake_failed"] = 1015] = "tls_handshake_failed";
})(WebSocketFrameCloseReason || (WebSocketFrameCloseReason = {}));
/**
 * Represents the length level of the payload.
 */
var PayloadLenLevel;
(function (PayloadLenLevel) {
    PayloadLenLevel[PayloadLenLevel["LEVEL0"] = 0] = "LEVEL0";
    PayloadLenLevel[PayloadLenLevel["LEVEL1"] = 1] = "LEVEL1";
    PayloadLenLevel[PayloadLenLevel["LEVEL2"] = 2] = "LEVEL2";
})(PayloadLenLevel || (PayloadLenLevel = {}));
/**
 * Maps the payload length level to the number of bits taken in the frame to
 * record the payload length.
 */
var PayloadLenLevelBits;
(function (PayloadLenLevelBits) {
    PayloadLenLevelBits[PayloadLenLevelBits["LEVEL0"] = 7] = "LEVEL0";
    PayloadLenLevelBits[PayloadLenLevelBits["LEVEL1"] = 16] = "LEVEL1";
    PayloadLenLevelBits[PayloadLenLevelBits["LEVEL2"] = 64] = "LEVEL2";
})(PayloadLenLevelBits || (PayloadLenLevelBits = {}));
/**
 * The largest payload size (in bytes) for level 0 payloads.
 */
var PAYLOAD_LEN_MAX_LVL0 = 125;
/**
 * The largest payload size (in bytes) for level 1 payloads.
 */
var PAYLOAD_LEN_MAX_LVL1 = (1 << 32) - 1; // 2^32-1
/**
 * The number of bits taken for the fin field.
 */
var BITS_LEN_FIN = 1;
/**
 * The number of bits taken for the RSV1, RSV2, and RSV4 fields.
 */
var BITS_LEN_RSV = 3;
/**
 * The number of bits taken for the opcode field.
 */
var BITS_LEN_OPCODE = 4;
/**
 * The number of bits taken for the mask indicator field.
 */
var BITS_LEN_MASK = 1;
/**
 * The number of bits taken for the close reason code field.
 */
var BITS_LEN_CLOSE_REASON_CODE = 2 * 8; // 2 bytes
/**
 * The number of bits taken for the masking key field.
 */
var BITS_LEN_MASKING_KEY = 4 * 8; // 4 bytes
/**
 * The smallest possible size of a Websocket frame (in bits).
 */
var MIN_FRAME_BITS_LEN = BITS_LEN_FIN +
    BITS_LEN_RSV +
    BITS_LEN_OPCODE +
    BITS_LEN_MASK +
    PayloadLenLevelBits.LEVEL0;
/**
 * The bit offset of the fin field.
 */
var BITS_OFFSET_FIN = 0;
/**
 * The bit offset of the RSV fields.
 */
var BITS_OFFSET_RSV = BITS_LEN_FIN;
/**
 * The bit offset of the opcode field.
 */
var BITS_OFFSET_OPCODE = BITS_LEN_RSV + BITS_OFFSET_RSV;
/**
 * The bit offset of the mask indicator field.
 */
var BITS_OFFSET_MASK = BITS_OFFSET_OPCODE + BITS_LEN_OPCODE;
/**
 * The bit offset of the payload length field.
 */
var BITS_OFFSET_PAYLOAD = BITS_OFFSET_MASK + BITS_LEN_MASK;
/**
 * Represents a Websocket frame.
 */
var WebSocketFrame = /** @class */ (function () {
    function WebSocketFrame(values) {
        var _a;
        /** The RSV1 field. */
        this.rsv1 = false;
        /** The RSV2 field. */
        this.rsv2 = false;
        /** The RSV3 field. */
        this.rsv3 = false;
        this.fin = values.fin;
        this.opcode = values.opcode;
        this.mask = values.mask;
        this.payloadBytesLen = (_a = values.payloadBytesLen) !== null && _a !== void 0 ? _a : 0;
        this.maskingKey = values.maskingKey;
        this.payloadData = values.payloadData;
        this.closeReason = values.closeReason;
        this.validateValues();
    }
    /**
     * Validates that the initial values of the frame are valid. Raises an error
     * if invalid.
     */
    WebSocketFrame.prototype.validateValues = function () {
        if (this.mask && !this.maskingKey)
            throw new WebSocketFrameError("Missing masking key");
        if (this.payloadData && this.payloadBytesLen !== this.payloadData.length)
            throw new WebSocketFrameError("Payload bytes length does not match payload buffer length");
    };
    /**
     * Validates that the given opcode is a valid opcode. Raises an error if
     * invalid.
     *
     * @param opcode The opcode to validate.
     */
    WebSocketFrame.validateOpcode = function (opcode) {
        var valid = opcode === WebSocketFrameOpcode.continuation ||
            opcode === WebSocketFrameOpcode.text ||
            opcode === WebSocketFrameOpcode.binary ||
            opcode === WebSocketFrameOpcode.conn_close ||
            opcode === WebSocketFrameOpcode.ping ||
            opcode === WebSocketFrameOpcode.pong;
        if (!valid)
            throw new WebSocketFrameError("Invalid opcode: ".concat(opcode));
    };
    /**
     * Validates that the given close reason code is valid. Raises an error if
     * invalid.
     * @param closeReasonCode The close reason code to validate.
     */
    WebSocketFrame.validateCloseReasonCode = function (closeReasonCode) {
        var valid = closeReasonCode === WebSocketFrameCloseReason.abnormal ||
            closeReasonCode === WebSocketFrameCloseReason.extension_required ||
            closeReasonCode === WebSocketFrameCloseReason.going_away ||
            closeReasonCode === WebSocketFrameCloseReason.internal_server_error ||
            closeReasonCode === WebSocketFrameCloseReason.invalid_data ||
            closeReasonCode === WebSocketFrameCloseReason.message_too_big ||
            closeReasonCode === WebSocketFrameCloseReason.normal ||
            closeReasonCode === WebSocketFrameCloseReason.protocol_error ||
            closeReasonCode === WebSocketFrameCloseReason.reason_not_provided ||
            closeReasonCode === WebSocketFrameCloseReason.reserved ||
            closeReasonCode === WebSocketFrameCloseReason.tls_handshake_failed ||
            closeReasonCode === WebSocketFrameCloseReason.unprocessable_input;
        if (!valid)
            throw new WebSocketFrameError("Invalid close reason code: ".concat(closeReasonCode));
    };
    Object.defineProperty(WebSocketFrame.prototype, "payloadLenLevel", {
        /** A getter that gives the payload length level of the current payload. */
        get: function () {
            tsafe.assert(this.payloadBytesLen >= 0);
            if (this.payloadBytesLen <= PAYLOAD_LEN_MAX_LVL0) {
                return PayloadLenLevel.LEVEL0;
            }
            else if (this.payloadBytesLen <= PAYLOAD_LEN_MAX_LVL1) {
                return PayloadLenLevel.LEVEL1;
            }
            else {
                return PayloadLenLevel.LEVEL2;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "payloadBitsLength", {
        /**
         * A getter that gives the number of bits for the payload length field based
         * on the current payload length level.
         */
        get: function () {
            if (this.payloadLenLevel == PayloadLenLevel.LEVEL0)
                return PayloadLenLevelBits.LEVEL0;
            else if (this.payloadLenLevel == PayloadLenLevel.LEVEL1)
                return PayloadLenLevelBits.LEVEL0 + PayloadLenLevelBits.LEVEL1;
            else
                return PayloadLenLevelBits.LEVEL0 + PayloadLenLevelBits.LEVEL2;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "maskingKeyBitsLength", {
        /**
         * A getter that gives the masking key field bit length.
         */
        get: function () {
            return this.mask ? BITS_LEN_MASKING_KEY : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "maskingKeyBitsOffset", {
        /**
         * A getter that gives the masking key field bit offset.
         */
        get: function () {
            return BITS_OFFSET_PAYLOAD + this.payloadBitsLength;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "payloadBitsLen", {
        /**
         * A getter that gives the number of bits of the payload.
         */
        get: function () {
            return this.payloadBytesLen * 8;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "hasCloseReasonCode", {
        /**
         * A getter gets if the frame has a close reason code.
         */
        get: function () {
            return (this.opcode === WebSocketFrameOpcode.conn_close && !!this.closeReason);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "closeReasonCodeBitsLength", {
        /**
         * A getter that gives the close reason bit length in the frame.
         */
        get: function () {
            return this.hasCloseReasonCode ? BITS_LEN_CLOSE_REASON_CODE : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebSocketFrame.prototype, "frameBitsLength", {
        /**
         * A getter that gives the total bit length of the frame.
         */
        get: function () {
            return (BITS_LEN_FIN +
                BITS_LEN_RSV +
                BITS_LEN_OPCODE +
                BITS_LEN_MASK +
                this.payloadBitsLength +
                this.maskingKeyBitsLength +
                this.closeReasonCodeBitsLength +
                this.payloadBitsLen);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Masks the given buffer with the masking key, starting at startOffset and
     * going for length bytes.
     *
     * @param buffer The buffer to mask.
     * @param maskingKey The masking key to use when masking.
     * @param startOffset The start offset in the buffer to mask.
     * @param length The number of bytes past startOffset to mask.
     */
    WebSocketFrame.applyMaskToBuffer = function (buffer, maskingKey, startOffset, length) {
        if (startOffset === void 0) { startOffset = 0; }
        var maskBytesN = Buffer.allocUnsafe(4);
        maskBytesN.writeUInt32BE(maskingKey);
        // Reference: https://datatracker.ietf.org/doc/html/rfc6455#section-5.3
        if (!length)
            length = buffer.length;
        // Mask each byte in the payload
        for (var i = startOffset; i < startOffset + length; i++) {
            var j = i & 3; // equivalent to: i % 4
            buffer[i] = buffer[i] ^ maskBytesN[j];
        }
    };
    /**
     * Returns the corresponding Websocket frame stored in the buffer.
     *
     * @param buffer The buffer to read the Websocket frame from.
     * @returns Returns a WebSocketFrame.
     */
    WebSocketFrame.fromBuffer = function (buffer) {
        // Ensure that at least everything upto and including
        // Payload len (7) is there
        if (buffer.length < MIN_FRAME_BITS_LEN / 8)
            throw new WebSocketFrameError("Buffer length too small");
        // Wrap buffer in a bit buffer
        var bitBuffer$1 = new bitBuffer.BitView(buffer);
        bitBuffer$1.bigEndian = true;
        var bufferRemainingBits = buffer.length * 8;
        // Get fin value
        var fin = intToBool(bitBuffer$1.getBits(BITS_OFFSET_FIN, BITS_LEN_FIN, false));
        bufferRemainingBits -= BITS_LEN_FIN;
        // Ensure RSV values are 0
        var rsv = bitBuffer$1.getBits(BITS_OFFSET_RSV, BITS_LEN_RSV, false);
        bufferRemainingBits -= BITS_LEN_RSV;
        if (rsv !== 0)
            throw new WebSocketFrameError("RSV bits must be zero");
        // Get opcode
        var opcodeNum = bitBuffer$1.getBits(BITS_OFFSET_OPCODE, BITS_LEN_OPCODE, false);
        WebSocketFrame.validateOpcode(opcodeNum);
        var opcode = opcodeNum;
        bufferRemainingBits -= BITS_LEN_OPCODE;
        // Get if the frame is masked
        var mask = intToBool(bitBuffer$1.getBits(BITS_OFFSET_MASK, BITS_LEN_MASK, false));
        bufferRemainingBits -= BITS_LEN_MASK;
        // Get the payload length
        var payloadLenLvl0Val = bitBuffer$1.getBits(BITS_OFFSET_PAYLOAD, PayloadLenLevelBits.LEVEL0, false);
        bufferRemainingBits -= PayloadLenLevelBits.LEVEL0;
        var payloadBytesLen = 0;
        var payloadLenLevel;
        var payloadAdditionalBitsLength;
        if (payloadLenLvl0Val <= 125) {
            payloadLenLevel = PayloadLenLevel.LEVEL0;
            payloadAdditionalBitsLength = 0;
        }
        else if (payloadLenLvl0Val === 126) {
            payloadLenLevel = PayloadLenLevel.LEVEL1;
            payloadAdditionalBitsLength = PayloadLenLevelBits.LEVEL1;
        }
        else if (payloadLenLvl0Val === 127) {
            payloadLenLevel = PayloadLenLevel.LEVEL2;
            payloadAdditionalBitsLength = PayloadLenLevelBits.LEVEL2;
        }
        else
            notReached();
        if (payloadLenLevel === PayloadLenLevel.LEVEL0)
            payloadBytesLen = payloadLenLvl0Val;
        else {
            if (bufferRemainingBits < payloadAdditionalBitsLength)
                throw new WebSocketFrameError("Buffer length too small");
            payloadBytesLen = bitBuffer$1.getBits(BITS_OFFSET_PAYLOAD + PayloadLenLevelBits.LEVEL0, payloadAdditionalBitsLength);
            bufferRemainingBits -= payloadAdditionalBitsLength;
        }
        // Extract the masking key, if needed
        var maskingKey = undefined;
        var maskingKeyBytes = 0;
        if (mask) {
            if (bufferRemainingBits < BITS_LEN_MASKING_KEY)
                throw new WebSocketFrameError("Buffer length too small");
            maskingKeyBytes = BITS_LEN_MASKING_KEY;
            maskingKey = bitBuffer$1.getBits(BITS_OFFSET_PAYLOAD +
                PayloadLenLevelBits.LEVEL0 +
                payloadAdditionalBitsLength, maskingKeyBytes, false);
            bufferRemainingBits -= BITS_LEN_MASKING_KEY;
        }
        // Handle close control frame
        var closeReason = undefined;
        var closeReasonBytes = 0;
        var hasCloseReasonCode = bufferRemainingBits / 8 >= 2;
        if (opcode === WebSocketFrameOpcode.conn_close && hasCloseReasonCode) {
            closeReasonBytes = BITS_LEN_CLOSE_REASON_CODE;
            var closeReasonNum = bitBuffer$1.buffer.readUInt16BE((PayloadLenLevelBits.LEVEL0 +
                payloadAdditionalBitsLength +
                BITS_LEN_MASKING_KEY) /
                8);
            WebSocketFrame.validateCloseReasonCode(closeReasonNum);
            closeReason = closeReasonNum;
            bufferRemainingBits -= closeReasonBytes;
        }
        // Extract payload and unmask the payload if needed.
        if (payloadBytesLen * 8 !== bufferRemainingBits) {
            throw new WebSocketFrameError("Payload length does not match payload bytes");
        }
        var payloadData = undefined;
        if (payloadBytesLen > 0) {
            payloadData = Buffer.alloc(payloadBytesLen);
            var payloadStartByte = (BITS_OFFSET_PAYLOAD +
                PayloadLenLevelBits.LEVEL0 +
                payloadAdditionalBitsLength +
                maskingKeyBytes +
                closeReasonBytes) /
                8;
            // Copy payload in bitBuffer to payloadData
            bitBuffer$1.buffer.copy(payloadData, 0, payloadStartByte, payloadStartByte + payloadBytesLen);
            // Unmask the payload, if it is masked
            if (mask) {
                tsafe.assert(maskingKey !== undefined);
                WebSocketFrame.applyMaskToBuffer(payloadData, maskingKey);
            }
        }
        // Instantiate the frame instance
        return new WebSocketFrame({
            fin: fin,
            mask: mask,
            opcode: opcode,
            payloadBytesLen: payloadBytesLen,
            maskingKey: maskingKey,
            payloadData: payloadData,
            closeReason: closeReason,
        });
    };
    /**
     * Exports the given Websocket frame instance into its corresponding buffer
     * representation that can be sent over the network.
     *
     * @returns a buffer.
     */
    WebSocketFrame.prototype.toBuffer = function () {
        // Initialize the buffer and wrap it in the bit buffer
        var buffer = Buffer.alloc(this.frameBitsLength / 8);
        var bitBuffer$1 = new bitBuffer.BitView(buffer);
        bitBuffer$1.bigEndian = true;
        // Set fin flag
        bitBuffer$1.setBits(BITS_OFFSET_FIN, boolToInt(this.fin), BITS_LEN_FIN);
        // Set RSV flags
        bitBuffer$1.setBits(BITS_OFFSET_RSV, 0, BITS_LEN_RSV);
        // Set opcode field
        bitBuffer$1.setBits(BITS_OFFSET_OPCODE, this.opcode, BITS_LEN_OPCODE);
        // Set mask flag
        bitBuffer$1.setBits(BITS_OFFSET_MASK, boolToInt(this.mask), BITS_LEN_MASK);
        // Set payload length bits
        if (this.payloadLenLevel === PayloadLenLevel.LEVEL0) {
            bitBuffer$1.setBits(BITS_OFFSET_PAYLOAD, this.payloadBytesLen, PayloadLenLevelBits.LEVEL0);
        }
        else if (this.payloadLenLevel === PayloadLenLevel.LEVEL1) {
            bitBuffer$1.setBits(BITS_OFFSET_PAYLOAD, 126, PayloadLenLevelBits.LEVEL0);
            bitBuffer$1.setBits(BITS_OFFSET_PAYLOAD + PayloadLenLevelBits.LEVEL0, this.payloadBytesLen, PayloadLenLevelBits.LEVEL1);
        }
        else if (this.payloadLenLevel === PayloadLenLevel.LEVEL2) {
            bitBuffer$1.setBits(BITS_OFFSET_PAYLOAD, 127, PayloadLenLevelBits.LEVEL0);
            bitBuffer$1.setBits(BITS_OFFSET_PAYLOAD + PayloadLenLevelBits.LEVEL0, this.payloadBytesLen, PayloadLenLevelBits.LEVEL2);
        }
        else
            notReached();
        // Set masking key bits, if needed
        if (this.mask) {
            tsafe.assert(this.maskingKey);
            var maskingBytesN = Buffer.allocUnsafe(4);
            maskingBytesN.writeUInt32BE(this.maskingKey);
            var startIdx = this.maskingKeyBitsOffset / 8;
            bitBuffer$1.buffer[startIdx] = maskingBytesN[2];
            bitBuffer$1.buffer[startIdx + 1] = maskingBytesN[3];
            bitBuffer$1.buffer[startIdx + 2] = maskingBytesN[0];
            bitBuffer$1.buffer[startIdx + 3] = maskingBytesN[1];
        }
        // Write in close code, if needed
        if (this.hasCloseReasonCode) {
            var bufferCloseReasonCodeBytesStart = this.frameBitsLength / 8 -
                this.payloadBytesLen -
                this.closeReasonCodeBitsLength / 8;
            tsafe.assert(this.closeReason);
            buffer.writeUInt16BE(this.closeReason, bufferCloseReasonCodeBytesStart);
        }
        // Set payload bytes, if needed
        if (this.payloadData) {
            tsafe.assert(this.payloadData.length === this.payloadBytesLen);
            var bufferPayloadStart = this.frameBitsLength / 8 - this.payloadBytesLen;
            this.payloadData.copy(bitBuffer$1.buffer, bufferPayloadStart, 0, this.payloadBytesLen);
            // Account for the close code 2 bytes, if necessary
            var bufferPayloadStartWithCloseCode = this.frameBitsLength / 8 -
                this.payloadBytesLen -
                this.closeReasonCodeBitsLength / 8;
            // Mask the bytes in the bit buffer that are for the payload, if needed
            if (this.mask) {
                tsafe.assert(this.maskingKey);
                WebSocketFrame.applyMaskToBuffer(bitBuffer$1.buffer, this.maskingKey, bufferPayloadStartWithCloseCode, this.payloadBytesLen);
            }
        }
        return bitBuffer$1.buffer;
    };
    return WebSocketFrame;
}());

/**
 * List of valid protocol prefixes supported.
 */
var VALID_PROTOCOLS = ["ws:", "wss:"];
/**
 * Maps default port to each supported Websocket protocol.
 */
var DEFAULT_PORTS = {
    "ws:": 80,
    "wss:": 443,
};
/**
 * Maps the websocket protocol to its corresponding HTTP upgrade protocol.
 */
var WS_PROTO_TO_UPGRADE_PROTO = {
    "ws:": "http:",
    "wss:": "https:",
};
/**
 * The length (in bytes) of the Websocket secret nonce.
 */
var WS_SECRET_KEY_NONCE_SIZE = 16;
/**
 * The version of the Websocket secret.
 */
var WS_SECRET_VERSION = 13;
/**
 * The Websocket secret value.
 */
var WS_SECRET_VALUE = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
/**
 * Events supported by the Websocket client.
 */
var WebSocketClientEvents;
(function (WebSocketClientEvents) {
    WebSocketClientEvents["open"] = "open";
    WebSocketClientEvents["message"] = "message";
    WebSocketClientEvents["close"] = "close";
    WebSocketClientEvents["ping"] = "ping";
    WebSocketClientEvents["pong"] = "pong";
    WebSocketClientEvents["error"] = "error";
})(WebSocketClientEvents || (WebSocketClientEvents = {}));
/**
 * The Websocket client that manages the Websocket connection to a Websocket
 * server.
 */
var WebSocketClient = /** @class */ (function (_super) {
    __extends(WebSocketClient, _super);
    function WebSocketClient(url) {
        var _this = _super.call(this) || this;
        _this.urlStr = url;
        _this.url = _this.parseAndValidateUrl(url);
        _this.state = "connecting";
        _this.socket = undefined;
        _this.startConnection();
        return _this;
    }
    /**
     * Randomly generates a new masking key.
     *
     * @returns A masking key.
     */
    WebSocketClient.prototype.generateMaskingKey = function () {
        return crypto__default["default"].randomBytes(4).readUInt32BE();
    };
    /**
     * Parses the given URL string and ensures that it is a supported
     * Websocket URL.
     *
     * @param urlStr The URL string.
     * @returns A URL object.
     */
    WebSocketClient.prototype.parseAndValidateUrl = function (urlStr) {
        var url$1 = new url.URL(urlStr);
        if (!VALID_PROTOCOLS.includes(url$1.protocol))
            throw new WebSocketInitializationError("Invalid protocol '".concat(url$1.protocol, "'"));
        if (url$1.port.length == 0)
            url$1.port = DEFAULT_PORTS[url$1.protocol].toString();
        return url$1;
    };
    /**
     * Validates that the given HTTP upgrade response is a valid Websocket
     * handshake. Raises an error if it is an invalid handshake response.
     *
     * @param res The HTTP upgrade response.
     * @param nonceB64 The nonce used when initiating the handshake.
     */
    WebSocketClient.prototype.validateResHandshake = function (res, nonceB64) {
        // Invalid response code
        if (res.statusCode !== 101) {
            res.destroy();
            throw new WebSocketHandshakeError("Server replied with status code: ".concat(res.statusCode));
        }
        // Missing/invalid upgrade header
        var hdrUpgrade = res.headers["upgrade"];
        if (!hdrUpgrade ||
            !caseInsensitiveEquals(hdrUpgrade, "websocket")) {
            res.destroy();
            throw new WebSocketHandshakeError("Missing or invalid upgrade header");
        }
        // Missing/invalid connection header
        var hdrConnection = res.headers["connection"];
        if (!hdrConnection ||
            !caseInsensitiveEquals(hdrConnection, "Upgrade")) {
            res.destroy();
            throw new WebSocketHandshakeError("Missing or invalid connection header");
        }
        var hdrSecWsAccept = res.headers["sec-websocket-accept"];
        // Compute Sec-Websocket-Accept for confirmation
        var secWsAcceptClient = nonceB64 + WS_SECRET_VALUE;
        var secWsAcceptClientHash = crypto__default["default"].createHash("sha1");
        secWsAcceptClientHash.update(secWsAcceptClient);
        var secWsAcceptClientHashB64 = secWsAcceptClientHash.digest("base64");
        // Missing/invalid Sec-Websocket-Accept header
        if (!hdrSecWsAccept || hdrSecWsAccept != secWsAcceptClientHashB64) {
            res.destroy();
            throw new WebSocketHandshakeError("Missing or non-matching Sec-Websocket-Accept header.");
        }
        // Note: ignoring Sec-WebSocket-Extensions and Sec-WebSocket-Protocol
        // headers since we do not support any extensions
    };
    /**
     * Initializes the WebSocket connection, dealing with the upgrade and setting
     * up initial listeners to the underlying TCP socket.
     */
    WebSocketClient.prototype.startConnection = function () {
        var _this = this;
        var nonce = crypto__default["default"].randomBytes(WS_SECRET_KEY_NONCE_SIZE);
        var nonceB64 = nonce.toString("base64");
        var req = https__default["default"].get({
            headers: {
                Connection: "Upgrade",
                Upgrade: "websocket",
                "Sec-WebSocket-Key": nonceB64,
                "Sec-WebSocket-Version": WS_SECRET_VERSION,
            },
            protocol: WS_PROTO_TO_UPGRADE_PROTO[this.url.protocol],
            hash: this.url.hash,
            hostname: this.url.hostname,
            href: this.url.href,
            pathname: this.url.pathname,
            search: this.url.search,
            searchParams: this.url.searchParams,
            host: this.url.host,
            port: this.url.port,
        });
        req.on("upgrade", function (res, socket, head) {
            // Validate the result status code and headers
            _this.validateResHandshake(res, nonceB64);
            _this.state = "open";
            _this.socket = socket;
            tsafe.assert(_this.socket);
            _this.socket.once("close", _this.onSocketClose.bind(_this));
            _this.socket.on("end", _this.onSocketEnd.bind(_this));
            _this.socket.on("data", _this.onSocketData.bind(_this));
            _this.socket.on("error", _this.onSocketError.bind(_this));
            _this.emit(WebSocketClientEvents.open);
        });
    };
    /**
     * Handles when the TCP socket closes.
     *
     * @param hadError Indicates that there was an error when closing.
     */
    WebSocketClient.prototype.onSocketClose = function (hadError) {
        if (this.state !== "closed") {
            this.finalizeClose();
        }
    };
    /**
     * Handles when the TCP socket ends.
     */
    WebSocketClient.prototype.onSocketEnd = function () {
        if (this.state !== "closed") {
            this.finalizeClose();
        }
    };
    /**
     * Handles when an error occurs with the TCP socket.
     */
    WebSocketClient.prototype.onSocketError = function (err) {
        this.emit(WebSocketClientEvents.error, err);
    };
    /**
     * Handles when data is received from the TCP socket. Will parse the data
     * frame and respond accordingly, either emitting websocket ping, pong or
     * message, or handling closing the connection.
     *
     * @param data The data buffer.
     */
    WebSocketClient.prototype.onSocketData = function (data) {
        try {
            var frame = WebSocketFrame.fromBuffer(data);
            if (frame.opcode === WebSocketFrameOpcode.ping) {
                this.handlePingFrame(frame);
            }
            else if (frame.opcode === WebSocketFrameOpcode.pong) {
                this.handlePongFrame(frame);
            }
            else if (frame.opcode === WebSocketFrameOpcode.binary ||
                frame.opcode === WebSocketFrameOpcode.text) {
                this.handleMessageFrame(frame);
            }
            else if (frame.opcode === WebSocketFrameOpcode.continuation) {
                throw new WebSocketUnsupportedError("Fragmentation not supported.");
            }
            else if (frame.opcode === WebSocketFrameOpcode.conn_close) {
                this.handleCloseFrame(frame);
            }
            else
                notReached();
        }
        catch (err) {
            this.emit(WebSocketClientEvents.error, err);
        }
    };
    /**
     * Handles a received ping frame.
     *
     * @param frame The frame.
     */
    WebSocketClient.prototype.handlePingFrame = function (frame) {
        tsafe.assert(frame.opcode === WebSocketFrameOpcode.ping);
        this.emit(WebSocketClientEvents.ping, frame.payloadData);
    };
    /**
     * Handles a received pong frame.
     *
     * @param frame The frame.
     */
    WebSocketClient.prototype.handlePongFrame = function (frame) {
        tsafe.assert(frame.opcode === WebSocketFrameOpcode.pong);
        this.emit(WebSocketClientEvents.pong, frame.payloadData);
    };
    /**
     * Handles a received message frame.
     *
     * @param frame The frame.
     */
    WebSocketClient.prototype.handleMessageFrame = function (frame) {
        tsafe.assert(frame.opcode === WebSocketFrameOpcode.binary ||
            frame.opcode === WebSocketFrameOpcode.text);
        var isBinary = frame.opcode === WebSocketFrameOpcode.binary;
        this.emit(WebSocketClientEvents.message, frame.payloadData, isBinary);
    };
    /**
     * Handles a received close frame.
     *
     * @param frame The frame.
     */
    WebSocketClient.prototype.handleCloseFrame = function (frame) {
        tsafe.assert(frame.opcode === WebSocketFrameOpcode.conn_close);
        // We did not send a closing frame before so send one back
        if (this.state !== "closing") {
            this.sendFrame(WebSocketFrameOpcode.conn_close, undefined, WebSocketFrameCloseReason.normal);
        }
        this.finalizeClose();
    };
    /**
     * Finalizes the closing of the Websocket connection.
     */
    WebSocketClient.prototype.finalizeClose = function () {
        this.state = "closed";
        if (this.socket) {
            this.socket.removeAllListeners("close");
            this.socket.removeAllListeners("end");
            this.socket.removeAllListeners("data");
            this.socket.removeAllListeners("error");
        }
        this.emit(WebSocketClientEvents.close);
    };
    /**
     * Sends a ping message.
     *
     * @param data Extra data.
     */
    WebSocketClient.prototype.ping = function (data) {
        this.sendFrame(WebSocketFrameOpcode.ping, data);
    };
    /**
     * Sends a pong message.
     *
     * @param data Extra data.
     */
    WebSocketClient.prototype.pong = function (data) {
        this.sendFrame(WebSocketFrameOpcode.pong, data);
    };
    /**
     * Sends a Websocket message.
     *
     * @param data The data of the message.
     */
    WebSocketClient.prototype.send = function (data) {
        tsafe.assert(this.state === "open");
        if (isBuffer(data))
            this.sendBuffer(data);
        else if (isStringifiable(data))
            this.sendUTF8String(data.toString());
        else
            throw new WebSocketError("Data type must be a buffer or implement toString");
    };
    /**
     * Sends a Websocket buffer message.
     *
     * @param buffer The payload buffer.
     */
    WebSocketClient.prototype.sendBuffer = function (buffer) {
        this.sendFrame(WebSocketFrameOpcode.binary, buffer);
    };
    /**
     * Sends a Websocket UTF-8 string message.
     *
     * @param buffer The payload string.
     */
    WebSocketClient.prototype.sendUTF8String = function (str) {
        var buffer = Buffer.from(str, "utf-8");
        this.sendFrame(WebSocketFrameOpcode.text, buffer);
    };
    /**
     * Sends a frame.
     *
     * @param opcode The opcode of the frame.
     * @param payloadData The payload of the frame.
     * @param closeReason The close reason of the frame, if needed.
     */
    WebSocketClient.prototype.sendFrame = function (opcode, payloadData, closeReason) {
        var _a;
        // Outgoing frames from client must always be masked
        var maskingKey = this.generateMaskingKey();
        var frame = new WebSocketFrame({
            fin: true,
            mask: true,
            maskingKey: maskingKey,
            opcode: opcode,
            payloadBytesLen: (_a = payloadData === null || payloadData === void 0 ? void 0 : payloadData.length) !== null && _a !== void 0 ? _a : 0,
            payloadData: payloadData,
            closeReason: closeReason,
        });
        // Send the frame
        tsafe.assert(this.socket);
        this.socket.write(frame.toBuffer());
    };
    /**
     * Closes the Websocket connection with the given close code.
     *
     * @param code The close code.
     * @param data Extra payload data.
     */
    WebSocketClient.prototype.close = function (code, data) {
        if (code === void 0) { code = WebSocketFrameCloseReason.normal; }
        // Do nothing if the client is not already open
        if (this.state !== "open")
            return;
        this.state = "closing";
        var dataBuffer;
        if (isStringifiable(data))
            dataBuffer = Buffer.from(data.toString(), "utf-8");
        // Send close frame
        this.sendFrame(WebSocketFrameOpcode.conn_close, dataBuffer, code);
    };
    return WebSocketClient;
}(EventEmitter__default["default"]));

exports.WebSocketClient = WebSocketClient;
