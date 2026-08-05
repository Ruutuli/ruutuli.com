"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RosterImageSlot from "@/components/RosterImageSlot";
import { GalleryBannerPhoto } from "@/types/gallery";

const SLOT_COUNT = 5;
/** Time between each panel swap — calm, even rhythm */
const SWAP_MS = 5500;

function pickReplacement(
  pool: GalleryBannerPhoto[],
  slots: GalleryBannerPhoto[],
  slotIndex: number,
): GalleryBannerPhoto {
  const current = slots[slotIndex];
  const visibleElsewhere = new Set(
    slots.map((photo, index) => (index === slotIndex ? null : photo.src)).filter(Boolean),
  );
  const candidates = pool.filter((photo) => photo.src !== current.src && !visibleElsewhere.has(photo.src));
  const pickFrom =
    candidates.length > 0 ? candidates : pool.filter((photo) => photo.src !== current.src);
  if (pickFrom.length === 0) return current;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

/** Stable order for SSR + hydration; random shuffle runs in useEffect after mount. */
function initialSlots(pool: GalleryBannerPhoto[], count: number): GalleryBannerPhoto[] {
  if (pool.length === 0) return [];
  return Array.from({ length: count }, (_, index) => pool[index % pool.length]);
}

function randomSlots(pool: GalleryBannerPhoto[], count: number): GalleryBannerPhoto[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, index) => shuffled[index % shuffled.length]);
}

function BannerImage({ photo }: { photo: GalleryBannerPhoto }) {
  return (
    <RosterImageSlot
      src={photo.src}
      alt={photo.alt}
      emptyLabel={photo.alt}
      className="object-cover object-top"
      sizes="20vw"
    />
  );
}

function BannerSlot({ image }: { image: GalleryBannerPhoto }) {
  const [visible, setVisible] = useState(image);
  const [incoming, setIncoming] = useState<GalleryBannerPhoto | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (image.src === visible.src) return;

    setIncoming(image);
    setFadeIn(false);

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFadeIn(true));
    });

    return () => cancelAnimationFrame(frame);
  }, [image, visible.src]);

  const handleTransitionEnd = useCallback(() => {
    if (!incoming || !fadeIn) return;
    setVisible(incoming);
    setIncoming(null);
    setFadeIn(false);
  }, [incoming, fadeIn]);

  return (
    <div className="mediakit-banner-slot relative h-full min-w-0 overflow-hidden bg-closet-blush/15">
      <div className="absolute inset-0" aria-hidden={!!incoming && fadeIn}>
        <BannerImage photo={visible} />
      </div>
      {incoming && (
        <div
          className={`absolute inset-0 transition-opacity duration-[1600ms] ease-in-out ${
            fadeIn ? "opacity-100" : "opacity-0"
          }`}
          onTransitionEnd={(event) => {
            if (event.propertyName !== "opacity" || !fadeIn) return;
            handleTransitionEnd();
          }}
        >
          <BannerImage photo={incoming} />
        </div>
      )}
    </div>
  );
}

export default function MediaKitPhotoBanner({ photos }: { photos: GalleryBannerPhoto[] }) {
  const pool = useMemo(() => photos.filter((p) => p.src?.trim()), [photos]);
  const [slots, setSlots] = useState<GalleryBannerPhoto[]>(() => initialSlots(pool, SLOT_COUNT));
  const [reducedMotion, setReducedMotion] = useState(false);
  const slotCursor = useRef(0);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (pool.length === 0) return;
    setSlots(randomSlots(pool, SLOT_COUNT));
    slotCursor.current = 0;
  }, [pool]);

  useEffect(() => {
    if (reducedMotion || pool.length <= 1) return;

    const timer = window.setInterval(() => {
      const slotToChange = slotCursor.current;
      slotCursor.current = (slotCursor.current + 1) % SLOT_COUNT;

      setSlots((prev) => {
        const next = [...prev];
        next[slotToChange] = pickReplacement(pool, prev, slotToChange);
        return next;
      });
    }, SWAP_MS);

    return () => window.clearInterval(timer);
  }, [pool, reducedMotion]);

  if (pool.length === 0) return null;

  return (
    <section aria-label="Gallery photo collage" className="animate-fade-up [animation-delay:80ms]">
      <div className="mediakit-banner-collage closet-panel-outer overflow-hidden">
        <div className="mediakit-banner-grid">
          {slots.map((image, index) => (
            <BannerSlot key={index} image={image} />
          ))}
        </div>
      </div>
    </section>
  );
}
