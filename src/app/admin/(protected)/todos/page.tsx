import AdminTodosManager from "@/components/admin/AdminTodosManager";
import AdminShell from "@/components/admin/AdminShell";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getTasks } from "@/lib/store/taskStore";

export const dynamic = "force-dynamic";

export default async function AdminTodosPage() {
  const [cosplays, legacyTasks] = await Promise.all([getCosplays(), getTasks()]);

  return (
    <AdminShell>
      <AdminTodosManager initialCosplays={cosplays} legacyTasks={legacyTasks} />
    </AdminShell>
  );
}
