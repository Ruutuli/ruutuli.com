import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import AboutView from "@/components/AboutView";
import { faqItems } from "@/data/faq";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { absoluteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = "About";
  const description = `About ${site.displayName} — casual cosplayer, bio, resources, and frequently asked questions.`;

  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: "/about",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
    },
  };
}

export default function AboutPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
    url: absoluteUrl("/about#faq"),
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="cosplan-shell closet-page">
        <AboutView />
      </div>
    </SiteShell>
  );
}
