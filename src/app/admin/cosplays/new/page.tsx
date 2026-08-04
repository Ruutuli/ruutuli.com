import AdminShell from "@/components/admin/AdminShell";
import AdminCosplayEditForm from "@/components/admin/AdminCosplayEditForm";

export default function AdminCosplayNewPage() {
  return (
    <AdminShell>
      <AdminCosplayEditForm isNew />
    </AdminShell>
  );
}
