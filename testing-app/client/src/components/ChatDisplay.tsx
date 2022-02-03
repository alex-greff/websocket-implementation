import React, { FunctionComponent } from "react";
import { Box, Flex, VStack, Text } from "@chakra-ui/react";
import { ChatMessage } from "@/general-types";

export interface Props {
  /**
   * The list of chat messages to display. Ordered from oldest to newest.
   */
  messages: ChatMessage[];
  /** The name of the current user. */
  selfName: string;
}

interface ChatBubbleProps {
  /**
   * Chat message to display.
   */
  message: ChatMessage;
  /**
   * Indicates if the chat message is a message the current user sent.
   */
  fromSelf: boolean;
}

/**
 * Component for displaying one chat bubble.
 */
const ChatBubble: FunctionComponent<ChatBubbleProps> = (props) => {
  const { message, fromSelf } = props;

  return (
    <Flex direction="column">
      <Text alignSelf={fromSelf ? "flex-end" : "flex-start"} fontSize="sm">
        {message.sender}
      </Text>
      <Box
        paddingX="4"
        paddingY="1.5"
        borderRadius="5px"
        bgColor={fromSelf ? "#24AAE7" : "#D1D1D1"}
      >
        <Text fontSize="md">{message.message}</Text>
      </Box>
    </Flex>
  );
};

/**
 * Component that displays the chat log.
 */
export const ChatDisplay: FunctionComponent<Props> = (props) => {
  const { messages, selfName } = props;

  return (
    <VStack spacing="2" maxWidth="20rem" width="100%">
      {messages.map((message, idx) => {
        const fromSelf = message.sender == selfName;

        return (
          <Flex
            key={`chat-bubble-${idx}`}
            width="100%"
            justifyContent={fromSelf ? "flex-end" : "flex-start"}
          >
            <ChatBubble message={message} fromSelf={fromSelf} />
          </Flex>
        );
      })}
    </VStack>
  );
};
