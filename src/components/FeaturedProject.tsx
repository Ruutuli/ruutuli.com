import Link from "next/link";
import type { ReactNode } from "react";
import { formatCalendarEventDates, formatEventDate, getNextConvention } from "@/data/calendar";
import { getCosplayProgressPercent, getSpotlightCosplay } from "@/lib/siteConfig";
import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { getCosplayDisplayImage } from "@/lib/cosplay/images";
import RosterImageSlot from "@/components/RosterImageSlot";

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
  events,
}: {
  cosplays: Cosplay[];
  events: ConEvent[];
}) {
  const cosplay = getSpotlightCosplay(cosplays);
  const nextCon = getNextConvention(events);

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
          className="cosplan-focus-ring group col-span-12 flex h-full overflow-hidden rounded-3xl border border-closet-pink/35 bg-white shadow-closet transition-all duration-300 hover:-translate-y-0.5 hover:border-closet-rose/25 hover:shadow-closet-lg lg:col-span-8"
        >
          <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
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
            {cosplay.deadline && (
              <div className="mt-2">
                <span className="rounded-full bg-closet-rose/90 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                  Due {formatEventDate(cosplay.deadline)}
                </span>
              </div>
            )}

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

          <div className="relative w-[34%] max-w-[200px] shrink-0 sm:max-w-[220px] lg:max-w-[240px]" aria-hidden>
            <RosterImageSlot
              src={cover}
              alt=""
              emptyLabel={cosplay.character}
              className="object-contain object-bottom transition-transform duration-700 group-hover:scale-[1.02]"
              objectPosition={artPosition}
              sizes="(max-width: 1024px) 34vw, 240px"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/25 to-transparent" />
          </div>
        </Link>
      ) : (
        <article className="col-span-12 flex min-h-[220px] flex-col justify-center rounded-3xl border border-closet-pink/35 bg-white p-6 shadow-closet lg:col-span-8">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-closet-rose">Current Build</p>
          <h2 className="mt-2 font-sans text-xl font-bold text-closet-brown">Nothing featured right now</h2>
          <p className="mt-1 max-w-md text-sm text-closet-brown-light">
            Pick a build in admin to show here, or check the roster.
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

      {/* Next convention — 4 columns on desktop, matched to Current Build height */}
      <Link
        href="/calendar"
        className="cosplan-focus-ring group col-span-12 flex h-full overflow-hidden rounded-3xl border border-closet-pink/35 bg-white shadow-closet transition-all duration-300 hover:-translate-y-0.5 hover:border-closet-rose/25 hover:shadow-closet-lg lg:col-span-4"
      >
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-closet-rose">
            Next Convention
          </p>
          {nextCon ? (
            <>
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-closet-brown sm:text-[1.75rem]">
                {nextCon.title}
              </h2>
              <p className="mt-0.5 text-xs text-closet-brown-light">{formatCalendarEventDates(nextCon)}</p>
              {nextCon.location && (
                <p className="mt-2 flex items-center gap-1 text-xs font-medium text-closet-brown-light">
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
              <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-closet-brown sm:text-[1.75rem]">
                Nothing scheduled
              </h2>
              <p className="mt-0.5 text-xs text-closet-brown-light">
                Add one in admin when you know where you&apos;re going.
              </p>
            </>
          )}

          <span className="cosplan-focus-ring mt-auto flex items-center justify-between border-t border-closet-pink/35 pt-4 text-sm font-semibold text-closet-rose transition-colors group-hover:text-closet-mauve">
            View calendar
            <ChevronRight />
          </span>
        </div>

        <div
          className="relative flex w-[34%] max-w-[200px] shrink-0 items-end justify-center pb-5 sm:max-w-[220px] sm:pb-6 lg:max-w-[240px]"
          aria-hidden
        >
          <SideCardIcon>
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </SideCardIcon>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/25 to-transparent" />
        </div>
      </Link>
    </div>
  );
}
