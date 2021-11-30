from functools import partial
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from hashlib import sha1
import base64
import struct
import multiprocessing
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
        # ^ Check valid header length
        # ^ Check supported opcode
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
    """
    Main WebSocket Server class, capable of connecting to multiple clients simultaneously.
    This server implementation does not currently support handling/sending data across multiple frames
    using the 0 fin bit

    See more about the WebSocket Protocol here: https://datatracker.ietf.org/doc/html/rfc6455
    """
    def __init__(self, port, connectionCb):
        self.connectionCb = connectionCb
        handler = partial(Server, self)
        server = ThreadingHTTPServer(('', port), handler)
        self.server_process = multiprocessing.Process(target=server.serve_forever, args=())
        self.server_process.start()
        print('Server serving')

    def _newConnection(self, socket: Socket):
        newConn = WebSocketConnection(socket)
        self.connectionCb(newConn)
        newConn._listen()

    def closeServer(self):
        if self.server_process:
            self.server_process.terminate()

class WebSocketConnection:
    """
    Stores the socket of a tcp connection, and is used to 
    send & receive data under the WebSocket communication protocol.
    """
    def __init__(self, socket):
        self.socket: Socket = socket

    # API method to send data over websocket
    def send(self, data):
        frame = WSFrame(b'')
        # two cases for data: str or bytes
        if type(data) == str:
            # create new frame and fill out based on length and type
            frame.set_opcode(OP_TEXT)
            data_bytelen = len(data.encode())
        elif type(data) == bytes:
            frame.set_opcode(OP_BINARY)
            data_bytelen = len(data)
        
        frame.set_payload_len(data_bytelen)
        frame.set_payload_data(data)
        payload = frame.get_bytes()
        self.socket.send(payload)
    
    def _sendPong(self):
        frame = WSFrame(b'')
        frame.set_opcode(OP_PONG)
        payload = frame.get_bytes()
        self.socket.send(payload)

    def _sendClose(self):
        frame = WSFrame(b'')
        frame.set_opcode(OP_CLOSE)
        payload = frame.get_bytes()
        self.socket.send(payload)

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
            maskbytes = wsMsg[nextByte:nextByte + 4]
            nextByte += 4
            print(finFlag, opcode, maskFlag, payloadLen, maskingKey)
            if (opcode == OP_CLOSE):
                self._sendClose()
                self.socket.close()
                break
            elif (opcode == OP_PING):
                self._sendPong()
            else:
                unmasked = b''
                for i,b in enumerate(wsMsg[nextByte:]):
                    obyte = b ^ maskbytes[i%4]
                    unmasked += obyte.to_bytes(1, byteorder='big')
                self.msgHandler(unmasked)


class WSFrame:
    """
    WSFrame represents a WebSocket Frame, including all headers,
    appropriate payload length and payload data.

    bytes: placeholder bytes data for pre-filling WSFrame object with bytes (for receiving WS Protocol messages)

    NOTE: this class does not convert payload_data to bitstring representations
    so that it can save on unnecessary computation

    Consult link for more info about WebSocket Frames: https://datatracker.ietf.org/doc/html/rfc6455#section-5
    """
    def __init__(self, bytes):
        self.bytes = bytes if bytes else b''
        self.fin = '1' # 1 is True, 0 is False, denotes the final frame as part of one msg
        self.rsv = '000' # 3 filler bits, reserved for "special" websocket use (these will remain as 0)
        self.opcode = '0000' # 4 bits, 1 is text, 2 is binary data etc.. (See predefined opcodes above)
        self.mask = '0' # 1 bit, true if payload is masked (this server implementation does not mask outgoing messages)
        self.payload_len = '0000000' # 7 bits, or 7+16 bits or 7+64 bits
        # if first 7 bits are 0-125, that is the length of payload
        # if first 7 bits are 126, we interpret the following 16 bits as the actual payload length
        # if first 7 bits are 127, we interpret the following 64 bits as the actual payload length
        # NOTE: these cases ^ for bitlength are handled in the setter method for this variable

        self.masking_key = '' # this server implementation does not mask outgoing messages
        
        self.payload_data = b'' # payload_data is kept as bytes to save on unecessary computation

    def get_frame(self) -> str:
        """
        Returns the bistring representation of the entire frame header (so it excludes the payload data)
        """

        return (
            self.fin+
            self.rsv+
            self.opcode+
            self.mask+
            self.payload_len+
            self.masking_key
        )
    
    def get_bytes(self, refresh: bool = False) -> bytes:
        """
        get the byte sequence of the entire frame, refreshing old bytes optionally
        NOTE: This server does not mask anything sent out!
        """
        if (not self.bytes) or refresh:
            # set first bit of ws header
            prefix = 0x80 ^ int(self.opcode, 2)
            # concatenate prefix bytes with payload length and payload data bytes
            self.bytes = prefix.to_bytes(1, 'big') + bs2b(self.payload_len) + self.payload_data
        return self.bytes

    def set_fin(self, fin:bool):
        """
        Setter method for the fin bit of the frame.
        NOTE: this implementation currently only supports sending data in one singular frame
        """
        self.fin = '1' if fin else '0'

    # opcode: int, sets the opcode variable accordingly
    def set_opcode(self, opcode:int):
        """
        Setter method for the 4 opcode bits tof the frame.
        NOTE: to be used with the predefined opcode integers
        """
        s = bin(opcode)[2:] # will be 4 bits if opcode is one hexadecimal char
        padding = '0'*(4-len(s))
        assert(len(s) <= 4)
        self.opcode = padding+s
    
    # plen: int, number of bytes that our payload takes up
    def set_payload_len(self, plen:int):
        """
        Setter method for the variable amount of bits to represent the payload length
        This setter takes the number of bytes in the payload, and determines the 
        WebSocket Frame compliant bitstring needed to represent the length
        """
        # NOTE: assumes payload length doesn't exceed 2*64 bytes
        plen_bits = bin(plen)[2:]
        if plen <= 125:
            self.payload_len = plen_bits;
        elif plen < 65536:
            # case where we hard code the first 7 bits to be = 126 and append plen_bits
            prefix = bin(126)[2:]
            self.payload_len = prefix + '0'*(16-len(plen_bits)) + plen_bits
        else:
            # case where we hard code the first 7 bits to be = 127 and append plen_bits
            prefix = bin(127)[2:]
            self.payload_len = prefix + '0'*(64-len(plen_bits)) +plen_bits
    
    # data: str or bytes data to be sent. Will be encoded to bytes if is str.
    def set_payload_data(self, data):
        """
        Setter method for the payload data of the WebSocket Frame.
        This method stores the data as bytes, since this is the final type
        that the entire frame will be converted into when sending on a socket.
        """
        if not data:
            self.payload_data = b''
            return
        # if data is text, we convert to bytes, and then convert to bin
        if type(data) == str:
            self.payload_data = data.encode()
        # if data is bytes:
        if type(data) == bytes:
            self.payload_data = data
