from functools import partial
from http.server import BaseHTTPRequestHandler, HTTPServer
from hashlib import sha1
import base64
import struct
from socket import socket as Socket
# local imports:
from wssUtils import s2bs, b2bs, bs2s, bs2b

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
OP_CONTINUATION = 0x0
OP_TEXT = 0x1
OP_BINARY = 0x2
OP_CLOSE = 0x8
OP_PING = 0x9
OP_PONG = 0xa


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
        # two cases for data: str or bytes
        if type(data) == str:
            # create new frame and fill out based on length and stuff
            frame = WSFrame(b'')
            frame.set_opcode(OP_TEXT)
            print(frame)
        elif type(data) == bytes:
            return
    
    def _sendPong(self):
        frame = WSFrame(b'')
        frame.set_opcode(OP_PONG)
        payload = frame.get_bytes(True)
        self.socket.send(payload)

    def _sendClose(self):
        return

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
            (maskingKey,) = struct.unpack("!I", wsMsg[nextByte:nextByte + 4])
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


class WSFrame:
    def __init__(self, bytes):
        self.bytes = bytes if bytes else b''
        self.fin = '1' # 1 is True, 0 is False, denotes the final frame as part of one msg
        self.rsv = '000' # 3 filler bits
        self.opcode = '0000' # 4 bits, 1 is text, 2 is binary data etc..
        self.mask = '0' # 1 bit, true if payload is masked (server does not need to mask data)
        self.payload_len = '0000000' # 7 bits, or 7+16 bits or 7+64 bits
        # if first 7 bits are 0-125, that is the length of payload
        # if first 7 bits are 126, we interpret the following 16 bits as the actual payload length
        # if first 7 bits are 127, we interpret the following 64 bits as the actual payload length
        self.masking_key = '' # server does not need a masking key if we are not masking yeah
        self.payload_data = '' # number of bits is 8*the number represented by payload_len

    def get_frame(self) -> str:
        """
        Returns the bistring representation of the entire frame
        """

        return (
            self.fin+
            self.rsv+
            self.opcode+
            self.mask+
            self.payload_len+
            self.masking_key+
            self.payload_data
        )
    
    def get_bytes(self, refresh: bool) -> bytes:
        """
        get the byte sequence of the entire frame, refreshing old bytes optionally
        """
        if (not self.bytes) or refresh:
            self.bytes = bs2b(self.get_frame())
        return self.bytes

    def set_fin(self, fin:bool):
        self.fin = '1' if fin else '0'

    # opcode: hexadecimal int, sets the opcode variable accordingly
    def set_opcode(self, opcode:int):
        s = bin(opcode)[2:] # will be 4 bits if opcode is one hexadecimal char
        self.opcode = s
    
    # plen: int, number of bytes that our payload takes up
    def set_payload_len(self, plen):
        plen_bits = bin(plen)[2:]
        if plen <= 125:
            self.payload_len = plen_bits;
        elif plen < 65536:
            # case where we hard code the first 7 bits to be = 126 and append plen_bits
            prefix = bin(126)[2:]
            self.payload_len = prefix + plen_bits
        else:
            # case where we hard code the first 7 bits to be = 127 and append plen_bits
            prefix = bin(127)[2:]
            self.payload_len = prefix + plen_bits
    
    def set_payload_data(self, data):
        if not data:
            self.payload_data = ''
            return
        # if data is text, we convert to bytes, and then convert to bin
        if type(data) == str:
            self.payload_data = s2bs(data)
        # if data is bytes:
        if type(data) == bytes:
            self.payload_data = b2bs(data)
