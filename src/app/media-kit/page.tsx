import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import MediaKitView from "@/components/MediaKitView";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `Media Kit | ${site.name}`,
    description: "Links, collab info, and portfolio highlights for brands and events.",
  };
}

export default function MediaKitPage() {
  return (
    <SiteShell>
      <MediaKitView />
    </SiteShell>
  );
}
