import Image from "next/image";
import { siteAssets } from "@/data/siteDefaults";

interface ScallopHeroFrameProps {
  src: string;
  alt: string;
}

export default function ScallopHeroFrame({ src, alt }: ScallopHeroFrameProps) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden sm:max-w-md">
      <Image
        src={siteAssets.makiBig}
        alt=""
        fill
        className="animate-spin-slow object-contain drop-shadow-closet-lg"
        priority
        sizes="(max-width: 640px) 20rem, 28rem"
        aria-hidden
      />
      <div className="absolute inset-[14%] flex items-end justify-center sm:inset-[12%]">
        <div className="relative h-full w-full animate-float-slow [animation-delay:600ms]">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain object-bottom drop-shadow-closet-lg"
            priority
            sizes="300px"
          />
        </div>
      </div>
    </div>
  );
}
