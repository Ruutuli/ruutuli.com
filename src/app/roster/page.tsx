import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import RosterView from "@/components/RosterView";
import { getCosplays } from "@/lib/store/cosplayStore";
import { enrichCosplaysWithGalleryDisplayPhotos } from "@/lib/store/galleryStore";
import { getSiteConfig } from "@/lib/server/siteConfig";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteConfig();
  const title = "Cosplay Roster";
  const description = `Cosplay portfolio by ${site.displayName} — characters and builds from planned to completed.`;

  return {
    title,
    description,
    alternates: { canonical: "/roster" },
    openGraph: {
      title: `${title} | ${site.name}`,
      description,
      url: "/roster",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
    },
  };
}

export default async function RosterPage() {
  const cosplays = await enrichCosplaysWithGalleryDisplayPhotos(await getCosplays());

  return (
    <SiteShell>
      <div className="closet-page">
        <RosterView cosplays={cosplays} />
      </div>
    </SiteShell>
  );
}
