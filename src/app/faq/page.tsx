import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import SectionHeading from "@/components/SectionHeading";
import FaqView from "@/components/FaqView";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `FAQ | ${site.name}`,
    description: "Frequently asked questions about Ruutuli, cosplay, and this site.",
  };
}

export default function FaqPage() {
  return (
    <SiteShell>
      <div className="cosplan-shell closet-page">
        <SectionHeading
          eyebrow="questions"
          title="FAQ"
          description="Things people actually ask. Answers are honest."
        />
        <FaqView />
      </div>
    </SiteShell>
  );
}
