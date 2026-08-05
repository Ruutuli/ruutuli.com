"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildImageLoadAttempts,
  isTinyPlaceholderImage,
} from "@/lib/utils/googleDriveImage";
import { GalleryBannerPhoto } from "@/types/gallery";

const SLOT_COUNT = 5;
/** Time between each panel swap — calm, even rhythm */
const SWAP_MS = 5500;
const FADE_MS = 900;

function isProxyImageUrl(url: string): boolean {
  return url.includes("/api/images/proxy");
}

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

function BannerImage({
  photo,
  onReady,
}: {
  photo: GalleryBannerPhoto;
  onReady?: () => void;
}) {
  const attempts = useMemo(() => buildImageLoadAttempts(photo.src), [photo.src]);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const readyRef = useRef(false);

  useEffect(() => {
    setAttemptIndex(0);
    readyRef.current = false;
  }, [photo.src]);

  const displayUrl = attempts[attemptIndex];
  if (!displayUrl) return null;

  const markReady = () => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displayUrl}
      alt={photo.alt}
      className="absolute inset-0 h-full w-full object-cover object-top"
      referrerPolicy="no-referrer"
      decoding="sync"
      fetchPriority="high"
      onLoad={(event) => {
        const img = event.currentTarget;
        const currentUrl = attempts[attemptIndex] ?? displayUrl;
        if (
          isTinyPlaceholderImage(img.naturalWidth, img.naturalHeight) &&
          isProxyImageUrl(currentUrl) &&
          attemptIndex + 1 < attempts.length
        ) {
          readyRef.current = false;
          setAttemptIndex((index) => index + 1);
          return;
        }
        markReady();
      }}
      onError={() => {
        if (attemptIndex + 1 < attempts.length) {
          readyRef.current = false;
          setAttemptIndex((index) => index + 1);
          return;
        }
        markReady();
      }}
    />
  );
}

function BannerSlot({ image }: { image: GalleryBannerPhoto }) {
  const [layers, setLayers] = useState<[GalleryBannerPhoto, GalleryBannerPhoto]>(() => [image, image]);
  const [front, setFront] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const waitingRef = useRef(false);

  const back = 1 - front;
  const frontPhoto = layers[front];

  useEffect(() => {
    if (image.src === frontPhoto.src) return;

    waitingRef.current = true;
    setFadeIn(false);
    setLayers((prev) => {
      const next: [GalleryBannerPhoto, GalleryBannerPhoto] = [...prev];
      next[back] = image;
      return next;
    });
  }, [image, frontPhoto.src, back]);

  const handleBackReady = useCallback(() => {
    if (!waitingRef.current) return;
    waitingRef.current = false;
    requestAnimationFrame(() => setFadeIn(true));
  }, []);

  const handleTransitionEnd = useCallback(() => {
    if (!fadeIn) return;
    setFront(back);
    setFadeIn(false);
  }, [fadeIn, back]);

  return (
    <div className="mediakit-banner-slot relative h-full min-w-0 overflow-hidden bg-closet-blush/15">
      <div className="absolute inset-0">
        <BannerImage photo={layers[front]} />
      </div>
      <div
        className={`mediakit-banner-layer absolute inset-0 transition-opacity ease-in-out ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
        style={{ transitionDuration: `${FADE_MS}ms` }}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "opacity" || !fadeIn) return;
          handleTransitionEnd();
        }}
      >
        <BannerImage photo={layers[back]} onReady={handleBackReady} />
      </div>
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
