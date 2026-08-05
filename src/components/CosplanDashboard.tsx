import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { BuildTask } from "@/types/task";
import DashboardWelcome from "@/components/DashboardWelcome";
import FeaturedProject from "@/components/FeaturedProject";
import ProjectGrid from "@/components/ProjectGrid";

interface CosplanDashboardProps {
  cosplays: Cosplay[];
  tasks: BuildTask[];
  events: ConEvent[];
}

export default function CosplanDashboard({ cosplays, tasks, events }: CosplanDashboardProps) {
  return (
    <div className="cosplan-shell">
      <div className="space-y-6 pb-10 pt-4 sm:space-y-8 sm:pb-12 lg:pt-5">
        <DashboardWelcome cosplays={cosplays} tasks={tasks} />
        <FeaturedProject cosplays={cosplays} tasks={tasks} events={events} />
        <ProjectGrid cosplays={cosplays} />
      </div>
    </div>
  );
}
