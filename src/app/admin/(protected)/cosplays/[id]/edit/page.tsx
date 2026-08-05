import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminCosplayEditForm from "@/components/admin/AdminCosplayEditForm";
import { resolveCosplayTodos } from "@/lib/cosplay/todos";
import { getCosplayById } from "@/lib/store/cosplayStore";
import { getTasks } from "@/lib/store/taskStore";

export const dynamic = "force-dynamic";

export default async function AdminCosplayEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [cosplay, allTasks] = await Promise.all([getCosplayById(id), getTasks()]);
  if (!cosplay) notFound();

  const todos = resolveCosplayTodos(cosplay, allTasks);

  return (
    <AdminShell>
      <AdminCosplayEditForm initial={{ ...cosplay, todos }} />
    </AdminShell>
  );
}
