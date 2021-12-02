import { plainToClass, serialize } from "class-transformer";
import { assert } from "tsafe";
import "reflect-metadata";
import { ChatMessage } from "./types";

/**
 * The type of a received Websocket message.
 */
export type WsReceivedMessageType =
  | "room-connect"
  | "room-leave"
  | "send-message";

/**
 * The type of a sent Websocket message.
 */
export type WsSentMessageType =
  | "room-connected"
  | "receive-message"
  | "members-changed"
  | "error";

/**
 * Base class that represents a Websocket chat message.
 */
export class WsMessage {
  public type: string;

  constructor(type: string) {
    this.type = type;
  }

  static fromJson(dataJson: any): WsMessage {
    const messageBase = plainToClass(WsMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    return messageBase;
  }

  toJson(): string {
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

  static fromJson(dataJson: any): WsReceivedMessage {
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

  static fromJson(dataJson: any): WsSentMessage {
    const messageBase = plainToClass(WsSentMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    return messageBase;
  }
}

// --- Received Messages ---

/**
 * Represents a received room connection request message.
 */
export class WsRoomConnect extends WsReceivedMessage {
  constructor(public roomId: string, public name: string) {
    super("room-connect");
  }

  static fromJson(dataJson: any): WsRoomConnect {
    const message = plainToClass(WsRoomConnect, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-connect");
    return message;
  }
}

/**
 * Represents a received room leave request message.
 */
export class WsRoomLeave extends WsReceivedMessage {
  constructor() {
    super("room-leave");
  }

  static fromJson(dataJson: any): WsRoomLeave {
    const message = plainToClass(WsRoomLeave, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-leave");
    return message;
  }
}

/**
 * Represents a received message sent by a user.
 */
export class WsSendMessage extends WsReceivedMessage {
  constructor(public message: string) {
    super("send-message");
  }

  static fromJson(dataJson: any): WsSendMessage {
    const message = plainToClass(WsSendMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "send-message");
    return message;
  }
}

// --- Sent Messages ---

/**
 * Represents a room connection confirmation message.
 */
export class WsRoomConnected extends WsSentMessage {
  constructor(
    public roomId: string,
    public members: string[],
    public messages: ChatMessage[]
  ) {
    super("room-connected");
  }

  static fromJson(dataJson: any): WsRoomConnected {
    const message = plainToClass(WsRoomConnected, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "room-connected");
    return message;
  }
}

/**
 * Represents a chat message sent to the users.
 */
export class WsReceiveMessage extends WsSentMessage {
  constructor(public message: string, public name: string) {
    super("receive-message");
  }

  static fromJson(dataJson: any): WsReceiveMessage {
    const message = plainToClass(WsReceiveMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "receive-message");
    return message;
  }
}

/**
 * Represents the event message sent when the connected users list changes.
 */
export class WsMembersChanged extends WsSentMessage {
  constructor(public names: string[]) {
    super("members-changed");
  }

  static fromJson(dataJson: any): WsReceiveMessage {
    const message = plainToClass(WsReceiveMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "members-changed");
    return message;
  }
}

/**
 * Represents the message sent when a chat application specific
 * error occurs.
 */
export class WsMessageError extends WsSentMessage {
  constructor(public error: string) {
    super("error");
  }

  static fromJson(dataJson: any): WsMessageError {
    const message = plainToClass(WsMessageError, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "error");
    return message;
  }
}
