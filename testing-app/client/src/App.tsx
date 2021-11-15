import React, { FunctionComponent } from "react";
import {
  Button,
  Center,
  ChakraProvider,
  Flex,
  Heading,
  HStack,
} from "@chakra-ui/react";
import "./App.scss";
import { HashRouter as Router, Link, Route, Switch } from "react-router-dom";
import { PingPongView } from "./views/ping-pong/PingPongView";
import { ChatView } from "./views/chat/ChatView";
import { HomeView } from "./views/home/HomeView";

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
