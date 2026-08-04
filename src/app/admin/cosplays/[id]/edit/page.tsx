import { notFound } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import AdminCosplayEditForm from "@/components/admin/AdminCosplayEditForm";
import { getCosplayById } from "@/lib/store/cosplayStore";

export default async function AdminCosplayEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cosplay = await getCosplayById(id);
  if (!cosplay) notFound();

  return (
    <AdminShell>
      <AdminCosplayEditForm initial={cosplay} />
    </AdminShell>
  );
}
