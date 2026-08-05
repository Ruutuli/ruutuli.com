"use client";

import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import SectionHeading from "@/components/SectionHeading";

const collabTypes = [
  "Convention panels, meetups, and guest appearances",
  "Brand features, unboxings, and product spotlights",
  "Sponsored streams and variety content",
  "Event coverage — cosplay, gaming, and con life",
  "Photoshoots and styled character work",
  "Live2D rigging and VTuber-related projects",
];

function SocialLink({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="closet-btn-outline !px-5 !py-2.5 text-sm"
    >
      {label}
    </a>
  );
}

export default function MediaKitView() {
  const siteConfig = useSiteConfig();

  return (
    <div className="cosplan-shell closet-page">
      <SectionHeading
        eyebrow="for brands & events"
        title="Media Kit"
        description="Stats, links, and the basics if you want to work together. No pitch deck — just the stuff you'd actually need."
      />

      <div className="mx-auto grid max-w-4xl gap-6">
        <section className="closet-panel-outer animate-fade-up">
          <div className="closet-panel-header">
            <h2 className="font-sans text-xl font-bold text-closet-brown">About</h2>
          </div>
          <div className="closet-panel-body space-y-4">
            <p className="text-base font-medium leading-relaxed text-closet-brown">{siteConfig.roles}</p>
            <p className="text-base leading-relaxed text-closet-brown-light">{siteConfig.bio}</p>
            <p className="text-base leading-relaxed text-closet-brown-light">
              Cosplay builds, streams, art, rigging — this site is where I stash the portfolio stuff. Roster,
              WIPs, calendar, all of it.
            </p>
          </div>
        </section>

        <section className="closet-panel-outer animate-fade-up [animation-delay:80ms]">
          <div className="closet-panel-header">
            <h2 className="font-sans text-xl font-bold text-closet-brown">Find me</h2>
          </div>
          <div className="closet-panel-body space-y-4">
            <p className="text-sm text-closet-brown-light">
              Email is best for collab inquiries. DMs work too if that&apos;s easier.
            </p>
            {siteConfig.contactEmail && (
              <a
                href={`mailto:${siteConfig.contactEmail}`}
                className="inline-flex text-base font-semibold text-closet-rose underline decoration-closet-pink/60 underline-offset-4 transition-colors hover:text-closet-mauve"
              >
                {siteConfig.contactEmail}
              </a>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <SocialLink href={siteConfig.socials.instagram} label="Instagram" />
              <SocialLink href={siteConfig.socials.twitch} label="Twitch" />
              <SocialLink href={siteConfig.socials.tiktok} label="TikTok" />
              <SocialLink href={siteConfig.socials.twitter} label="X" />
            </div>
          </div>
        </section>

        <section className="closet-panel-outer animate-fade-up [animation-delay:120ms]">
          <div className="closet-panel-header">
            <h2 className="font-sans text-xl font-bold text-closet-brown">Open to</h2>
          </div>
          <div className="closet-panel-body">
            <ul className="space-y-2.5">
              {collabTypes.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-closet-brown-light">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-closet-rose" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="closet-panel-outer animate-fade-up [animation-delay:160ms]">
          <div className="closet-panel-header">
            <h2 className="font-sans text-xl font-bold text-closet-brown">Portfolio</h2>
          </div>
          <div className="closet-panel-body flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-relaxed text-closet-brown-light">
              Completed builds, in-progress WIPs, and con plans live on the site.
            </p>
            <Link href="/roster" className="closet-btn-peach btn-shimmer shrink-0 !px-6 !py-2.5 text-sm">
              View roster
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
