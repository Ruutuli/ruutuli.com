import { NextRequest, NextResponse } from "next/server";
import {
  fetchDriveFileMediaBuffer,
  fetchDriveFileThumbnailBuffer,
  fetchPublicDriveFileWithApiKey,
  getImageProxyMaxBytes,
} from "@/lib/google-drive/galleryDrive";
import {
  detectImageContentType,
  getGoogleDriveFileId,
  getGoogleDriveImageUrls,
  isAllowedExternalImageUrl,
  normalizeImageUrl,
  sanitizeGoogleDriveFileId,
} from "@/lib/utils/googleDriveImage";
import { logger } from "@/lib/logger";

const PROXY_CACHE_CONTROL = "public, max-age=604800, must-revalidate";

function parseProxyThumbWidth(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 100) return null;
  return Math.min(parsed, 1920);
}

function bufferAsBody(buf: Buffer): BodyInit {
  return new Uint8Array(buf);
}

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

function transparentFallback(extraHeaders: Record<string, string> = {}) {
  return new NextResponse(bufferAsBody(TRANSPARENT_PNG), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache",
      "X-Image-Error": "true",
      ...extraHeaders,
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawUrl = searchParams.get("url");
  const rawFileId = searchParams.get("fileId");

  if (!rawUrl && !rawFileId) {
    return transparentFallback();
  }

  const url = rawUrl ? normalizeImageUrl(rawUrl) : null;
  const fromUrl = url ? getGoogleDriveFileId(url) : null;
  const driveFileId = fromUrl ?? sanitizeGoogleDriveFileId(rawFileId);
  const thumbWidth = parseProxyThumbWidth(searchParams.get("w"));

  const MAX_IMAGE_BYTES = getImageProxyMaxBytes();

  function serveBuffer(buffer: Buffer, extraHeaders: Record<string, string> = {}): NextResponse | null {
    const contentType = detectImageContentType(buffer);
    if (!contentType) return null;
    return new NextResponse(bufferAsBody(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": PROXY_CACHE_CONTROL,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        ...extraHeaders,
      },
    });
  }

  function externalImageReferer(externalUrl: string): string | undefined {
    try {
      const host = new URL(externalUrl).hostname.toLowerCase();
      if (host.includes("wikia.nocookie.net") || host.includes("fandom.com")) {
        const wikiMatch = externalUrl.match(/\/([^/]+)\.fandom\.com/i);
        if (wikiMatch) return `https://${wikiMatch[1]}.fandom.com/`;
        const pathMatch = externalUrl.match(/\/\/static\.wikia\.nocookie\.net\/([^/]+)\//i);
        if (pathMatch) return `https://${pathMatch[1]}.fandom.com/`;
      }
    } catch {
      /* ignore malformed URLs */
    }
    return undefined;
  }

  async function fetchExternalImage(externalUrl: string): Promise<NextResponse> {
    try {
      const referer = externalImageReferer(externalUrl);
      const response = await fetch(externalUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          ...(referer ? { Referer: referer } : {}),
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return NextResponse.json({ error: "Could not fetch image" }, { status: 502 });
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength <= 100 || buffer.byteLength > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Image too small or too large" }, { status: 502 });
      }

      const served = serveBuffer(buffer);
      if (served) return served;

      return NextResponse.json({ error: "Not a valid image" }, { status: 415 });
    } catch (err) {
      logger.debug("ImageProxy", "External fetch failed", {
        externalUrl,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "Could not fetch image" }, { status: 502 });
    }
  }

  if (!driveFileId && url && isAllowedExternalImageUrl(url)) {
    return fetchExternalImage(url);
  }

  if (!driveFileId) {
    return NextResponse.json({ error: "Invalid image URL or file ID" }, { status: 400 });
  }

  const urls = url
    ? getGoogleDriveImageUrls(url, thumbWidth ?? 800)
    : getGoogleDriveImageUrls(`https://drive.google.com/file/d/${driveFileId}/view`, thumbWidth ?? 800);

  function serveDriveBuffer(buffer: Buffer): NextResponse | null {
    return serveBuffer(buffer);
  }

  if (thumbWidth) {
    const thumb = await fetchDriveFileThumbnailBuffer(driveFileId, MAX_IMAGE_BYTES, thumbWidth);
    if (thumb) {
      const served = serveDriveBuffer(thumb.buffer);
      if (served) return served;
    }

    for (const imageUrl of urls) {
      try {
        const response = await fetch(imageUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Referer: "https://drive.google.com/",
            Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
          },
          redirect: "follow",
        });

        if (!response.ok) continue;

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength <= 100 || buffer.byteLength > MAX_IMAGE_BYTES) continue;

        const contentType = detectImageContentType(buffer);
        if (!contentType) continue;

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": PROXY_CACHE_CONTROL,
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (err) {
        logger.debug("ImageProxy", "Thumbnail CDN fetch failed", {
          imageUrl,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return transparentFallback({ "X-Image-FileId": driveFileId });
  }

  const driveApiMedia = await fetchDriveFileMediaBuffer(driveFileId, MAX_IMAGE_BYTES);
  if (driveApiMedia.status === "ok") {
    const served = serveDriveBuffer(driveApiMedia.buffer);
    if (served) return served;
  }

  if (driveApiMedia.status === "too_large") {
    const thumb = await fetchDriveFileThumbnailBuffer(driveFileId, MAX_IMAGE_BYTES);
    if (thumb) {
      const served = serveDriveBuffer(thumb.buffer);
      if (served) return served;
    }
  }

  const apiKeyMedia = await fetchPublicDriveFileWithApiKey(driveFileId, MAX_IMAGE_BYTES);
  if (apiKeyMedia) {
    const served = serveDriveBuffer(apiKeyMedia.buffer);
    if (served) return served;
  }

  for (const imageUrl of urls) {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://drive.google.com/",
          Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        },
        redirect: "follow",
      });

      if (!response.ok) continue;

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength <= 100 || buffer.byteLength > MAX_IMAGE_BYTES) continue;

      const contentType = detectImageContentType(buffer);
      if (!contentType) continue;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": PROXY_CACHE_CONTROL,
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (err) {
      logger.debug("ImageProxy", "CDN fetch failed", {
        imageUrl,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return transparentFallback({ "X-Image-FileId": driveFileId });
}
