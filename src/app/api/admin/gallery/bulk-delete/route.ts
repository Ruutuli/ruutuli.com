import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, readJsonBody, unauthorized } from "@/lib/admin/api";
import { bulkRemoveGalleryItems, listGalleryItemIds } from "@/lib/store/galleryStore";
import { GalleryImageTypeFilter, GalleryListFilters, GalleryPublishedFilter, GallerySectionFilter, GallerySortBy } from "@/types/gallery";

export const dynamic = "force-dynamic";

interface BulkDeleteBody {
  itemIds?: string[];
  filters?: GalleryListFilters;
}

function parseFilters(raw: GalleryListFilters | undefined): GalleryListFilters | undefined {
  if (!raw) return undefined;
  const published = raw.published as GalleryPublishedFilter | undefined;
  const imageType = raw.imageType as GalleryImageTypeFilter | undefined;
  const gallerySection = raw.gallerySection as GallerySectionFilter | undefined;
  const sortBy = raw.sortBy as GallerySortBy | undefined;

  return {
    q: typeof raw.q === "string" ? raw.q : undefined,
    published: published && published !== "all" ? published : undefined,
    hideLivePhotos: raw.hideLivePhotos === true,
    cosplayId: typeof raw.cosplayId === "string" ? raw.cosplayId : undefined,
    convention: typeof raw.convention === "string" ? raw.convention : undefined,
    photographer: typeof raw.photographer === "string" ? raw.photographer : undefined,
    folderId: typeof raw.folderId === "string" ? raw.folderId : undefined,
    imageType: imageType && imageType !== "all" ? imageType : undefined,
    gallerySection: gallerySection && gallerySection !== "all" ? gallerySection : undefined,
    sortBy: sortBy === "name" ? "name" : undefined,
  };
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<BulkDeleteBody>(request);
  if (!body) return badRequest("Invalid body");

  let itemIds = Array.isArray(body.itemIds)
    ? [...new Set(body.itemIds.filter((id): id is string => typeof id === "string" && id.trim()))]
    : [];

  if (itemIds.length === 0 && body.filters) {
    itemIds = await listGalleryItemIds(parseFilters(body.filters) ?? {});
  }

  if (itemIds.length === 0) return badRequest("No gallery items to remove");

  const result = await bulkRemoveGalleryItems(itemIds);
  return NextResponse.json({ ...result, total: itemIds.length });
}
