import type { Metadata } from "next";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import SectionHeading from "@/components/SectionHeading";
import { getMediaKitSettings } from "@/lib/store/mediaKitStore";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = "Contact";
  const description = `Get in touch with ${site.displayName} for collaborations, conventions, and inquiries.`;

  return {
    title,
    description,
    alternates: { canonical: "/contact" },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: "/contact",
    },
    twitter: {
      card: "summary",
      title: `${title} | ${site.name}`,
      description,
    },
  };
}

export default async function ContactPage() {
  const [site, mediaKit] = await Promise.all([getSiteConfig(), getMediaKitSettings()]);
  const email = mediaKit.businessEmail?.trim() || site.contactEmail?.trim();

  return (
    <SiteShell>
      <div className="cosplan-shell closet-page">
        <SectionHeading
          eyebrow="say hello"
          title="Contact"
          description="Questions, collabs, convention invites — I'd love to hear from you."
        />
        <div className="mx-auto max-w-xl animate-fade-up">
          <section className="closet-panel-outer">
            <div className="closet-panel-body space-y-6 text-center">
              {email ? (
                <>
                  <p className="text-base leading-relaxed text-closet-brown-light">
                    Email is the best way to reach me for work inquiries.
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="cosplan-focus-ring inline-flex min-h-[44px] max-w-full break-all items-center gap-2 text-base font-semibold text-closet-rose underline decoration-closet-pink/60 underline-offset-4 transition-colors hover:text-closet-mauve sm:text-lg"
                  >
                    {email}
                  </a>
                </>
              ) : (
                <p className="text-base leading-relaxed text-closet-brown-light">
                  Contact details are being set up. Check back soon!
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {site.socials.instagram && (
                  <a href={site.socials.instagram} target="_blank" rel="noopener noreferrer" className="closet-btn-outline !px-5 !py-2.5 text-sm">
                    Instagram
                  </a>
                )}
                {site.socials.tiktok && (
                  <a href={site.socials.tiktok} target="_blank" rel="noopener noreferrer" className="closet-btn-outline !px-5 !py-2.5 text-sm">
                    TikTok
                  </a>
                )}
              </div>
              <Link href="/media-kit" className="closet-btn-peach btn-shimmer inline-flex !px-6 !py-2.5 text-sm">
                View Media Kit
              </Link>
            </div>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
