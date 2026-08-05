"use client";

import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import ScallopHeroFrame from "@/components/ScallopHeroFrame";
import { Cosplay } from "@/types/cosplay";
import { BuildTask } from "@/types/task";

interface DashboardWelcomeProps {
  cosplays: Cosplay[];
  tasks: BuildTask[];
}

export default function DashboardWelcome(_props: DashboardWelcomeProps) {
  const siteConfig = useSiteConfig();
  const heroArt = siteConfig.assets.chibi || siteConfig.assets.pageDoll || siteConfig.assets.makiHero;

  return (
    <section className="grid items-center gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="animate-fade-up text-center lg:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-closet-rose">
          {siteConfig.tagline}
        </p>
        <h1 className="mt-2.5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-closet-brown sm:text-5xl lg:text-[3.1rem]">
          {siteConfig.displayName}
        </h1>

        <p className="mx-auto mt-3 max-w-lg text-sm font-medium leading-relaxed text-closet-brown sm:text-base lg:mx-0">
          {siteConfig.roles}
        </p>

        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-closet-brown-light sm:text-lg lg:mx-0">
          {siteConfig.bio}
        </p>

        <div className="mt-5 flex justify-center lg:justify-start">
          <Link href="/roster" className="closet-btn-peach btn-shimmer group !px-7 !py-3">
            View Roster
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="animate-fade-up flex justify-center [animation-delay:120ms] lg:justify-end">
        <ScallopHeroFrame src={heroArt} alt={`${siteConfig.displayName} chibi illustration`} />
      </div>
    </section>
  );
}
