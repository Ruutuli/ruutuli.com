"use client";

import Link from "next/link";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { Cosplay } from "@/types/cosplay";
import { MediaKitSettings } from "@/types/mediaKit";
import { GalleryPhotoCreditMap } from "@/lib/gallery/photoCredits";
import { GalleryBannerPhoto } from "@/types/gallery";
import {
  getCollaborationContactHref,
  getMediaKitFeaturedCosplays,
  getMediaKitStats,
  getVisibleCollaborationServices,
  getVisiblePastCollaborations,
  getVisiblePressFeatures,
  hasPdfDownload,
} from "@/lib/mediaKit/utils";
import MediaKitHeroCollage from "@/components/media-kit/MediaKitHeroCollage";
import MediaKitFeaturedWork from "@/components/media-kit/MediaKitFeaturedWork";
import MediaKitCollaboration from "@/components/media-kit/MediaKitCollaboration";
import MediaKitPlatforms from "@/components/media-kit/MediaKitPlatforms";
import MediaKitPhotoBanner from "@/components/media-kit/MediaKitPhotoBanner";
import { ProxiedNextImage } from "@/components/GoogleDriveImage";

function StatIcon({ icon }: { icon: string }) {
  const cls = "h-5 w-5 text-closet-rose";
  switch (icon) {
    case "star":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case "dress":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a3 3 0 00-3 3v2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2h-2V5a3 3 0 00-3-3z" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
  }
}

function SocialIconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  if (!href?.trim()) return null;
  return (
    <a
      href={href}
      target={href.startsWith("mailto:") ? undefined : "_blank"}
      rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
      aria-label={label}
      className="cosplan-focus-ring flex h-11 w-11 items-center justify-center rounded-full border border-closet-pink/50 bg-white text-closet-rose shadow-sm transition-all hover:-translate-y-0.5 hover:border-closet-rose/40 hover:shadow-closet"
    >
      {children}
    </a>
  );
}

function DownloadButton({
  mediaKit,
  isAdmin,
  className,
}: {
  mediaKit: MediaKitSettings;
  isAdmin: boolean;
  className?: string;
}) {
  const hasPdf = hasPdfDownload(mediaKit);
  if (!hasPdf && !isAdmin) return null;

  if (!hasPdf && isAdmin) {
    return (
      <span
        className={`${className ?? ""} cursor-not-allowed opacity-50`}
        title="Upload a PDF in Admin → Media Kit"
        aria-disabled="true"
      >
        Download Media Kit
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </span>
    );
  }

  const filename = mediaKit.pdfFileName?.trim() || "media-kit.pdf";
  return (
    <a
      href={mediaKit.pdfUrl}
      download={filename}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      Download Media Kit
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  );
}

export default function MediaKitView({
  mediaKit,
  cosplays,
  photoCredits,
  galleryPhotos,
  isAdmin,
}: {
  mediaKit: MediaKitSettings;
  cosplays: Cosplay[];
  photoCredits: GalleryPhotoCreditMap;
  galleryPhotos: GalleryBannerPhoto[];
  isAdmin: boolean;
}) {
  const siteConfig = useSiteConfig();
  const stats = getMediaKitStats(mediaKit);
  const featured = getMediaKitFeaturedCosplays(cosplays);
  const pastCollabs = getVisiblePastCollaborations(mediaKit);
  const pressFeatures = getVisiblePressFeatures(mediaKit);
  const contact = getCollaborationContactHref(mediaKit, siteConfig.contactEmail);

  const heading =
    mediaKit.heading?.trim() || `Hi, I'm ${siteConfig.displayName}!`;
  const intro = mediaKit.introduction?.trim() || siteConfig.bio;

  const businessEmail = mediaKit.businessEmail?.trim() || siteConfig.contactEmail?.trim();
  const emailHref = businessEmail ? `mailto:${businessEmail}` : "/contact";

  return (
    <div className="cosplan-shell closet-page mediakit-page relative">
      <div className="mediakit-deco mediakit-deco-tl" aria-hidden />
      <div className="mediakit-deco mediakit-deco-br" aria-hidden />

      {/* Hero */}
      <section aria-labelledby="mediakit-hero-heading" className="animate-fade-up">
        <div className="closet-panel-outer overflow-visible">
          <div className="closet-panel-body grid items-center gap-8 p-5 sm:p-7 lg:grid-cols-2 lg:gap-10 lg:p-8">
            <div className="order-1 lg:order-none">
              {mediaKit.eyebrow?.trim() && (
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-closet-rose sm:text-xs">
                  {mediaKit.eyebrow}
                </p>
              )}
              <h1
                id="mediakit-hero-heading"
                className="mt-2 font-display text-4xl font-bold leading-[1.08] tracking-tight text-closet-brown sm:text-5xl"
              >
                {heading}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-closet-brown-light sm:text-lg">{intro}</p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <SocialIconLink href={siteConfig.socials.instagram} label="Instagram">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={siteConfig.socials.tiktok} label="TikTok">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={mediaKit.youtubeUrl || ""} label="YouTube">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </SocialIconLink>
                <SocialIconLink href={emailHref} label="Email">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </SocialIconLink>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={contact.href} className="closet-btn-peach btn-shimmer cosplan-focus-ring w-full justify-center sm:w-auto">
                  Work With Me
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Link>
                <DownloadButton
                  mediaKit={mediaKit}
                  isAdmin={isAdmin}
                  className="closet-btn-outline cosplan-focus-ring w-full justify-center sm:w-auto"
                />
              </div>
            </div>

            <div className="order-2 lg:order-none">
              <MediaKitHeroCollage />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section aria-label="Creator statistics" className="animate-fade-up [animation-delay:60ms]">
          <div className="closet-panel-outer">
            <div className="grid grid-cols-2 divide-closet-pink/40 sm:grid-cols-4 sm:divide-x lg:divide-x">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`flex flex-col items-center gap-2 px-4 py-6 text-center sm:px-6 ${
                    index % 2 === 0 ? "border-r border-closet-pink/30 sm:border-r-0" : ""
                  } ${index < 2 ? "border-b border-closet-pink/30 sm:border-b-0" : ""}`}
                >
                  <StatIcon icon={stat.icon} />
                  <p className="font-sans text-xl font-bold text-closet-brown sm:text-2xl">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-closet-brown-light">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <MediaKitPhotoBanner photos={galleryPhotos} />

      {/* Featured + Collaboration */}
      {(featured.length > 0 || getVisibleCollaborationServices(mediaKit).length > 0) && (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-6 animate-fade-up [animation-delay:100ms]">
          {featured.length > 0 && (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col self-stretch">
              <MediaKitFeaturedWork cosplays={featured} photoCredits={photoCredits} />
            </div>
          )}
          <MediaKitCollaboration mediaKit={mediaKit} contactEmail={siteConfig.contactEmail} />
        </div>
      )}

      <MediaKitPlatforms mediaKit={mediaKit} siteSocials={siteConfig.socials} />

      {/* Past Collaborations */}
      {pastCollabs.length > 0 && (
        <section aria-labelledby="mediakit-past-heading" className="animate-fade-up">
          <h2 id="mediakit-past-heading" className="closet-section-title mb-6">
            Past Collaborations
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-8 rounded-3xl border border-closet-pink/50 bg-white px-6 py-8 shadow-closet">
            {pastCollabs.map((collab) => {
              const content = (
                <>
                  {collab.logo?.trim() ? (
                    <div className="relative h-12 w-28">
                      <ProxiedNextImage
                        src={collab.logo}
                        alt=""
                        fill
                        className="object-contain"
                        sizes="112px"
                        fallbackSrc=""
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-closet-brown">{collab.name}</span>
                  )}
                  <span className="sr-only">{collab.name}</span>
                </>
              );

              if (collab.url?.trim()) {
                return (
                  <a
                    key={collab.name}
                    href={collab.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cosplan-focus-ring flex flex-col items-center gap-1 opacity-80 transition-opacity hover:opacity-100"
                    title={[collab.name, collab.type, collab.year].filter(Boolean).join(" · ")}
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={collab.name}
                  className="flex flex-col items-center gap-1 opacity-80"
                  title={[collab.name, collab.type, collab.year].filter(Boolean).join(" · ")}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Press & Features */}
      {pressFeatures.length > 0 && (
        <section aria-labelledby="mediakit-press-heading" className="animate-fade-up">
          <h2 id="mediakit-press-heading" className="closet-section-title mb-6">
            Press &amp; Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {pressFeatures.map((item) => (
              <article
                key={`${item.publication}-${item.title}`}
                className="flex gap-4 rounded-2xl border border-closet-pink/50 bg-white p-4 shadow-closet"
              >
                {item.thumbnail?.trim() && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-closet-blush/30">
                    <ProxiedNextImage
                      src={item.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      fallbackSrc=""
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-closet-rose">{item.publication}</p>
                  {item.url?.trim() ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cosplan-focus-ring mt-0.5 block text-sm font-bold text-closet-brown hover:text-closet-rose"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-sm font-bold text-closet-brown">{item.title}</p>
                  )}
                  {item.date?.trim() && (
                    <p className="mt-1 text-xs text-closet-brown-light">{item.date.trim()}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section aria-labelledby="mediakit-cta-heading" className="animate-fade-up">
        <div className="closet-panel-outer text-center">
          <div className="closet-panel-body space-y-5 py-10 sm:py-12">
            <h2 id="mediakit-cta-heading" className="font-display text-3xl font-bold text-closet-brown sm:text-4xl">
              Interested in working together?
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-closet-brown-light sm:text-lg">
              Let&apos;s create something memorable, whether it&apos;s a convention appearance, product feature,
              sponsored post, or creative photoshoot.
            </p>
            {(businessEmail || (mediaKit.showLocationPublicly && mediaKit.location?.trim())) && (
              <p className="text-sm text-closet-brown-light">
                {businessEmail && (
                  <a href={`mailto:${businessEmail}`} className="font-semibold text-closet-rose hover:underline">
                    {businessEmail}
                  </a>
                )}
                {businessEmail && mediaKit.showLocationPublicly && mediaKit.location?.trim() && " · "}
                {mediaKit.showLocationPublicly && mediaKit.location?.trim() && mediaKit.location.trim()}
              </p>
            )}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={contact.href} className="closet-btn-peach btn-shimmer cosplan-focus-ring w-full sm:w-auto">
                Contact Ruu
              </Link>
              <DownloadButton
                mediaKit={mediaKit}
                isAdmin={isAdmin}
                className="closet-btn-outline cosplan-focus-ring w-full sm:w-auto"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
