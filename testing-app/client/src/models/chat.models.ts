import { plainToClass, serialize } from "class-transformer";
import { assert } from "tsafe";
import "reflect-metadata";
import { ChatMessage } from "@/general-types";

/**
 * The type of a sent Websocket message.
 */
export type WsSentMessageType = "room-connect" | "room-leave" | "send-message";

/**
 * The type of a received Websocket message.
 */
export type WsReceivedMessageType =
  | "room-connected"
  | "receive-message"
  | "members-changed"
  | "error";

/**
 * Base class that represents a Websocket chat message.
 */
export class WsMessage {
  constructor(public type: string) {}

  static fromJson(dataJson: unknown): WsMessage {
    const messageBase = plainToClass(WsMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    return messageBase;
  }

  toJson(): any {
    return serialize(this, { excludeExtraneousValues: false });
  }
}

/**
 * Base class that represents a received Websocket chat message.
 */
export class WsReceivedMessage extends WsMessage {
  constructor(public type: WsReceivedMessageType) {
    super(type);
  }

  static fromJson(dataJson: unknown): WsReceivedMessage {
    const messageBase = plainToClass(WsReceivedMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    return messageBase;
  }
}

/**
 * Base class that represents a sent Websocket chat message.
 */
export class WsSentMessage extends WsMessage {
  constructor(public type: WsSentMessageType) {
    super(type);
  }

  static fromJson(dataJson: unknown): WsSentMessage {
    const messageBase = plainToClass(WsSentMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    return messageBase;
  }
}

// --- Sent Messages ---

/**
 * Represents the room connection request message.
 */
export class WsRoomConnect extends WsSentMessage {
  constructor(public roomId: string, public name: string) {
    super("room-connect");
  }

  static fromJson(dataJson: unknown): WsRoomConnect {
    const message = plainToClass(WsRoomConnect, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-connect");
    return message;
  }
}

/**
 * Represents the room leave request message.
 */
export class WsRoomLeave extends WsSentMessage {
  constructor() {
    super("room-leave");
  }

  static fromJson(dataJson: unknown): WsRoomLeave {
    const message = plainToClass(WsRoomLeave, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-leave");
    return message;
  }
}

/**
 * Represents a message sent by the user.
 */
export class WsSendMessage extends WsSentMessage {
  constructor(public message: string) {
    super("send-message");
  }

  static fromJson(dataJson: unknown): WsSendMessage {
    const message = plainToClass(WsSendMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "send-message");
    return message;
  }
}

// --- Received Messages ---

/**
 * Represents the room connection confirmation message.
 */
export class WsRoomConnected extends WsReceivedMessage {
  constructor(
    public roomId: string,
    public members: string[],
    public messages: ChatMessage[]
  ) {
    super("room-connected");
  }

  static fromJson(dataJson: unknown): WsRoomConnected {
    const message = plainToClass(WsRoomConnected, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-connected");
    return message;
  }
}

/**
 * Represents a received chat message.
 */
export class WsReceiveMessage extends WsReceivedMessage {
  constructor(public message: string, public name: string) {
    super("receive-message");
  }

  static fromJson(dataJson: unknown): WsReceiveMessage {
    const message = plainToClass(WsReceiveMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "receive-message");
    return message;
  }
}

/**
 * Represents the event message received when the connected users list changes.
 */
export class WsMembersChanged extends WsReceivedMessage {
  constructor(public names: string[]) {
    super("members-changed");
  }

  static fromJson(dataJson: unknown): WsMembersChanged {
    const message = plainToClass(WsMembersChanged, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "members-changed");
    return message;
  }
}

/**
 * Represents the message received when a chat application specific
 * error occurs.
 */
export class WsMessageError extends WsReceivedMessage {
  constructor(public error: string) {
    super("error");
  }

  static fromJson(dataJson: unknown): WsMessageError {
    const message = plainToClass(WsMessageError, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "error");
    return message;
  }
}
