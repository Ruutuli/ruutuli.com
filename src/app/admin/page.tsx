import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminShell from "@/components/admin/AdminShell";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getTasks } from "@/lib/store/taskStore";
import { getWigs } from "@/lib/store/wigStore";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const [cosplays, wigs, tasks] = await Promise.all([getCosplays(), getWigs(), getTasks()]);

  return (
    <AdminShell>
      <AdminDashboard cosplays={cosplays} wigs={wigs} tasks={tasks} />
    </AdminShell>
  );
}
