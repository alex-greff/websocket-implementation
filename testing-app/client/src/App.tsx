import React, { FunctionComponent } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import "./App.scss";

export const App: FunctionComponent = (props) => {
  return (
    <ChakraProvider>
      <Box>TODO: implement App</Box>
    </ChakraProvider>
  );
};
