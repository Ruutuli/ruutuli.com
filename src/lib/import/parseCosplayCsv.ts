import "server-only";

import fs from "fs";
import path from "path";
import { Cosplay, CosplayPart } from "@/types/cosplay";

const PART_SECTIONS = [
  { category: "wig" as const, label: "Wig Color", slots: 1 },
  { category: "eyes" as const, label: "Eye Color", slots: 1 },
  { category: "top" as const, label: "Top", slots: 4 },
  { category: "bottom" as const, label: "Bottom", slots: 3 },
  { category: "socks" as const, label: "Socks", slots: 1 },
  { category: "shoes" as const, label: "Shoes", slots: 1 },
  { category: "accessories" as const, label: "Accessories", slots: 4 },
  { category: "other" as const, label: "Other", slots: 2 },
  { category: "prop" as const, label: "Prop", slots: 4 },
];

function slugify(...parts: string[]): string {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function statusFromPercent(raw: string): Cosplay["status"] {
  const n = parseFloat(String(raw).replace("%", ""));
  if (Number.isNaN(n) || n <= 0) return "planned";
  if (n >= 100) return "completed";
  return "in-progress";
}

function pickAccent(series: string): string {
  const accents = [
    "from-rose-500 to-red-700",
    "from-cyan-400 to-blue-600",
    "from-pink-400 to-violet-500",
    "from-teal-400 to-emerald-500",
    "from-red-600 to-rose-900",
    "from-amber-400 to-orange-600",
    "from-purple-400 to-indigo-600",
    "from-emerald-400 to-teal-600",
  ];
  let hash = 0;
  for (const ch of series) hash = (hash + ch.charCodeAt(0)) % accents.length;
  return accents[hash]!;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field.trim());
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i++;
      row.push(field.trim());
      field = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }

  return rows;
}

function parseOwned(raw: string | undefined): boolean {
  return String(raw ?? "").trim().toUpperCase() === "TRUE";
}

function parseParts(cols: string[]): CosplayPart[] {
  let i = 5;
  const parts: CosplayPart[] = [];

  for (const section of PART_SECTIONS) {
    for (let slot = 0; slot < section.slots; slot++) {
      const ownedRaw = cols[i++];
      const nameRaw = cols[i++];
      const name = String(nameRaw ?? "").trim();
      if (!name) continue;

      parts.push({
        category: section.category,
        label: section.label,
        name,
        owned: parseOwned(ownedRaw),
      });
    }
  }

  return parts;
}

function partsProgress(parts: CosplayPart[]): number | null {
  if (!parts.length) return null;
  const owned = parts.filter((p) => p.owned).length;
  return Math.round((owned / parts.length) * 100);
}

function buildDescription(
  _character: string,
  _series: string,
  _outfit: string,
  convention: string | undefined,
  percent: number,
): string {
  if (convention && percent >= 100) return `Worn at ${convention}.`;
  if (convention) return `For ${convention}.`;
  return "";
}

export function parseCosplaysFromCsvRows(rows: string[][]): Cosplay[] {
  const [, ...data] = rows;
  const seen = new Map<string, number>();

  return data.map((cols) => {
    const series = cols[0] || "Misc";
    const character = cols[1] || "Unknown";
    const outfit = cols[2] || "Default";
    const statusRaw = cols[3] || "0%";
    const convention = cols[4]?.trim() || undefined;
    const percent = Math.round(parseFloat(statusRaw.replace("%", "")) || 0);

    let baseId = slugify(series, character, outfit);
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    const id = count > 0 ? `${baseId}-${count + 1}` : baseId;

    const title =
      outfit && outfit.toLowerCase() !== "default" ? `${character} (${outfit})` : character;

    const tags = [series];
    if (outfit && outfit.toLowerCase() !== "default") tags.push(outfit);
    if (convention) tags.push(convention);

    const costumeParts = parseParts(cols);
    const partsPct = partsProgress(costumeParts);
    const overallPercent = partsPct ?? percent;

    const cosplay: Cosplay = {
      id,
      title,
      character,
      series,
      outfit,
      status: statusFromPercent(`${overallPercent}%`),
      description: buildDescription(character, series, outfit, convention, overallPercent),
      characterArt:
        character === "Tifa" && outfit === "Remake" ? "/images/tifa-character.png" : "",
      image: "",
      gallery: [],
      accent: pickAccent(series),
      tags,
      parts: costumeParts,
      ...(convention ? { convention } : {}),
      ...(overallPercent < 100 ? { progress: [{ label: "Parts", percent: overallPercent }] } : {}),
      ...(character === "Tifa" &&
      outfit === "Remake" &&
      series.includes("Final Fantasy VII")
        ? { spotlight: true, featured: true }
        : {}),
    };

    return cosplay;
  });
}

export function loadCosplaysFromCsvFile(csvPath?: string): Cosplay[] {
  const filePath =
    csvPath ?? path.join(process.cwd(), "Ruu's and Silas's Cosplays - Lauren Cos.csv");
  const text = fs.readFileSync(filePath, "utf8");
  return parseCosplaysFromCsvRows(parseCsv(text));
}
