import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import TodosView from "@/components/TodosView";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getTasks } from "@/lib/store/taskStore";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `To-Do List | ${site.name}`,
    description: "All build to-dos across active cosplays — open tasks, buys, and checks.",
  };
}

export default async function TodosPage() {
  const [cosplays, legacyTasks] = await Promise.all([getCosplays(), getTasks()]);

  return (
    <SiteShell>
      <div className="closet-page">
        <TodosView cosplays={cosplays} legacyTasks={legacyTasks} />
      </div>
    </SiteShell>
  );
}
