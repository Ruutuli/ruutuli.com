import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import MediaKitView from "@/components/MediaKitView";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getCosplays } from "@/lib/store/cosplayStore";
import {
  enrichCosplaysWithGalleryDisplayPhotos,
  getGalleryPhotoCreditsForCosplay,
  getPublishedGalleryPhotosForBanner,
} from "@/lib/store/galleryStore";
import { getMediaKitSettings } from "@/lib/store/mediaKitStore";
import { getMediaKitFeaturedCosplays } from "@/lib/mediaKit/utils";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { GalleryPhotoCreditMap } from "@/lib/gallery/photoCredits";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = "Media Kit";
  const description = `Media kit for ${site.displayName} — stats, portfolio, and collaboration info for brands, conventions, and creators.`;

  return {
    title,
    description,
    alternates: { canonical: "/media-kit" },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: "/media-kit",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
    },
  };
}

async function buildPhotoCredits(cosplayIds: string[]): Promise<GalleryPhotoCreditMap> {
  const maps = await Promise.all(cosplayIds.map((id) => getGalleryPhotoCreditsForCosplay(id)));
  return Object.assign({}, ...maps);
}

export default async function MediaKitPage() {
  const mediaKit = await getMediaKitSettings();

  const [cosplays, isAdmin, galleryPhotos] = await Promise.all([
    enrichCosplaysWithGalleryDisplayPhotos(await getCosplays()),
    isAdminAuthenticated(),
    getPublishedGalleryPhotosForBanner(),
  ]);

  const featured = getMediaKitFeaturedCosplays(cosplays);
  const photoCredits = await buildPhotoCredits(featured.map((c) => c.id));

  return (
    <SiteShell>
      <MediaKitView
        mediaKit={mediaKit}
        cosplays={cosplays}
        photoCredits={photoCredits}
        galleryPhotos={galleryPhotos}
        isAdmin={isAdmin}
      />
    </SiteShell>
  );
}
