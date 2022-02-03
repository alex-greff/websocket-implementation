import React, { FunctionComponent, useMemo, useState } from "react";
import { Box, Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { WebsocketSelector } from "@/components/WebsocketSelector";
import { WebsocketClient, WebsocketClientElectron } from "@/general-types";
import { assert, is } from "tsafe";
import isElectron from "is-electron";

/**
 * The component for the ping pong view.
 * Note: this component is only supported in Electron because the browser
 * Websocket client does not allow for ping frames to be sent.
 */
export const PingPongView: FunctionComponent = () => {
  const toast = useToast();

  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);
  const connected = useMemo(() => wsClient !== null, [wsClient]);

  const onWsConnect = (ws: WebsocketClient) => {
    assert(is<WebsocketClientElectron>(ws));
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
    assert(is<WebsocketClientElectron>(wsClient));
    wsClient.ping();
  };

  if (!isElectron()) {
    return (
      <Flex
        direction="column"
        height="100%"
        alignItems="center"
        justifyContent="center"
      >
        <Heading>Ping-Pong</Heading>
        <Text maxWidth="25rem" textAlign="center">
          Unfortunately sending/receiving ping and pong frames is not supported
          in the browser.
        </Text>
        <Button as={Link} to="/">
          Home
        </Button>
      </Flex>
    );
  }

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
