import React, { FunctionComponent } from "react";
import { Button, Flex, Heading, HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export const HomeView: FunctionComponent = (props) => {
  return (
    <Flex
      direction="column"
      alignItems="center"
      height="100%"
      justifyContent="center"
    >
      <Heading>Choose Test Example</Heading>

      <HStack spacing="3">
        <Button as={Link} to="/ping-pong">
          Ping-Pong
        </Button>

        <Button as={Link} to="/chat">
          Chat
        </Button>
      </HStack>
    </Flex>
  );
};
