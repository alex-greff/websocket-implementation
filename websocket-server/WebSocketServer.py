from http.server import BaseHTTPRequestHandler, HTTPServer
from hashlib import sha1
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

class Server(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

    # GET request handler 
    def do_GET(self):
        self.protocol_version = 'HTTP/1.1'
        self.close_connection = False
        msg = b'Hello there'
        socket:Socket = self.request
        self.send_response(200)
        self.send_header('Content-type','text/html')
        self.send_header('Content-length', len(msg))
        self.end_headers()
        self.wfile.write(msg)


class WebSocketServer:
    def __init__(self, port):
        httpd = HTTPServer(('', port), Server)
        httpd.serve_forever()
    
    def onConnection(self, cb):
        self.connectionCb = cb
        
class WebSocketConnection:
    def __init__(self):
        pass
    
    def send(self, data):
        pass
    
    def onMessage(self, msgHandler):
        self.msgHandler = msgHandler
