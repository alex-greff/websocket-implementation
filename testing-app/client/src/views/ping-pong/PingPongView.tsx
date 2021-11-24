import React, { FunctionComponent, useMemo, useState } from "react";
import { Box, Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { WebsocketSelector } from "@/components/WebsocketSelector";
import { WebsocketClient } from "@/types";
import { assert } from "tsafe";

export const PingPongView: FunctionComponent = (props) => {
  const toast = useToast();

  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);
  const connected = useMemo(() => wsClient !== null, [wsClient]);

  const onWsConnect = (ws: WebsocketClient) => {
    ws.on("pong", () => {
      toast({
        title: "Pong",
        duration: 2000,
        status: "info",
        isClosable: false,
      });
    });

    setWsClient(() => ws);
  };

  const onWsDisconnect = () => {
    setWsClient(() => null);
  };

  const ping = () => {
    assert(wsClient !== null);
    wsClient.ping();
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
        <Heading>Ping-Pong</Heading>
        <Text>Demo for WebSocket ping-pong messages</Text>
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

      <Button
        colorScheme="teal"
        maxWidth="30rem"
        width="100%"
        onClick={ping}
        isDisabled={!connected}
      >
        Ping
      </Button>
    </Flex>
  );
};
