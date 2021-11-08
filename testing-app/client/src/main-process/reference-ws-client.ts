import { BrowserWindow, ipcMain } from "electron";
import WebSocket from "ws";

const PREFIX = "reference-ws-client";

let ws: WebSocket | null = null;

export const initialize = (mainWindow: BrowserWindow) => {

  ipcMain.on(`${PREFIX}-create`, (event, arg) => {
    if (ws)
      throw "WebSocket client already instantiated";
    ws = new WebSocket("ws://localhost:3051");
  
    ws.on("open", () => {
      mainWindow.webContents.send(`${PREFIX}-open`);
    });

    ws.on("message", (message) => {
      mainWindow.webContents.send(`${PREFIX}-message`, message);
    });

    ws.on("error", (message) => {
      mainWindow.webContents.send(`${PREFIX}-error`, message);
    });

    ws.on("ping", (message) => {
      mainWindow.webContents.send(`${PREFIX}-ping`);
    });

    ws.on("pong", (message) => {
      mainWindow.webContents.send(`${PREFIX}-pong`);
    });

    ws.on("close", (message) => {
      mainWindow.webContents.send(`${PREFIX}-close`, message);
      ws = null;
    });

    // ws.on("upgrade", (message) => {
    //   mainWindow.webContents.send(`${PREFIX}-upgrade`, message);
    // });

    // ws.on("unexpected-response", (message) => {
    //   mainWindow.webContents.send(`${PREFIX}-unexpected-response`, message);
    // });
  });
};
