import { ipcRenderer } from "electron";
import WebSocket from "ws";

const PREFIX = "reference-ws-client";

export class ReferenceWebSocketClient extends EventTarget {
  constructor() {
    super();

    ipcRenderer.sendSync(`${PREFIX}-create`);

    ipcRenderer.on(`${PREFIX}-message`, this.onMessageListener);
    ipcRenderer.on(`${PREFIX}-close`, this.onCloseListener);
    ipcRenderer.on(`${PREFIX}-error`, this.onErrorListener);
    ipcRenderer.on(`${PREFIX}-open`, this.onOpenListener);
  }

  private onMessageListener(event: Electron.IpcRendererEvent, message: WebSocket.RawData) {
    const e = new CustomEvent("message", { detail: message });
    this.dispatchEvent(e);
  }

  private onCloseListener(event: Electron.IpcRendererEvent, message: number) {
    const e = new CustomEvent("close", { detail: message });
    this.dispatchEvent(e);
  }

  private onErrorListener(event: Electron.IpcRendererEvent, message: Error) {
    const e = new CustomEvent("error", { detail: message });
    this.dispatchEvent(e);
  }

  private onOpenListener(event: Electron.IpcRendererEvent) {
    const e = new CustomEvent("error");
    this.dispatchEvent(e);
  }

  addEventListener(
    method: "message",
    cb: (e: CustomEvent<WebSocket.RawData>) => void,
  ): void;
  addEventListener(
    method: "close",
    cb: (e: CustomEvent<number>) => void,
  ): void;
  addEventListener(
    method: "error",
    cb: (e: CustomEvent<Error>) => void,
  ): void;
  addEventListener(
    method: "open",
    cb: (e: CustomEvent<null>) => void,
  ): void;
  addEventListener(
    method: string,
    cb: (event: CustomEvent) => void,
  ): void {
    super.addEventListener(method, cb);
  }

  removeEventListener(
    method: "message",
    cb: (e: CustomEvent<WebSocket.RawData>) => void,
  ): void;
  removeEventListener(
    method: "close",
    cb: (e: CustomEvent<number>) => void,
  ): void;
  removeEventListener(
    method: "error",
    cb: (e: CustomEvent<Error>) => void,
  ): void;
  removeEventListener(
    method: "open",
    cb: (e: CustomEvent<null>) => void,
  ): void;
  removeEventListener(
    method: string,
    cb: (event: CustomEvent) => void,
  ): void {
    super.removeEventListener(method, cb);
  }
}