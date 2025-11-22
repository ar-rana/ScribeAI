import { nullable } from "better-auth";
import { assign, createActor, createMachine } from "xstate";

interface RecorderContext {
  mediaStream: MediaStream | null;
  recorder: MediaRecorder | null;
  transcript: string;
  type: "mic" | "tab";
}

type RecorderEvents =
  | { type: "TOGGLE_RECORDING" }
  | { type: "START" }
  | { type: "STOP" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART" };

export const recorderState = createMachine(
  {
    id: "recorder",
    types: {
      context: {} as RecorderContext,
      events: {} as RecorderEvents,
    },
    context: {
      mediaStream: null,
      recorder: null,
      transcript: "",
      type: "mic",
    },
    initial: "idle",
    on: {
      TOGGLE_RECORDING: {
        actions: "setType",
      },
    },
    states: {
      idle: {
        on: { START: "recording" },
      },
      recording: {
        entry: "startRecording", // action on state start
        on: {
          RESTART: "finish",
          PAUSE: "paused",
          STOP: "finish",
        },
      },
      paused: {
        entry: "pauseRecording",
        on: {
          RESTART: "finish",
          STOP: "finish",
          RESUME: "recording",
        },
      },
      finish: {
        on: {
          START: "recording",
        },
        entry: "stopRecording",
      },
    },
  },
  {
    actions: {
      startRecording: () => {
        console.log("▶ Recording started");
      },

      stopRecording: () => {
        console.log("■ Recording stopped");
      },

      pauseRecording: () => {
        console.log("|| Recording Paused");
      },

      setType: assign({
        type: ({ context }) => (context.type === "mic" ? "tab" : "mic"),
      }),
    },
  }
);

// export const recorder = createActor(recorderState);
