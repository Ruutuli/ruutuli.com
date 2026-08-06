/** How this image is used on the roster — reference (front) or featured (back). */
export type GalleryImageType = "reference" | "featured";

export const GALLERY_IMAGE_TYPE_LABELS: Record<GalleryImageType, string> = {
  reference: "Reference image",
  featured: "Feature image",
};

/** Which public cosplay page gallery this photo appears in. */
export type GallerySection = "build" | "convention" | "reference";

export const GALLERY_SECTION_LABELS: Record<GallerySection, string> = {
  build: "Build gallery",
  convention: "Gallery",
  reference: "Reference gallery",
};

export function isGallerySection(value: unknown): value is GallerySection {
  return value === "build" || value === "convention" || value === "reference";
}

export interface GalleryItem {
  id: string;
  driveFileId: string;
  name: string;
  mimeType: string | null;
  folderId: string;
  /** Drive subfolder name (immediate parent) — set during sync. */
  folderName?: string;
  viewUrl: string;
  published: boolean;
  tags: string[];
  cosplayIds: string[];
  /** Reference PNG (roster front) or feature photo (roster back) */
  imageType?: GalleryImageType | null;
  /** Build progress vs finished cosplay shots on the public cosplay page */
  gallerySection?: GallerySection | null;
  /** Convention name (e.g. Katsucon 2017) — links to build planner event when matched */
  convention?: string;
  /** Auto-linked build planner event when convention matches */
  eventId?: string;
  /** Photographer credit — often parsed from filename */
  photographer?: string;
  /** Google Drive modifiedTime — used to bust image proxy cache when a file is replaced in place */
  driveModifiedAt?: string;
  notes?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type GalleryPublishedFilter = "all" | "published" | "unpublished" | "unlinked";
export type GalleryImageTypeFilter = "all" | GalleryImageType | "unset";
export type GallerySectionFilter = "all" | GallerySection | "unset";

export type GallerySortBy = "name" | "folder";

/** Public-facing photographer / convention credit for a gallery photo URL. */
export interface GalleryPhotoCredit {
  convention?: string;
  photographer?: string;
}

/** Lightweight photo entry for the media kit banner collage. */
export interface GalleryBannerPhoto {
  src: string;
  alt: string;
  /** Primary cosplay link — used to avoid showing the same character in adjacent slots. */
  cosplayId?: string;
}

export interface GalleryListFilters {
  q?: string;
  published?: GalleryPublishedFilter;
  /** When true, exclude photos marked live/published on site. */
  hideLivePhotos?: boolean;
  /** When true, show only photos marked live/published on site. */
  liveOnly?: boolean;
  cosplayId?: string;
  convention?: string;
  photographer?: string;
  imageType?: GalleryImageTypeFilter;
  gallerySection?: GallerySectionFilter;
  folderId?: string;
  sortBy?: GallerySortBy;
  page?: number;
  limit?: number;
  /** When false, omit stats from the response (e.g. pagination-only refresh). */
  includeStats?: boolean;
  /** When false, omit facet lists from the response. */
  includeFacets?: boolean;
}

export interface GalleryListResult {
  items: GalleryItem[];
  total: number;
  page: number;
  limit: number;
  stats?: {
    total: number;
    published: number;
    unpublished: number;
    unlinked: number;
    /** Photos removed from gallery catalog; still on Drive until re-synced. */
    excluded: number;
  };
  facets?: {
    conventions: string[];
    photographers: string[];
    folders: { id: string; name: string }[];
  };
}
