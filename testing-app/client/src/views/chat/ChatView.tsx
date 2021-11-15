import React, { FunctionComponent, useMemo, useState } from "react";
import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { WebsocketSelector } from "@/components/WebsocketSelector";
import { WebsocketClient } from "@/types";

export const ChatView: FunctionComponent = (props) => {
  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);
  const connected = useMemo(() => wsClient !== null, [wsClient]);

  const onWsConnect = (ws: WebsocketClient) => {
    // TODO: do chat message setup
    setWsClient(() => ws);
  };

  const onWsDisconnect = () => {
    setWsClient(() => null);
  };

  return (
    <Flex direction="column" height="100%" alignItems="center">
      <Flex
        width="100%"
        margin="2"
        direction="column"
        alignItems="center"
        padding="2"
        bgColor="blue.100"
      >
        <Heading>Chat</Heading>
        <Text>Websocket Chat Demo</Text>
        <Button as={Link} to="/">
          Home
        </Button>
      </Flex>

      <Box height="2"></Box>

      <WebsocketSelector
        onConnect={onWsConnect}
        onDisconnect={onWsDisconnect}
      />

      <Box height="6"></Box>

      <Text>TODO: implement chat UI</Text>
    </Flex>
  );
};
