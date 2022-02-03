import React, {
  FunctionComponent,
  useMemo,
  useState,
} from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { WebsocketSelector } from "@/components/WebsocketSelector";
import { ChatMessage, WebsocketClient } from "@/general-types";
import { assert } from "tsafe";
import WebSocket from "ws";
import { useMountedState } from "react-use";
import {
  WsMembersChanged,
  WsMessageError,
  WsReceivedMessage,
  WsReceiveMessage,
  WsRoomConnect,
  WsRoomConnected,
  WsRoomLeave,
  WsSendMessage,
} from "@/models/chat.models";
import { ChatDisplay } from "@/components/ChatDisplay";

/**
 * Default input value for the room ID input.
 */
const DEFAULT_ROOM_ID = "";

/**
 * Default input value for the name input.
 */
const DEFAULT_NAME = "";

/**
 * The component for the chat view.
 */
export const ChatView: FunctionComponent = () => {
  const isMounted = useMountedState();
  const toast = useToast();

  const [wsClient, setWsClient] = useState<WebsocketClient | null>(null);
  const isConnected = useMemo(() => wsClient !== null, [wsClient]);

  const [roomId, setRoomId] = useState<string>(DEFAULT_ROOM_ID);
  const isValidRoomId = useMemo(() => roomId.length > 0, [roomId]);

  const [name, setName] = useState<string>(DEFAULT_NAME);
  const isValidName = useMemo(() => name.length > 0, [name]);

  const [isRoomConnected, setIsRoomConnected] = useState<boolean>(false);

  const [textMessageInput, setTextMessageInput] = useState<string>("");
  const isValidTextMessageInput = useMemo(
    () => textMessageInput.length > 0,
    [textMessageInput]
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  const onWsConnect = (ws: WebsocketClient) => {
    setWsClient(() => ws);
  };

  const onWsDisconnect = () => {
    if (isMounted()) {
      roomDisconnect(false);
    }
    setWsClient(() => null);
  };

  const onRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomId(() => e.target.value);
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(() => e.target.value);
  };

  const onNewMessage = (message: string, name: string) => {
    setMessages((messages) => {
      const newMessages: ChatMessage[] = [
        ...messages,
        { message, sender: name },
      ];
      return newMessages;
    });
  };

  const onRoomMessage = (messageRaw: WebSocket.RawData) => {
    try {
      const messageStr: string = messageRaw.toString();

      const messageJson: any = JSON.parse(messageStr);

      const receivedMessage = WsReceivedMessage.fromJson(messageJson);

      if (receivedMessage.type == "room-connected") {
        const roomConnectedMsg = WsRoomConnected.fromJson(messageJson);

        toast({
          title: "Room Connected",
          description: `Successfully connected to room '${roomConnectedMsg.roomId}'`,
          duration: 2000,
          isClosable: true,
          status: "success",
        });

        // Initialize message list to any chat messages that were sent
        // before joining
        setMessages(() => [...roomConnectedMsg.messages]);

        // Initialize members list for the currently joined users
        setMembers(() => [...roomConnectedMsg.members]);

        setIsRoomConnected(() => true);
      } else if (receivedMessage.type == "receive-message") {
        const receiveMessageMsg = WsReceiveMessage.fromJson(messageJson);

        // Update UI with message
        onNewMessage(receiveMessageMsg.message, receiveMessageMsg.name);
      } else if (receivedMessage.type == "members-changed") {
        const membersChangedMsg = WsMembersChanged.fromJson(messageJson);

        setMembers(() => [...membersChangedMsg.names]);
      } else if (receivedMessage.type === "error") {
        const errorMsg = WsMessageError.fromJson(messageJson);

        toast({
          title: "Error",
          description: errorMsg.error,
          duration: 2000,
          isClosable: true,
          status: "error",
        });

        // An error occurred while we were trying to connect to the room
        // so clean up message listener
        if (!isRoomConnected) {
          assert(wsClient !== null);
          // Note: see reasoning in roomDisconnect for why we do this instead of
          // wsClient.off("message", ...)
          wsClient.removeAllListeners("message");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const roomJoin = () => {
    assert(wsClient !== null);

    // Setup message listener
    wsClient.on("message", onRoomMessage);

    // Send the join room message
    const connectMessage = new WsRoomConnect(roomId, name);
    wsClient.send(connectMessage.toJson());
  };

  const roomDisconnect = (sendLeaveMessage = true) => {
    if (sendLeaveMessage) {
      assert(wsClient !== null);

      // Send the leave room message
      const roomLeaveMsg = new WsRoomLeave();
      wsClient.send(roomLeaveMsg.toJson());

      // Note: we do not do wsClient.off("message", ...)
      // because onRoomMessage changes with each rerender and fixing this
      // with useCallback caused other issues. So since no other event listeners
      // are on "message", we can just do this here
      wsClient.removeAllListeners("message");
    }

    setIsRoomConnected(() => false);
    setMessages(() => []); // clear messages
    setMembers(() => []); // clear members
  };

  const onRoomToggleJoin = () => {
    if (!isRoomConnected) {
      roomJoin();
    } else {
      roomDisconnect();
    }
  };

  const onTextMessageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextMessageInput(() => e.target.value);
  };

  const onSendTextMessage = () => {
    assert(wsClient !== null && isValidTextMessageInput);

    // Send the message
    const sendMessage = new WsSendMessage(textMessageInput);
    wsClient.send(sendMessage.toJson());

    // Update UI with message
    onNewMessage(sendMessage.message, name);

    // Clear the input
    setTextMessageInput("");
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
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "20rem",
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isConnected || !isValidRoomId || !isValidName) return;
            onRoomToggleJoin();
          }}
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
            type="submit"
            isDisabled={!isConnected || !isValidRoomId || !isValidName}
          >
            {isRoomConnected ? "Leave Room" : "Join / Create Room"}
          </Button>
        </form>
      </Flex>

      <Box height="6"></Box>

      {/* Display members and chat messages list */}
      {isRoomConnected && (
        <>
          <Flex direction="column" maxWidth="20rem" width="100%">
            <Text fontWeight="bold">Currently Connected:</Text>
            <Box>{members.join(", ")}</Box>
          </Flex>
          <Box height="2"></Box>
          <ChatDisplay messages={messages} selfName={name} />
        </>
      )}

      {/* Chat input */}
      <form
        style={{
          marginTop: "5px",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingBottom: "0.5rem",
        }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!isConnected || !isRoomConnected || !isValidTextMessageInput)
            return;
          onSendTextMessage();
        }}
      >
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
          isDisabled={
            !isConnected || !isRoomConnected || !isValidTextMessageInput
          }
          type="submit"
        >
          Send
        </Button>
      </form>
    </Flex>
  );
};
