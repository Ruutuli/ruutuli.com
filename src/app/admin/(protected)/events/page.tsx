import AdminEventsManager from "@/components/admin/AdminEventsManager";
import AdminShell from "@/components/admin/AdminShell";
import { getEvents } from "@/lib/store/eventStore";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await getEvents();

  return (
    <AdminShell>
      <AdminEventsManager initialEvents={events} />
    </AdminShell>
  );
}
