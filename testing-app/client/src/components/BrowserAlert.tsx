import { Alert, AlertDescription, AlertIcon, AlertTitle } from "@chakra-ui/react";
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
      <AlertIcon boxSize='40px' mr={0} />
      <AlertTitle mt={4} mb={1} fontSize='lg'>
        Web Browser Detected!
      </AlertTitle>
      <AlertDescription maxWidth="md">
        Due to limitations in the browser preventing us from accessing the TLS
        layer directly, the implemented Websocket client cannot be run on
        the browser. As such, only the Websocket client provided by the WebAPI
        is able to be used.
      </AlertDescription>
    </Alert>
  );
};