import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteShell from "@/components/SiteShell";
import CosplayBoard from "@/components/CosplayBoard";
import { getCosplayById } from "@/lib/store/cosplayStore";
import {
  enrichCosplaysWithGalleryDisplayPhotos,
  getGalleryDisplayPhotoCandidatesForCosplay,
  getGalleryPhotoCreditsForCosplay,
  getGallerySectionPhotosForCosplay,
} from "@/lib/store/galleryStore";
import { resolveCosplayTodos } from "@/lib/cosplay/todos";
import { getTasks } from "@/lib/store/taskStore";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getSiteConfig } from "@/lib/server/siteConfig";
import { absoluteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const [cosplay, site] = await Promise.all([getCosplayById(id), getSiteConfig()]);
  if (!cosplay) return { title: "Cosplay" };

  const title = cosplay.character;
  const description =
    cosplay.description ||
    `${cosplay.character} cosplay from ${cosplay.series} by ${site.displayName}.`;
  const image = cosplay.image || cosplay.characterArt;
  const path = `/roster/${id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${title} | ${site.name}`,
      description,
      url: path,
      images: image
        ? [{ url: image, alt: `${cosplay.character} cosplay by ${site.displayName}` }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${site.name}`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function CosplayBoardPage({ params }: PageProps) {
  const { id } = await params;
  const [cosplay, allTasks, photoCredits, buildPhotoUrls, referencePhotoUrls, conventionPhotoUrls, displayPhotoCandidates, isAdmin] =
    await Promise.all([
    getCosplayById(id),
    getTasks(),
    getGalleryPhotoCreditsForCosplay(id),
    getGallerySectionPhotosForCosplay(id, "build"),
    getGallerySectionPhotosForCosplay(id, "reference"),
    getGallerySectionPhotosForCosplay(id, "convention"),
    getGalleryDisplayPhotoCandidatesForCosplay(id),
    isAdminAuthenticated(),
  ]);

  if (!cosplay) notFound();

  const [enrichedCosplay] = await enrichCosplaysWithGalleryDisplayPhotos([cosplay]);

  const todos = resolveCosplayTodos(enrichedCosplay, allTasks);
  const site = await getSiteConfig();
  const image = enrichedCosplay.image || enrichedCosplay.characterArt;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${enrichedCosplay.character} cosplay`,
    description:
      enrichedCosplay.description ||
      `${enrichedCosplay.character} from ${enrichedCosplay.series}`,
    url: absoluteUrl(`/roster/${id}`),
    image: image ? (image.startsWith("http") ? image : absoluteUrl(image)) : undefined,
    creator: {
      "@type": "Person",
      name: site.displayName,
      url: absoluteUrl(),
    },
    about: {
      "@type": "Thing",
      name: enrichedCosplay.character,
    },
    genre: enrichedCosplay.series,
  };

  return (
    <SiteShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="closet-page !pt-4">
        <CosplayBoard
          cosplay={enrichedCosplay}
          todos={todos}
          photoCredits={photoCredits}
          buildPhotoUrls={buildPhotoUrls}
          referencePhotoUrls={referencePhotoUrls}
          conventionPhotoUrls={conventionPhotoUrls}
          displayPhotoCandidates={displayPhotoCandidates}
          isAdmin={isAdmin}
        />
      </div>
    </SiteShell>
  );
}
