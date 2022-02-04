import sys
import os
from typing import Dict, List, Tuple, Union
sys.path.append('../../websocket-server')
sys.path.append('./dist')
import json
from WebSocketServer import WebSocketConnection, WebSocketServer
import threading



class Room:
    def __init__(self, id):
        self.id: str = id
        self.members: List[RoomMember] = []
        self.messages: List[Message] = []
        

class RoomMember:
    def __init__(self, name, wsClient):
        self.name: str = name
        self.wsClient: WebSocketConnection = wsClient
        

class Message:
    def __init__(self, sender, message):
        self.sender: RoomMember = sender
        self.message: str = message


# global room structure
rooms: Dict[str, Room] = {}
lock = threading.Lock()

def getConnectedRoom(ws: WebSocketConnection) -> Union[Tuple[Room, RoomMember], Tuple[None, None]]:
    """Try to find room associated with this websocket connection"""
    for roomId in rooms:
        room = rooms[roomId]
        
        for member in room.members:
            if member.wsClient == ws:
                return (room, member)
    return (None, None)
    
    
def checkNameInRoom(roomId: str, name: str) -> bool:
    """Try to find a user with given name in given room"""
    if roomId not in rooms:
        return False
    room = rooms[roomId]
    for member in room.members:
        if member.name == name:
            return True


def connectionHandler(ws: WebSocketConnection):
    """Called when new connection is established just set up handlers"""
    ws.onMessage(onMessage)
    ws.onClose(onClose)


def onClose(ws):
    """Called when websocket connection is about to be closed, cleanup"""
    with lock:
        (room, member) = getConnectedRoom(ws)
        if not room:
            return
        room.members.remove(member)
        membersChangedMsg = {
            "type": "members-changed",
            "names": [member.name for member in room.members]
        }
        for member in room.members:
            member.wsClient.send(json.dumps(membersChangedMsg))
    

def onMessage(text: Union[str, bytes], ws: WebSocketConnection):
    """Called on every message sent to the given websocket connection and data"""
    with lock:
        try:
            # our application uses json to communicate, parse the json
            message = json.loads(text)
        except:
            errorMsg = {
                "type": "error",
                "error": "Invalid message"
            }
            ws.send(json.dumps(errorMsg))
            return
            
        if (message["type"] == "room-connect"):
            # A new user is connecting
            (room, member) = getConnectedRoom(ws)
            if room:
                errorMsg = {
                    "type": "error",
                    "error": "Already in a room"
                }
                ws.send(json.dumps(errorMsg))
                return
                
            roomId = message["roomId"]
            name = message["name"]
            
            if checkNameInRoom(roomId, name):
                errorMsg = {
                    "type": "error",
                    "error": f"Name {name} already exists in room {roomId}"
                }
                ws.send(json.dumps(errorMsg))
                return
            
            # either get the room if exists or make a new one
            if roomId not in rooms:
                rooms[roomId] = Room(roomId)
                
            room = rooms[roomId]
            # add this new member to the room
            room.members.append(RoomMember(name, ws))
            
            # send back join confirmation and entire message history for this room
            roomConnectedMsg = {
                "type": "room-connected",
                "roomId": roomId,
                "members": [member.name for member in room.members],
                "messages": [{"sender": msg.sender.name, "message": msg.message}
                            for msg in room.messages]
            }
            ws.send(json.dumps(roomConnectedMsg))
            
            # notify all members of the room of this new member
            membersChangedMsg = {
                "type": "members-changed",
                "names": [member.name for member in room.members]
            }
            
            for member in room.members:
                if member.wsClient == ws:
                    continue
                member.wsClient.send(json.dumps(membersChangedMsg))
        
        elif (message["type"] == "room-leave"):
            # someone wants to leave their room
            (room, myMember) = getConnectedRoom(ws)
            if not room:
                errorMsg = {
                    "type": "error",
                    "error": "Not in a room"
                }
                ws.send(json.dumps(errorMsg))
                return
            
            # remove that user from the room
            room.members.remove(myMember)
                
            # let everyone know this user left
            membersChangedMsg = {
                "type": "members-changed",
                "names": [member.name for member in room.members]
            }
            
            for member in room.members:
                member.wsClient.send(json.dumps(membersChangedMsg))
        
        elif (message["type"] == "send-message"):
            # someone wants to send a message to everyone in their room
            (room, sender) = getConnectedRoom(ws)
            if not room:
                errorMsg = {
                    "type": "error",
                    "error": "Not in a room"
                }
                ws.send(json.dumps(errorMsg))
                return
            
            # add message to the room
            room.messages.append(Message(sender, message["message"]))
            
            # notify everyone in the room of the new message
            receiveMsg = {
                "type": "receive-message",
                "message": message["message"],
                "name": sender.name
            }
            for member in room.members:
                if member.name != sender.name:
                    member.wsClient.send(json.dumps(receiveMsg))
        else:
            errorMsg = {
                "type": "error",
                "error": "Invalid message"
            }
            ws.send(json.dumps(errorMsg))
            return
    
def get_port() -> int:
    if os.environ.get("PORT", None) is not None:
        return int(os.environ.get("PORT", None))
    return 3052

wss = WebSocketServer(get_port(), connectionHandler)
