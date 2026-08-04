/**
 * Import Lauren Cos.csv + WIGS.csv into data/store JSON files.
 * Run: node scripts/import-csv.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const storeDir = path.join(root, "data", "store");

function parseCsv(text) {
  const rows = [];
  let row = [];
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

function slugify(...parts) {
  return parts
    .filter(Boolean)
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function statusFromPercent(raw) {
  const n = parseFloat(String(raw).replace("%", ""));
  if (Number.isNaN(n) || n <= 0) return "planned";
  if (n >= 100) return "completed";
  return "in-progress";
}

function pickAccent(series) {
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
  return accents[hash];
}

const PLACEHOLDER = "/images/box-blank.png";

const PART_SECTIONS = [
  { category: "wig", label: "Wig Color", slots: 1 },
  { category: "eyes", label: "Eye Color", slots: 1 },
  { category: "top", label: "Top", slots: 4 },
  { category: "bottom", label: "Bottom", slots: 3 },
  { category: "socks", label: "Socks", slots: 1 },
  { category: "shoes", label: "Shoes", slots: 1 },
  { category: "accessories", label: "Accessories", slots: 4 },
  { category: "other", label: "Other", slots: 2 },
  { category: "prop", label: "Prop", slots: 1 },
];

function parseOwned(raw) {
  return String(raw ?? "").trim().toUpperCase() === "TRUE";
}

function parseParts(cols) {
  let i = 5;
  const parts = [];

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

function partsProgress(parts) {
  if (!parts.length) return null;
  const owned = parts.filter((p) => p.owned).length;
  return Math.round((owned / parts.length) * 100);
}

function parseCosplays(rows) {
  const [, ...data] = rows;
  const seen = new Map();

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

    return {
      id,
      title,
      character,
      series,
      outfit,
      status: statusFromPercent(`${overallPercent}%`),
      description: buildDescription(character, series, outfit, convention, overallPercent),
      characterArt: character === "Tifa" && outfit === "Remake" ? "/images/tifa-character.png" : PLACEHOLDER,
      image: PLACEHOLDER,
      gallery: [],
      accent: pickAccent(series),
      tags,
      parts: costumeParts,
      ...(convention ? { convention } : {}),
      ...(overallPercent < 100 ? { progress: [{ label: "Parts", percent: overallPercent }] } : {}),
      ...(character === "Tifa" && outfit === "Remake" && series.includes("Final Fantasy VII")
        ? { spotlight: true, featured: true }
        : {}),
    };
  });
}

function buildDescription(character, series, outfit, convention, percent) {
  const parts = [`${character} from ${series}`];
  if (outfit && outfit.toLowerCase() !== "default") parts.push(`(${outfit})`);
  if (convention && percent >= 100) parts.push(`Worn at ${convention}.`);
  else if (convention) parts.push(`Target: ${convention}.`);
  parts.push(`${percent}% complete.`);
  return parts.join(" ");
}

function parseWigs(rows) {
  const [, ...data] = rows;

  return data.map((cols, index) => {
    const brand = cols[1] || "Unknown";
    const style = cols[2] || "";
    const length = cols[3]?.trim() || "";
    const character = cols[4]?.trim() || undefined;
    const color = cols[5] || "";

    return {
      id: slugify(brand, style, character || "wig", color, String(index)),
      brand,
      style,
      length,
      character,
      color,
      owner: "Ruu",
    };
  });
}

const cosCsv = fs.readFileSync(path.join(root, "Ruu's and Silas's Cosplays - Lauren Cos.csv"), "utf8");
const wigsCsv = fs.readFileSync(path.join(root, "Ruu's and Silas's Cosplays - WIGS.csv"), "utf8");

const cosplays = parseCosplays(parseCsv(cosCsv));
const wigs = parseWigs(parseCsv(wigsCsv));

fs.mkdirSync(storeDir, { recursive: true });
fs.writeFileSync(path.join(storeDir, "cosplays.json"), JSON.stringify(cosplays, null, 2));
fs.writeFileSync(path.join(storeDir, "wigs.json"), JSON.stringify(wigs, null, 2));

console.log(`Wrote ${cosplays.length} cosplays → data/store/cosplays.json`);
console.log(`Wrote ${wigs.length} wigs → data/store/wigs.json`);
