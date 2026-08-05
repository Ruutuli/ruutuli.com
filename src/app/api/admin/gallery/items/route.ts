import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { unauthorized } from "@/lib/admin/api";
import { listGalleryItems } from "@/lib/store/galleryStore";
import { GalleryPublishedFilter, GalleryImageTypeFilter, GallerySectionFilter, GallerySortBy } from "@/types/gallery";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const params = request.nextUrl.searchParams;
  const published = params.get("published") as GalleryPublishedFilter | null;

  const imageType = params.get("imageType") as GalleryImageTypeFilter | null;
  const gallerySection = params.get("gallerySection") as GallerySectionFilter | null;
  const sortBy = params.get("sortBy") as GallerySortBy | null;

  const result = await listGalleryItems({
    q: params.get("q") ?? undefined,
    published: published && published !== "all" ? published : undefined,
    hideLivePhotos: params.get("hideLive") === "1" || params.get("hideLive") === "true",
    liveOnly: params.get("liveOnly") === "1" || params.get("liveOnly") === "true",
    cosplayId: params.get("cosplayId") ?? undefined,
    convention: params.get("convention") ?? undefined,
    photographer: params.get("photographer") ?? undefined,
    folderId: params.get("folderId") ?? undefined,
    imageType: imageType && imageType !== "all" ? imageType : undefined,
    gallerySection: gallerySection && gallerySection !== "all" ? gallerySection : undefined,
    sortBy: sortBy === "name" ? "name" : undefined,
    page: Number(params.get("page")) || 1,
    limit: Number(params.get("limit")) || 48,
    includeStats: params.get("includeStats") !== "0",
    includeFacets: params.get("includeFacets") !== "0",
  });

  return NextResponse.json(result);
}
