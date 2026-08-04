import Link from "next/link";
import type { ReactNode } from "react";
import { getCosplayProgressPercent, getDashboardProjects } from "@/lib/siteConfig";
import { getCosplayDisplayImage } from "@/lib/cosplay/images";
import { Cosplay, CosplayProgress } from "@/types/cosplay";
import RosterImageSlot from "./RosterImageSlot";

const CATEGORY_ICONS: Record<string, ReactNode> = {
  Sewing: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v4m0 0a4 4 0 100 8 4 4 0 000-8zm0 0V4m6 8h2M4 12h2" />
    </svg>
  ),
  Armor: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
    </svg>
  ),
  Wig: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c3.5 0 6-2 6-5.5S15 4 12 4 6 5.5 6 8.5 8.5 14 12 14zm-3 2c-2 1-3 2.5-3 4.5h12c0-2-1-3.5-3-4.5" />
    </svg>
  ),
  Accessories: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c2 2.5 5 3 5 6a5 5 0 11-10 0c0-3 3-3.5 5-6z" />
    </svg>
  ),
};

const DEFAULT_CATEGORIES = ["Sewing", "Armor", "Wig", "Accessories"];

function resolveCategories(progress?: CosplayProgress[]): CosplayProgress[] {
  if (progress?.length) return progress.slice(0, 4);
  return DEFAULT_CATEGORIES.map((label) => ({ label, percent: 0 }));
}

function ProgressDots({ percent }: { percent: number }) {
  const filled = percent >= 100 ? 3 : percent >= 50 ? 2 : percent > 0 ? 1 : 0;
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1 w-1 rounded-full ${i < filled ? "bg-closet-rose" : "bg-closet-pink/50"}`}
        />
      ))}
    </span>
  );
}

function categoryTag(series: string): string {
  const s = series.toLowerCase();
  if (s.includes("final fantasy") || s.includes("zelda") || s.includes("game")) return "Gaming";
  if (s.includes("dragon ball") || s.includes("anime")) return "Anime";
  return "Cosplay";
}

export default function ProjectGrid({ cosplays }: { cosplays: Cosplay[] }) {
  const projects = getDashboardProjects(cosplays);

  if (!projects.length) return null;

  return (
    <section id="projects" className="cosplan-panel animate-fade-up overflow-hidden [animation-delay:200ms]">
      <div className="cosplan-panel-header justify-between">
        <h2 className="font-sans text-base font-bold text-closet-brown sm:text-lg">
          Featured Roster
        </h2>
        <Link
          href="/roster"
          className="text-sm font-semibold text-closet-rose transition-colors hover:text-closet-mauve"
        >
          View all →
        </Link>
      </div>

      <div className="animate-stagger grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
        {projects.map((cosplay) => {
          const progress = getCosplayProgressPercent(cosplay);
          const categories = resolveCategories(cosplay.progress);

          return (
            <Link
              key={cosplay.id}
              href={`/roster/${cosplay.id}`}
              className="cosplan-project-card group"
            >
              <div className="relative h-36 overflow-hidden sm:h-40">
                <RosterImageSlot
                  src={getCosplayDisplayImage(cosplay.characterArt, cosplay.image)}
                  alt={cosplay.character}
                  emptyLabel={cosplay.character}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-closet-brown/75 via-closet-brown/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <h3 className="font-sans text-lg font-bold text-white">{cosplay.character}</h3>
                  <span className="mt-1 inline-flex rounded-full bg-white/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {categoryTag(cosplay.series)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-3">
                <div>
                  <div className="mb-1 flex justify-between text-[0.65rem] font-semibold text-closet-brown">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="closet-progress-track h-1.5">
                    <div className="closet-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-closet-pink/30 pt-2.5">
                  {categories.map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1 text-closet-brown-light">
                      <span className="text-closet-rose">
                        {CATEGORY_ICONS[item.label] ?? CATEGORY_ICONS.Accessories}
                      </span>
                      <ProgressDots percent={item.percent} />
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
