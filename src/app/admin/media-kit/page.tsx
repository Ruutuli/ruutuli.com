import AdminMediaKitForm from "@/components/admin/AdminMediaKitForm";
import AdminShell from "@/components/admin/AdminShell";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getMediaKitSettings } from "@/lib/store/mediaKitStore";

export const dynamic = "force-dynamic";

export default async function AdminMediaKitPage() {
  const [mediaKit, cosplays] = await Promise.all([getMediaKitSettings(), getCosplays()]);

  return (
    <AdminShell>
      <AdminMediaKitForm initial={mediaKit} cosplays={cosplays} />
    </AdminShell>
  );
}
