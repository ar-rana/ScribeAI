import { nullable } from "better-auth";
import { assign, createActor, createMachine } from "xstate";

interface RecorderContext {
  recorder: MediaRecorder | null;
  transcript: string;
  type: "mic" | "tab";
  audio: Blob[];
  audioURL: string | null;
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
      recorder: null,
      transcript: "",
      type: "mic",
      audio: [],
      audioURL: "",
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
      startRecording: (context) => {
        if (context.context.recorder) {
          context.context.recorder?.resume();
          console.log("Audio Resumed");
          return context;
        }
        console.log("Recording started");
        const getStream = async () => {
          return context.context.type === "mic"
            ? navigator.mediaDevices.getUserMedia({ audio: true })
            : navigator.mediaDevices.getDisplayMedia({
                audio: true,
                video: false,
              });
        };

        getStream()?.then((stream: MediaStream) => {
          const recorder = new MediaRecorder(stream);
          const audioBlobs: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioBlobs.push(e.data);
          };

          recorder.onstop = () => {
            const blob = new Blob(audioBlobs, { type: "audio/webm" }); // combine all chunks into one audio BLOB
            const url = URL.createObjectURL(blob); // this URL used for playback

            context.context.audio = audioBlobs;
            context.context.audioURL = url;
          };
        });
      },

      stopRecording: ({ context }) => {
        context.recorder?.stop();
        console.log("■ Recording stopped");
      },

      pauseRecording: ({ context }) => {
        context.recorder?.pause();
        console.log("Recording Paused");
      },

      setType: assign({
        type: ({ context }) => (context.type === "mic" ? "tab" : "mic"),
      }),
    },
  }
);

// export const recorder = createActor(recorderState);
