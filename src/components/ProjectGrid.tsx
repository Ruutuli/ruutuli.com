import Link from "next/link";
import type { ReactNode } from "react";
import { getCosplayProgressPercent, getDashboardProjects } from "@/lib/siteConfig";
import { getCosplayDisplayImage } from "@/lib/cosplay/images";
import { Cosplay } from "@/types/cosplay";
import RosterImageSlot from "./RosterImageSlot";

function CardAction({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="cosplan-focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-closet-rose transition-colors hover:bg-closet-blush hover:text-closet-mauve"
    >
      {children}
    </Link>
  );
}

function RosterCard({ cosplay }: { cosplay: Cosplay }) {
  const progress = getCosplayProgressPercent(cosplay);
  const imageSrc = getCosplayDisplayImage(cosplay.image, cosplay.characterArt);
  const artPosition = cosplay.characterArtPosition ?? "center top";
  const boardHref = `/roster/${cosplay.id}`;

  return (
    <article className="cosplan-project-card flex h-full min-h-[280px] flex-col">
      <Link
        href={boardHref}
        className="cosplan-focus-ring group/card flex min-h-0 flex-1 flex-col transition-colors focus-visible:rounded-t-3xl"
      >
        <div className="relative h-40 shrink-0 overflow-hidden bg-gradient-to-b from-closet-blush/40 via-white to-closet-peach/10 sm:h-44">
          <RosterImageSlot
            src={imageSrc}
            alt={cosplay.character}
            emptyLabel={cosplay.character}
            className="object-contain transition-transform duration-500 group-hover/card:scale-[1.03]"
            objectPosition={artPosition}
            sizes="(max-width: 640px) 82vw, (max-width: 1024px) 45vw, 280px"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-closet-brown/80 via-closet-brown/35 to-transparent pt-10" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <h3 className="font-sans text-lg font-bold text-white">{cosplay.character}</h3>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="mt-auto">
            <div className="mb-1.5 flex items-center justify-between text-[0.65rem] font-semibold text-closet-brown">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="closet-progress-track h-1.5">
              <div className="closet-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </Link>

      <div className="flex items-center justify-end gap-1 border-t border-closet-pink/30 px-3 py-2.5">
        <CardAction href={boardHref} label={`Open ${cosplay.character} board`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </CardAction>
        <CardAction href="/roster" label="View full roster">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" />
          </svg>
        </CardAction>
      </div>
    </article>
  );
}

export default function ProjectGrid({ cosplays }: { cosplays: Cosplay[] }) {
  const projects = getDashboardProjects(cosplays);

  return (
    <section
      id="projects"
      className="cosplan-panel flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden animate-fade-up [animation-delay:200ms]"
    >
      <div className="cosplan-panel-header justify-between">
        <h2 className="font-sans text-base font-bold text-closet-brown sm:text-lg">Random Roster</h2>
        <Link
          href="/roster"
          className="cosplan-focus-ring text-sm font-semibold text-closet-rose transition-colors hover:text-closet-mauve"
        >
          View all →
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <p className="font-sans text-lg font-bold text-closet-brown">No builds in roster yet</p>
          <p className="mt-2 max-w-sm text-sm text-closet-brown-light">
            Three random builds show up here once you&apos;ve got cosplays in the roster.
          </p>
          <Link href="/roster" className="cosplan-focus-ring mt-4 text-sm font-semibold text-closet-rose hover:text-closet-mauve">
            Browse roster →
          </Link>
        </div>
      ) : (
        <div className="animate-stagger cosplan-roster-scroll flex-1 p-4 sm:p-5">
          {projects.map((cosplay) => (
            <RosterCard key={cosplay.id} cosplay={cosplay} />
          ))}
        </div>
      )}
    </section>
  );
}
