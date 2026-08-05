export type CosplayStatus = "completed" | "in-progress" | "planned" | "retired";

export interface CosplayProgress {
  label: string;
  percent: number;
}

export type CosplayPartCategory =
  | "wig"
  | "eyes"
  | "top"
  | "bottom"
  | "socks"
  | "shoes"
  | "accessories"
  | "other"
  | "prop";

export interface CosplayPart {
  category: CosplayPartCategory;
  /** Group label from spreadsheet (e.g. Top, Accessories) */
  label: string;
  name: string;
  owned: boolean;
}

/** Where a costume piece came from — wig shop, contact brand, etc. */
export interface CosplaySource {
  label: string;
  detail: string;
  url?: string;
}

export interface Cosplay {
  id: string;
  title: string;
  character: string;
  series: string;
  status: CosplayStatus;
  description: string;
  /** PNG / art of the character — front of roster flip card */
  characterArt: string;
  /** Optional CSS object-position for character art (e.g. "center top") */
  characterArtPosition?: string;
  /** Main cosplay photo — back of roster flip card */
  image: string;
  /** Full gallery opened when the roster card is clicked */
  gallery: string[];
  accent: string;
  tags: string[];
  progress?: CosplayProgress[];
  completedDate?: string;
  startedDate?: string;
  deadline?: string;
  featured?: boolean;
  /** Primary dashboard spotlight build */
  spotlight?: boolean;
  /** Outfit variant label from spreadsheet */
  outfit?: string;
  /** Upcoming convention this build is for */
  convention?: string;
  /** Costume piece checklist from spreadsheet */
  parts?: CosplayPart[];
  /** Vendors & shops — wig, contacts, props, etc. */
  sources?: CosplaySource[];
  /** Manual roster display order (lower = first). Set in admin. */
  sortOrder?: number;
}

export function dedupeCosplaysById(cosplays: Cosplay[]): Cosplay[] {
  return Array.from(
    new Map(cosplays.filter((c) => c.id?.trim()).map((c) => [c.id, c])).values(),
  );
}

export function getCosplayPartsPercent(cosplay: Cosplay): number | null {
  if (cosplay.status === "retired") return null;
  if (!cosplay.parts?.length) return null;
  const owned = cosplay.parts.filter((p) => p.owned).length;
  return Math.round((owned / cosplay.parts.length) * 100);
}

export function syncCosplayProgressFromParts(cosplay: Cosplay): Cosplay {
  if (cosplay.status === "retired") return cosplay;
  const pct = getCosplayPartsPercent(cosplay);
  if (pct === null) return cosplay;
  const status: CosplayStatus =
    pct >= 100 ? "completed" : pct > 0 ? "in-progress" : "planned";
  return {
    ...cosplay,
    status,
    progress: [{ label: "Parts", percent: pct }],
  };
}
