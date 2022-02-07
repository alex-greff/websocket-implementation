import React, { FunctionComponent } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { HashRouter, BrowserRouter, Route, Switch } from "react-router-dom";
import { PingPongView } from "./views/ping-pong/PingPongView";
import { ChatView } from "./views/chat/ChatView";
import { HomeView } from "./views/home/HomeView";
import isElectron from "is-electron";

/**
 * The root app component.
 */
export const App: FunctionComponent = (props) => {
  const AppComponents = (
    <Switch>
      <Route exact path="/">
        <HomeView />
      </Route>

      <Route path="/ping-pong">
        <PingPongView />
      </Route>

      <Route path="/chat">
        <ChatView />
      </Route>
    </Switch>
  );

  return (
    <ChakraProvider>
      {isElectron() ? (
        <HashRouter>{AppComponents}</HashRouter>
      ) : (
        <BrowserRouter>{AppComponents}</BrowserRouter>
      )}
    </ChakraProvider>
  );
};
