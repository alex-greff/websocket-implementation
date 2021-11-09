import React, { FunctionComponent, useEffect, useState } from "react";
import { Button, Flex, useToast } from "@chakra-ui/react";
import WebSocket from "ws";

export const PingPongView: FunctionComponent = (props) => {
  const toast = useToast();

  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3051");

    ws.on("pong", () => {
      console.log("pong");
      toast({
        title: "Pong",
        duration: 2000,
        status: "success",
        isClosable: false,
      })
    });

    setWs(ws);

    return () => {
      ws.close();
    };
  }, []);

  const ping = () => {
    ws?.ping();
  };

  return (
    <Flex direction="column">
      <Button onClick={ping}>Ping</Button>
    </Flex>
  );
};
