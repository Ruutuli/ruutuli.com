"use client";

import Link from "next/link";
import { Cosplay, CosplayStatus } from "@/types/cosplay";
import { getCosplayProgressPercent } from "@/lib/siteConfig";
import { GoogleDriveImage } from "./GoogleDriveImage";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import CheerButton from "./CheerButton";

const statusLabels: Record<CosplayStatus, string> = {
  completed: "Complete",
  "in-progress": "In progress",
  planned: "Planned",
  retired: "Retired",
};

const statusStyles: Record<CosplayStatus, string> = {
  completed: "bg-emerald-600 text-white",
  "in-progress": "bg-closet-rose text-white",
  planned: "bg-violet-600 text-white",
  retired: "bg-slate-500 text-white",
};

interface RosterFlipCardProps {
  cosplay: Cosplay;
  initialCheerCount?: number;
}

function CardMeta({ cosplay, subtitle }: { cosplay: Cosplay; subtitle?: string }) {
  const showOutfit = cosplay.outfit && cosplay.outfit.toLowerCase() !== "default";

  return (
    <div className="flex min-h-[5rem] shrink-0 items-start justify-between gap-2 border-t border-closet-pink/40 bg-white px-3 py-3 sm:min-h-[5.25rem] sm:px-4 sm:py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-closet-rose sm:text-[11px]">
          {cosplay.series}
        </p>
        <h3 className="truncate font-sans text-base font-bold leading-snug text-closet-brown sm:text-lg">
          {cosplay.character}
        </h3>
        <p className="mt-0.5 truncate text-xs text-closet-brown-light">
          {subtitle ?? (showOutfit ? cosplay.outfit : "\u00A0")}
        </p>
      </div>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-closet-blush text-closet-rose group-hover:bg-closet-rose group-hover:text-white sm:h-9 sm:w-9"
        aria-hidden
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </div>
  );
}

function StatusBadges({ cosplay, progress }: { cosplay: Cosplay; progress: number }) {
  return (
    <>
      <span
        className={`absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px] ${statusStyles[cosplay.status]}`}
      >
        {statusLabels[cosplay.status]}
      </span>

      {cosplay.status === "in-progress" && progress > 0 && (
        <span className="absolute right-2.5 top-2.5 z-10 rounded-full border border-white/80 bg-white/95 px-2 py-1 text-[10px] font-bold tabular-nums text-closet-rose shadow-sm sm:right-3 sm:top-3 sm:text-xs">
          {progress}%
        </span>
      )}
    </>
  );
}

function FlipImage({
  src,
  alt,
  emptyLabel,
  emptyHint,
  imageClassName,
}: {
  src: string | null | undefined;
  alt: string;
  emptyLabel: string;
  emptyHint: string;
  imageClassName: string;
}) {
  if (isCosplayPlaceholderImage(src)) {
    const initial = emptyLabel.trim().charAt(0).toUpperCase() || "?";
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-closet-blush p-4">
        <span className="font-display text-5xl font-bold text-closet-rose/25 sm:text-6xl">{initial}</span>
        <span className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-closet-brown-light/60">
          {emptyHint}
        </span>
      </div>
    );
  }

  return (
    <GoogleDriveImage
      src={src!}
      alt={alt}
      fill
      className={`absolute inset-0 h-full w-full ${imageClassName}`}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
    />
  );
}

function CardFace({
  cosplay,
  progress,
  imageSrc,
  imageAlt,
  emptyHint,
  imageClassName,
  subtitle,
  showHint,
}: {
  cosplay: Cosplay;
  progress: number;
  imageSrc: string | null | undefined;
  imageAlt: string;
  emptyHint: string;
  imageClassName: string;
  subtitle?: string;
  showHint?: boolean;
}) {
  return (
    <>
      <div className="roster-flip-media">
        <FlipImage
          src={imageSrc}
          alt={imageAlt}
          emptyLabel={cosplay.character}
          emptyHint={emptyHint}
          imageClassName={imageClassName}
        />
        <StatusBadges cosplay={cosplay} progress={progress} />
        {showHint && (
          <>
            <span className="roster-flip-hint sm:hidden" aria-hidden>
              Hold to peek
            </span>
            <span className="roster-flip-hint hidden sm:block" aria-hidden>
              Hover to flip
            </span>
          </>
        )}
      </div>
      <CardMeta cosplay={cosplay} subtitle={subtitle} />
    </>
  );
}

export default function RosterFlipCard({ cosplay, initialCheerCount = 0 }: RosterFlipCardProps) {
  const progress = getCosplayProgressPercent(cosplay);
  const canCheer = cosplay.status === "planned" || cosplay.status === "in-progress";

  return (
    <div className="group relative h-full">
      <Link
        href={`/roster/${cosplay.id}`}
        className="roster-flip-card block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-closet-pink focus-visible:ring-offset-2"
        aria-label={`Open ${cosplay.character} build page`}
      >
        <div className="roster-flip-shell">
          <div className="roster-flip-inner">
            <div className="roster-flip-face roster-flip-face-front">
              <CardFace
                cosplay={cosplay}
                progress={progress}
                showHint
                imageSrc={cosplay.characterArt}
                imageAlt={`${cosplay.character} character art`}
                emptyHint="No reference art"
                imageClassName="object-contain object-center p-2 sm:p-3"
              />
            </div>

            <div className="roster-flip-face roster-flip-face-back">
              <CardFace
                cosplay={cosplay}
                progress={progress}
                subtitle="Cosplay photo"
                imageSrc={cosplay.image}
                imageAlt={`${cosplay.character} cosplay`}
                emptyHint="No cosplay photo"
                imageClassName="object-cover object-top"
              />
            </div>
          </div>
        </div>
      </Link>

      {canCheer ? (
        <div className="pointer-events-auto absolute bottom-[5.35rem] left-2.5 z-20 sm:bottom-[5.6rem] sm:left-3">
          <CheerButton
            cosplayId={cosplay.id}
            eligible
            initialCount={initialCheerCount}
            variant="compact"
          />
        </div>
      ) : null}
    </div>
  );
}
