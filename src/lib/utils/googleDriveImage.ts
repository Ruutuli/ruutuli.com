const VALID_FILE_ID_REGEX = /^[a-zA-Z0-9_-]{15,50}$/;

/** Cache-bust token for gallery images — prefer Drive modifiedTime over catalog updatedAt. */
export function resolveImageCacheVersion(item?: {
  driveModifiedAt?: string | null;
  updatedAt?: string | null;
}): string | undefined {
  return item?.driveModifiedAt?.trim() || item?.updatedAt?.trim() || undefined;
}

/** Query param on image URLs — forwarded to the proxy as `v` to bust browser cache after Drive file replacement. */
export const IMAGE_CACHE_VERSION_PARAM = "imgv";

export function getImageCacheVersionFromUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  try {
    const parsed = new URL(normalizeImageUrl(url));
    const version = parsed.searchParams.get(IMAGE_CACHE_VERSION_PARAM)?.trim();
    return version || undefined;
  } catch {
    return undefined;
  }
}

/** Append a cache-bust token to an image URL (Drive ignores unknown query params). */
export function withImageCacheVersion(url: string | null | undefined, version?: string | null): string {
  if (!url?.trim() || !version?.trim()) return url?.trim() ?? "";
  try {
    const parsed = new URL(normalizeImageUrl(url));
    parsed.searchParams.set(IMAGE_CACHE_VERSION_PARAM, version.trim());
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function isGoogleHostedImageUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return (
    /drive\.google\.com/i.test(url) ||
    /googleusercontent\.com/i.test(url) ||
    /drive\.usercontent\.google/i.test(url)
  );
}

export function detectImageContentType(data: ArrayBuffer | Uint8Array): string | null {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length < 12) return null;

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }

  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export function sanitizeGoogleDriveFileId(fileId: string | null | undefined): string | null {
  if (!fileId || typeof fileId !== "string") return null;
  let trimmed = fileId.trim();
  trimmed = trimmed.replace(/\\u0026/gi, "&");
  trimmed = trimmed.replace(/u0026/gi, "&");

  const firstSegment = trimmed.includes("&") ? trimmed.split("&")[0]!.trim() : trimmed;
  if (VALID_FILE_ID_REGEX.test(firstSegment)) return firstSegment;
  const match = trimmed.match(/[a-zA-Z0-9_-]{15,50}/);
  return match ? match[0]! : null;
}

export function getGoogleDriveFileId(url: string | null | undefined): string | null {
  if (!url) return null;

  const decoded = decodeUrlEntities(url.trim());

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
    /^https?:\/\/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/drive\.usercontent\.google\.com\/download\?id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (match) return match[1]!;
  }
  return null;
}

export function convertGoogleDriveUrl(url: string | null | undefined): string {
  if (!url) return "";

  const trimmed = decodeUrlEntities(url.trim());
  const fileId = getGoogleDriveFileId(trimmed);
  if (fileId && /drive\.google\.com/i.test(trimmed)) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  if (trimmed.includes("drive.google.com/uc") && /[?&]id=/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function decodeUrlEntities(url: string): string {
  return url
    .replace(/&amp;/gi, "&")
    .replace(/&#0*38;/gi, "&")
    .replace(/\\u0026/gi, "&")
    .replace(/u0026/gi, "&");
}

function stripTrailingUrlPunctuation(url: string): string {
  return url.replace(/[.,;:!?)>\]"']+$/, "");
}

/** Trim and unwrap markdown / HTML pasted links. */
export function normalizeImageUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  let s = decodeUrlEntities(raw.trim().replace(/\r/g, ""));

  const mdMatch = s.match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/i);
  if (mdMatch) s = mdMatch[1]!;

  const srcMatch = s.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (srcMatch) s = srcMatch[1]!;

  if (s.startsWith("<") && s.includes("http")) {
    const hrefMatch = s.match(/https?:\/\/[^\s"'<>]+/i);
    if (hrefMatch) s = hrefMatch[0]!;
  }

  if (!/^https?:\/\//i.test(s)) {
    const urlMatch = s.match(/https?:\/\/[^\s"'<>]+/i);
    if (urlMatch) s = urlMatch[0]!;
  }

  if (s.startsWith("//")) {
    s = `https:${s}`;
  }

  return stripTrailingUrlPunctuation(s.trim());
}

/** Pick the first image URL from pasted clipboard text. */
export function extractFirstImageUrl(text: string): string {
  const parsed = parseImageUrlsFromText(text);
  if (parsed.length > 0) return parsed[0]!;
  return normalizeImageUrl(text);
}

export function isExternalImageUrl(url: string | null | undefined): boolean {
  const normalized = normalizeImageUrl(url);
  if (!normalized) return false;
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return false;
  if (normalized.startsWith("data:")) return false;
  return /^https?:\/\//i.test(normalized) && !isGoogleHostedImageUrl(normalized);
}

export function isAllowedExternalImageUrl(url: string | null | undefined): boolean {
  const normalized = normalizeImageUrl(url);
  if (!normalized || !/^https?:\/\//i.test(normalized)) return false;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "0.0.0.0"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Split pasted text into unique image URLs (newlines, commas, spaces). */
export function parseImageUrlsFromText(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const cleaned = text.replace(/\r/g, "");

  const add = (candidate: string) => {
    const url = normalizeImageUrl(candidate);
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) return;
    seen.add(url);
    out.push(url);
  };

  for (const part of cleaned.split(/[\n,]+/)) {
    for (const token of part.split(/\s+/)) {
      if (token.trim()) add(token);
    }
  }

  if (out.length === 0) {
    const globalMatches = cleaned.match(/https?:\/\/[^\s"'<>]+/gi);
    if (globalMatches) {
      for (const match of globalMatches) add(match);
    }
  }

  return out;
}

export function getExternalProxyUrl(url: string | null | undefined): string {
  const normalized = normalizeImageUrl(url);
  if (!normalized || !isAllowedExternalImageUrl(normalized)) return normalized;
  return `/api/images/proxy?url=${encodeURIComponent(normalized)}`;
}

export function getGoogleDriveImageUrls(
  url: string | null | undefined,
  maxWidth = 800
): string[] {
  if (!url) return [];

  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return [url];

  const w = Math.min(Math.max(maxWidth, 200), 1920);

  return [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w${w}`,
    `https://lh3.googleusercontent.com/d/${fileId}=w${w}-rw`,
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download`,
  ];
}

/** Max width for admin gallery grid / Drive picker thumbnails (via proxy ?w=). */
export const ADMIN_GALLERY_THUMB_WIDTH = 320;

export const IMAGE_PLACEHOLDER_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240" viewBox="0 0 480 240" role="img" aria-label="Image unavailable">' +
    '<rect width="480" height="240" fill="#fce4ec"/>' +
    '<text x="240" y="120" text-anchor="middle" fill="#be185d" font-family="system-ui,sans-serif" font-size="14">Image unavailable</text>' +
    "</svg>"
)}`;

export function shouldUseUnoptimizedImage(src: string | null | undefined): boolean {
  if (!src || !src.trim()) return true;
  if (src.startsWith("/api/images/proxy")) return true;
  if (src.startsWith("/") && !src.startsWith("//")) return false;
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) {
    return true;
  }
  return true;
}

export function getProxyUrl(
  url: string | null | undefined,
  options?: { width?: number; version?: string },
): string {
  if (!url) return "";

  const trimmed = normalizeImageUrl(url);
  const version = options?.version?.trim() || getImageCacheVersionFromUrl(trimmed);
  const fileId = getGoogleDriveFileId(trimmed);
  if (fileId && isGoogleHostedImageUrl(trimmed)) {
    const params = new URLSearchParams({
      fileId,
      url: trimmed,
    });
    if (options?.width) {
      params.set("w", String(Math.min(Math.max(Math.round(options.width), 100), 1920)));
    }
    if (version) params.set("v", version);
    return `/api/images/proxy?${params.toString()}`;
  }

  if (isAllowedExternalImageUrl(trimmed)) {
    const proxied = getExternalProxyUrl(trimmed);
    if (version && proxied.startsWith("/api/images/proxy")) {
      const params = new URLSearchParams(proxied.split("?")[1] ?? "");
      params.set("v", version);
      return `/api/images/proxy?${params.toString()}`;
    }
    return proxied;
  }

  return trimmed;
}

export function isTinyPlaceholderImage(naturalWidth: number, naturalHeight: number): boolean {
  return naturalWidth <= 1 && naturalHeight <= 1;
}

export function buildImageLoadAttempts(url: string | null | undefined): string[] {
  if (!url?.trim()) return [];
  const trimmed = normalizeImageUrl(url);
  if (trimmed === IMAGE_PLACEHOLDER_URL || trimmed.startsWith("data:image/")) return [];

  const seen = new Set<string>();
  const out: string[] = [];
  const add = (candidate: string | null | undefined) => {
    const c = candidate?.trim();
    if (!c || c === IMAGE_PLACEHOLDER_URL || seen.has(c)) return;
    seen.add(c);
    out.push(c);
  };

  if (isGoogleHostedImageUrl(trimmed)) {
    for (const direct of getGoogleDriveImageUrls(trimmed)) {
      if (!direct.startsWith("/api/images/proxy")) add(direct);
    }
    add(convertGoogleDriveUrl(trimmed));
    add(trimmed);
    const proxied = getProxyUrl(trimmed);
    if (proxied.startsWith("/api/images/proxy")) add(proxied);
  } else if (isAllowedExternalImageUrl(trimmed)) {
    add(getExternalProxyUrl(trimmed));
    add(trimmed);
  } else {
    add(trimmed);
    const converted = convertGoogleDriveUrl(trimmed);
    if (converted !== trimmed) add(converted);
  }

  return out;
}

export function resolveImageSrc(url: string | null | undefined): string {
  const attempts = buildImageLoadAttempts(url);
  if (attempts.length > 0) return attempts[0]!;
  if (!url?.trim()) return IMAGE_PLACEHOLDER_URL;
  return decodeUrlEntities(url.trim()) || IMAGE_PLACEHOLDER_URL;
}

/** Admin grid/modals — proxy via server so private Drive files load reliably. */
export function getGalleryAdminImageSrc(
  url: string | null | undefined,
  options?: { driveFileId?: string | null; width?: number; version?: string },
): string {
  const version = options?.version?.trim() || getImageCacheVersionFromUrl(url ?? "");
  const fileId =
    sanitizeGoogleDriveFileId(options?.driveFileId) ?? getGoogleDriveFileId(normalizeImageUrl(url ?? ""));
  if (fileId) {
    const viewUrl =
      url?.trim() && isGoogleHostedImageUrl(normalizeImageUrl(url))
        ? normalizeImageUrl(url)
        : `https://drive.google.com/file/d/${fileId}/view`;
    const versionedUrl = version ? withImageCacheVersion(viewUrl, version) : viewUrl;
    const proxied = getProxyUrl(versionedUrl, { width: options?.width, version });
    if (proxied.startsWith("/api/images/proxy")) return proxied;
    const params = new URLSearchParams({ fileId });
    if (options?.width) {
      params.set("w", String(Math.min(Math.max(Math.round(options.width), 100), 1920)));
    }
    if (version) params.set("v", version);
    return `/api/images/proxy?${params.toString()}`;
  }

  if (!url?.trim()) return IMAGE_PLACEHOLDER_URL;
  const normalized = normalizeImageUrl(url);
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return normalized;
  if (isAllowedExternalImageUrl(normalized)) return getExternalProxyUrl(normalized);
  return normalized || IMAGE_PLACEHOLDER_URL;
}
