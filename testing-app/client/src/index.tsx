import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from "@/App";

function render() {
  const root = document.getElementById("root");
  ReactDOM.render(<App />, root);
}

render();