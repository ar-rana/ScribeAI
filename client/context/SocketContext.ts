import { io, Socket } from "socket.io-client";
import { assign, createMachine, fromCallback, sendTo } from "xstate";

interface SocketContext {
  socket: Socket | null;
  messages: string[];
  transcript: string;
}

interface AudioData {
  audio: string;
  client_id: string;
  user: string;
  state?: string;
}

interface TranscriptData {
  message: {
    transcript: string;
    client_id: string;
    user: string;
  };
}

type SocketEvent =
  | { type: "DISCONNECT" }
  | { type: "DISCONNECT_CLIENT" }
  | { type: "CONNECT" }
  | { type: "CONNECTED"; socket: Socket }
  | { type: "SEND_AUDIO"; media: Blob; user: string }
  | { type: "SEND_CHECK"; message: string }
  | { type: "RECEIVED_MSG"; message: string }
  | { type: "RECEIVED_TRANSCRIPT"; message: string };

const connectToSocket = fromCallback<SocketEvent, any>(
  ({ sendBack, receive }) => {
    const socket = io("http://localhost:3333");

    socket.on("connect", () => {
      sendBack({ type: "CONNECTED", socket });
    });

    socket.on("transciption", (msg: TranscriptData) => {
      console.log(
        "received TranscriptData: ", msg.message.transcript.substring(0, 12)
      );
      sendBack({ type: "RECEIVED_TRANSCRIPT", message: msg.message.transcript });
    });

    socket.on("check_response", (msg: string) => {
      console.log("received cool message: ", msg);
    });

    receive((event) => {
      if (event.type === "SEND_CHECK") {
        socket.emit("check", { message: event.message });
      }

      if (event.type === "SEND_AUDIO") {
        var reader = new FileReader();
        reader.readAsDataURL(event.media);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // console.log("base64: ", base64.slice(0, 50));
          const rawBase64 = base64.split(",")[1];

          const data: AudioData = {
            audio: rawBase64,
            client_id: localStorage.getItem("audioId") || "NIL",
            user: event.user,
          };
          // console.log("data send to server 'audio': ", data);
          socket.emit("audio", { message: data });
        };
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
      transcript: "",
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
          CONNECT: "connected",
        },
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
            actions: sendTo("socket-server", {
              type: "SEND_CHECK",
              message: "checking connection.....",
            }),
          },
          SEND_AUDIO: {
            actions: sendTo("socket-server", ({ event }) => event),
          },
          RECEIVED_TRANSCRIPT: {
            actions: "appendTranscript",
          },
        },
      },
    },
  },
  {
    actions: {
      appendTranscript: assign({
        transcript: ({ context, event }) => {
          const newMsg = (
            event as SocketEvent & { type: "RECEIVED_TRANSCRIPT" }
          ).message;
          const newTranscript = context.transcript + " " + newMsg;
          // console.log("new transcript: ", newTranscript);
          return newTranscript;
        },
      }),

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
