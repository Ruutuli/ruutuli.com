import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import MediaKitView from "@/components/MediaKitView";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { getCosplays } from "@/lib/store/cosplayStore";
import {
  getGalleryCoverPhotoForCosplay,
  getGalleryPhotoCreditsForCosplay,
  getPublishedGalleryPhotosForBanner,
} from "@/lib/store/galleryStore";
import { getMediaKitSettings } from "@/lib/store/mediaKitStore";
import { getMediaKitFeaturedCosplays } from "@/lib/mediaKit/utils";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { GalleryPhotoCreditMap } from "@/lib/gallery/photoCredits";
import { Cosplay } from "@/types/cosplay";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `Media Kit | ${site.name}`,
    description: "Stats, portfolio, and collaboration info for brands, conventions, and creators.",
  };
}

async function buildPhotoCredits(cosplayIds: string[]): Promise<GalleryPhotoCreditMap> {
  const maps = await Promise.all(cosplayIds.map((id) => getGalleryPhotoCreditsForCosplay(id)));
  return Object.assign({}, ...maps);
}

async function enrichCosplaysWithGalleryPhotos(cosplays: Cosplay[]): Promise<Cosplay[]> {
  return Promise.all(
    cosplays.map(async (cosplay) => {
      if (!isCosplayPlaceholderImage(cosplay.image)) return cosplay;
      const cover = await getGalleryCoverPhotoForCosplay(cosplay.id);
      if (!cover) return cosplay;
      return { ...cosplay, image: cover };
    }),
  );
}

export default async function MediaKitPage() {
  const mediaKit = await getMediaKitSettings();

  const [cosplays, isAdmin, galleryPhotos] = await Promise.all([
    getCosplays(),
    isAdminAuthenticated(),
    getPublishedGalleryPhotosForBanner(),
  ]);

  const enrichedCosplays = await enrichCosplaysWithGalleryPhotos(cosplays);
  const featured = getMediaKitFeaturedCosplays(enrichedCosplays);
  const photoCredits = await buildPhotoCredits(featured.map((c) => c.id));

  return (
    <SiteShell>
      <MediaKitView
        mediaKit={mediaKit}
        cosplays={enrichedCosplays}
        photoCredits={photoCredits}
        galleryPhotos={galleryPhotos}
        isAdmin={isAdmin}
      />
    </SiteShell>
  );
}
