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
} from "@/models";
import { assert } from "tsafe";

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
}

interface RoomMap {
  [id: string]: Room | undefined;
}

const rooms: RoomMap = {};

const getConnectedRoom = (ws: WebSocket): Room | null => {
  for (const roomId in rooms) {
    const room = rooms[roomId]!;

    for (const member of room.members) {
      if (member.wsClient === ws) return room;
    }
  }

  return null;
};

const onClientClose = (ws: WebSocket) => {
  const connectedRoom = getConnectedRoom(ws);
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
    const message = WsReceivedMessage.fromJson(messageStr);

    // Client connects to or creates a room
    if (message.type === "room-connect") {
      const roomConnectMsg = WsRoomConnect.fromJson(messageStr);

      const connectedRoom = getConnectedRoom(ws);
      if (connectedRoom) {
        const errorMsg = new WsMessageError("Already in a room.");
        ws.send(errorMsg.toJson());
        return;
      }

      const roomId = roomConnectMsg.roomId;
      const name = roomConnectMsg.name;

      // Get the room or create it if it does not exist yet
      let room = rooms[roomConnectMsg.roomId];
      if (!room) {
        room = {
          id: roomId,
          members: [],
        };
        rooms[roomConnectMsg.roomId] = room;
      }

      room.members.push({ name, wsClient: ws });

      // Send room-connected message back to client
      const roomConnectedMsg = new WsRoomConnected(
        roomId,
        room.members.map((member) => member.name)
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
    } else if (message.type === "send-message") {
      const sendMsg = WsSendMessage.fromJson(messageStr);

      const connectedRoom = getConnectedRoom(ws);
      if (!connectedRoom) {
        const errorMsg = new WsMessageError("Not in a room.");
        ws.send(errorMsg.toJson());
        return;
      }

      const message = sendMsg.message;
      const receiveMsg = new WsReceiveMessage(message);

      // Send the new message to all the clients in the room
      for (const member of connectedRoom.members) {
        try {
          member.wsClient.send(receiveMsg.toJson());
        } catch (err) {
          console.log("Unable to send receive-message to WS client");
        }
      }
    }
  } catch (err) {
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
