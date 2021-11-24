import { BitView } from "bit-buffer";
import { assert } from "tsafe";
import { WebSocketFrameError } from "./exceptions";
import * as Utilities from "./utilities";

export enum WebSocketFrameOpcode {
  continuation = 0x0,
  text = 0x1,
  binary = 0x2,
  conn_close = 0x8,
  ping = 0x9,
  pong = 0xa,
}

export enum WebSocketFrameCloseReason {
  normal = 1000,
  going_away = 1001,
  protocol_error = 1002,
  unprocessable_input = 1003,
  reserved = 1004,
  reason_not_provided = 1005,
  abnormal = 1006,
  invalid_data = 1007,
  message_to_big = 1009,
  extension_required = 1010,
  internal_server_error = 1011,
  tls_handshake_failed = 1015,
}

enum PayloadLenLevel {
  LEVEL0 = 0,
  LEVEL1 = 1,
  LEVEL2 = 2,
}

enum PayloadLenLevelBits {
  LEVEL0 = 7,
  LEVEL1 = 32,
  LEVEL2 = 64,
}

const PAYLOAD_LEN_MAX_LVL0 = 125;
const PAYLOAD_LEN_MAX_LVL1 = (1 << 32) - 1; // 2^32-1

const BITS_LEN_FIN = 1;
const BITS_LEN_RSV = 3;
const BITS_LEN_OPCODE = 4;
const BITS_LEN_MASK = 1;

const BITS_LEN_CLOSE_REASON_CODE = 2 * 8; // 2 bytes

const BITS_LEN_MASKING_KEY = 4 * 8; // 4 bytes

const MIN_FRAME_BITS_LEN =
  BITS_LEN_FIN +
  BITS_LEN_RSV +
  BITS_LEN_OPCODE +
  BITS_LEN_MASK +
  PayloadLenLevelBits.LEVEL0;

const BITS_OFFSET_FIN = 0;
const BITS_OFFSET_RSV = BITS_LEN_FIN;
const BITS_OFFSET_OPCODE = BITS_LEN_RSV + BITS_OFFSET_RSV;
const BITS_OFFSET_MASK = BITS_OFFSET_OPCODE + BITS_LEN_OPCODE;
const BITS_OFFSET_PAYLOAD = BITS_OFFSET_MASK + BITS_LEN_MASK;

export interface WebSocketFrameValues {
  fin: boolean;
  opcode: WebSocketFrameOpcode;
  mask: boolean;
  payloadBytesLen?: number;
  maskingKey?: number;
  payloadData?: Buffer;
  closeReason?: WebSocketFrameCloseReason;
}

export class WebSocketFrame {
  public readonly fin: boolean;
  public readonly rsv1: boolean = false;
  public readonly rsv2: boolean = false;
  public readonly rsv3: boolean = false;
  public readonly opcode: number;
  public readonly mask: boolean;
  public readonly payloadBytesLen: number;
  public readonly maskingKey?: number;
  public readonly payloadData?: Buffer;
  public readonly closeReason?: WebSocketFrameCloseReason;

  constructor(values: WebSocketFrameValues) {
    this.fin = values.fin;
    this.opcode = values.opcode;
    this.mask = values.mask;
    this.payloadBytesLen = values.payloadBytesLen ?? 0;
    this.maskingKey = values.maskingKey;
    this.payloadData = values.payloadData;
    this.closeReason = values.closeReason;

    this.validateValues();
  }

  private validateValues(): void | never {
    // TODO: did I get everything?

    if (this.mask && !this.maskingKey)
      throw new WebSocketFrameError("Missing masking key");

    if (this.payloadData && this.payloadBytesLen !== this.payloadData.length)
      throw new WebSocketFrameError(
        "Payload bytes length does not match payload buffer length"
      );
  }

  static validateOpcode(opcode: number): void | never {
    const valid =
      opcode === WebSocketFrameOpcode.continuation ||
      opcode === WebSocketFrameOpcode.text ||
      opcode === WebSocketFrameOpcode.binary ||
      opcode === WebSocketFrameOpcode.conn_close ||
      opcode === WebSocketFrameOpcode.ping ||
      opcode === WebSocketFrameOpcode.pong;

    if (!valid) throw new WebSocketFrameError(`Invalid opcode: ${opcode}`);
  }

  static validateCloseReasonCode(closeReasonCode: number): void | never {
    // TODO: implement
  }

  private get payloadLenLevel(): PayloadLenLevel {
    assert(this.payloadBytesLen >= 0);

    if (this.payloadBytesLen <= PAYLOAD_LEN_MAX_LVL0) {
      return PayloadLenLevel.LEVEL0;
    } else if (this.payloadBytesLen <= PAYLOAD_LEN_MAX_LVL1) {
      return PayloadLenLevel.LEVEL1;
    } else {
      return PayloadLenLevel.LEVEL2;
    }
  }

  private get payloadBitsLength(): number {
    if (this.payloadLenLevel == PayloadLenLevel.LEVEL0)
      return PayloadLenLevelBits.LEVEL0;
    else if (this.payloadLenLevel == PayloadLenLevel.LEVEL1)
      return PayloadLenLevelBits.LEVEL0 + PayloadLenLevelBits.LEVEL1;
    else return PayloadLenLevelBits.LEVEL0 + PayloadLenLevelBits.LEVEL2;
  }

  private get maskingKeyBitsLength(): number {
    return this.mask ? BITS_LEN_MASKING_KEY : 0;
  }

  private get maskingKeyBitsOffset(): number {
    return BITS_OFFSET_PAYLOAD + this.payloadBitsLength;
  }

  private get payloadBitsLen(): number {
    return this.payloadBytesLen * 8;
  }

  private get hasCloseReasonCode(): boolean {
    return (
      this.opcode === WebSocketFrameOpcode.conn_close && !!this.closeReason
    );
  }

  private get closeReasonCodeBitsLength(): number {
    return this.hasCloseReasonCode ? BITS_LEN_CLOSE_REASON_CODE : 0;
  }

  private get frameBitsLength(): number {
    return (
      BITS_LEN_FIN +
      BITS_LEN_RSV +
      BITS_LEN_OPCODE +
      BITS_LEN_MASK +
      this.payloadBitsLength +
      this.maskingKeyBitsLength +
      this.closeReasonCodeBitsLength +
      this.payloadBitsLen
    );
  }

  static applyMaskToBuffer(
    buffer: Buffer,
    maskingKey: number,
    startOffset: number = 0,
    length?: number
  ) {
    const maskBytesN = Buffer.allocUnsafe(4);
    maskBytesN.writeUInt32BE(maskingKey);

    // Reference: https://datatracker.ietf.org/doc/html/rfc6455#section-5.3

    if (!length) length = buffer.length;

    // Mask each byte in the payload
    for (let i = startOffset; i < startOffset + length; i++) {
      const j = i & 3; // equivalent to: i % 4
      // Alternatively can do something like
      // buffer[i] = buffer[i] ^ Utilities.intGetByteAt(maskingKey, j);
      buffer[i] = buffer[i] ^ maskBytesN[j];
    }
  }

  static fromBuffer(buffer: Buffer): WebSocketFrame {
    // Ensure that at least everything upto and including
    // Payload len (7) is there
    if (buffer.length < MIN_FRAME_BITS_LEN / 8)
      throw new WebSocketFrameError("Buffer length too small");

    const bitBuffer = new BitView(buffer);
    bitBuffer.bigEndian = true;
    let bufferRemainingBits = buffer.length * 8;

    const fin = Utilities.intToBool(
      bitBuffer.getBits(BITS_OFFSET_FIN, BITS_LEN_FIN, false)
    );
    bufferRemainingBits -= BITS_LEN_FIN;

    const rsv = bitBuffer.getBits(BITS_OFFSET_RSV, BITS_LEN_RSV, false);
    bufferRemainingBits -= BITS_LEN_RSV;
    if (rsv !== 0) throw new WebSocketFrameError("RSV bits must be zero");

    const opcodeNum = bitBuffer.getBits(
      BITS_OFFSET_OPCODE,
      BITS_LEN_OPCODE,
      false
    );
    WebSocketFrame.validateOpcode(opcodeNum);
    const opcode = opcodeNum as WebSocketFrameOpcode;
    bufferRemainingBits -= BITS_LEN_OPCODE;

    const mask = Utilities.intToBool(
      bitBuffer.getBits(BITS_OFFSET_MASK, BITS_LEN_MASK, false)
    );
    bufferRemainingBits -= BITS_LEN_MASK;

    const payloadLenLvl0Val = bitBuffer.getBits(
      BITS_OFFSET_PAYLOAD,
      PayloadLenLevelBits.LEVEL0,
      false
    );
    bufferRemainingBits -= PayloadLenLevelBits.LEVEL0;

    let payloadBytesLen: number = 0;

    let payloadLenLevel: PayloadLenLevel;
    let payloadAdditionalBitsLength;
    if (payloadLenLvl0Val <= 125) {
      payloadLenLevel = PayloadLenLevel.LEVEL0;
      payloadAdditionalBitsLength = 0;
    } else if (payloadLenLvl0Val === 126) {
      payloadLenLevel = PayloadLenLevel.LEVEL1;
      payloadAdditionalBitsLength = PayloadLenLevelBits.LEVEL1;
    } else if (payloadLenLvl0Val === 127) {
      payloadLenLevel = PayloadLenLevel.LEVEL2;
      payloadAdditionalBitsLength = PayloadLenLevelBits.LEVEL2;
    } else Utilities.notReached();

    if (payloadLenLevel === PayloadLenLevel.LEVEL0)
      payloadBytesLen = payloadLenLvl0Val;
    else {
      if (bufferRemainingBits < payloadAdditionalBitsLength)
        throw new WebSocketFrameError("Buffer length too small");
      payloadBytesLen = bitBuffer.getBits(
        BITS_OFFSET_PAYLOAD + PayloadLenLevelBits.LEVEL0,
        payloadAdditionalBitsLength
      );
      bufferRemainingBits -= payloadAdditionalBitsLength;
    }

    let maskingKey: number | undefined = undefined;
    let maskingKeyBytes = 0;
    if (mask) {
      if (bufferRemainingBits < BITS_LEN_MASKING_KEY)
        throw new WebSocketFrameError("Buffer length too small");

      maskingKeyBytes = BITS_LEN_MASKING_KEY;

      maskingKey = bitBuffer.getBits(
        BITS_OFFSET_PAYLOAD +
          PayloadLenLevelBits.LEVEL0 +
          payloadAdditionalBitsLength,
        maskingKeyBytes,
        false
      );
      bufferRemainingBits -= BITS_LEN_MASKING_KEY;
    }

    // Handle close control frame
    let closeReason: WebSocketFrameCloseReason | undefined = undefined;
    let closeReasonBytes = 0;
    const hasCloseReasonCode = bufferRemainingBits / 8 >= 2;
    if (opcode === WebSocketFrameOpcode.conn_close && hasCloseReasonCode) {
      closeReasonBytes = BITS_LEN_CLOSE_REASON_CODE;
      const closeReasonNum = bitBuffer.buffer.readUInt16BE(
        (PayloadLenLevelBits.LEVEL0 +
          payloadAdditionalBitsLength +
          BITS_LEN_MASKING_KEY) /
          8
      );
      WebSocketFrame.validateCloseReasonCode(closeReasonNum);

      closeReason = closeReasonNum as WebSocketFrameCloseReason;

      bufferRemainingBits -= closeReasonBytes;
    }

    if (payloadBytesLen * 8 !== bufferRemainingBits)
      throw new WebSocketFrameError(
        "Payload length does not match payload bytes"
      );
    let payloadData: Buffer | undefined = undefined;
    if (payloadBytesLen > 0) {
      payloadData = Buffer.alloc(payloadBytesLen);

      const payloadStartByte =
        (BITS_OFFSET_PAYLOAD +
          PayloadLenLevelBits.LEVEL0 +
          payloadAdditionalBitsLength +
          maskingKeyBytes +
          closeReasonBytes) /
        8;

      // Copy payload in bitBuffer to payloadData
      bitBuffer.buffer.copy(
        payloadData,
        0,
        payloadStartByte,
        payloadStartByte + payloadBytesLen
      );

      // Unmask the payload, if it is masked
      if (mask) {
        assert(maskingKey !== undefined);
        WebSocketFrame.applyMaskToBuffer(payloadData, maskingKey);
      }
    }

    return new WebSocketFrame({
      fin,
      mask,
      opcode,
      payloadBytesLen,
      maskingKey,
      payloadData,
      closeReason,
    });
  }

  public toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.frameBitsLength / 8);
    const bitBuffer = new BitView(buffer);
    bitBuffer.bigEndian = true;

    bitBuffer.setBits(
      BITS_OFFSET_FIN,
      Utilities.boolToInt(this.fin),
      BITS_LEN_FIN
    );
    bitBuffer.setBits(BITS_OFFSET_RSV, 0, BITS_LEN_RSV);
    bitBuffer.setBits(BITS_OFFSET_OPCODE, this.opcode, BITS_LEN_OPCODE);
    bitBuffer.setBits(
      BITS_OFFSET_MASK,
      Utilities.boolToInt(this.mask),
      BITS_LEN_MASK
    );

    // Set payload length bits
    if (this.payloadLenLevel === PayloadLenLevel.LEVEL0) {
      bitBuffer.setBits(
        BITS_OFFSET_PAYLOAD,
        this.payloadBytesLen,
        PayloadLenLevelBits.LEVEL0
      );
    } else if (this.payloadLenLevel === PayloadLenLevel.LEVEL1) {
      bitBuffer.setBits(BITS_OFFSET_PAYLOAD, 126, PayloadLenLevelBits.LEVEL0);
      bitBuffer.setBits(
        BITS_OFFSET_PAYLOAD + PayloadLenLevelBits.LEVEL0,
        this.payloadBytesLen,
        PayloadLenLevelBits.LEVEL1
      );
    } else if (this.payloadLenLevel === PayloadLenLevel.LEVEL2) {
      bitBuffer.setBits(BITS_OFFSET_PAYLOAD, 127, PayloadLenLevelBits.LEVEL0);
      bitBuffer.setBits(
        BITS_OFFSET_PAYLOAD + PayloadLenLevelBits.LEVEL0,
        this.payloadBytesLen,
        PayloadLenLevelBits.LEVEL2
      );
    } else Utilities.notReached();

    // Set masking key bits, if needed
    if (this.mask) {
      assert(this.maskingKey);

      const maskingBytesN = Buffer.allocUnsafe(4);
      maskingBytesN.writeUInt32BE(this.maskingKey);
      // TODO: this has to be some endianness stuff, figure it out
      const startIdx = this.maskingKeyBitsOffset / 8;
      bitBuffer.buffer[startIdx] = maskingBytesN[2];
      bitBuffer.buffer[startIdx + 1] = maskingBytesN[3];
      bitBuffer.buffer[startIdx + 2] = maskingBytesN[0];
      bitBuffer.buffer[startIdx + 3] = maskingBytesN[1];
    }

    // Write in close code, if needed
    if (this.hasCloseReasonCode) {
      const bufferCloseReasonCodeBytesStart =
        this.frameBitsLength / 8 -
        this.payloadBytesLen -
        this.closeReasonCodeBitsLength / 8;
      assert(this.closeReason);
      buffer.writeUInt16BE(this.closeReason, bufferCloseReasonCodeBytesStart);
    }

    // Set payload bytes, if needed
    if (this.payloadData) {
      assert(this.payloadData.length === this.payloadBytesLen);

      const bufferPayloadStart =
        this.frameBitsLength / 8 - this.payloadBytesLen;

      this.payloadData.copy(
        bitBuffer.buffer,
        bufferPayloadStart,
        0,
        this.payloadBytesLen
      );

      // Account for the close code 2 bytes, if necessary
      const bufferPayloadStartWithCloseCode =
        this.frameBitsLength / 8 -
        this.payloadBytesLen -
        this.closeReasonCodeBitsLength / 8;

      // TODO: remove
      // console.log("bitBufferPayloadStart = " + bitBufferPayloadStart);
      // console.log("payloadData (unmasked):");
      // console.log(this.payloadData);

      // Mask the bytes in the bit buffer that are for the payload, if needed
      if (this.mask) {
        assert(this.maskingKey);
        WebSocketFrame.applyMaskToBuffer(
          bitBuffer.buffer,
          this.maskingKey,
          bufferPayloadStartWithCloseCode,
          this.payloadBytesLen
        );

        // TODO: remove
        // const payloadMasked = Buffer.alloc(this.payloadBytesLen);
        // bitBuffer.buffer.copy(
        //   payloadMasked,
        //   0,
        //   bitBufferPayloadStart,
        //   bitBufferPayloadStart + this.payloadBytesLen
        // );
        // console.log("payloadData (masked):");
        // console.log(payloadMasked);
      }
    }

    // TODO: remove
    // console.log("bitBuffer.buffer");
    // console.log(bitBuffer.buffer);

    return bitBuffer.buffer;
  }
}
