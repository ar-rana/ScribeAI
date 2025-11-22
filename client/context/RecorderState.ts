import { assign, createMachine, fromCallback, sendTo } from "xstate";

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
  | { type: "RESTART" }
  | { type: "FINISH" }
  | { type: "AUDIO_READY"; audioBlob: Blob[]; audioURL: any }
  | { type: "RECORDER_CREATED"; recorder: MediaRecorder };

const startRecording = fromCallback<RecorderEvents, { type: "mic" | "tab" }>(
  ({ sendBack, receive, input }) => {
    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let blob;
    let url: any;
    let audioBlobs: Blob[];

    const getStream = async (): Promise<MediaStream> => {
      return input.type === "mic"
        ? navigator.mediaDevices.getUserMedia({ audio: true })
        : navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: false,
          });
    };

    getStream()
      .then((s) => {
        stream = s;
        recorder = new MediaRecorder(stream);
        audioBlobs = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioBlobs.push(e.data);
        };

        recorder.onstop = () => {
          blob = new Blob(audioBlobs, { type: "audio/webm" });
          url = URL.createObjectURL(blob);

          console.log("reached stopp!!!");
          sendBack({
            type: "AUDIO_READY",
            audioBlob: audioBlobs,
            audioURL: url,
          });

          sendBack({ type: "FINISH" });
        };

        sendBack({
          type: "RECORDER_CREATED",
          recorder: recorder,
        });

        recorder.start();
      })
      .catch((error) => {
        console.error("Error setting up recorder:", error);
      });

    receive((event) => {
      if (event.type === "PAUSE") {
        recorder?.pause();
      }

      if (event.type === "RESUME") {
        recorder?.resume();
      }

      if (event.type === "STOP") {
        recorder?.stop();
        stream?.getTracks().forEach((t) => t.stop());

        console.log("finishing!");
      }
    });
  }
);

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
      audioURL: null,
    },
    initial: "idle",
    on: {
      TOGGLE_RECORDING: {
        actions: "setType",
      },
      AUDIO_READY: {
        actions: "setAudioData",
      },
    },
    states: {
      idle: {
        on: { START: "recording" },
      },
      recording: {
        invoke: {
          id: "collect.audio",
          src: "startRecording",
          input: ({ context }) => ({ type: context.type }),
        },
        on: {
          RECORDER_CREATED: {
            actions: "setRecorder",
          },
          RESTART: {
            target: "idle",
            actions: "restartRecording",
          },
          PAUSE: {
            actions: sendTo("collect.audio", { type: "PAUSE" }),
          },
          RESUME: {
            actions: sendTo("collect.audio", { type: "RESUME" }),
          },
          STOP: {
            actions: sendTo("collect.audio", { type: "STOP" }),
          },
          FINISH: "finish",
        },
      },
      finish: {
        entry: "stopRecording",
        on: {
          START: "recording",
          RESTART: {
            target: "idle",
            actions: "restartRecording",
          },
        },
      },
    },
  },
  {
    actions: {
      stopRecording: assign({
        recorder: null,
      }),

      pauseRecording: ({ context }) => {
        context.recorder?.pause();
        console.log("Recording Paused");
      },

      setType: assign({
        type: ({ context }) => (context.type === "mic" ? "tab" : "mic"),
      }),

      restartRecording: assign({
        audio: [],
        audioURL: null,
        recorder: null,
      }),

      setAudioData: assign({
        audio: ({ event }) =>
          (event as RecorderEvents & { type: "AUDIO_READY" }).audioBlob,
        audioURL: ({ event }) =>
          (event as RecorderEvents & { type: "AUDIO_READY" }).audioURL,
      }),

      setRecorder: assign({
        recorder: ({ event }) =>
          (event as RecorderEvents & { type: "RECORDER_CREATED" }).recorder,
      }),

      pauseAndPlay: ({ context }) => {
        if (context.recorder) {
          context.recorder.pause();
        }
      },
    },
    actors: {
      startRecording,
    },
  }
);
