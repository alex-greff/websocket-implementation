import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Text,
  Link,
  Flex,
} from "@chakra-ui/react";
import { FunctionComponent } from "react";

/**
 * Component for displaying one chat bubble.
 */
export const BrowserAlert: FunctionComponent = (props) => {
  return (
    <Alert
      status="warning"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Web Browser Detected!
      </AlertTitle>
      <AlertDescription maxWidth="md">
        <Text marginBottom="5">
          Due to limitations in the browser preventing us from accessing the TCP
          layer directly, the implemented Websocket client cannot be run on the
          browser. As such, only the Websocket client provided by the WebAPI is
          able to be used.
        </Text>

        <Text>
          The Electron builds can be downloaded below which does use our
          Websocket client. To use, unzip and run the client/client.exe files,
          no installation is necessary.
        </Text>

        <Flex
          width="100%"
          flexDirection="row"
          gap="2"
          alignItems="center"
          justifyContent="center"
        >
          <Link
            color="blue.800"
            href={`${process.env.PUBLIC_URL}/desktop-builds/demo-linux-x64.zip`}
            target="_blank"
          >
            demo.zip (Linux)
          </Link>
          <Link
            color="blue.800"
            href={`${process.env.PUBLIC_URL}/desktop-builds/demo-windows-x64.zip`}
            target="_blank"
          >
            demo.zip (Windows)
          </Link>
        </Flex>
      </AlertDescription>
    </Alert>
  );
};
