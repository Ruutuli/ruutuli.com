"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildImageLoadAttempts,
  isTinyPlaceholderImage,
} from "@/lib/utils/googleDriveImage";
import { GalleryBannerPhoto } from "@/types/gallery";

const SLOT_COUNT = 5;
/** Time between each panel swap — calm, even rhythm */
const SWAP_MS = 5500;
const FADE_MS = 1200;

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

async function loadBannerPhoto(url: string): Promise<HTMLImageElement | null> {
  const attempts = buildImageLoadAttempts(url);
  if (attempts.length === 0) return null;

  for (let index = 0; index < attempts.length; index++) {
    const attemptUrl = attempts[index]!;
    const result = await new Promise<HTMLImageElement | "retry" | "fail">((resolve) => {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.onload = () => {
        if (
          isTinyPlaceholderImage(img.naturalWidth, img.naturalHeight) &&
          isProxyImageUrl(attemptUrl) &&
          index + 1 < attempts.length
        ) {
          resolve("retry");
          return;
        }
        resolve(img);
      };
      img.onerror = () => resolve(index + 1 < attempts.length ? "retry" : "fail");
      img.src = attemptUrl;
    });

    if (result === "retry") continue;
    if (result === "fail") return null;

    try {
      await result.decode();
    } catch {
      /* decoded or unsupported — still usable */
    }
    return result;
  }

  return null;
}

function preloadBannerPhoto(photo: GalleryBannerPhoto): Promise<void> {
  return loadBannerPhoto(photo.src).then(() => undefined);
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

  const markReady = async (img: HTMLImageElement) => {
    if (readyRef.current) return;
    try {
      await img.decode();
    } catch {
      /* ignore */
    }
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
      decoding="async"
      draggable={false}
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
        void markReady(img);
      }}
      onError={() => {
        if (attemptIndex + 1 < attempts.length) {
          readyRef.current = false;
          setAttemptIndex((index) => index + 1);
          return;
        }
        void markReady(document.createElement("img"));
      }}
    />
  );
}

function BannerSlot({ image }: { image: GalleryBannerPhoto }) {
  const [visible, setVisible] = useState(image);
  const [incoming, setIncoming] = useState<GalleryBannerPhoto | null>(null);
  const [fadeActive, setFadeActive] = useState(false);
  const fadeTokenRef = useRef(0);

  useEffect(() => {
    if (image.src === visible.src) return;

    fadeTokenRef.current += 1;
    setFadeActive(false);
    setIncoming(image);
  }, [image, visible.src]);

  const handleIncomingReady = useCallback(() => {
    const token = fadeTokenRef.current;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (token !== fadeTokenRef.current) return;
        setFadeActive(true);
      });
    });
  }, []);

  const handleTransitionEnd = useCallback(
    (event: React.TransitionEvent<HTMLDivElement>) => {
      if (event.propertyName !== "opacity" || !fadeActive || !incoming) return;
      fadeTokenRef.current += 1;
      setVisible(incoming);
      setIncoming(null);
      setFadeActive(false);
    },
    [fadeActive, incoming],
  );

  const linkedPhoto = incoming ?? visible;
  const cosplayId = linkedPhoto.cosplayId?.trim();
  const href = cosplayId ? `/roster/${cosplayId}` : null;

  const images = (
    <>
      <div className="absolute inset-0">
        <BannerImage photo={visible} />
      </div>
      {incoming && (
        <div
          className={`mediakit-banner-layer absolute inset-0 ${
            fadeActive ? "mediakit-banner-layer-fading opacity-100" : "opacity-0"
          }`}
          style={fadeActive ? { transitionDuration: `${FADE_MS}ms` } : undefined}
          onTransitionEnd={handleTransitionEnd}
        >
          <BannerImage photo={incoming} onReady={handleIncomingReady} />
        </div>
      )}
    </>
  );

  const slotClassName =
    "mediakit-banner-slot relative block h-full min-w-0 overflow-hidden bg-closet-blush/15 transition-[filter] duration-300 hover:brightness-[1.06]";

  if (href) {
    return (
      <Link
        href={href}
        className={slotClassName}
        aria-label={linkedPhoto.alt?.trim() || "View cosplay"}
      >
        {images}
      </Link>
    );
  }

  return <div className={slotClassName}>{images}</div>;
}

export default function MediaKitPhotoBanner({ photos }: { photos: GalleryBannerPhoto[] }) {
  const pool = useMemo(() => photos.filter((p) => p.src?.trim()), [photos]);
  const [slots, setSlots] = useState<GalleryBannerPhoto[]>(() => initialSlots(pool, SLOT_COUNT));
  const [reducedMotion, setReducedMotion] = useState(false);
  const slotCursor = useRef(0);
  const poolRef = useRef(pool);

  useEffect(() => {
    poolRef.current = pool;
  }, [pool]);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reducedMotion || pool.length <= 1) return;

    let cancelled = false;

    const timer = window.setInterval(() => {
      const slotToChange = slotCursor.current;
      slotCursor.current = (slotCursor.current + 1) % SLOT_COUNT;

      setSlots((prev) => {
        const replacement = pickReplacement(poolRef.current, prev, slotToChange);
        if (replacement.src === prev[slotToChange]?.src) return prev;

        void preloadBannerPhoto(replacement).then(() => {
          if (cancelled) return;
          setSlots((current) => {
            const next = [...current];
            next[slotToChange] = replacement;
            return next;
          });
        });

        return prev;
      });
    }, SWAP_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [pool.length, reducedMotion]);

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
