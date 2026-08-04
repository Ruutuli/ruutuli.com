import SiteShell from "@/components/SiteShell";
import CosplanDashboard from "@/components/CosplanDashboard";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";
import { getTasks } from "@/lib/store/taskStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [cosplays, tasks, events] = await Promise.all([getCosplays(), getTasks(), getEvents()]);

  return (
    <SiteShell>
      <CosplanDashboard cosplays={cosplays} tasks={tasks} events={events} />
    </SiteShell>
  );
}
