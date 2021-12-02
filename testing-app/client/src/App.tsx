import React, { FunctionComponent } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { HashRouter as Router, Route, Switch } from "react-router-dom";
import { PingPongView } from "./views/ping-pong/PingPongView";
import { ChatView } from "./views/chat/ChatView";
import { HomeView } from "./views/home/HomeView";

/**
 * The root app component.
 */
export const App: FunctionComponent = (props) => {
  return (
    <ChakraProvider>
      <Router>
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
      </Router>
    </ChakraProvider>
  );
};
