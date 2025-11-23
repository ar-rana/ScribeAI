"use client";
import { ThemeSwitch } from "@/components/Buttons/ThemeSwitch";
import Loading from "@/components/Loading";
import { recorderState } from "@/context/RecorderState";
import { socketState } from "@/context/SocketContext";
import { authClient } from "@/lib/auth-client";
import { useMachine } from "@xstate/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

type CurrState = "recording..." | "paused" | "Start session";

type Records = "start" | "stop" | "restart" | "pause" | "resume";

const page = () => {
  const [session, setSession] = useState<any>(null);

  const [state, send] = useMachine(recorderState);
  const [socketSt, sendSoc] = useMachine(socketState);

  const [currentState, setCurrentState] = useState<CurrState>("Start session");
  const [transcript, setTranscript] = useState<string>("");

  useEffect(() => {
    authClient.getSession().then((session) => {
      setSession(session.data ?? null);
    });
    sendSoc({ type: "CONNECT" });
  }, []);

  useEffect(() => {
    if (state.context.audio.length === 0) return;

    console.log("audio recognised", " user: ", session?.user?.email);
    sendSoc({ type: "SEND_AUDIO", media: state.context.audio[state.context.audio.length - 1], user: session?.user?.email });
  }, [state.context.audio]);

  useEffect(() => {
    if (!socketSt.context.transcript) return;

    setTranscript(socketSt.context.transcript);
  }, [socketSt.context.transcript]);

  // useEffect(() => {
  //   console.log(state.context.type);
  //   console.log(state.value);
  //   console.log("context: ", state.context);
  // }, [state.context.type, state.value, state.context.audioURL, session]);

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
      setCurrentState("paused")
    } else if (type === "restart") {
      send({ type: "RESTART" });
      setCurrentState("Start session");
    } else if (type === "resume") {
      send({ type: "RESUME" });
    }
  };

  // if (!session) {
  //   return (
  //       <Loading />
  //   )
  // }

  return (
    <div className="min-h-screen dark:bg-slate-800 text-zinc-200 dark:text-white p-4">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-4 space-y-4 flex flex-col">
          <button className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Generate Transcript
          </button>
          <button className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Generate Summary
          </button>
          <button onClick={() => {console.log("check"); sendSoc({ type: "SEND_CHECK", message: "hhh"})}} className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Test Socket
          </button>
          {(state.context.audioURL && state.matches("finish")) && (
            <audio className="w-full" controls src={state.context.audioURL}></audio>
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
            <div className="relative w-9 h-5 bg-rose-600 rounded-full peer dark:bg-rose-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 dark:peer-checked:bg-purple-600"></div>
            <span className="select-none ms-3 text-sm font-medium text-heading text-gray-800 dark:text-white">
              Record Tab
            </span>
          </label>
          <ThemeSwitch />
        </div>
        <div className="flex-2 bg-gray-100 dark:bg-slate-700 shadow-md">
          <div className="w-full grid grid-cols-2 h-full p-4 gap-2">
            <button
              onClick={() => handleRecording("start")}
              className="fa fa-play w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-4 pb-4"
              title="start session"
            />
            <button
              onClick={() => handleRecording("pause")}
              className="fa fa-pause w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-4 pb-4"
              title="pause"
            />
            <button
              onClick={() => handleRecording("stop")}
              className="fa fa-stop w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-4 pb-4"
              title="stop"
            />
            <button
              onClick={() => handleRecording("restart")}
              className="fa fa-repeat w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90 pt-4 pb-4"
              title="reset"
            />
          </div>
          <div className="w-full bg-gray-300 dark:bg-slate-600 p-4 flex flex-col shadow-md">
            <span className="mb-1.5 w-full font-bold text-lg text-gray-800 dark:text-white">
              Live Transcript
            </span>
            <span className="max-h-20 w-full text-sm text-gray-800 dark:text-white overflow-y-auto">
              {transcript}
            </span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <h1 className="bg-rose-600 p-4 rounded-md text-center">
            Previous Recordings
          </h1>
          <div className="p-2 bg-gray-300 dark:bg-slate-700 space-y-2 overflow-y-scroll max-h-80">
            {[
              {
                id: "rec1",
                title: "Client Meeting - Design",
                duration: "12:34",
                date: "2025-11-20",
              },
              {
                id: "rec2",
                title: "Interview - Frontend",
                duration: "25:10",
                date: "2025-11-19",
              },
              {
                id: "rec3",
                title: "Daily Standup",
                duration: "03:45",
                date: "2025-11-21",
              },
              {
                id: "rec4",
                title: "Daily Standup",
                duration: "03:45",
                date: "2025-11-21",
              },
            ].map((rec) => (
              <div
                key={rec.id}
                className="w-full h-12 bg-gray-200 flex items-center justify-between px-3 rounded"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-gray-800">
                    {rec.title}
                  </span>
                  <span className="text-xs text-gray-800">{rec.date}</span>
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {rec.duration}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
