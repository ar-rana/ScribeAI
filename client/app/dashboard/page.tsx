"use client";
import { ThemeSwitch } from "@/components/Buttons/ThemeSwitch";
import Loading from "@/components/Loading";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

type CurrState = "recording..." | "paused" | "Begin recording";

const page = () => {
  const [session, setSession] = useState<any>(null);

  const [currentState, setCurrentState] = useState<CurrState>("Begin recording");

  useEffect(() => {
    authClient.getSession().then((session) => {
      setSession(session ?? null);
    });
  }, []);

  // if (!session) {
  //   return (
  //       <Loading />
  //   )
  // }

  return (
    <div className="h-screen dark:bg-slate-800 text-zinc-200 dark:text-white p-4">
      <div className="flex">
        <div className="flex-1 p-4 space-y-4 flex flex-col">
          <button className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Generate Transcript
          </button>
          <button className="w-full h-12 bg-indigo-600 rounded-xl hover:opacity-90">
            Generate Summary
          </button>
          <span className="w-full p-2.5 bg-rose-600 rounded-xl text-center align-middle">{currentState}</span>
          <ThemeSwitch />
        </div>
        <div className="flex-2 bg-gray-100 dark:bg-slate-700">
          <div className="w-full grid grid-cols-2 h-full p-4 gap-2">
            <button className="fa fa-play w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90" title="start"/>
            <button className="fa fa-pause w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90" title="pause"/>
            <button className="fa fa-stop w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90" title="stop"/>
            <button className="fa fa-repeat w-full bg-indigo-600 rounded-xl font-semibold hover:opacity-90" title="replay"/>
          </div>
          <div className="w-full bg-gray-300 dark:bg-slate-600 p-4 flex flex-col">
            <span className="mb-1.5 w-full font-bold text-lg text-gray-800 dark:text-white">Live Transcript</span>
            <span className="h-12 w-full text text-gray-800 dark:text-white">sads</span>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <h1 className="bg-rose-600 p-4 rounded-md text-center">Previous Recordings</h1>
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
              }
            ].map((rec) => (
              <div
                key={rec.id}
                className="w-full h-12 bg-gray-200 flex items-center justify-between px-3 rounded"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm text-gray-800">{rec.title}</span>
                  <span className="text-xs text-gray-800">
                    {rec.date}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-800">{rec.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
