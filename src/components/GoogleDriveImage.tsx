"use client";

import { useState, useMemo, useEffect, memo, useCallback, useRef } from "react";
import Image, { type ImageProps } from "next/image";
import {
  buildImageLoadAttempts,
  IMAGE_PLACEHOLDER_URL,
  shouldUseUnoptimizedImage,
  isTinyPlaceholderImage,
} from "@/lib/utils/googleDriveImage";

interface GoogleDriveImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

function isProxyImageUrl(url: string): boolean {
  return url.includes("/api/images/proxy");
}

function GoogleDriveImageComponent({
  src,
  alt,
  className = "",
  style,
  fallbackSrc = IMAGE_PLACEHOLDER_URL,
  priority = false,
  fill,
  sizes,
}: GoogleDriveImageProps) {
  const loadAttempts = useMemo(() => buildImageLoadAttempts(src), [src]);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const loadAttemptsRef = useRef(loadAttempts);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadAttemptsRef.current = loadAttempts;
    setAttemptIndex(0);
  }, [loadAttempts]);

  const displayUrl =
    attemptIndex < loadAttempts.length ? loadAttempts[attemptIndex]! : fallbackSrc;

  const tryNextUrl = useCallback((reason: "proxy-fallback" | "load-error") => {
    if (!mountedRef.current) return;
    setAttemptIndex((current) => {
      const attempts = loadAttemptsRef.current;
      const next = current + 1;
      if (next < attempts.length) return next;
      if (next === attempts.length) return next;
      return next;
    });
    void reason;
  }, []);

  const handleError = () => {
    const attempts = loadAttemptsRef.current;
    if (attemptIndex >= attempts.length) return;
    tryNextUrl("load-error");
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const attempts = loadAttemptsRef.current;
    if (attemptIndex >= attempts.length) return;

    const img = e.currentTarget;
    const currentUrl = attempts[attemptIndex] ?? displayUrl;
    if (
      isTinyPlaceholderImage(img.naturalWidth, img.naturalHeight) &&
      isProxyImageUrl(currentUrl)
    ) {
      tryNextUrl("proxy-fallback");
    }
  };

  if (loadAttempts.length === 0) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      onError={handleError}
      onLoad={handleLoad}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      {...(fill ? { sizes } : {})}
    />
  );
}

export const GoogleDriveImage = memo(GoogleDriveImageComponent);

type ProxiedNextImageProps = Omit<ImageProps, "src" | "onError" | "onLoad"> & {
  src: string | null | undefined;
  fallbackSrc?: string;
};

export function ProxiedNextImage({
  src,
  fallbackSrc = IMAGE_PLACEHOLDER_URL,
  unoptimized,
  ...props
}: ProxiedNextImageProps) {
  const loadAttempts = useMemo(() => (src ? buildImageLoadAttempts(src) : []), [src]);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const loadAttemptsRef = useRef(loadAttempts);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadAttemptsRef.current = loadAttempts;
    setAttemptIndex(0);
  }, [loadAttempts]);

  const displaySrc =
    attemptIndex < loadAttempts.length ? loadAttempts[attemptIndex]! : fallbackSrc;

  const tryNextUrl = useCallback(() => {
    if (!mountedRef.current) return;
    setAttemptIndex((current) => {
      const attempts = loadAttemptsRef.current;
      const next = current + 1;
      return next <= attempts.length ? next : current;
    });
  }, []);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      const attempts = loadAttemptsRef.current;
      if (attemptIndex >= attempts.length) return;

      const img = e.currentTarget;
      const currentUrl = attempts[attemptIndex] ?? "";
      if (
        isTinyPlaceholderImage(img.naturalWidth, img.naturalHeight) &&
        isProxyImageUrl(currentUrl)
      ) {
        tryNextUrl();
      }
    },
    [tryNextUrl, attemptIndex]
  );

  if (!displaySrc) return null;

  return (
    <Image
      {...props}
      src={displaySrc}
      unoptimized={unoptimized ?? shouldUseUnoptimizedImage(displaySrc)}
      referrerPolicy="no-referrer"
      onError={tryNextUrl}
      onLoad={handleLoad}
    />
  );
}
