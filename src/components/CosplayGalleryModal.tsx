"use client";

import { useCallback, useEffect } from "react";
import { Cosplay } from "@/types/cosplay";
import { GalleryPhotoCreditMap } from "@/lib/gallery/photoCredits";
import CosplayPhotoGallery from "./CosplayPhotoGallery";

interface CosplayGalleryModalProps {
  cosplay: Cosplay;
  photoCredits?: GalleryPhotoCreditMap;
  onClose: () => void;
}

export default function CosplayGalleryModal({ cosplay, photoCredits = {}, onClose }: CosplayGalleryModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const photos = cosplay.gallery.length > 0 ? cosplay.gallery : [cosplay.image];

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`${cosplay.character} gallery`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-closet-brown/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close gallery"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl animate-scale-in flex-col overflow-hidden rounded-t-3xl border border-closet-pink/50 bg-white/95 shadow-closet-lg sm:mx-6 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4 border-b border-closet-pink/40 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-closet-rose">{cosplay.series}</p>
            <h2 className="font-sans text-2xl font-semibold text-closet-brown sm:text-3xl">
              {cosplay.character}
            </h2>
            <p className="mt-1 max-w-lg text-sm text-closet-brown-light">
              {photos.length} photo{photos.length === 1 ? "" : "s"}
              {cosplay.description ? ` · ${cosplay.description}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-closet-pink/40 bg-white p-2 text-closet-brown transition-all duration-200 hover:scale-110 hover:border-closet-rose/40 hover:text-closet-rose"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6">
          <CosplayPhotoGallery
            photos={photos.filter(Boolean)}
            photoCredits={photoCredits}
            characterName={cosplay.character}
            variant="featured"
          />
        </div>
      </div>
    </div>
  );
}
