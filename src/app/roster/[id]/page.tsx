import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import CosplayBoard from "@/components/CosplayBoard";
import { getCosplayById } from "@/lib/store/cosplayStore";
import { getGalleryPhotoCreditsForCosplay, getGallerySectionPhotosForCosplay } from "@/lib/store/galleryStore";
import { getTasks } from "@/lib/store/taskStore";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { getTasksForCosplay } from "@/data/tasks";

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
  const [cosplay, allTasks, photoCredits, buildPhotoUrls, conventionPhotoUrls] = await Promise.all([
    getCosplayById(id),
    getTasks(),
    getGalleryPhotoCreditsForCosplay(id),
    getGallerySectionPhotosForCosplay(id, "build"),
    getGallerySectionPhotosForCosplay(id, "convention"),
  ]);

  if (!cosplay) notFound();

  const tasks = getTasksForCosplay(allTasks, cosplay.id, cosplay.character);

  return (
    <SiteShell>
      <div className="closet-page !pt-4">
        <CosplayBoard
          cosplay={cosplay}
          tasks={tasks}
          photoCredits={photoCredits}
          buildPhotoUrls={buildPhotoUrls}
          conventionPhotoUrls={conventionPhotoUrls}
        />
      </div>
    </SiteShell>
  );
}
