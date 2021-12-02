import React, { FunctionComponent, useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Radio,
  RadioGroup,
  Text,
  useToast,
} from "@chakra-ui/react";
import {
  WebsocketClient,
  WebsocketClientType,
  WebsocketServerType,
} from "@/types";
import { useMountedState } from "react-use";
import { WebSocket as WebSocketClientReference } from "ws";
import { WebSocketClient as WebSocketClientD58 } from "d58-websocket-client";

export type WebsocketSelectorOnConnect = (ws: WebsocketClient) => unknown;
export type WebsocketSelectorOnDisconnect = () => unknown;

export interface Props {
  /**
   * Called when the user clicks the connect button.
   */
  onConnect?: WebsocketSelectorOnConnect;
  /**
   * Called when the user clicks the disconnect button.
   */
  onDisconnect?: WebsocketSelectorOnDisconnect;
}

/**
 * Component that handles selecting which Websocket server and client to use.
 */
export const WebsocketSelector: FunctionComponent<Props> = (props) => {
  const { onConnect, onDisconnect } = props;

  const isMounted = useMountedState();

  const toast = useToast();

  const [selectedServer, setSelectedServer] =
    useState<WebsocketServerType>("implemented-server");
  const [selectedClient, setSelectedClient] =
    useState<WebsocketClientType>("implemented-client");

  const [connected, setConnected] = useState(false);
  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);

  const onServerChange = (value: string) => {
    setSelectedServer(value as WebsocketServerType);
  };

  const onClientChange = (value: string) => {
    setSelectedClient(value as WebsocketClientType);
  };

  const onWsConnect = (ws: WebsocketClient) => {
    setWsClient(() => ws);
    setConnected(() => true);
    if (onConnect) onConnect(ws);
  };

  const onWsDisconnect = () => {
    // Only update state and do callback if the component is mounted
    if (isMounted()) {
      setWsClient(() => null);
      setConnected(() => false);
      if (onDisconnect) onDisconnect();
    }
  };

  const onClickToggleConnect = () => {
    const serverUrl =
      selectedServer === "implemented-server"
        ? "ws://localhost:3052"
        : "ws://localhost:3051";

    // Connect to new websocket client
    if (!connected) {
      const ws =
        selectedClient === "reference-client"
          ? new WebSocketClientReference(serverUrl)
          : new WebSocketClientD58(serverUrl);

      ws.on("open", () => {
        onWsConnect(ws);
      });

      ws.on("error", () => {
        toast({
          title: "Unable to connect",
          description: "Unable to connect to Websocket client",
          duration: 3000,
          status: "error",
          isClosable: true,
        });

        onWsDisconnect();
      });

      ws.on("close", () => {
        onWsDisconnect();
      });
    }
    // Disconnect from currently connected websocket client
    else {
      wsClient?.close();
    }
  };

  // Close the Websocket client when the component is unmounted.
  useEffect(() => {
    return () => {
      wsClient?.close();
    };
  }, [wsClient]);

  return (
    <form
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
      onSubmit={(e) => {
        e.preventDefault();
        onClickToggleConnect();
      }}
    >
      <Text color="gray.700" fontWeight="semibold">
        Select Websocket server and client to use
      </Text>

      <Box height="2"></Box>

      <Flex direction="column">
        <FormControl as="fieldset" id="websocket-server">
          <FormLabel as="legend">Websocket Server</FormLabel>
          <RadioGroup
            value={selectedServer}
            isDisabled={connected}
            onChange={onServerChange}
          >
            <HStack spacing="24px">
              <Radio value="implemented-server">Implemented</Radio>
              <Radio value="reference-server">Reference</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        <Box height="4"></Box>

        <FormControl as="fieldset" id="websocket-client">
          <FormLabel as="legend">Websocket Client</FormLabel>
          <RadioGroup
            value={selectedClient}
            isDisabled={connected}
            onChange={onClientChange}
          >
            <HStack spacing="24px">
              <Radio value="implemented-client">Implemented</Radio>
              <Radio value="reference-client">Reference</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>
      </Flex>

      <Box height="2"></Box>

      <Button
        colorScheme={connected ? "red" : "green"}
        maxWidth="10rem"
        width="100%"
        type="submit"
      >
        {connected ? "Disconnect" : "Connect"}
      </Button>
    </form>
  );
};
