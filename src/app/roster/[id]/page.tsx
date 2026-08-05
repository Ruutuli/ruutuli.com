import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import CosplayBoard from "@/components/CosplayBoard";
import { getCosplayById } from "@/lib/store/cosplayStore";
import {
  enrichCosplaysWithGalleryDisplayPhotos,
  getGalleryDisplayPhotoCandidatesForCosplay,
  getGalleryPhotoCreditsForCosplay,
  getGallerySectionPhotosForCosplay,
} from "@/lib/store/galleryStore";
import { resolveCosplayTodos } from "@/lib/cosplay/todos";
import { getTasks } from "@/lib/store/taskStore";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [cosplay, site] = await Promise.all([getCosplayById(id), getSiteConfig()]);
  if (!cosplay) return { title: `Cosplay | ${site.name}` };
  return {
    title: `${cosplay.character} | ${site.name}`,
    description: cosplay.description || `${cosplay.character} from ${cosplay.series}`,
  };
}

export default async function CosplayBoardPage({ params }: PageProps) {
  const { id } = await params;
  const [cosplay, allTasks, photoCredits, buildPhotoUrls, referencePhotoUrls, conventionPhotoUrls, displayPhotoCandidates, isAdmin] =
    await Promise.all([
    getCosplayById(id),
    getTasks(),
    getGalleryPhotoCreditsForCosplay(id),
    getGallerySectionPhotosForCosplay(id, "build"),
    getGallerySectionPhotosForCosplay(id, "reference"),
    getGallerySectionPhotosForCosplay(id, "convention"),
    getGalleryDisplayPhotoCandidatesForCosplay(id),
    isAdminAuthenticated(),
  ]);

  if (!cosplay) notFound();

  const [enrichedCosplay] = await enrichCosplaysWithGalleryDisplayPhotos([cosplay]);

  const todos = resolveCosplayTodos(enrichedCosplay, allTasks);

  return (
    <SiteShell>
      <div className="closet-page !pt-4">
        <CosplayBoard
          cosplay={enrichedCosplay}
          todos={todos}
          photoCredits={photoCredits}
          buildPhotoUrls={buildPhotoUrls}
          referencePhotoUrls={referencePhotoUrls}
          conventionPhotoUrls={conventionPhotoUrls}
          displayPhotoCandidates={displayPhotoCandidates}
          isAdmin={isAdmin}
        />
      </div>
    </SiteShell>
  );
}
