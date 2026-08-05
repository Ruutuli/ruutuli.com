import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import AboutView from "@/components/AboutView";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `About | ${site.name}`,
    description: "About Ruu — casual cosplayer, facts, bio, and frequently asked questions.",
  };
}

export default function AboutPage() {
  return (
    <SiteShell>
      <div className="cosplan-shell closet-page">
        <AboutView />
      </div>
    </SiteShell>
  );
}
