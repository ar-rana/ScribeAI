"use client";
import { getAllPastRecordings, getRecordingSummary } from "@/api/fetch";
import { ThemeSwitch } from "@/components/Buttons/ThemeSwitch";
import { download } from "@/components/helper";
import Loading from "@/components/Loading";
import SummaryModal from "@/components/modal/SummaryModal";
import { recorderState } from "@/context/RecorderState";
import { socketState } from "@/context/SocketContext";
import { authClient } from "@/lib/auth-client";
import { useMachine } from "@xstate/react";
import { useEffect, useState } from "react";

type CurrState = "recording..." | "paused" | "Start session";

type Records = "start" | "stop" | "restart" | "pause" | "resume";

export interface Recording {
  id?: string;
  title: string;
  transcript: string;
  duration: string;
  client_audio_id: string;
  userEmail: string;
  date: string;
}

export interface TranscriptRecord {
  email: string;
  transcript: string;
  title?: string;
  duration: string;
  client_audio_id: string;
}

const page = () => {
  const [session, setSession] = useState<any>(null);

  const [state, send] = useMachine(recorderState);
  const [socketSt, sendSoc] = useMachine(socketState);

  const [currentState, setCurrentState] = useState<CurrState>("Start session");
  const [transcript, setTranscript] = useState<string>("");

  const [selectedRecord, setSelectedRecord] = useState<Recording | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    authClient
      .getSession()
      .then((session) => {
        setSession(session.data ?? null);
      })
    sendSoc({ type: "CONNECT" });
  }, []);

  useEffect(() => {
    if (state.context.audio.length === 0) return;

    // console.log("audio recognised", " user: ", session?.user?.email);
    let index: number = parseInt(localStorage.getItem("idx") as string);
    // console.log("local prev idx -> ", index);
    if (index >= state.context.audio.length) index = state.context.audio.length - 1;
    sendSoc({
      type: "SEND_AUDIO",
      media: state.context.audio[index],
      user: session?.user?.email,
    });
  }, [state.context.audio]);

  useEffect(() => {
    if (!socketSt.context.transcript) return;

    setTranscript(socketSt.context.transcript);
  }, [socketSt.context.transcript]);

  useEffect(() => {
    const getRecordings = async () => {
      const data = await getAllPastRecordings(session?.user?.email);
      if (data.success) {
        send({ type: "SAVE_RECORDS",records: data.data.recordings })
      } else {
        console.log("failed to get recordings");
      }
    };

    getRecordings();
  }, [session]);

  const getSummary = async () => {
    if (!selectedRecord) return;
    if (summary) {
      setOpen(true);
      return;
    }
    const payload = {
      email: session?.user?.email,
      client_id: selectedRecord?.client_audio_id
    }
    const data = await getRecordingSummary(payload);
    if (data.success) {
      setSummary(data.data.summary);
      setOpen(true);
    } else {
      console.log("failed to get recordings");
    }
  };

  useEffect(() => {
    console.log("curr state: ", state.value);
    console.log("context: ", state.context);

    if (state.matches("idle")) {
      sendSoc({ type: "CLEAR_TRANSCRIPT" });
    }
    if (state.matches("finish")) {
      const payload: TranscriptRecord = {
        email: session?.user?.email,
        transcript: socketSt.context.transcript,
        title: title.trim().length === 0 ? undefined: title.trim(),
        duration: state.context.duration.toString(),
        client_audio_id: localStorage.getItem("audioId") as string
      }
      sendSoc({ type: "SEND_TRANSCRIPT", payload: payload });
      send({ type: "KEEP_TRANSCRIPT", payload: payload });
    }
  }, [state.value, state.context.audioURL]);

  const handleRecording = (type: Records) => {
    if (type === "start") {
      if (currentState === "paused") send({ type: "RESUME" });
      else send({ type: "START" });
      setCurrentState("recording...");
    } else if (type === "stop") {
      send({ type: "STOP" });
      setCurrentState("Start session");
    } else if (type === "pause") {
      send({ type: "PAUSE" });
      setCurrentState("paused");
    } else if (type === "restart") {
      send({ type: "RESTART" });
      setCurrentState("Start session");
    } else if (type === "resume") {
      send({ type: "RESUME" });
    }
  };

  const downloadTranscript = () => {
    if (!selectedRecord) {
      alert("please select a record first from 'Previous Recordings'");
      return;
    }

    download("transcript.txt", selectedRecord.transcript);
  }

  if (!session) {
    return (
        <Loading />
    )
  }

  return (
    <div className="min-h-screen dark:bg-slate-800 text-zinc-200 dark:text-white p-4">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-4 space-y-4 flex flex-col">
          <button onClick={() => downloadTranscript()} className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Get Transcript
          </button>
          <button onClick={() => getSummary()} className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Get Summary
          </button>
          <input placeholder="Enter title for this recording" onChange={(e) => setTitle(e.target.value)} className="p-6 w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90" />
          {/* <button
            onClick={() => {
              console.log("check");
              sendSoc({ type: "SEND_CHECK", message: "hhh" });
            }}
            className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90"
          >
            Test Socket
          </button> */}
          {state.context.audioURL && (
            <audio
              className="w-full"
              controls
              src={state.context.audioURL}
            ></audio>
          )}
          <span
            onClick={() => {
              if (currentState === "Start session") handleRecording("start");
            }}
            className="w-full p-2.5 bg-rose-600 rounded-xl text-center align-middle"
          >
            {currentState}
          </span>
          <label className="inline-flex items-center me-5 cursor-pointer">
            <span className="select-none ms-3 text-sm font-medium text-heading mr-2 text-gray-800 dark:text-white">
              Record Mic
            </span>
            <input
              type="checkbox"
              onChange={() => send({ type: "TOGGLE_RECORDING" })}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-rose-600 rounded-full peer dark:bg-rose-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-600"></div>
            <span className="select-none ms-3 text-sm font-medium text-heading text-gray-800 dark:text-white">
              Record Tab
            </span>
          </label>
          <ThemeSwitch />
        </div>
        <div className="flex-2 bg-gray-100 dark:bg-slate-700 shadow-md">
          <div className="w-full grid grid-cols-2 h-[70%] p-4 gap-2">
            <button
              onClick={() => handleRecording("start")}
              className="fa fa-play w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-2 pb-2"
              title="start session"
            />
            <button
              onClick={() => handleRecording("pause")}
              className="fa fa-pause w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-2 pb-2"
              title="pause"
            />
            <button
              onClick={() => handleRecording("stop")}
              className="fa fa-stop w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-2 pb-2"
              title="stop"
            />
            <button
              onClick={() => handleRecording("restart")}
              className="fa fa-repeat w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-2 pb-2"
              title="reset"
            />
          </div>
          <div className="w-full bg-gray-300 dark:bg-slate-600 p-3 flex flex-col shadow-md">
            <span className="mb-1.5 w-full font-bold text-lg text-gray-800 dark:text-white">
              Live Transcript
            </span>
            <span className="min-h-20 max-h-26 w-full text-sm text-gray-800 dark:text-white overflow-y-auto">
              {transcript}               
            </span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <h1 className="bg-rose-600 p-4 rounded-md text-center">
            Previous Recordings
          </h1>
          <div className="p-2 bg-gray-300 dark:bg-slate-700 space-y-2 overflow-y-scroll max-h-80">
            {state.context.prevrecordings.map((rec) => (
              <div
                onClick={() => {
                  setSelectedRecord(rec);
                  setSummary("");
                }}
                key={rec.client_audio_id}
                className="w-full h-12 bg-gray-200 flex items-center justify-between px-3 rounded cursor-pointer hover:bg-gray-300"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-gray-800">
                    {rec.title}
                  </span>
                  <span className="text-xs text-gray-800">{rec.date.substring(0, 10)}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {rec.duration}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/login";
            }}
            className="w-full h-12 bg-red-800 rounded-xl hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </div>
      <SummaryModal
        open={open}
        setOpen={setOpen}
        summary={summary}
      />
    </div>
  );
};

export default page;
