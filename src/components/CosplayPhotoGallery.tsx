"use client";

import { useCallback, useEffect, useState } from "react";
import { ProxiedNextImage } from "@/components/GoogleDriveImage";
import {
  GalleryPhotoCreditMap,
  lookupPhotoCredit,
  photoCreditLines,
} from "@/lib/gallery/photoCredits";

type GalleryVariant = "standard" | "compact" | "featured" | "build";

function CreditOverlay({
  src,
  credits,
  compact = false,
}: {
  src: string;
  credits: GalleryPhotoCreditMap;
  compact?: boolean;
}) {
  const { where, who } = photoCreditLines(lookupPhotoCredit(src, credits));
  const hasCredit = Boolean(where || who);

  return (
    <>
      {hasCredit && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-closet-brown/80 via-closet-brown/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 text-white ${
              compact ? "px-2.5 pb-2 pt-8" : "px-3.5 pb-3.5 pt-12 sm:px-4 sm:pb-4"
            }`}
          >
            {where && (
              <p
                className={`truncate font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] ${
                  compact ? "text-[0.65rem] uppercase tracking-wider" : "text-xs sm:text-sm"
                }`}
              >
                📍 {where}
              </p>
            )}
            {who && (
              <p
                className={`truncate text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)] ${
                  compact ? "text-[0.6rem]" : "mt-0.5 text-[11px] sm:text-xs"
                }`}
              >
                📷 {who}
              </p>
            )}
          </div>
        </>
      )}
      <span className="pointer-events-none absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-closet-brown/45 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 sm:h-9 sm:w-9">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </span>
    </>
  );
}

function PhotoLightbox({
  photos,
  index,
  characterName,
  photoCredits,
  onClose,
  onChangeIndex,
}: {
  photos: string[];
  index: number;
  characterName: string;
  photoCredits: GalleryPhotoCreditMap;
  onClose: () => void;
  onChangeIndex: (next: number) => void;
}) {
  const src = photos[index];
  const { where, who } = photoCreditLines(lookupPhotoCredit(src, photoCredits));
  const hasMultiple = photos.length > 1;

  const goPrev = useCallback(() => {
    onChangeIndex((index - 1 + photos.length) % photos.length);
  }, [index, onChangeIndex, photos.length]);

  const goNext = useCallback(() => {
    onChangeIndex((index + 1) % photos.length);
  }, [index, onChangeIndex, photos.length]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goNext, goPrev, onClose]);

  return (
    <div
      className="fixed inset-0 z-[110] flex animate-fade-in items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${characterName} photo ${index + 1} of ${photos.length}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-closet-brown/75 backdrop-blur-md"
        onClick={onClose}
        aria-label="Close gallery"
      />

      <div className="relative z-10 flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-closet-pink/50 bg-white shadow-closet-lg">
        <div className="flex items-center justify-between gap-3 border-b border-closet-pink/40 bg-closet-blush/30 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-closet-brown">{characterName}</p>
            <p className="text-xs font-semibold text-closet-brown-light">
              Photo {index + 1} of {photos.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-closet-pink/50 bg-white p-2 text-closet-brown transition hover:border-closet-rose/50 hover:text-closet-rose"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#f7f2ee]">
          <div className="relative h-[min(72vh,820px)] w-full">
            <ProxiedNextImage
              src={src}
              alt={`${characterName} photo ${index + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 900px"
              priority
            />
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-2.5 text-closet-brown shadow-closet transition hover:bg-white sm:flex"
                aria-label="Previous photo"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/80 bg-white/90 p-2.5 text-closet-brown shadow-closet transition hover:bg-white sm:flex"
                aria-label="Next photo"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {(where || who) && (
          <div className="border-t border-closet-pink/40 bg-closet-blush/25 px-4 py-3 text-center sm:px-6">
            {where && <p className="text-sm font-semibold text-closet-brown">📍 {where}</p>}
            {who && (
              <p className={`text-sm text-closet-brown-light ${where ? "mt-1" : ""}`}>📷 Photo by {who}</p>
            )}
          </div>
        )}

        {hasMultiple && (
          <div className="flex items-center justify-between gap-3 border-t border-closet-pink/40 px-4 py-3 sm:hidden">
            <button type="button" className="closet-btn-outline !py-1.5 !text-xs" onClick={goPrev}>
              Previous
            </button>
            <button type="button" className="closet-btn !py-1.5 !text-xs" onClick={goNext}>
              Next
            </button>
          </div>
        )}

        {hasMultiple && photos.length <= 12 && (
          <div className="flex gap-2 overflow-x-auto border-t border-closet-pink/30 bg-white px-3 py-3 sm:px-4">
            {photos.map((thumb, i) => (
              <button
                key={`${thumb}-${i}`}
                type="button"
                onClick={() => onChangeIndex(i)}
                className={`relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === index ? "border-closet-rose ring-2 ring-closet-rose/30" : "border-closet-pink/40 opacity-75 hover:opacity-100"
                }`}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              >
                <ProxiedNextImage src={thumb} alt="" fill className="object-cover" sizes="44px" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CosplayPhotoGallery({
  photos,
  photoCredits = {},
  characterName,
  emptyMessage = "No photos yet.",
  variant = "standard",
  className = "",
  maxVisible,
}: {
  photos: string[];
  photoCredits?: GalleryPhotoCreditMap;
  characterName: string;
  emptyMessage?: string;
  variant?: GalleryVariant;
  className?: string;
  maxVisible?: number;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const visiblePhotos = maxVisible ? photos.slice(0, maxVisible) : photos;

  if (photos.length === 0) {
    return <p className="py-12 text-center text-sm text-closet-brown-light">{emptyMessage}</p>;
  }

  const gridClass =
    variant === "compact"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-4"
      : variant === "build"
        ? "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4"
      : variant === "featured"
        ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2 lg:gap-4"
        : "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4";

  const imageFitClass = variant === "build" ? "object-contain" : "object-cover";

  return (
    <>
      <div className={`${gridClass} ${className}`}>
        {visiblePhotos.map((src, i) => {
          const isFeaturedLead = variant === "featured" && i === 0;

          return (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className={`group relative overflow-hidden rounded-2xl border border-closet-pink/50 bg-closet-blush/30 text-left shadow-closet transition duration-300 hover:-translate-y-0.5 hover:border-closet-rose/45 hover:shadow-closet-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-closet-rose/50 ${
                isFeaturedLead ? "col-span-2 row-span-2 min-h-[280px] lg:min-h-0" : ""
              } ${variant === "compact" ? "aspect-square rounded-xl" : variant === "build" ? "aspect-[4/3] sm:aspect-[3/2]" : isFeaturedLead ? "min-h-[220px] sm:min-h-[260px]" : "aspect-[3/4] sm:aspect-[4/5]"}`}
            >
              <ProxiedNextImage
                src={src}
                alt={`${characterName} photo ${i + 1}`}
                fill
                className={`${imageFitClass} transition-transform duration-500 group-hover:scale-[1.02]`}
                sizes={
                  isFeaturedLead
                    ? "(max-width: 1024px) 100vw, 50vw"
                    : variant === "compact"
                      ? "180px"
                      : variant === "build"
                        ? "(max-width: 640px) 50vw, 33vw"
                      : "(max-width: 640px) 50vw, 33vw"
                }
              />
              {variant !== "build" && (
                <CreditOverlay src={src} credits={photoCredits} compact={variant === "compact"} />
              )}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          characterName={characterName}
          photoCredits={photoCredits}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </>
  );
}
