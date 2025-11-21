'use client';
import { ThemeSwitch } from "@/components/Buttons/ThemeSwitch";
import Loading from "@/components/Loading";
import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

const page = () => {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    authClient.getSession().then((session) => {
      setSession(session ?? null);
    });
  }, []);

  if (!session) {
    return (
        <Loading />
    )
  }

  return (
    <div className="min-h-screen dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to Dashboard!</h1>
      <p className="text-lg text-black dark:text-red">
        This text changes color with the theme.
      </p>
      <ThemeSwitch />
    </div>
  );
};

export default page;
