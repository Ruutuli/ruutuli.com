import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import RosterView from "@/components/RosterView";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `Character Roster | ${site.name}`,
    description: "Characters I've cosplayed, by status.",
  };
}

export default async function RosterPage() {
  const cosplays = await getCosplays();

  return (
    <SiteShell>
      <div className="closet-page">
        <RosterView cosplays={cosplays} />
      </div>
    </SiteShell>
  );
}
