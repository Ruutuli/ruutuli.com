"use client";

import Image from "next/image";
import { useState } from "react";
import { siteAssets } from "@/data/siteDefaults";

export default function Background() {
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-cream-100">
      <Image
        src={siteAssets.backgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />

      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={siteAssets.backgroundImage}
        src={siteAssets.backgroundVideo}
        onCanPlayThrough={() => setVideoReady(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          videoReady ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      <div className="absolute inset-0 bg-gradient-to-b from-cream-50/75 via-cream-100/82 to-cream-200/88" />
    </div>
  );
}
