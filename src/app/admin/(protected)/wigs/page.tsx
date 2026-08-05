import AdminShell from "@/components/admin/AdminShell";
import AdminWigManager from "@/components/admin/AdminWigManager";
import { getWigs } from "@/lib/store/wigStore";

export const dynamic = "force-dynamic";

export default async function AdminWigsPage() {
  const wigs = await getWigs();
  return (
    <AdminShell>
      <AdminWigManager initial={wigs} />
    </AdminShell>
  );
}
