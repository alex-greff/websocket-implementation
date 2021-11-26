from WebSocketServer import WebSocketConnection, WebSocketServer

def connectionHandler(ws: WebSocketConnection):
    ws.onMessage(onMessage)
    

def onMessage(text):
    print(text)


wss = WebSocketServer(3051, connectionHandler)
print('did we get here?')