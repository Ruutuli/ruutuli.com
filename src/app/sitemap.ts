import type { MetadataRoute } from "next";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/roster`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/media-kit`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/calendar`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
  ];

  try {
    const cosplays = await getCosplays();
    const cosplayRoutes: MetadataRoute.Sitemap = cosplays.map((cosplay) => ({
      url: `${base}/roster/${cosplay.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...cosplayRoutes];
  } catch {
    return staticRoutes;
  }
}
