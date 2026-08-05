import { MediaKitPlatform, MediaKitSettings } from "@/types/mediaKit";
import {
  getVisiblePlatforms,
  hasAudienceDetails,
  mergePlatformUrls,
  platformHasMetrics,
} from "@/lib/mediaKit/utils";

function PlatformIcon({ id }: { id: MediaKitPlatform["id"] }) {
  const cls = "h-6 w-6";
  switch (id) {
    case "instagram":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "twitch":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      );
    case "bluesky":
      return (
        <svg className={cls} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.913 0 3.108 0 3.805c0 .107.833 8.947 1.375 10.872.714 2.512 3.256 3.355 5.505 3.084 1.084-.133 2.303-.407 3.768-.784.72-.184 1.368-.349 1.953-.483.585.134 1.233.299 1.953.483 1.465.377 2.684.651 3.768.784 2.249.271 4.791-.572 5.505-3.084C23.167 12.752 24 3.912 24 3.805c0-.697-.139-1.892-.902-2.24-.659-.299-1.664-.621-4.3 1.24C16.046 4.747 13.087 8.686 12 10.8z" />
        </svg>
      );
  }
}

const PLATFORM_NAMES: Record<MediaKitPlatform["id"], string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  bluesky: "Bluesky",
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sans text-xl font-bold text-closet-brown">{value}</p>
      <p className="text-xs font-medium text-closet-brown-light">{label}</p>
    </div>
  );
}

function PlatformCard({ platform }: { platform: MediaKitPlatform }) {
  const metrics = [
    platform.followers?.trim() ? { label: "Followers", value: platform.followers.trim() } : null,
    platform.subscribers?.trim() ? { label: "Subscribers", value: platform.subscribers.trim() } : null,
    platform.engagementRate?.trim() ? { label: "Engagement", value: platform.engagementRate.trim() } : null,
    platform.averageViews?.trim() ? { label: "Avg. views", value: platform.averageViews.trim() } : null,
    platform.monthlyReach?.trim() ? { label: "Monthly reach", value: platform.monthlyReach.trim() } : null,
  ].filter((m): m is { label: string; value: string } => m !== null);

  const inner = (
    <>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-closet-blush text-closet-rose">
          <PlatformIcon id={platform.id} />
        </span>
        <div>
          <p className="text-sm font-bold text-closet-brown">{PLATFORM_NAMES[platform.id]}</p>
          {platform.handle?.trim() && (
            <p className="text-sm text-closet-rose">{platform.handle.trim()}</p>
          )}
        </div>
      </div>
      {metrics.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-closet-pink/35 pt-4">
          {metrics.map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
      )}
    </>
  );

  if (platform.url?.trim()) {
    return (
      <a
        href={platform.url.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="cosplan-focus-ring mediakit-platform-card block rounded-3xl border border-closet-pink/50 bg-white p-5 shadow-closet transition-all hover:-translate-y-0.5 hover:shadow-closet-lg"
      >
        {inner}
      </a>
    );
  }

  return (
    <article className="mediakit-platform-card rounded-3xl border border-closet-pink/50 bg-white p-5 shadow-closet">
      {inner}
    </article>
  );
}

export default function MediaKitPlatforms({
  mediaKit,
  siteSocials,
}: {
  mediaKit: MediaKitSettings;
  siteSocials: { instagram: string; tiktok: string; twitch: string; twitter: string };
}) {
  const platforms = getVisiblePlatforms(mergePlatformUrls(mediaKit.platforms, siteSocials, mediaKit));
  const showAudience = hasAudienceDetails(mediaKit.audienceDetails);
  const hasAnyMetrics = platforms.some(platformHasMetrics);

  if (platforms.length === 0 && !showAudience) return null;

  const { audienceDetails } = mediaKit;

  return (
    <section aria-labelledby="mediakit-platforms-heading" className="animate-fade-up">
      <h2 id="mediakit-platforms-heading" className="closet-section-title mb-2">
        Platforms &amp; Audience
      </h2>
      {mediaKit.metricsLastUpdated?.trim() && hasAnyMetrics && (
        <p className="mb-6 text-center text-sm text-closet-brown-light">
          Last updated {mediaKit.metricsLastUpdated.trim()}
        </p>
      )}

      {platforms.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>
      )}

      {showAudience && (
        <div className="mt-8 closet-panel-outer">
          <div className="closet-panel-header">
            <h3 className="font-sans text-lg font-bold text-closet-brown">Audience details</h3>
          </div>
          <div className="closet-panel-body grid gap-6 sm:grid-cols-2">
            {audienceDetails.primaryAgeRange?.trim() && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-closet-rose">Primary age range</p>
                <p className="mt-1 text-sm text-closet-brown">{audienceDetails.primaryAgeRange.trim()}</p>
              </div>
            )}
            {audienceDetails.averageContentReach?.trim() && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-closet-rose">Average reach</p>
                <p className="mt-1 text-sm text-closet-brown">{audienceDetails.averageContentReach.trim()}</p>
              </div>
            )}
            {audienceDetails.topCountries?.some((c) => c.trim()) && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-closet-rose">Top countries</p>
                <p className="mt-1 text-sm text-closet-brown">
                  {audienceDetails.topCountries.filter((c) => c.trim()).join(" · ")}
                </p>
              </div>
            )}
            {audienceDetails.interests?.some((i) => i.trim()) && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-closet-rose">Interests</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {audienceDetails.interests.filter((i) => i.trim()).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-full border border-closet-pink/50 bg-closet-blush/40 px-3 py-1 text-xs font-semibold text-closet-brown"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {audienceDetails.genderDistribution?.some((g) => g.label.trim() && g.percent > 0) && (
              <div className="sm:col-span-2">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-closet-rose">Gender distribution</p>
                <div className="space-y-2">
                  {audienceDetails.genderDistribution
                    .filter((g) => g.label.trim() && g.percent > 0)
                    .map((g) => (
                      <div key={g.label}>
                        <div className="mb-1 flex justify-between text-xs font-medium text-closet-brown">
                          <span>{g.label}</span>
                          <span>{g.percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-closet-blush">
                          <div
                            className="h-full rounded-full bg-closet-rose"
                            style={{ width: `${Math.min(100, g.percent)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
