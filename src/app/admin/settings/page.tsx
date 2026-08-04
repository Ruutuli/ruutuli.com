import AdminShell from "@/components/admin/AdminShell";
import AdminSettingsForm from "@/components/admin/AdminSettingsForm";
import { getSettings } from "@/lib/store/settingsStore";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <AdminShell>
      <AdminSettingsForm initial={settings} />
    </AdminShell>
  );
}
