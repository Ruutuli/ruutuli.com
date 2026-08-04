import { Cosplay, CosplayStatus } from "@/types/cosplay";
import { getCosplayProgressPercent } from "@/lib/siteConfig";

export type CosplaySortBy =
  | "custom"
  | "character-asc"
  | "character-desc"
  | "series-asc"
  | "series-desc"
  | "status"
  | "progress-desc"
  | "progress-asc";

export const COSPLAY_SORT_OPTIONS: { value: CosplaySortBy; label: string }[] = [
  { value: "custom", label: "Custom order" },
  { value: "character-asc", label: "Character A–Z" },
  { value: "character-desc", label: "Character Z–A" },
  { value: "series-asc", label: "Series A–Z" },
  { value: "series-desc", label: "Series Z–A" },
  { value: "status", label: "Status" },
  { value: "progress-desc", label: "Progress high → low" },
  { value: "progress-asc", label: "Progress low → high" },
];

const STATUS_RANK: Record<CosplayStatus, number> = {
  "in-progress": 0,
  planned: 1,
  completed: 2,
  retired: 3,
};

function compareCustom(a: Cosplay, b: Cosplay): number {
  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;
  return a.character.localeCompare(b.character);
}

export function sortCosplays(cosplays: Cosplay[], sortBy: CosplaySortBy): Cosplay[] {
  const list = [...cosplays];

  switch (sortBy) {
    case "custom":
      return list.sort(compareCustom);
    case "character-asc":
      return list.sort((a, b) => a.character.localeCompare(b.character));
    case "character-desc":
      return list.sort((a, b) => b.character.localeCompare(a.character));
    case "series-asc":
      return list.sort(
        (a, b) => a.series.localeCompare(b.series) || a.character.localeCompare(b.character),
      );
    case "series-desc":
      return list.sort(
        (a, b) => b.series.localeCompare(a.series) || a.character.localeCompare(b.character),
      );
    case "status":
      return list.sort(
        (a, b) =>
          STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
          a.character.localeCompare(b.character),
      );
    case "progress-desc":
      return list.sort(
        (a, b) =>
          getCosplayProgressPercent(b) - getCosplayProgressPercent(a) ||
          a.character.localeCompare(b.character),
      );
    case "progress-asc":
      return list.sort(
        (a, b) =>
          getCosplayProgressPercent(a) - getCosplayProgressPercent(b) ||
          a.character.localeCompare(b.character),
      );
    default:
      return list.sort((a, b) => a.character.localeCompare(b.character));
  }
}

export function orderedCosplayIds(cosplays: Cosplay[]): string[] {
  return sortCosplays(cosplays, "custom").map((c) => c.id);
}
