"use client";

import Image from "next/image";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

export function Footer() {
  const siteConfig = useSiteConfig();

  return (
    <footer className="relative z-10 mt-auto animate-fade-in border-t border-closet-pink/40 bg-closet-rose/95 px-5 py-8 backdrop-blur-sm sm:px-8">
      <div className="closet-shell flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/95">
            <Image src={siteConfig.assets.maki} alt="" width={28} height={28} className="h-6 w-6" />
          </span>
          <span className="text-sm font-semibold text-white/95">
            © {new Date().getFullYear()} {siteConfig.name}
          </span>
        </div>
        <p className="text-sm font-medium text-white/80">{siteConfig.tagline}</p>
      </div>
    </footer>
  );
}
