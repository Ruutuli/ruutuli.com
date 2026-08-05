/** Default path stored on older builds when no image was assigned. */
export const COSPLAY_PLACEHOLDER_PATH = "/images/box-blank.png";

export function isCosplayPlaceholderImage(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const trimmed = url.trim();
  if (trimmed === COSPLAY_PLACEHOLDER_PATH) return true;
  if (trimmed.includes("box-blank")) return true;
  if (trimmed.toLowerCase().includes("placeholder")) return true;
  return false;
}

/** First real image from the list, or null if none. */
export function getCosplayDisplayImage(...urls: (string | null | undefined)[]): string | null {
  for (const url of urls) {
    if (!isCosplayPlaceholderImage(url)) return url!.trim();
  }
  return null;
}

export function filterCosplayImages(urls: string[]): string[] {
  return urls.filter((u) => !isCosplayPlaceholderImage(u));
}

/** Random pick from gallery fallbacks when no display photo is set. */
export function pickRandomCosplayPhoto(urls: (string | null | undefined)[]): string | null {
  const valid = filterCosplayImages(urls.filter((u): u is string => !!u));
  if (valid.length === 0) return null;
  return valid[Math.floor(Math.random() * valid.length)]!;
}

/** Merge gallery candidates with section photos — cosplay shots only, never reference art. */
export function buildCosplayPhotoFallbacks(
  candidates: { cosplayPhotos: string[]; referencePhotos: string[] } | undefined,
  sectionPhotoUrls: string[],
): { cosplay: string[]; reference: string[] } {
  const reference = candidates?.referencePhotos ?? [];
  const referenceSet = new Set(reference);

  let cosplay = candidates?.cosplayPhotos ?? [];
  if (cosplay.length === 0) {
    cosplay = filterCosplayImages(sectionPhotoUrls).filter((url) => !referenceSet.has(url));
  }

  return { cosplay, reference };
}

/** Display / featured roster photo — cosplay shots first, reference only if none exist. */
export function resolveCosplayDisplayPhoto(
  cosplay: { id: string; image?: string | null; characterArt?: string | null },
  cosplayPhotoFallbacks: (string | null | undefined)[] = [],
  referencePhotoFallbacks: (string | null | undefined)[] = [],
): string | null {
  if (!isCosplayPlaceholderImage(cosplay.image)) return cosplay.image!.trim();

  const fromCosplayPhotos = pickRandomCosplayPhoto(cosplayPhotoFallbacks);
  if (fromCosplayPhotos) return fromCosplayPhotos;

  const fromReferencePhotos = pickRandomCosplayPhoto(referencePhotoFallbacks);
  if (fromReferencePhotos) return fromReferencePhotos;

  return getCosplayDisplayImage(cosplay.characterArt);
}
