import React, { FunctionComponent, useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { WebsocketSelector } from "@/components/WebsocketSelector";
import { WebsocketClient } from "@/types";

export const ChatView: FunctionComponent = (props) => {
  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);
  const isConnected = useMemo(() => wsClient !== null, [wsClient]);

  const [roomId, setRoomId] = useState<string>("");
  const isValidRoomId = useMemo(() => roomId.length > 0, [roomId]);

  const [name, setName] = useState<string>("");
  const isValidName = useMemo(() => name.length > 0, [name]);

  const [isRoomConnected, setIsRoomConnected] = useState<boolean>(false);

  const [textMessageInput, setTextMessageInput] = useState<string>("");
  const isValidTextMessageInput = useMemo(
    () => textMessageInput.length > 0,
    [textMessageInput]
  );

  const onWsConnect = (ws: WebsocketClient) => {
    // TODO: do chat message setup
    setWsClient(() => ws);
  };

  const onWsDisconnect = () => {
    setWsClient(() => null);
  };

  const onRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(() => e.target.value);
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(() => e.target.value);
  };

  const onRoomToggleJoin = () => {
    // TODO: do chat message setup?
    setIsRoomConnected(() => !isRoomConnected);
  };

  const onTextMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextMessageInput(() => e.target.value);
  };

  const onSendTextMessage = () => {
    // TODO: implement
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

      <Flex
        direction="row"
        justifyContent="space-evenly"
        width="100%"
        paddingRight="2"
        paddingLeft="2"
      >
        <WebsocketSelector
          onConnect={onWsConnect}
          onDisconnect={onWsDisconnect}
        />

        <Box width="4"></Box>

        {/* Room join inputs */}
        <Flex
          direction="column"
          alignItems="center"
          width="100%"
          maxWidth="20rem"
        >
          <Text color="gray.700" fontWeight="semibold">
            Provide room and name information
          </Text>

          <FormControl id="room-id">
            <FormLabel>Room ID</FormLabel>
            <Input
              placeholder="Enter ID of room..."
              value={roomId}
              onChange={onRoomIdChange}
              isDisabled={!isConnected || isRoomConnected}
            />
          </FormControl>

          <Box height="2"></Box>

          <FormControl id="name-input">
            <FormLabel>Name</FormLabel>
            <Input
              placeholder="Enter name..."
              value={name}
              onChange={onNameChange}
              isDisabled={!isConnected || isRoomConnected}
            />
          </FormControl>

          <Box height="2"></Box>

          <Button
            colorScheme={isRoomConnected ? "red" : "blue"}
            onClick={onRoomToggleJoin}
            isDisabled={!isConnected || !isValidRoomId || !isValidName}
          >
            {isRoomConnected ? "Leave Room" : "Join / Create Room"}
          </Button>
        </Flex>
      </Flex>

      <Box height="6"></Box>

      <Text>TODO: show messages</Text>

      <Box height="2"></Box>

      {/* Chat input */}
      <Flex direction="row" justifyContent="space-between" paddingBottom="2">
        <FormControl id="chat-message-input">
          <Input
            placeholder="Enter message..."
            value={textMessageInput}
            onChange={onTextMessageInputChange}
            isDisabled={!isConnected || !isRoomConnected}
          />
        </FormControl>

        <Box width="2"></Box>

        <Button
          colorScheme={"blue"}
          onClick={onSendTextMessage}
          isDisabled={
            !isConnected || !isRoomConnected || !isValidTextMessageInput
          }
        >
          Send
        </Button>
      </Flex>
    </Flex>
  );
};
