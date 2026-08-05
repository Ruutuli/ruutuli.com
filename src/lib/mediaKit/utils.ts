import { Cosplay } from "@/types/cosplay";
import {
  MediaKitAudienceDetails,
  MediaKitHeroImage,
  MediaKitPlatform,
  MediaKitSettings,
} from "@/types/mediaKit";
import { getCosplayDisplayImage } from "@/lib/cosplay/images";

export function resolveHeroImage(
  image: MediaKitHeroImage | undefined,
  cosplays: Cosplay[],
): { src: string | null; alt: string; objectPosition?: string; rotation?: number } | null {
  if (!image) return null;

  if (image.cosplayId) {
    const cosplay = cosplays.find((c) => c.id === image.cosplayId);
    if (!cosplay) return null;
    const src = getCosplayDisplayImage(cosplay.image, cosplay.characterArt, ...cosplay.gallery);
    return {
      src,
      alt: image.alt || `${cosplay.character} cosplay`,
      objectPosition: image.objectPosition ?? cosplay.imagePosition ?? "center top",
      rotation: image.rotation,
    };
  }

  if (image.src?.trim()) {
    return {
      src: image.src.trim(),
      alt: image.alt,
      objectPosition: image.objectPosition ?? "center top",
      rotation: image.rotation,
    };
  }

  return null;
}

export function resolveRotatingHeroImages(
  cosplayIds: string[],
  cosplays: Cosplay[],
): { src: string; alt: string; objectPosition?: string }[] {
  const results: { src: string; alt: string; objectPosition?: string }[] = [];
  for (const id of cosplayIds) {
    const cosplay = cosplays.find((c) => c.id === id);
    if (!cosplay) continue;
    const src = getCosplayDisplayImage(cosplay.image, ...cosplay.gallery, cosplay.characterArt);
    if (!src) continue;
    results.push({
      src,
      alt: `${cosplay.character} cosplay`,
      objectPosition: cosplay.imagePosition ?? "center top",
    });
  }
  return results;
}

export function getMediaKitFeaturedCosplays(cosplays: Cosplay[], limit = 3): Cosplay[] {
  return cosplays
    .filter((c) => c.featuredForMediaKit && c.status !== "retired")
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .slice(0, limit);
}

export function hasAudienceDetails(details: MediaKitAudienceDetails): boolean {
  if (details.primaryAgeRange?.trim()) return true;
  if (details.averageContentReach?.trim()) return true;
  if (details.topCountries?.some((c) => c.trim())) return true;
  if (details.interests?.some((i) => i.trim())) return true;
  if (details.genderDistribution?.some((g) => g.label.trim() && g.percent > 0)) return true;
  return false;
}

export function getVisiblePlatforms(platforms: MediaKitPlatform[]): MediaKitPlatform[] {
  return platforms.filter((p) => {
    if (!p.enabled) return false;
    const hasHandle = !!p.handle?.trim();
    const hasUrl = !!p.url?.trim();
    const hasMetric =
      !!p.followers?.trim() ||
      !!p.subscribers?.trim() ||
      !!p.engagementRate?.trim() ||
      !!p.averageViews?.trim() ||
      !!p.monthlyReach?.trim();
    return hasHandle || hasUrl || hasMetric;
  });
}

export function platformHasMetrics(platform: MediaKitPlatform): boolean {
  return !!(
    platform.followers?.trim() ||
    platform.subscribers?.trim() ||
    platform.engagementRate?.trim() ||
    platform.averageViews?.trim() ||
    platform.monthlyReach?.trim()
  );
}

export function getCollaborationContactHref(
  mediaKit: MediaKitSettings,
  fallbackContactEmail: string,
): { href: string; label: string; isEmail: boolean } {
  const email = mediaKit.businessEmail?.trim() || fallbackContactEmail?.trim();
  if (email) {
    return { href: `mailto:${email}`, label: email, isEmail: true };
  }
  return { href: "/contact", label: "Contact Ruu", isEmail: false };
}

export function hasPdfDownload(mediaKit: MediaKitSettings): boolean {
  return !!mediaKit.pdfUrl?.trim();
}

export function getMediaKitStats(mediaKit: MediaKitSettings): { value: string; label: string; icon: string }[] {
  const stats: { value: string; label: string; icon: string }[] = [];
  if (mediaKit.yearsCosplaying?.trim()) {
    stats.push({ value: mediaKit.yearsCosplaying.trim(), label: "Years Cosplaying", icon: "star" });
  }
  if (mediaKit.completedCosplays?.trim()) {
    stats.push({ value: mediaKit.completedCosplays.trim(), label: "Cosplays", icon: "dress" });
  }
  if (mediaKit.conventionsAttended?.trim()) {
    stats.push({ value: mediaKit.conventionsAttended.trim(), label: "Conventions", icon: "calendar" });
  }
  if (mediaKit.location?.trim() && mediaKit.showLocationPublicly) {
    stats.push({ value: mediaKit.location.trim(), label: "Based In", icon: "pin" });
  }
  return stats;
}

export function getVisibleCollaborationServices(mediaKit: MediaKitSettings) {
  return mediaKit.collaborationServices.filter((s) => s.title.trim() && s.description.trim());
}

export function getVisiblePastCollaborations(mediaKit: MediaKitSettings) {
  return mediaKit.pastCollaborations.filter((c) => c.name.trim());
}

export function getVisiblePressFeatures(mediaKit: MediaKitSettings) {
  return mediaKit.pressFeatures.filter((p) => p.publication.trim() && p.title.trim());
}

export function mergePlatformUrls(
  platforms: MediaKitPlatform[],
  siteSocials: { instagram: string; tiktok: string; twitch: string; twitter: string },
  mediaKit: MediaKitSettings,
): MediaKitPlatform[] {
  const urlMap: Partial<Record<MediaKitPlatform["id"], string>> = {
    instagram: siteSocials.instagram,
    tiktok: siteSocials.tiktok,
    twitch: siteSocials.twitch,
    youtube: mediaKit.youtubeUrl,
    bluesky: mediaKit.blueskyUrl,
  };

  return platforms.map((p) => ({
    ...p,
    url: p.url?.trim() || urlMap[p.id] || "",
  }));
}
