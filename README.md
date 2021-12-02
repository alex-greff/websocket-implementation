# cscd58-project

Project for CSCD58 (WebSocket client and server)

**Members:**
 
* Anton Kaminsky
* Chedy Sankar
* Alex Greff

## Testing App

For this project, we setup a simple chat room app that allows us to demonstrate
the functionality of our Websocket client and server implementations. The app
consists of two Websocket servers, one uses our implemented Websocket client
while the other one uses the `ws` npm package. These servers are connected to by
a client that uses Electron which gives a nice interface for interacting with
the chat room.

To run the testing app we must do the following:

First, start up our Websocket chat sever:

```bash
cd server
python3 chat_server.py
```

In a new terminal, start up the reference Websocket chat server:

```bash
cd server-reference
npm install
npm run start:dev
```

Next, link our Websocket client implementation so that our Electron client can
use it:

```bash
cd ../websocket-client
npm run create:link
```

Finally, in one more terminal start up the Electron app client:

```bash
cd client
npm install
npm link:ws-client
npm run start:dev
# or start `num` windows (between 2 and 4, inclusive)
npm run start:dev-[num]
```