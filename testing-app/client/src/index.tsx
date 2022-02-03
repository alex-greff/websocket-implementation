import "reflect-metadata";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from "@/App";
import "./index.scss";

function render() {
  const root = document.getElementById("root");
  ReactDOM.render(<App />, root);
}

render();