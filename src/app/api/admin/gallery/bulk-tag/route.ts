import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, readJsonBody, unauthorized } from "@/lib/admin/api";
import {
  bulkTagGalleryItems,
  BulkTagMode,
  listGalleryItemIds,
} from "@/lib/store/galleryStore";
import {
  GalleryImageTypeFilter,
  GalleryListFilters,
  GalleryPublishedFilter,
  GallerySection,
  GallerySectionFilter,
  GallerySortBy,
  isGallerySection,
} from "@/types/gallery";

export const dynamic = "force-dynamic";

interface BulkTagBody {
  itemIds?: string[];
  filters?: GalleryListFilters;
  cosplayIds?: string[];
  mode?: BulkTagMode;
  convention?: string;
  photographer?: string;
  gallerySection?: GallerySection | null;
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
    liveOnly: raw.liveOnly === true,
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

  const body = await readJsonBody<BulkTagBody>(request);
  if (!body) return badRequest("Invalid body");

  const cosplayIds = Array.isArray(body.cosplayIds)
    ? [...new Set(body.cosplayIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
    : [];

  const mode: BulkTagMode =
    body.mode === "remove" || body.mode === "set" || body.mode === "add" ? body.mode : "add";

  const gallerySection = isGallerySection(body.gallerySection) ? body.gallerySection : body.gallerySection === null ? null : undefined;

  const hasUpdate =
    cosplayIds.length > 0 ||
    gallerySection !== undefined ||
    typeof body.convention === "string" ||
    typeof body.photographer === "string";

  if (!hasUpdate) {
    return badRequest("Provide a character, gallery section, convention, or photographer to apply");
  }

  let itemIds = Array.isArray(body.itemIds)
    ? [...new Set(body.itemIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
    : [];

  if (itemIds.length === 0 && body.filters) {
    itemIds = await listGalleryItemIds(parseFilters(body.filters) ?? {});
  }

  if (itemIds.length === 0) return badRequest("No gallery items to update");

  try {
    const result = await bulkTagGalleryItems({
      itemIds,
      cosplayIds,
      mode,
      convention: typeof body.convention === "string" ? body.convention : undefined,
      photographer: typeof body.photographer === "string" ? body.photographer : undefined,
      gallerySection,
    });
    return NextResponse.json({ ...result, total: itemIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk tag failed";
    return badRequest(message);
  }
}
