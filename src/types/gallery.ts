/** How this image is used on the roster — reference (front) or featured (back). */
export type GalleryImageType = "reference" | "featured";

export const GALLERY_IMAGE_TYPE_LABELS: Record<GalleryImageType, string> = {
  reference: "Reference image",
  featured: "Feature image",
};

/** Which public cosplay page gallery this photo appears in. */
export type GallerySection = "build" | "convention" | "retired";

export const GALLERY_SECTION_LABELS: Record<GallerySection, string> = {
  build: "Build gallery",
  convention: "Convention gallery",
  retired: "Retired gallery",
};

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
  /** Build progress vs convention shots on the public cosplay page */
  gallerySection?: GallerySection | null;
  /** Convention name (e.g. Katsucon 2017) — links to build planner event when matched */
  convention?: string;
  /** Auto-linked build planner event when convention matches */
  eventId?: string;
  /** Photographer credit — often parsed from filename */
  photographer?: string;
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

export interface GalleryListFilters {
  q?: string;
  published?: GalleryPublishedFilter;
  /** When true, exclude photos marked live/published on site. */
  hideLivePhotos?: boolean;
  cosplayId?: string;
  convention?: string;
  photographer?: string;
  imageType?: GalleryImageTypeFilter;
  gallerySection?: GallerySectionFilter;
  folderId?: string;
  sortBy?: GallerySortBy;
  page?: number;
  limit?: number;
}

export interface GalleryListResult {
  items: GalleryItem[];
  total: number;
  page: number;
  limit: number;
  stats: {
    total: number;
    published: number;
    unpublished: number;
    unlinked: number;
  };
  facets: {
    conventions: string[];
    photographers: string[];
    folders: { id: string; name: string }[];
  };
}
