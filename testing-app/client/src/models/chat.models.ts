import { plainToClass, serialize } from "class-transformer";
import { assert } from "tsafe";
import "reflect-metadata";
import { ChatMessage } from "@/types";

export type WsSentMessageType = "room-connect" | "room-leave" | "send-message";
export type WsReceivedMessageType =
  | "room-connected"
  | "receive-message"
  | "members-changed"
  | "error";

export class WsMessage {
  constructor(public type: string) {}

  static fromJson(dataJson: any): WsMessage {
    const messageBase = plainToClass(WsMessage, dataJson, {
      excludeExtraneousValues: false,
    });
    return messageBase;
  }

  toJson(): any {
    return serialize(this, { excludeExtraneousValues: false });
  }
}

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

// --- Sent Messages ---

export class WsRoomConnect extends WsSentMessage {
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

export class WsRoomLeave extends WsSentMessage {
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

export class WsSendMessage extends WsSentMessage {
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

// --- Received Messages ---

export class WsRoomConnected extends WsReceivedMessage {
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

export class WsReceiveMessage extends WsReceivedMessage {
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

export class WsMembersChanged extends WsReceivedMessage {
  constructor(public names: string[]) {
    super("members-changed");
  }

  static fromJson(dataJson: any): WsMembersChanged {
    const message = plainToClass(WsMembersChanged, dataJson, {
      excludeExtraneousValues: false,
    });
    assert(message.type == "members-changed");
    return message;
  }
}

export class WsMessageError extends WsReceivedMessage {
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
