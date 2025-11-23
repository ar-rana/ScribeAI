"use client";
import { auth } from "@/auth";
import { ThemeSwitch } from "@/components/Buttons/ThemeSwitch";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import React, { useEffect, useState } from "react";

type AuthProviders = "google" | "github";

export default function LoginPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    authClient.getSession().then((session) => {
      setSession(session?.data ?? null);
    });
  }, []);

  if (session) {
      console.log("session: ", session);
      redirect("/dashboard");
  }

  const handleLogin = (type: AuthProviders) => {
    if (type === "github") {
    } else if (type === "google") {
      authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    }
  };
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="w-full max-w-2xl mx-6 lg:mx-0">
        <section className="flex flex-col justify-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 sm:p-12">
          <header className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-xl font-semibold">Sign in to ScribeAI</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2 text-sm">
                <ThemeSwitch />
              </div>
            </div>
          </header>

          <div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  continue with
                </span>
              </div>
            </div>

            <div className="mt-4 w-full flex flex-col gap-2">
              <button
                onClick={() => handleLogin("google")}
                className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
              >
                Login with Google
              </button>
              {/* <button className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
                                Login with GitHub
                            </button>
                            <button className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
                                Login with Microsoft
                            </button> */}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
