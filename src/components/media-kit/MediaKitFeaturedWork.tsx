import Link from "next/link";
import RosterImageSlot from "@/components/RosterImageSlot";
import { getCosplayDisplayImage } from "@/lib/cosplay/images";
import { Cosplay } from "@/types/cosplay";
import { GalleryPhotoCreditMap, lookupPhotoCredit, photoCreditLines } from "@/lib/gallery/photoCredits";

export default function MediaKitFeaturedWork({
  cosplays,
  photoCredits,
}: {
  cosplays: Cosplay[];
  photoCredits: GalleryPhotoCreditMap;
}) {
  if (cosplays.length === 0) return null;

  return (
    <section
      aria-labelledby="mediakit-featured-heading"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col self-stretch"
    >
      <div className="mb-5 flex shrink-0 items-end justify-between gap-4">
        <h2 id="mediakit-featured-heading" className="closet-section-title mb-0">
          Featured Work
        </h2>
        <Link
          href="/roster"
          className="cosplan-focus-ring hidden items-center gap-1.5 text-sm font-semibold text-closet-rose transition-colors hover:text-closet-mauve lg:inline-flex"
        >
          View more cosplays
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="cosplan-roster-scroll min-h-0 flex-1 sm:grid sm:grid-cols-2 sm:items-stretch lg:grid lg:h-full lg:min-h-0 lg:grid-cols-3 lg:gap-6 lg:[grid-template-rows:minmax(0,1fr)]">
          {cosplays.map((cosplay) => {
            const imageSrc = getCosplayDisplayImage(cosplay.image, ...cosplay.gallery, cosplay.characterArt);
            const credit = lookupPhotoCredit(cosplay.image, photoCredits);
            const { who: photographer } = photoCreditLines(credit);

            return (
              <Link
                key={cosplay.id}
                href={`/roster/${cosplay.id}`}
                className="cosplan-focus-ring group mediakit-feature-card flex h-full min-h-[300px] flex-col overflow-hidden rounded-3xl border border-closet-pink/50 bg-white shadow-closet transition-all duration-300 hover:-translate-y-1 hover:shadow-closet-lg sm:min-h-[340px] lg:min-h-0"
              >
                <div className="relative min-h-[220px] flex-1 overflow-hidden bg-closet-blush/30 sm:min-h-[240px] lg:min-h-0">
                  <RosterImageSlot
                    src={imageSrc}
                    alt={`${cosplay.character} cosplay from ${cosplay.series}`}
                    emptyLabel={cosplay.character}
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    objectPosition={cosplay.imagePosition ?? cosplay.characterArtPosition ?? "center top"}
                    sizes="(max-width: 640px) 82vw, (max-width: 1024px) 45vw, 320px"
                  />
                </div>
                <div className="shrink-0 p-4">
                  <h3 className="font-sans text-lg font-bold text-closet-brown">{cosplay.character}</h3>
                  <p className="text-sm font-medium text-closet-rose">{cosplay.series}</p>
                  {photographer && (
                    <p className="mt-1 text-xs text-closet-brown-light">Photo by {photographer}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 shrink-0 text-center lg:hidden">
          <Link
            href="/roster"
            className="cosplan-focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-closet-rose transition-colors hover:text-closet-mauve"
          >
            View more cosplays
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </p>
      </div>
    </section>
  );
}
