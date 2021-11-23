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
        self.socket = socket
        pass

    # API method to send data over websocket
    def send(self, data):
        pass

    # API method to register websocket message handler
    def onMessage(self, msgHandler):
        self.msgHandler = msgHandler

    def _listen(self):
        while True:
            wsMsg = self.socket.recv(512)
            self.msgHandler(wsMsg)
