import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import CosplanDashboard from "@/components/CosplanDashboard";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";
import { enrichCosplaysWithGalleryDisplayPhotos, getPublishedGalleryPhotosForBanner } from "@/lib/store/galleryStore";
import { getTasks } from "@/lib/store/taskStore";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { siteAssets } from "@/data/siteDefaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = `${site.name} — cosplay builds & conventions`;
  const description =
    site.bio ||
    "Casual cosplayer sharing costume builds, convention plans, and gallery photos.";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      images: [{ url: siteAssets.seoPreview, alt: `${site.displayName} cosplay` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [siteAssets.seoPreview],
    },
  };
}

export default async function Home() {
  const [cosplays, tasks, events, galleryPhotos] = await Promise.all([
    enrichCosplaysWithGalleryDisplayPhotos(await getCosplays()),
    getTasks(),
    getEvents(),
    getPublishedGalleryPhotosForBanner(),
  ]);

  return (
    <SiteShell>
      <CosplanDashboard cosplays={cosplays} tasks={tasks} events={events} galleryPhotos={galleryPhotos} />
    </SiteShell>
  );
}
