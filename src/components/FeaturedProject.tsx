import Link from "next/link";
import type { ReactNode } from "react";
import { formatCalendarEventDates, formatEventDate, getNextConvention } from "@/data/calendar";
import { getOpenTaskCount } from "@/data/tasks";
import { getCosplayProgressPercent, getSpotlightCosplay } from "@/lib/siteConfig";
import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { BuildTask } from "@/types/task";
import { getCosplayDisplayImage } from "@/lib/cosplay/images";
import RosterImageSlot from "@/components/RosterImageSlot";

function categoryTag(series: string): string {
  const s = series.toLowerCase();
  if (s.includes("final fantasy") || s.includes("zelda") || s.includes("game")) return "Gaming";
  if (s.includes("dragon ball") || s.includes("anime")) return "Anime";
  return "Cosplay";
}

function buildCover(cosplay: Cosplay): string | null {
  return getCosplayDisplayImage(cosplay.characterArt, cosplay.image);
}

function SideCardIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-closet-blush text-closet-rose transition-transform duration-300 group-hover:scale-110">
      {children}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function FeaturedProject({
  cosplays,
  tasks,
  events,
}: {
  cosplays: Cosplay[];
  tasks: BuildTask[];
  events: ConEvent[];
}) {
  const cosplay = getSpotlightCosplay(cosplays);
  const nextCon = getNextConvention(events);
  const openTasks = getOpenTaskCount(tasks);

  const overall = cosplay ? getCosplayProgressPercent(cosplay) : 0;
  const cover = cosplay ? buildCover(cosplay) : null;
  const showOutfit = cosplay?.outfit && cosplay.outfit.toLowerCase() !== "default";
  const artPosition = cosplay?.characterArtPosition ?? "center bottom";

  return (
    <div id="dashboard" className="cosplan-dashboard-top animate-fade-up">
      {/* Current Build — 8 columns on desktop */}
      {cosplay ? (
        <Link
          href={`/roster/${cosplay.id}`}
          className="cosplan-focus-ring group relative col-span-12 grid min-h-[220px] grid-cols-1 overflow-hidden rounded-3xl border border-closet-pink/35 bg-white shadow-closet transition-all duration-300 hover:-translate-y-0.5 hover:border-closet-rose/25 hover:shadow-closet-lg lg:col-span-8 lg:min-h-[260px] lg:grid-cols-[minmax(0,1fr)_minmax(200px,38%)]"
        >
          {/* Info + progress — always first (left on desktop) */}
          <div className="relative z-10 flex min-w-0 flex-col p-5 sm:p-6">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-closet-rose">
              Current Build
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-closet-brown sm:text-[1.75rem]">
              {cosplay.character}
            </h2>
            <p className="mt-0.5 text-xs text-closet-brown-light">
              {cosplay.series}
              {showOutfit ? ` · ${cosplay.outfit}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-closet-blush px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-closet-rose">
                {categoryTag(cosplay.series)}
              </span>
              {cosplay.deadline && (
                <span className="rounded-full bg-closet-rose/90 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                  Due {formatEventDate(cosplay.deadline)}
                </span>
              )}
            </div>

            <div className="mt-4">
              <p className="font-sans text-3xl font-bold leading-none text-closet-rose sm:text-4xl">{overall}%</p>
              <p className="mt-0.5 text-xs font-medium text-closet-brown-light">Complete</p>
            </div>

            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-closet-blush">
              <div
                className="h-full rounded-full bg-closet-rose transition-all duration-700"
                style={{ width: `${overall}%` }}
              />
            </div>

            <span className="cosplan-focus-ring mt-auto flex items-center justify-between border-t border-closet-pink/35 pt-4 text-sm font-semibold text-closet-rose transition-colors group-hover:text-closet-mauve">
              Open board
              <ChevronRight />
            </span>
          </div>

          {/* Character — mobile: behind text on right; desktop: right column, bottom-anchored */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 z-0 h-[58%] w-[52%] sm:h-[62%] sm:w-[46%] lg:static lg:col-start-2 lg:row-start-1 lg:h-full lg:w-full lg:max-w-none"
            aria-hidden
          >
            <RosterImageSlot
              src={cover}
              alt=""
              emptyLabel={cosplay.character}
              className="object-contain object-bottom transition-transform duration-700 group-hover:scale-[1.02]"
              objectPosition={artPosition}
              sizes="(max-width: 1024px) 46vw, 280px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent lg:from-white/20 lg:via-transparent lg:to-transparent" />
          </div>
        </Link>
      ) : (
        <article className="col-span-12 flex min-h-[220px] flex-col justify-center rounded-3xl border border-closet-pink/35 bg-white p-6 shadow-closet lg:col-span-8">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-closet-rose">Current Build</p>
          <h2 className="mt-2 font-sans text-xl font-bold text-closet-brown">No active build spotlighted</h2>
          <p className="mt-1 max-w-md text-sm text-closet-brown-light">
            Mark a project as your spotlight build in admin, or browse the roster to pick up where you left off.
          </p>
          <Link
            href="/roster"
            className="cosplan-focus-ring mt-4 inline-flex w-fit items-center gap-2 text-sm font-semibold text-closet-rose transition-colors hover:text-closet-mauve"
          >
            View roster
            <ChevronRight />
          </Link>
        </article>
      )}

      {/* Side cards — 4 columns on desktop, equal height */}
      <div className="col-span-12 flex flex-col gap-6 self-stretch sm:grid sm:grid-cols-2 lg:col-span-4 lg:flex lg:h-full lg:flex-col">
        <article className="cosplan-side-card group">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-closet-rose">
            Next Convention
          </p>
          <div className="mt-3 flex items-start gap-3">
            <SideCardIcon>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </SideCardIcon>
            <div className="min-w-0">
              {nextCon ? (
                <>
                  <h3 className="font-sans text-xl font-bold text-closet-brown">{nextCon.title}</h3>
                  <p className="mt-0.5 text-sm text-closet-brown-light">{formatCalendarEventDates(nextCon)}</p>
                  {nextCon.location && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-closet-brown-light">
                      <svg className="h-3.5 w-3.5 shrink-0 text-closet-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {nextCon.location}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-sans text-xl font-bold text-closet-brown">Nothing scheduled</h3>
                  <p className="mt-0.5 text-sm text-closet-brown-light">Add a convention to your calendar when plans firm up.</p>
                </>
              )}
            </div>
          </div>
          <Link href="/calendar" className="cosplan-side-card-action group">
            View Details
            <ChevronRight />
          </Link>
        </article>

        <article className="cosplan-side-card group">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-closet-rose">
            Tasks This Week
          </p>
          <div className="mt-3 flex items-start gap-3">
            <SideCardIcon>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </SideCardIcon>
            <div>
              {openTasks > 0 ? (
                <>
                  <p className="font-sans text-3xl font-bold leading-none text-closet-brown">{openTasks}</p>
                  <p className="mt-1 text-sm text-closet-brown-light">remaining</p>
                </>
              ) : (
                <>
                  <p className="font-sans text-xl font-bold leading-snug text-closet-brown">All caught up!</p>
                  <p className="mt-1 text-sm text-closet-brown-light">No open build tasks right now.</p>
                </>
              )}
            </div>
          </div>
          <a href="#focus" className="cosplan-side-card-action group">
            View Tasks
            <ChevronRight />
          </a>
        </article>
      </div>
    </div>
  );
}
