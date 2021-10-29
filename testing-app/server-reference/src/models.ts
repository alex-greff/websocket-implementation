import { plainToClass, serialize } from "class-transformer";
import { assert } from "tsafe";

export type WsMessageType = "error" | WsReceivedMessageType | WsSentMessageType;

export type WsReceivedMessageType = "room-connect" | "send-message";
export type WsSentMessageType =
  | "room-connected"
  | "receive-message"
  | "members-changed";

export class WsMessage {
  constructor(public type: string) {}

  static fromJson(data: string): WsMessage {
    const messageBase = plainToClass(WsMessage, data, {
      excludeExtraneousValues: true,
    });
    return messageBase;
  }

  toJson(): string {
    return serialize(this, { excludeExtraneousValues: false });
  }
}

export class WsReceivedMessage extends WsMessage {
  constructor(public type: WsReceivedMessageType) {
    super(type);
  }

  static fromJson(data: string): WsReceivedMessage {
    const messageBase = plainToClass(WsReceivedMessage, data, {
      excludeExtraneousValues: true,
    });
    return messageBase;
  }
}

export class WsSentMessage extends WsMessage {
  constructor(public type: WsSentMessageType) {
    super(type);
  }

  static fromJson(data: string): WsSentMessage {
    const messageBase = plainToClass(WsSentMessage, data, {
      excludeExtraneousValues: true,
    });
    return messageBase;
  }
}

// --- Received Messages ---

export class WsRoomConnect extends WsReceivedMessage {
  constructor(public roomId: string, public name: string) {
    super("room-connect");
  }

  static fromJson(data: string): WsRoomConnect {
    const message = plainToClass(WsRoomConnect, data, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-connect");
    return message;
  }
}

export class WsSendMessage extends WsReceivedMessage {
  constructor(public message: string) {
    super("send-message");
  }

  static fromJson(data: string): WsSendMessage {
    const message = plainToClass(WsSendMessage, data, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "send-message");
    return message;
  }
}

// --- Sent Messages ---

export class WsRoomConnected extends WsSentMessage {
  constructor(public roomId: string, public members: string[]) {
    super("room-connected");
  }

  static fromJson(data: string): WsRoomConnected {
    const message = plainToClass(WsRoomConnected, data, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-connected");
    return message;
  }
}

export class WsReceiveMessage extends WsSentMessage {
  constructor(public message: string) {
    super("receive-message");
  }

  static fromJson(data: string): WsReceiveMessage {
    const message = plainToClass(WsReceiveMessage, data, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "receive-message");
    return message;
  }
}

export class WsMembersChanged extends WsSentMessage {
  constructor(public names: string[]) {
    super("members-changed");
  }

  static fromJson(data: string): WsReceiveMessage {
    const message = plainToClass(WsReceiveMessage, data, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "members-changed");
    return message;
  }
}

// --- Error Message ---

export class WsMessageError extends WsMessage {
  constructor(public error: string) {
    super("error");
  }

  static fromJson(data: unknown): WsMessageError {
    const message = plainToClass(WsMessageError, data, {
      excludeExtraneousValues: true,
    });
    assert(message.type == "error");
    return message;
  }
}
