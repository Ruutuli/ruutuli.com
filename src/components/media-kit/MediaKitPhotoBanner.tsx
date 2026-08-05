"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RosterImageSlot from "@/components/RosterImageSlot";
import { buildImageLoadAttempts } from "@/lib/utils/googleDriveImage";
import { GalleryBannerPhoto } from "@/types/gallery";

const SLOT_COUNT = 5;
/** Time between each panel swap — calm, even rhythm */
const SWAP_MS = 5500;
const FADE_MS = 900;

function characterKey(photo: GalleryBannerPhoto): string {
  return photo.cosplayId?.trim() || photo.src;
}

function pickOnePerCharacter(pool: GalleryBannerPhoto[]): GalleryBannerPhoto[] {
  const seen = new Set<string>();
  const result: GalleryBannerPhoto[] = [];
  for (const photo of pool) {
    const key = characterKey(photo);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(photo);
  }
  return result;
}

function pickReplacement(
  pool: GalleryBannerPhoto[],
  slots: GalleryBannerPhoto[],
  slotIndex: number,
): GalleryBannerPhoto {
  const current = slots[slotIndex];
  const currentKey = characterKey(current);
  const visibleCharacters = new Set(
    slots
      .map((photo, index) => (index === slotIndex ? null : characterKey(photo)))
      .filter((key): key is string => Boolean(key)),
  );

  const candidates = pool.filter(
    (photo) => characterKey(photo) !== currentKey && !visibleCharacters.has(characterKey(photo)),
  );
  const pickFrom =
    candidates.length > 0
      ? candidates
      : pool.filter((photo) => characterKey(photo) !== currentKey);
  if (pickFrom.length === 0) return current;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

/** Stable, one-character-per-slot order for SSR + hydration. */
function initialSlots(pool: GalleryBannerPhoto[], count: number): GalleryBannerPhoto[] {
  const unique = pickOnePerCharacter(pool);
  if (unique.length === 0) return [];
  return Array.from({ length: count }, (_, index) => unique[index % unique.length]);
}

function preloadImage(src: string): Promise<void> {
  const attempts = buildImageLoadAttempts(src);
  const url = attempts[0];
  if (!url) return Promise.resolve();

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

function BannerImage({ photo, priority }: { photo: GalleryBannerPhoto; priority?: boolean }) {
  return (
    <RosterImageSlot
      src={photo.src}
      alt={photo.alt}
      emptyLabel={photo.alt}
      className="object-cover object-top"
      sizes="20vw"
      priority={priority}
    />
  );
}

function BannerSlot({ image }: { image: GalleryBannerPhoto }) {
  const [displayed, setDisplayed] = useState(image);
  const [incoming, setIncoming] = useState<GalleryBannerPhoto | null>(null);
  const [crossfading, setCrossfading] = useState(false);

  useEffect(() => {
    if (image.src === displayed.src) return;

    let cancelled = false;

    preloadImage(image.src).then(() => {
      if (cancelled || image.src === displayed.src) return;

      setIncoming(image);
      setCrossfading(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setCrossfading(true);
        });
      });
    });

    return () => {
      cancelled = true;
    };
  }, [image, displayed.src]);

  const handleTransitionEnd = useCallback(() => {
    if (!crossfading || !incoming) return;
    setDisplayed(incoming);
    setIncoming(null);
    setCrossfading(false);
  }, [crossfading, incoming]);

  return (
    <div className="mediakit-banner-slot relative h-full min-w-0 overflow-hidden bg-closet-blush/15">
      <div
        className={`mediakit-banner-layer absolute inset-0 transition-opacity ease-in-out ${
          crossfading ? "opacity-0" : "opacity-100"
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
        aria-hidden={crossfading}
      >
        <BannerImage photo={displayed} priority />
      </div>
      {incoming && (
        <div
          className={`mediakit-banner-layer absolute inset-0 transition-opacity ease-in-out ${
            crossfading ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDuration: `${FADE_MS}ms` }}
          onTransitionEnd={(event) => {
            if (event.propertyName !== "opacity" || !crossfading) return;
            handleTransitionEnd();
          }}
        >
          <BannerImage photo={incoming} priority />
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
