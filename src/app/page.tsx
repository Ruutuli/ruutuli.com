import SiteShell from "@/components/SiteShell";
import CosplanDashboard from "@/components/CosplanDashboard";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";
import { enrichCosplaysWithGalleryDisplayPhotos, getPublishedGalleryPhotosForBanner } from "@/lib/store/galleryStore";
import { getTasks } from "@/lib/store/taskStore";

export const dynamic = "force-dynamic";

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
