import { Cosplay } from "@/types/cosplay";

function normalizeFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/i, "")
    .trim()
    .replace(/^[!#*+\-–|]+\s*/i, "")
    .replace(/\(\d+\)\s*uploaded?\s*$/i, "")
    .replace(/\s*uploaded?\s*$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s*;\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Secondary line for cosplay pickers — shows series and outfit when it helps tell builds apart. */
export function cosplayPickerSubtitle(cosplay: Cosplay): string {
  const parts = [cosplay.series];
  const outfit = cosplay.outfit?.trim();
  if (outfit && outfit.toLowerCase() !== "default") {
    parts.push(outfit);
  } else if (cosplay.title.trim() !== cosplay.character.trim()) {
    parts.push(cosplay.title.trim());
  }
  return parts.join(" · ");
}

/** Rank cosplays that likely match a Drive filename (e.g. "ANDROID 21.png" → Android 21). */
export function suggestCosplaysFromFilename(filename: string, cosplays: Cosplay[]): Cosplay[] {
  const base = normalizeFilename(filename);
  if (!base) return [];

  const seen = new Set<string>();
  const scored = cosplays
    .map((cosplay) => {
      const character = cosplay.character.toLowerCase();
      const series = cosplay.series.toLowerCase();
      const outfit = cosplay.outfit?.toLowerCase() ?? "";
      const title = cosplay.title.toLowerCase();
      let score = 0;

      if (base === character) {
        score = 1000;
      } else if (base.includes(character) && character.length >= 3) {
        score = 500 + character.length;
      } else if (character.includes(base) && base.length >= 3) {
        score = 400 + base.length;
      } else {
        const tokens = base.split(" ").filter((t) => t.length >= 2);
        for (const token of tokens) {
          if (character.split(" ").some((w) => w === token || w.startsWith(token))) score += 80;
          else if (character.includes(token)) score += 40;
          if (series.includes(token)) score += 15;
        }
      }

      if (outfit && outfit !== "default" && base.includes(outfit)) score += 350;
      if (title !== character) {
        const titleTokens = title.replace(/[()]/g, " ").split(/\s+/).filter((t) => t.length >= 3);
        for (const token of titleTokens) {
          if (base.includes(token)) score += 120;
        }
      }

      return { cosplay, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.cosplay.character.localeCompare(b.cosplay.character));

  return scored
    .filter((row) => {
      if (seen.has(row.cosplay.id)) return false;
      seen.add(row.cosplay.id);
      return true;
    })
    .map((row) => row.cosplay);
}

/** Rank cosplays that likely match any of several Drive filenames (bulk tag). */
export function suggestCosplaysFromFilenames(filenames: string[], cosplays: Cosplay[]): Cosplay[] {
  const scoreById = new Map<string, number>();
  for (const filename of filenames) {
    const matches = suggestCosplaysFromFilename(filename, cosplays);
    matches.forEach((cosplay, index) => {
      const add = Math.max(1000 - index * 80, 50);
      scoreById.set(cosplay.id, (scoreById.get(cosplay.id) ?? 0) + add);
    });
  }

  return [...scoreById.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => cosplays.find((c) => c.id === id))
    .filter((c): c is Cosplay => !!c);
}

/** When every filename's top match is the same cosplay, pre-select it for bulk tag. */
export function autoSelectCosplayIdsFromFilenames(filenames: string[], cosplays: Cosplay[]): string[] {
  if (filenames.length === 0) return [];

  const topIds = filenames
    .map((filename) => suggestCosplaysFromFilename(filename, cosplays)[0]?.id)
    .filter((id): id is string => !!id);

  if (topIds.length === 0) return [];
  const first = topIds[0]!;
  return topIds.every((id) => id === first) ? [first] : [];
}

export function filterCosplaysByQuery(cosplays: Cosplay[], query: string): Cosplay[] {
  const q = query.trim().toLowerCase();
  if (!q) return cosplays;
  return cosplays.filter(
    (c) =>
      c.character.toLowerCase().includes(q) ||
      c.series.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q),
  );
}
