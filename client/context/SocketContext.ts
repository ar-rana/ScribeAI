import { io, Socket } from "socket.io-client";
import { assign, createMachine, fromCallback, sendTo } from "xstate";

interface SocketContext {
  socket: Socket | null;
  messages: string[];
}

type SocketEvent =
  | { type: "DISCONNECT" }
  | { type: "DISCONNECT_CLIENT" }
  | { type: "CONNECT" }
  | { type: "CONNECTED"; socket: Socket }
  | { type: "SEND_MSG"; message: string }
  | { type: "SEND_CHECK"; message: string }
  | { type: "RECEIVED_MSG"; message: string };

const connectToSocket = fromCallback<SocketEvent, any>(
  ({ sendBack, receive }) => {
    const socket = io("http://localhost:3333");

    socket.on("connect", () => {
      sendBack({ type: "CONNECTED", socket });
    });

    socket.on("message", (msg: string) => {
      const { message } = JSON.parse(msg);
      console.log("received cool message");
      sendBack({ type: "RECEIVED_MSG", message });
    });

    receive((event) => {
      if (event.type === "SEND_CHECK") {
        socket.emit("check", { message: event.message });
      }

      if (event.type === "DISCONNECT_CLIENT") {
        socket.disconnect();
      }
    });
  }
);

export const socketState = createMachine(
  {
    id: "socket_io",
    types: {
      context: {} as SocketContext,
      events: {} as SocketEvent,
    },
    context: {
      socket: null,
      messages: [],
    },
    initial: "disconnected",
    on: {
      CONNECTED: {
        actions: "setSocket",
      },
    },
    states: {
      disconnected: {
        entry: "clearSocket",
        on: {
            CONNECT: "connected"
        }
      },
      connected: {
        invoke: {
          id: "socket-server",
          src: "connectToSocket",
        },
        on: {
          DISCONNECT: {
            actions: sendTo("socket-server", { type: "DISCONNECT_CLIENT" }),
            target: "disconnected",
          },
          SEND_CHECK: {
            actions: sendTo("socket-server", { type: "SEND_CHECK", message: "checking connection....." }),
          },
        },
      },
    },
  },
  {
    actions: {
      setSocket: assign({
        socket: ({ event }) =>
          (event as SocketEvent & { type: "CONNECTED" }).socket,
      }),

      clearSocket: assign({
        socket: null,
      }),
    },

    actors: {
      connectToSocket,
    },
  }
);
