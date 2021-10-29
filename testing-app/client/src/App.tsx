import React, { FunctionComponent } from "react";
import { ChakraProvider, HStack } from "@chakra-ui/react";
import "./App.scss";
import { HashRouter as Router, Link, Route, Switch } from "react-router-dom";
import { PingPongView } from "./views/ping-pong/PingPongView";
import { ChatView } from "./views/chat/ChatView";
import { HomeView } from "./views/home/HomeView";

export const App: FunctionComponent = (props) => {
  return (
    <ChakraProvider>
      <Router>
        <HStack spacing="3">
          <Link to="/">Home</Link>
          <Link to="/ping-pong">Ping-Pong Test</Link>
          <Link to="/chat">Chat Test</Link>
        </HStack>

        <Switch>
          <Route exact path="/">
            <HomeView />
          </Route>

          <Route path="/ping-pong">
            <PingPongView />
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
