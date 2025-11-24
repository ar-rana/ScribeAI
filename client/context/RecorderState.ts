import { Recording, TranscriptRecord } from "@/app/dashboard/page";
import { assign, createMachine, fromCallback, sendTo } from "xstate";
import { v4 as uuidv4 } from "uuid";

interface RecorderContext {
  recorder: MediaRecorder | null;
  type: "mic" | "tab";
  audio: Blob[];
  audioURL: string | null;
  duration: number;
  prevrecordings: Recording[];
}

type RecorderEvents =
  | { type: "TOGGLE_RECORDING" }
  | { type: "START" }
  | { type: "STOP" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTART" }
  | { type: "FINISH" }
  | { type: "AUDIO_READY"; audioURL: any, duration: number }
  | { type: "KEEP_TRANSCRIPT"; payload: TranscriptRecord }
  | { type: "RECORDER_CREATED"; recorder: MediaRecorder }
  | { type: "SEND_AUDIO_CHUNK"; media: Blob }
  | { type: "SAVE_RECORDS"; records: Recording[] };

const startRecording = fromCallback<RecorderEvents, { type: "mic" | "tab" }>(
  ({ sendBack, receive, input }) => {
    const timer = 6000;
    let displayRecorder: MediaRecorder | null = null;
    let diplayRecorderBlob: Blob[] = [];
    let clonedStream: MediaStream | null = null;

    let recorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let audioBlobs: Blob[] = [];
    let paused: boolean = false;
    let recording: boolean = true;
    const recordOptions = { mimeType: "audio/webm; codecs=opus" };

    const getStream = async (): Promise<MediaStream> => {
      return input.type === "mic"
        ? navigator.mediaDevices.getUserMedia({ audio: true })
        : navigator.mediaDevices.getDisplayMedia({
            audio: true,
            video: true,
          });
    };

    const recordingCycle = () => {
      if (paused || !stream || !recording) return;
      let localAudioBlob: Blob[] = [];
      let localrecorder: MediaRecorder = new MediaRecorder(stream, recordOptions);

      recorder = localrecorder;
      sendBack({
        type: "RECORDER_CREATED",
        recorder: recorder,
      });

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          localAudioBlob.push(e.data);
        }
      };

      recorder.onstop = () => {
        for (let i = 0; i < localAudioBlob.length; i++) audioBlobs.push(localAudioBlob[i]);

        const audioChunk = new Blob(localAudioBlob, { type: "audio/webm" });
        sendBack({
          type: "SEND_AUDIO_CHUNK",
          media: audioChunk,
        });

        if (localrecorder === recorder) recorder = null;
        if (recording && !paused) {
          setTimeout(() => recordingCycle(), 0);
        }
      };

      recorder.start();
      setTimeout(() => {
        if (recorder && (recorder.state === "recording" || recorder.state === "paused")) {
          recorder.stop();
        }
      }, timer);
    };

    getStream()
      .then((s) => {
        const audioOnlyStream = new MediaStream();
        s.getAudioTracks().forEach((track) => audioOnlyStream.addTrack(track)); //getting audioonly for tab recorings
        stream = audioOnlyStream;

        const client_id = uuidv4();
        if (!localStorage.getItem("audioId")) localStorage.setItem("audioId", client_id);
        recordingCycle();

        clonedStream = stream.clone();
        displayRecorder = new MediaRecorder(clonedStream, recordOptions);

        displayRecorder.ondataavailable = (b: BlobEvent) => {
          if (b.data && b.data.size > 0) {
            diplayRecorderBlob.push(b.data);
          }
        };

        displayRecorder.onstop = async () => {
          const blob = new Blob(diplayRecorderBlob, { type: "audio/webm" });
          const url = URL.createObjectURL(blob);
          console.log("AudioURL: ", url);

          const arrayBuffer = await blob.arrayBuffer();
          const audioCtx = new AudioContext();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          console.log("AudioURL Duration: ", audioBuffer.duration);

          sendBack({
            type: "AUDIO_READY",
            audioURL: url,
            duration: audioBuffer.duration,
          });
          console.log("closed");
          sendBack({ type: "FINISH" });
        };

        displayRecorder.start(3000);
      })
      .catch((error) => {
        console.error("Error setting up recorder:", error);
        sendBack({ type: "FINISH" });
      });

    receive((event) => {
      if (event.type === "PAUSE") {
        recorder?.stop();
        paused = true;
        displayRecorder?.pause();
      }

      if (event.type === "RESUME") {
        paused = false;
        if (!recorder || recorder?.state !== "inactive") recordingCycle();
        else recorder?.resume();
        displayRecorder?.resume();
      }

      if (event.type === "STOP") {
        recording = false;
        recorder?.stop();
        displayRecorder?.stop();
        stream?.getTracks().forEach((t) => t.stop());
        clonedStream?.getTracks().forEach((t) => t.stop());

        console.log("finishing!");
        // sendBack({ type: "FINISH" });
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
      prevrecordings: [],
      recorder: null,
      type: "mic",
      audio: [],
      duration: 0,
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
      SAVE_RECORDS: {
        actions: "setPrevRecords",
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
          SEND_AUDIO_CHUNK: {
            actions: "addToGlobalAudio",
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
          KEEP_TRANSCRIPT: {
            target: "idle",
            actions: "appendRecordings",
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

      appendRecordings: assign({
        prevrecordings: ({ context, event }) => {
          const recording = (event as RecorderEvents & { type: "KEEP_TRANSCRIPT" }).payload
          const actualData: Recording = {
            date: new Date().toISOString(),
            duration: recording.duration,
            client_audio_id: recording.client_audio_id,
            title: recording.title || "recording",
            transcript: recording.transcript,
            userEmail: recording.email
          };
          return [actualData, ...context.prevrecordings];
        }
      }),

      pauseRecording: ({ context }) => {
        context.recorder?.pause();
        console.log("Recording Paused");
      },

      setType: assign({
        type: ({ context }) => (context.type === "mic" ? "tab" : "mic"),
      }),

      setPrevRecords: assign({
        prevrecordings: ({ event }) => (event as RecorderEvents & { type: "SAVE_RECORDS" }).records,
      }),

      restartRecording: assign({
        audio: [],
        audioURL: null,
        recorder: null,
      }),

      setAudioData: assign({
        audioURL: ({ event }) => (event as RecorderEvents & { type: "AUDIO_READY" }).audioURL,
        duration: ({ event }) => (event as RecorderEvents & { type: "AUDIO_READY" }).duration,
      }),

      setRecorder: assign({
        recorder: ({ event }) =>
          (event as RecorderEvents & { type: "RECORDER_CREATED" }).recorder,
      }),

      addToGlobalAudio: assign({
        audio: ({ context, event }) => {
          const newDate = (event as RecorderEvents & { type: "SEND_AUDIO_CHUNK" }).media;
          if (context.audio.length === 0) return [newDate];
          return [...context.audio, newDate];
        },
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
