import { Cosplay, CosplayTodo, getCosplayOverallProgress } from "@/types/cosplay";
import { defaultSiteSettings, siteAssets } from "@/data/siteDefaults";
import { SiteSettings } from "@/types/settings";

export type SiteConfig = SiteSettings & {
  assets: typeof siteAssets;
};

export function mergeSiteConfig(settings: SiteSettings): SiteConfig {
  return {
    ...defaultSiteSettings,
    ...settings,
    socials: { ...defaultSiteSettings.socials, ...settings.socials },
    assets: siteAssets,
  };
}

export const siteConfig = mergeSiteConfig(defaultSiteSettings);

export function getSpotlightCosplay(cosplays: Cosplay[]): Cosplay | undefined {
  return cosplays.find((c) => c.spotlight) ?? cosplays.find((c) => c.status === "in-progress");
}

export function getActiveBuilds(cosplays: Cosplay[]): Cosplay[] {
  return cosplays.filter((c) => c.status === "in-progress");
}

export function getDashboardProjects(cosplays: Cosplay[], limit = 3): Cosplay[] {
  const spotlight = getSpotlightCosplay(cosplays);
  const pool = cosplays.filter((c) => c.id !== spotlight?.id);
  if (pool.length <= limit) return pool;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
}

export function getCosplayProgressPercent(cosplay: Cosplay, todos?: CosplayTodo[]): number {
  if (cosplay.status === "retired") return 0;

  const overall = getCosplayOverallProgress(cosplay, todos);
  if (overall !== null) return overall;

  if (cosplay.progress?.length) {
    const total = cosplay.progress.reduce((sum, p) => sum + p.percent, 0);
    return Math.round(total / cosplay.progress.length);
  }
  if (cosplay.status === "completed") return 100;
  if (cosplay.status === "planned") return 0;
  return 40;
}
