import React, { FunctionComponent } from "react";
import { Box, Button, Flex, Heading, HStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import isElectron from "is-electron";
import { BrowserAlert } from "@/components/BrowserAlert";

/**
 * The component for the home view.
 */
export const HomeView: FunctionComponent = () => {
  return (
    <Flex
      direction="column"
      alignItems="center"
      height="100%"
      justifyContent="center"
    >
      {!isElectron() && <Box width="100%" marginBottom="5"><BrowserAlert /></Box>}

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
