import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import SectionHeading from "@/components/SectionHeading";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  return {
    title: `About | ${site.name}`,
    description: site.bio,
  };
}

export default async function AboutPage() {
  const site = await getSiteConfig();

  return (
    <SiteShell>
      <div className="cosplan-shell closet-page">
        <SectionHeading eyebrow="about me" title={`About ${site.displayName}`} description={site.tagline} />
        <div className="mx-auto max-w-3xl">
          <section className="closet-panel-outer animate-fade-up">
            <div className="closet-panel-body space-y-4">
              <p className="text-base font-medium leading-relaxed text-closet-brown">{site.roles}</p>
              <p className="text-base leading-relaxed text-closet-brown-light">{site.bio}</p>
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
