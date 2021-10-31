import React, { FunctionComponent, useState } from "react";
import { Box, Button, Flex } from "@chakra-ui/react";



export const PingPongView: FunctionComponent = (props) => {
  const [serverMsg, setServerMsg] = useState<any>("");

  const createWs = () => {
    const ws = new WebSocket("ws://localhost:3051");
    ws.addEventListener("message", (m) => {
      setServerMsg(m.data);
    });
    return ws;
  }

  const [ws] = useState(createWs());

  const ping = () => {
    ws.send("heartbeat");
  };

  return (
    <Flex direction="column">
      <Button onClick={ping}>Ping</Button>
      <Box>{serverMsg}</Box>
    </Flex>
  );
};
