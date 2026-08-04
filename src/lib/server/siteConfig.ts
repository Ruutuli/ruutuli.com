import "server-only";

import { mergeSiteConfig, SiteConfig } from "@/lib/siteConfig";
import { getSettings } from "@/lib/store/settingsStore";

export async function getSiteConfig(): Promise<SiteConfig> {
  const settings = await getSettings();
  return mergeSiteConfig(settings);
}
