import "server-only";

import { defaultMediaKitSettings, mediaKitFeaturedCosplayIds } from "@/data/mediaKitDefaults";
import { MediaKitSettings } from "@/types/mediaKit";
import { COLLECTIONS, getCollection } from "@/lib/mongodb/db";
import { seedStoreIfNeeded } from "./seed";

const MEDIA_KIT_ID = "media-kit";

type MediaKitDoc = MediaKitSettings & { _id: string };

function isBlank(value: string | undefined): boolean {
  return !value?.trim();
}

const LEGACY_INTRO_PHRASES = [
  "I create handmade costumes, character transformations",
  "handmade costumes, character transformations",
];

function usesLegacyIntro(introduction: string | undefined): boolean {
  if (!introduction?.trim()) return false;
  return LEGACY_INTRO_PHRASES.some((phrase) => introduction.includes(phrase));
}

function heroNeedsDefaultFill(hero: MediaKitSettings["hero"]): boolean {
  const hasMain = !!(hero.main?.src?.trim() || hero.main?.cosplayId?.trim());
  const hasSecondary = hero.secondary.some((s) => s.src?.trim() || s.cosplayId?.trim());
  return !hasMain || !hasSecondary;
}

const LEGACY_COLLAB_PHRASES = [
  "Authentic posts, unboxings",
  "on-the-floor coverage",
  "styled and shown in character",
  "collaborative art direction",
];

function usesLegacyCollabCopy(services: MediaKitSettings["collaborationServices"]): boolean {
  return services.some((s) => LEGACY_COLLAB_PHRASES.some((phrase) => s.description.includes(phrase)));
}

function mergeCollaborationServices(
  current: MediaKitSettings["collaborationServices"],
  defaults: MediaKitSettings["collaborationServices"],
): MediaKitSettings["collaborationServices"] {
  if (usesLegacyCollabCopy(current)) return defaults;
  return defaults.map((def, index) => {
    const existing = current[index];
    if (!existing) return def;
    return {
      title: isBlank(existing.title) ? def.title : existing.title,
      description: isBlank(existing.description) ? def.description : existing.description,
    };
  });
}

function fillEmptyMediaKitFields(current: MediaKitSettings): MediaKitSettings {
  const defaults = defaultMediaKitSettings;
  return {
    ...defaults,
    ...current,
    eyebrow: isBlank(current.eyebrow) ? defaults.eyebrow : current.eyebrow,
    heading: isBlank(current.heading) ? defaults.heading : current.heading,
    introduction: usesLegacyIntro(current.introduction)
      ? defaults.introduction
      : isBlank(current.introduction)
        ? defaults.introduction
        : current.introduction,
    location: isBlank(current.location) ? defaults.location : current.location,
    yearsCosplaying: isBlank(current.yearsCosplaying) ? defaults.yearsCosplaying : current.yearsCosplaying,
    completedCosplays: isBlank(current.completedCosplays) ? defaults.completedCosplays : current.completedCosplays,
    conventionsAttended: isBlank(current.conventionsAttended)
      ? defaults.conventionsAttended
      : current.conventionsAttended,
    showLocationPublicly: current.showLocationPublicly || defaults.showLocationPublicly,
    hero: {
      ...defaults.hero,
      ...current.hero,
      main: current.hero.main?.src?.trim() || current.hero.main?.cosplayId?.trim()
        ? current.hero.main
        : defaults.hero.main,
      rotatingCosplayIds:
        current.hero.rotatingCosplayIds.length > 0
          ? current.hero.rotatingCosplayIds
          : defaults.hero.rotatingCosplayIds,
      secondary:
        current.hero.secondary.some((s) => s.src?.trim() || s.cosplayId?.trim())
          ? current.hero.secondary
          : defaults.hero.secondary,
    },
    collaborationServices: mergeCollaborationServices(current.collaborationServices, defaults.collaborationServices),
    platforms: current.platforms.some((p) => p.enabled) ? current.platforms : defaults.platforms,
    audienceDetails: { ...defaults.audienceDetails, ...current.audienceDetails },
    pastCollaborations:
      current.pastCollaborations.length > 0 ? current.pastCollaborations : defaults.pastCollaborations,
    pressFeatures: current.pressFeatures.length > 0 ? current.pressFeatures : defaults.pressFeatures,
    businessEmail: current.businessEmail,
    pdfUrl: current.pdfUrl,
    pdfFileName: current.pdfFileName,
    metricsLastUpdated: current.metricsLastUpdated,
    youtubeUrl: current.youtubeUrl,
    blueskyUrl: current.blueskyUrl,
  };
}

function mergeMediaKitSettings(partial: Partial<MediaKitSettings>): MediaKitSettings {
  const base = defaultMediaKitSettings;
  return {
    ...base,
    ...partial,
    hero: {
      ...base.hero,
      ...partial.hero,
      secondary: partial.hero?.secondary ?? base.hero.secondary,
      rotatingCosplayIds: partial.hero?.rotatingCosplayIds ?? base.hero.rotatingCosplayIds,
    },
    collaborationServices: partial.collaborationServices ?? base.collaborationServices,
    platforms: partial.platforms ?? base.platforms,
    audienceDetails: { ...base.audienceDetails, ...partial.audienceDetails },
    pastCollaborations: partial.pastCollaborations ?? base.pastCollaborations,
    pressFeatures: partial.pressFeatures ?? base.pressFeatures,
  };
}

function fromDoc(doc: MediaKitDoc): MediaKitSettings {
  const { _id, ...rest } = doc;
  return fillEmptyMediaKitFields(mergeMediaKitSettings(rest));
}

let mediaKitPatched = false;

async function patchMediaKitCosplayFlags(): Promise<void> {
  if (mediaKitPatched) return;
  mediaKitPatched = true;

  const collection = await getCollection<{ _id: string; featuredForMediaKit?: boolean; sortOrder?: number }>(
    COLLECTIONS.cosplays,
  );

  await Promise.all(
    mediaKitFeaturedCosplayIds.map((id, index) =>
      collection.updateOne(
        { _id: id },
        { $set: { featuredForMediaKit: true, sortOrder: index + 1 } },
      ),
    ),
  );
}

async function ensureMediaKitDocument(): Promise<MediaKitSettings> {
  const collection = await getCollection<MediaKitDoc>(COLLECTIONS.mediaKit);
  const doc = await collection.findOne({ _id: MEDIA_KIT_ID });

  if (!doc) {
    const settings = defaultMediaKitSettings;
    await collection.replaceOne({ _id: MEDIA_KIT_ID }, { _id: MEDIA_KIT_ID, ...settings } as MediaKitDoc, {
      upsert: true,
    });
    return settings;
  }

  const { _id, ...raw } = doc;
  const merged = mergeMediaKitSettings(raw);
  const filled = fillEmptyMediaKitFields(merged);
  const needsSave =
    isBlank(merged.introduction) ||
    isBlank(merged.yearsCosplaying) ||
    isBlank(merged.completedCosplays) ||
    isBlank(merged.conventionsAttended) ||
    merged.hero.rotatingCosplayIds.length === 0 ||
    merged.collaborationServices.every((s) => isBlank(s.description)) ||
    usesLegacyCollabCopy(merged.collaborationServices) ||
    usesLegacyIntro(merged.introduction) ||
    heroNeedsDefaultFill(merged.hero);

  if (needsSave) {
    await collection.replaceOne({ _id: MEDIA_KIT_ID }, { _id: MEDIA_KIT_ID, ...filled } as MediaKitDoc, {
      upsert: true,
    });
    return filled;
  }

  return filled;
}

export async function getMediaKitSettings(): Promise<MediaKitSettings> {
  await seedStoreIfNeeded();
  await patchMediaKitCosplayFlags();
  return ensureMediaKitDocument();
}

export async function saveMediaKitSettings(settings: MediaKitSettings): Promise<MediaKitSettings> {
  const collection = await getCollection<MediaKitDoc>(COLLECTIONS.mediaKit);
  await collection.replaceOne(
    { _id: MEDIA_KIT_ID },
    { _id: MEDIA_KIT_ID, ...settings } as MediaKitDoc,
    { upsert: true },
  );
  return settings;
}

export async function updateMediaKitSettings(patch: Partial<MediaKitSettings>): Promise<MediaKitSettings> {
  const current = await getMediaKitSettings();
  return saveMediaKitSettings({ ...current, ...patch });
}
