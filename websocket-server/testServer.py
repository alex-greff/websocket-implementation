from WebSocketServer import WebSocketConnection, WebSocketServer

def connectionHandler(ws: WebSocketConnection):
    ws.onMessage(onMessage)
    

def onMessage(text):
    pass


wss = WebSocketServer(3051, connectionHandler)
