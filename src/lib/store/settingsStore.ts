import "server-only";

import { SiteSettings } from "@/types/settings";
import { defaultSiteSettings } from "@/data/siteDefaults";
import { COLLECTIONS, getCollection } from "@/lib/mongodb/db";
import { seedStoreIfNeeded } from "./seed";

const SETTINGS_ID = "site";

type SettingsDoc = SiteSettings & { _id: string };

function fromDoc(doc: SettingsDoc): SiteSettings {
  const { _id, ...rest } = doc;
  return rest;
}

export async function getSettings(): Promise<SiteSettings> {
  await seedStoreIfNeeded();
  const collection = await getCollection<SettingsDoc>(COLLECTIONS.settings);
  const doc = await collection.findOne({ _id: SETTINGS_ID });
  return doc ? fromDoc(doc) : defaultSiteSettings;
}

export async function saveSettings(settings: SiteSettings): Promise<SiteSettings> {
  const collection = await getCollection(COLLECTIONS.settings);
  await collection.replaceOne({ _id: SETTINGS_ID }, { _id: SETTINGS_ID, ...settings }, { upsert: true });
  return settings;
}

export async function updateSettings(patch: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSettings();
  const updated = { ...current, ...patch };
  if (patch.socials) {
    updated.socials = { ...current.socials, ...patch.socials };
  }
  return saveSettings(updated);
}
