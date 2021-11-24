from functools import partial
from http.server import BaseHTTPRequestHandler, HTTPServer
from hashlib import sha1
import base64
import struct
from socket import socket as Socket

# HTTP server listening for requests
# websocket handshake start
# client creates TCP connection with server
# client sends upgrade HTTP GET request to the server
# server sends back HTTP response
# websocket handshake complete
# use TCP connection to send/recv data (websocket frames)
# client sends websocket close frame
# websocket and TCP connection closed

GUID = b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
OP_CLOSE = 8
OP_PING = 9


class Server(BaseHTTPRequestHandler):
    def __init__(self, wss, *args, **kwargs):
        self.wss = wss
        super().__init__(*args, **kwargs)

    # Handshake for WebSocket
    def do_GET(self):
        # TODO ERROR HANDLING
        sec = self.headers.get('Sec-WebSocket-Key')
        hash = sha1(sec.encode() + GUID).digest()
        token = base64.b64encode(hash).decode()

        self.protocol_version = 'HTTP/1.1'
        self.close_connection = False
        socket: Socket = self.request
        self.send_response(101)
        self.send_header('Upgrade', 'websocket')
        self.send_header('Connection', 'Upgrade')
        self.send_header('Sec-WebSocket-Accept', token)
        self.end_headers()
        self.wss._newConnection(socket)


class WebSocketServer:
    def __init__(self, port, connectionCb):
        self.connectionCb = connectionCb
        handler = partial(Server, self)
        httpd = HTTPServer(('', port), handler)
        httpd.serve_forever()

    def _newConnection(self, socket: Socket):
        newConn = WebSocketConnection(socket)
        self.connectionCb(newConn)
        newConn._listen()


class WebSocketConnection:
    def __init__(self, socket):
        self.socket: Socket = socket

    # API method to send data over websocket
    def send(self, data):
        pass

    # API method to register websocket message handler
    def onMessage(self, msgHandler):
        self.msgHandler = msgHandler

    def _listen(self):
        while True:
            wsMsg = self.socket.recv(512)
            # get data from websocket header
            finFlag = (wsMsg[0] & 0x80) >> 7
            opcode = wsMsg[0] & 0xf
            maskFlag = (wsMsg[1] & 0x80) >> 7
            payloadLen = wsMsg[1] & 0x7f
            nextByte = 2
            if (payloadLen == 126):
                (payloadLen,) = struct.unpack("!H", wsMsg[2:4])
                nextByte = 4
            elif (payloadLen == 127):
                (payloadLen,) = struct.unpack("!I", wsMsg[2:6])
                nextByte = 6
            (maskingKey,) = struct.unpack("!I", wsMsg[nextByte:nextByte+4])
            nextByte += 4
            print(finFlag, opcode, maskFlag, payloadLen, maskingKey)
            if (opcode == OP_CLOSE):
                self._sendClose()
                self.socket.close()
                break
            elif (opcode == OP_PING):
                self._sendPong()
            else:  
                self.msgHandler(wsMsg)
