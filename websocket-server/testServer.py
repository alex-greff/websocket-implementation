from WebSocketServer import WebSocketServer

def connectionHandler(ws):
    pass

wss = WebSocketServer(8080)
wss.onConnection(connectionHandler)
