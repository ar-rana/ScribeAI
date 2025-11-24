import { ThemeSwitch } from "@/components/Buttons/ThemeSwitch";
import { redirect } from "next/navigation";

export default function Home() {

  redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
        <span className="fa fa-play"></span>
        <h1>hello</h1>
        <h2 className="text-red-500 dark:text-yellow-500">Hi</h2>
        <h2 className="dark:text-indigo-600 text-purple-700">Hey</h2>
      </div>
      <ThemeSwitch />
    </div>
  );
}
