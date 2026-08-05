import AdminGalleryManager from "@/components/admin/AdminGalleryManager";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminGalleryPage() {
  return (
    <AdminShell>
      <AdminGalleryManager />
    </AdminShell>
  );
}
