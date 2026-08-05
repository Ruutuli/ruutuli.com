"use client";

import Image from "next/image";

export default function MediaKitHeroCollage() {
  return (
    <div className="flex items-end justify-center lg:justify-end">
      <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[400px]">
        <Image
          src="/images/ruubday.png"
          alt="Ruu chibi illustration"
          fill
          className="object-contain object-bottom drop-shadow-closet-lg"
          priority
          sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 400px"
        />
      </div>
    </div>
  );
}
