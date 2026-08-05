import AdminShell from "@/components/admin/AdminShell";
import AdminCosplayEditForm from "@/components/admin/AdminCosplayEditForm";

export const dynamic = "force-dynamic";

export default function AdminCosplayNewPage() {
  return (
    <AdminShell>
      <AdminCosplayEditForm isNew />
    </AdminShell>
  );
}
