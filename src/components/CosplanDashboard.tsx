import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { BuildTask } from "@/types/task";
import { GalleryBannerPhoto } from "@/types/gallery";
import DashboardWelcome from "@/components/DashboardWelcome";
import FeaturedProject from "@/components/FeaturedProject";
import MediaKitPhotoBanner from "@/components/media-kit/MediaKitPhotoBanner";
import ProjectGrid from "@/components/ProjectGrid";

interface CosplanDashboardProps {
  cosplays: Cosplay[];
  tasks: BuildTask[];
  events: ConEvent[];
  galleryPhotos: GalleryBannerPhoto[];
}

export default function CosplanDashboard({ cosplays, tasks, events, galleryPhotos }: CosplanDashboardProps) {
  return (
    <div className="cosplan-shell">
      <div className="space-y-6 pb-10 pt-4 sm:space-y-8 sm:pb-12 lg:pt-5">
        <DashboardWelcome cosplays={cosplays} tasks={tasks} />
        <MediaKitPhotoBanner photos={galleryPhotos} />
        <FeaturedProject cosplays={cosplays} events={events} />
        <ProjectGrid cosplays={cosplays} />
      </div>
    </div>
  );
}
