# Websocket Implementation

Implementation of a spec-compliant Websocket server and client. Originally done 
as a project for my CSCD58: Computer Networks class.

**Members:**
 
* Anton Kaminsky
* Chedy Sankar
* Alex Greff

# Project Structure

The repository is composed into three sections:

1. The Websocket server (`websocket-server`)
2. The Websocket client (`websocket-client`)
3. The testing chat application (`testing-app`)

The Websocket server is implemented in Python3 with no external dependencies.
The Websocket client is implemented as a Node.js package. The testing app has
three main parts to it. The first part is a reference Websocket server
(`testing-app/server-reference`) using Node.js and the `ws` Websocket package
which implements a version of the chat application used as a reference point to
demonstrate the interoperability of the Websocket client with production-ready
Websocket libraries. The chat application is also rewritten in Python and uses
our implemented Websocket server (`testing-app/server`). Finally, the client
is a cross-platform web app written in React and Typescript. Unfortunately due
to limitations in the WebAPI (specifically no access to lower-level networking
protocols such as TCP), our implemented Websocket client cannot run on the
browser. As such, it is loaded into an Electron app while the web build only
allows for the WebAPI Websocket client to be used.