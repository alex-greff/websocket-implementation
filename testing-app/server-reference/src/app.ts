import "reflect-metadata";
import { WebSocketServer, WebSocket, RawData } from "ws";
import {
  WsMessageError,
  WsReceiveMessage,
  WsSendMessage,
  WsRoomConnect,
  WsRoomConnected,
  WsReceivedMessage,
  WsMembersChanged,
  WsMessage,
  WsRoomLeave,
} from "@/models";
import { assert } from "tsafe";
import { ChatMessage } from "./types";

const wss = new WebSocketServer({
  port: 3051,
});

interface RoomMember {
  name: string;
  wsClient: WebSocket;
}

interface Room {
  id: string;
  members: RoomMember[];
  messages: ChatMessage[];
}

interface RoomMap {
  [id: string]: Room | undefined;
}

const rooms: RoomMap = {};

const getConnectedRoom = (ws: WebSocket): [Room | null, RoomMember | null] => {
  for (const roomId in rooms) {
    const room = rooms[roomId]!;

    for (const member of room.members) {
      if (member.wsClient === ws) return [room, member];
    }
  }

  return [null, null];
};

const nameAlreadyExistsInRoom = (roomId: string, name: string): boolean => {
  const room = rooms[roomId];

  // Room doesn't exist yet so of course this name is available
  if (!room) return false;

  for (const member of room.members) {
    if (member.name === name) return true;
  }

  return false;
};

const onClientClose = (ws: WebSocket) => {
  const [connectedRoom] = getConnectedRoom(ws);
  if (!connectedRoom) return;

  // Remove the client from the room it was in
  const idx = connectedRoom.members.findIndex(
    (member) => member.wsClient === ws
  );
  assert(idx > -1);
  connectedRoom.members.splice(idx, 1);

  // Broadcast that the client has left the room
  const membersChangedMsg = new WsMembersChanged(
    connectedRoom.members.map((member) => member.name)
  );
  for (const member of connectedRoom.members) {
    if (member.wsClient === ws) continue;

    try {
      member.wsClient.send(membersChangedMsg.toJson());
    } catch (err) {
      console.log("Unable to send members-changed to WS client");
    }
  }
};

const onClientMessage = (messageRaw: RawData, ws: WebSocket) => {
  const messageStr = messageRaw.toString();
  try {
    const messageJson = JSON.parse(messageStr);

    const message = WsReceivedMessage.fromJson(messageJson);

    // Client connects to or creates a room
    if (message.type === "room-connect") {
      const roomConnectMsg = WsRoomConnect.fromJson(messageJson);

      const [connectedRoom] = getConnectedRoom(ws);
      if (connectedRoom) {
        const errorMsg = new WsMessageError("Already in a room.");
        ws.send(errorMsg.toJson());
        return;
      }

      const roomId = roomConnectMsg.roomId;
      const name = roomConnectMsg.name;

      if (nameAlreadyExistsInRoom(roomId, name)) {
        const errorMsg = new WsMessageError(
          `Name '${name}' already exists in room '${roomId}'`
        );
        ws.send(errorMsg.toJson());
        return;
      }

      // Get the room or create it if it does not exist yet
      let room = rooms[roomConnectMsg.roomId];
      if (!room) {
        room = {
          id: roomId,
          members: [],
          messages: [],
        };
        rooms[roomConnectMsg.roomId] = room;
      }

      room.members.push({ name, wsClient: ws });

      // Send room-connected message back to client
      const roomConnectedMsg = new WsRoomConnected(
        roomId,
        room.members.map((member) => member.name),
        [...room.messages]
      );
      ws.send(roomConnectedMsg.toJson());

      // Send members-changed message to all clients other than the newly
      // connected one
      const membersChangedMsg = new WsMembersChanged(
        room.members.map((member) => member.name)
      );
      for (const member of room.members) {
        if (member.wsClient === ws) continue;

        try {
          member.wsClient.send(membersChangedMsg.toJson());
        } catch (err) {
          console.log("Unable to send members-changed to WS client");
        }
      }
    }
    // Client leaves room
    else if (message.type == "room-leave") {
      const roomLeaveMsg = WsRoomLeave.fromJson(messageJson);

      const [connectedRoom, self] = getConnectedRoom(ws);
      if (!connectedRoom) {
        const errorMsg = new WsMessageError("Not in a room.");
        ws.send(errorMsg.toJson());
        return;
      }

      assert(self !== null);

      // Remove member from member list
      const memberIdx = connectedRoom.members.findIndex(
        (member) => member.name == self.name
      );
      if (memberIdx > -1) connectedRoom.members.splice(memberIdx, 1);

      // Send members-changed message to all remaining clients
      const membersChangedMsg = new WsMembersChanged(
        connectedRoom.members.map((member) => member.name)
      );
      for (const member of connectedRoom.members) {
        try {
          member.wsClient.send(membersChangedMsg.toJson());
        } catch (err) {
          console.log("Unable to send members-changed to WS client");
        }
      }
    }
    // Client sends a message
    else if (message.type === "send-message") {
      const sendMsg = WsSendMessage.fromJson(messageJson);

      const [connectedRoom, sender] = getConnectedRoom(ws);
      if (!connectedRoom) {
        const errorMsg = new WsMessageError("Not in a room.");
        ws.send(errorMsg.toJson());
        return;
      }

      assert(sender !== null);

      const message = sendMsg.message;

      // Add the message to the message list
      connectedRoom.messages.push({ message, sender: sender.name });

      // Send the new message to all the clients in the room, minus the sender
      const receiveMsg = new WsReceiveMessage(message, sender.name);
      for (const member of connectedRoom.members) {
        try {
          if (member.name !== sender.name)
            member.wsClient.send(receiveMsg.toJson());
        } catch (err) {
          console.log("Unable to send receive-message to WS client");
        }
      }
    }
  } catch (err) {
    console.error(err);
    const errorMsg = new WsMessageError("Invalid message.");
    ws.send(errorMsg.toJson());
  }
};

const onConnection = (ws: WebSocket) => {
  ws.on("message", (m) => onClientMessage(m, ws));

  // TODO: setup heartbeat?

  ws.on("close", () => onClientClose(ws));
};

wss.on("connection", onConnection);
