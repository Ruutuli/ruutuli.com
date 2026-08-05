import AdminBuildTaskManager from "@/components/admin/AdminBuildTaskManager";
import AdminShell from "@/components/admin/AdminShell";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getEvents } from "@/lib/store/eventStore";
import { getTasks } from "@/lib/store/taskStore";

export const dynamic = "force-dynamic";

export default async function AdminTasksPage() {
  const [tasks, events, cosplays] = await Promise.all([getTasks(), getEvents(), getCosplays()]);

  return (
    <AdminShell>
      <AdminBuildTaskManager initialTasks={tasks} initialEvents={events} cosplays={cosplays} />
    </AdminShell>
  );
}
