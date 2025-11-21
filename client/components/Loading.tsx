"use client";
import React from "react";
import loadingImg from "../assets/loadingImg.svg";
import Image from "next/image";

const Loading: React.FC = () => {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Image
          src={loadingImg}
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <span>Loading...</span>
      </div>
    </div>
  );
};

export default Loading;
