# Testing App Client

The Electron app client for testing our WebSocket server and client.

## Running

Before continuing, make sure the Websocket servers are running
(see the README.md files inside of `../server` and `../server-reference`)

Install packages (first time only)

```
npm install
```

Link our Websocket client package (before doing this make sure to run
`npm run create:link` in `../../websocket-client` beforehand) (first time only)

```
npm run link:ws-client
```

Start a development window

```
npm run start:dev
```

Optionally, `num` (between 2 and 4, inclusive) windows can be opened at
once with:

```
npm run start:dev-[num]
```
