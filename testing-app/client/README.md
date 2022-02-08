# Testing App Client

The multi-platform testing app.

## Running

Install packages

```bash
npm install
```

Link Websocket client package

```bash
npm run link:ws-client
```

Start web app version (make sure the two servers are running already)

```bash
npm run start:dev-web
```

Start the Electron app

```bash
npm run start:dev-desktop

# Or open with multiple windows
npm run start:dev-desktop-[num-windows]
# where [num-windows] is a number from 1 to 4
```

# Building 

Build the Electron portable zip (note: it is platform dependent and only
works on Linux or Windows)

```bash
npm run build:prod-desktop
```

Copy over the build file to the public directory of the web app (used for the
build download links)

```bash
# Linux
npm run prepare-electron-downloads:linux

# Windows
npm run prepare-electron-downloads:windows
```

Build the web app

```bash
npm run build build:prod-web
```