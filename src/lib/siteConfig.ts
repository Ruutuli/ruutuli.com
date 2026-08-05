import { Cosplay, getCosplayPartsPercent } from "@/types/cosplay";
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

export function getDashboardProjects(cosplays: Cosplay[]): Cosplay[] {
  const spotlight = getSpotlightCosplay(cosplays);
  return cosplays
    .filter(
      (c) =>
        c.id !== spotlight?.id && c.status !== "completed" && c.status !== "retired",
    )
    .slice(0, 3);
}

export function getCosplayProgressPercent(cosplay: Cosplay): number {
  if (cosplay.status === "retired") return 0;

  const fromParts = getCosplayPartsPercent(cosplay);
  if (fromParts !== null) return fromParts;

  if (cosplay.progress?.length) {
    const total = cosplay.progress.reduce((sum, p) => sum + p.percent, 0);
    return Math.round(total / cosplay.progress.length);
  }
  if (cosplay.status === "completed") return 100;
  if (cosplay.status === "planned") return 0;
  return 40;
}
