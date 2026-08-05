import "server-only";

import { Wig } from "@/types/wig";
import {
  getWigColorPrimary,
} from "@/lib/wigColors";

export type WigColorCategory =
  | "pink"
  | "red"
  | "orange"
  | "blonde"
  | "green"
  | "blue"
  | "purple"
  | "black"
  | "gray"
  | "white"
  | "brown";

export interface WigCardEntry {
  id: string;
  brand: string;
  style: string;
  length: string;
  character?: string;
  color: string;
}

export interface WigColorCard {
  id: string;
  category: WigColorCategory;
  title: string;
  accent: string;
  part: number;
  partCount: number;
  entries: WigCardEntry[];
}

const CATEGORY_ORDER: {
  id: WigColorCategory;
  title: string;
  accent: string;
}[] = [
  { id: "pink", title: "Pink", accent: "#ec4899" },
  { id: "red", title: "Red", accent: "#dc2626" },
  { id: "orange", title: "Orange", accent: "#ea580c" },
  { id: "blonde", title: "Blonde", accent: "#e8c872" },
  { id: "green", title: "Green / Teal", accent: "#0d9488" },
  { id: "blue", title: "Blue", accent: "#3b82f6" },
  { id: "purple", title: "Purple", accent: "#9333ea" },
  { id: "black", title: "Black", accent: "#1c1917" },
  { id: "gray", title: "Gray / Silver", accent: "#9ca3af" },
  { id: "white", title: "White", accent: "#f8fafc" },
  { id: "brown", title: "Brown", accent: "#78350f" },
];

const WIGS_PER_CARD = 14;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function categorizeWigColor(color: string): WigColorCategory {
  const primary = getWigColorPrimary(color);
  const lower = primary.toLowerCase();
  const full = color.toLowerCase();

  if (lower.includes("pink") || lower.includes("magenta") || full.includes("pink")) return "pink";
  if (lower.includes("red") || lower.includes("crimson")) return "red";
  if (lower.includes("orange") || lower.includes("peach")) return "orange";
  if (lower.includes("blond")) return "blonde";
  if (
    lower.includes("green") ||
    lower.includes("teal") ||
    lower.includes("turquoise") ||
    lower.includes("emerald") ||
    lower.includes("cyan") ||
    lower.includes("aqua")
  ) {
    return "green";
  }
  if (lower.includes("blue") || lower.includes("navy") || lower.includes("indigo") || lower.includes("demin")) {
    return "blue";
  }
  if (lower.includes("purple") || lower.includes("violet") || lower.includes("lavender")) return "purple";
  if (lower.includes("black")) return "black";
  if (lower.includes("gray") || lower.includes("grey") || lower.includes("silver") || lower.includes("ash")) {
    return "gray";
  }
  if (lower.includes("white") || lower.includes("cream")) return "white";
  if (
    lower.includes("brown") ||
    lower.includes("brunette") ||
    lower.includes("beige") ||
    lower.includes("gold") ||
    lower.includes("yellow") ||
    lower.includes("champange") ||
    lower.includes("champagne") ||
    lower.includes("sandy") ||
    lower.includes("titanium") ||
    lower.includes("fairy") ||
    lower.includes("natural") ||
    lower.includes("warm")
  ) {
    return "brown";
  }

  return "brown";
}

function toEntry(wig: Wig): WigCardEntry {
  return {
    id: wig.id,
    brand: wig.brand,
    style: wig.style,
    length: wig.length,
    character: wig.character?.trim() || undefined,
    color: wig.color,
  };
}

function sortEntries(entries: WigCardEntry[]): WigCardEntry[] {
  return [...entries].sort((a, b) => {
    const brand = a.brand.localeCompare(b.brand);
    if (brand !== 0) return brand;
    const character = (a.character ?? "").localeCompare(b.character ?? "");
    if (character !== 0) return character;
    return a.color.localeCompare(b.color);
  });
}

function chunkEntries(entries: WigCardEntry[], maxPerCard: number): WigCardEntry[][] {
  if (entries.length === 0) return [];
  const groups: WigCardEntry[][] = [];
  for (let i = 0; i < entries.length; i += maxPerCard) {
    groups.push(entries.slice(i, i + maxPerCard));
  }
  return groups;
}

function cardsForCategory(_category: WigColorCategory, entries: WigCardEntry[]): WigCardEntry[][] {
  return chunkEntries(entries, WIGS_PER_CARD);
}

/** Scale type to fit every entry inside the 3×5 card body. */
const CARD_BODY_HEIGHT_IN = 4.52;

function fitVarsForEntryCount(count: number, compactEntries: boolean): string {
  for (let textPt = 7; textPt >= 4.25; textPt -= 0.25) {
    const leading = textPt <= 4.75 ? 1.04 : textPt <= 5.5 ? 1.08 : textPt <= 6.25 ? 1.12 : 1.16;
    const lineIn = (textPt / 72) * leading;
    const secondaryIn = lineIn * (compactEntries ? 1 : 0.92);
    const metaMtIn = textPt <= 5 ? 0.006 : 0.01;
    const entryPadIn = textPt <= 5 ? 0.008 : textPt <= 6 ? 0.012 : 0.018;
    const gapIn = textPt <= 5 ? 0.006 : textPt <= 6 ? 0.01 : 0.016;

    const entryIn =
      lineIn + (compactEntries ? metaMtIn + secondaryIn : metaMtIn + lineIn + metaMtIn + secondaryIn) + entryPadIn;
    const totalIn = count * entryIn + Math.max(0, count - 1) * gapIn;

    if (totalIn <= CARD_BODY_HEIGHT_IN) {
      const titlePt = Math.max(6.5, Math.min(9, textPt + (count <= 8 ? 1.75 : 1.25)));
      const heroPad = count >= 14 ? 0.055 : count >= 10 ? 0.065 : count >= 7 ? 0.075 : 0.085;
      const swatch = count >= 12 ? 0.14 : count >= 8 ? 0.16 : 0.18;
      const bodyPad = count >= 12 ? 0.03 : count >= 8 ? 0.04 : 0.05;

      return [
        `--wig-text:${textPt}pt`,
        `--wig-leading:${leading}`,
        `--wig-title:${titlePt}pt`,
        `--wig-gap:${gapIn}in`,
        `--wig-entry-pad:${entryPadIn}in`,
        `--wig-meta-mt:${metaMtIn}in`,
        `--wig-hero-pad:${heroPad}in`,
        `--wig-swatch:${swatch}in`,
        `--wig-body-pad:${bodyPad}in`,
      ].join(";");
    }
  }

  return [
    "--wig-text:4.25pt",
    "--wig-leading:1.03",
    "--wig-title:6.5pt",
    "--wig-gap:0.004in",
    "--wig-entry-pad:0.006in",
    "--wig-meta-mt:0.004in",
    "--wig-hero-pad:0.05in",
    "--wig-swatch:0.12in",
    "--wig-body-pad:0.025in",
  ].join(";");
}

function useCompactEntries(count: number): boolean {
  return count >= 12;
}

export function buildWigColorCards(wigs: Wig[], categories?: WigColorCategory[]): WigColorCard[] {
  const allowed = categories?.length ? new Set(categories) : null;
  const grouped = new Map<WigColorCategory, WigCardEntry[]>();

  for (const wig of wigs) {
    const category = categorizeWigColor(wig.color);
    if (allowed && !allowed.has(category)) continue;
    const list = grouped.get(category) ?? [];
    list.push(toEntry(wig));
    grouped.set(category, list);
  }

  const cards: WigColorCard[] = [];

  for (const meta of CATEGORY_ORDER) {
    if (allowed && !allowed.has(meta.id)) continue;
    const entries = sortEntries(grouped.get(meta.id) ?? []);
    if (entries.length === 0) continue;

    const chunks = cardsForCategory(meta.id, entries);

    chunks.forEach((chunk, index) => {
      cards.push({
        id: chunks.length > 1 ? `${meta.id}-${index + 1}` : meta.id,
        category: meta.id,
        title: meta.title,
        accent: meta.accent,
        part: index + 1,
        partCount: chunks.length,
        entries: chunk,
      });
    });
  }

  return cards;
}

function headerNeedsDarkText(accent: string): boolean {
  return ["#e8c872", "#f8fafc", "#9ca3af"].includes(accent.toLowerCase());
}

function entryHeading(entry: WigCardEntry): string {
  return entry.character || entry.brand;
}

function renderEntry(entry: WigCardEntry, compact: boolean): string {
  const heading = entryHeading(entry);

  if (compact) {
    const details = [
      entry.character ? entry.brand : null,
      entry.length,
      entry.style !== entry.color ? entry.style : "",
      entry.color,
    ]
      .filter(Boolean)
      .join(" · ");

    return `<li class="wig-entry">
    <p class="wig-entry-heading">${escapeHtml(heading)}</p>
    ${details ? `<p class="wig-entry-meta">${escapeHtml(details)}</p>` : ""}
  </li>`;
  }

  const meta = [
    entry.character ? entry.brand : null,
    entry.length,
    entry.style !== entry.color ? entry.style : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return `<li class="wig-entry">
    <p class="wig-entry-heading">${escapeHtml(heading)}</p>
    ${meta ? `<p class="wig-entry-meta">${escapeHtml(meta)}</p>` : ""}
    <span class="wig-entry-color">${escapeHtml(entry.color)}</span>
  </li>`;
}

function renderCard(card: WigColorCard): string {
  const dark = headerNeedsDarkText(card.accent);
  const heroClass = dark ? " wig-hero--dark-text" : "";
  const compact = useCompactEntries(card.entries.length);
  const partLabel =
    card.partCount > 1
      ? `<p class="wig-part">${escapeHtml(String(card.part))} of ${card.partCount}</p>`
      : "";
  const items = card.entries.map((entry) => renderEntry(entry, compact)).join("");
  const fitVars = fitVarsForEntryCount(card.entries.length, compact);

  return `<article class="wig-card" data-wig-card="${escapeHtml(card.id)}" style="--accent:${escapeHtml(card.accent)};${fitVars}">
    <header class="wig-hero${heroClass}">
      <div class="wig-swatch" aria-hidden="true"></div>
      <h2 class="wig-title">${escapeHtml(card.title)}</h2>
      ${partLabel}
    </header>
    <div class="wig-body">
      <ul class="wig-list">${items}</ul>
    </div>
  </article>`;
}

const WIG_CARD_STYLES = `
  :root {
    color-scheme: light;
    --wig-ink: #3d2b1f;
    --wig-muted: #8b5a6b;
    --wig-line: #ecd9e4;
    --wig-card-bg: #fffcfd;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--wig-ink);
    background: linear-gradient(160deg, #f3eaee 0%, #e8dde4 100%);
    -webkit-font-smoothing: antialiased;
  }

  .print-toolbar {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid var(--wig-line);
    backdrop-filter: blur(8px);
  }

  .print-toolbar button {
    border: none;
    background: linear-gradient(135deg, #c45c7a 0%, #a84866 100%);
    color: #fff;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    padding: 0.45rem 0.95rem;
    border-radius: 999px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(196, 92, 122, 0.35);
  }

  .print-toolbar p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--wig-muted);
  }

  .wig-sheet {
    display: grid;
    grid-template-columns: repeat(2, 3in);
    gap: 0.2in;
    padding: 0.25in;
    justify-content: center;
  }

  .wig-card {
    width: 3in;
    height: 5in;
    display: flex;
    flex-direction: column;
    font-size: var(--wig-text, 7pt);
    line-height: var(--wig-leading, 1.16);
    background: var(--wig-card-bg);
    border: 1px dashed var(--wig-line);
    border-radius: 0.12in;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(61, 43, 31, 0.1);
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .wig-hero {
    flex-shrink: 0;
    position: relative;
    padding: var(--wig-hero-pad, 0.085in) var(--wig-hero-pad, 0.085in) calc(var(--wig-hero-pad, 0.085in) * 0.82);
    text-align: center;
    color: #fff;
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--accent) 88%, #fff) 0%,
      var(--accent) 55%,
      color-mix(in srgb, var(--accent) 80%, #000) 100%
    );
    border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, var(--wig-line));
  }

  .wig-hero--dark-text {
    color: var(--wig-ink);
  }

  .wig-hero--dark-text .wig-part {
    color: color-mix(in srgb, var(--wig-ink) 70%, transparent);
  }

  .wig-swatch {
    width: var(--wig-swatch, 0.18in);
    height: var(--wig-swatch, 0.18in);
    margin: 0 auto calc(var(--wig-hero-pad, 0.085in) * 0.45);
    border-radius: 999px;
    background: var(--accent);
    border: 2px solid rgba(255, 255, 255, 0.65);
    box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.15);
  }

  .wig-hero--dark-text .wig-swatch {
    border-color: rgba(0, 0, 0, 0.12);
  }

  .wig-title {
    margin: 0;
    font-size: var(--wig-title, 9pt);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .wig-part {
    margin: 0.03in 0 0;
    font-size: 0.92em;
    font-weight: 600;
    opacity: 0.92;
  }

  .wig-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: var(--wig-body-pad, 0.05in) 0.09in calc(var(--wig-body-pad, 0.05in) + 0.02in);
  }

  .wig-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--wig-gap, 0.016in);
  }

  .wig-entry {
    padding-bottom: var(--wig-entry-pad, 0.014in);
    border-bottom: 1px solid color-mix(in srgb, var(--wig-line) 80%, transparent);
  }

  .wig-entry:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .wig-entry-heading {
    margin: 0;
    font-size: inherit;
    font-weight: 800;
    line-height: var(--wig-leading);
    color: var(--wig-ink);
  }

  .wig-entry-meta {
    margin: var(--wig-meta-mt, 0.01in) 0 0;
    font-size: inherit;
    font-weight: 600;
    line-height: var(--wig-leading);
    color: var(--wig-muted);
  }

  .wig-entry-color {
    display: block;
    margin-top: calc(var(--wig-meta-mt, 0.01in) * 0.85);
    font-size: 0.92em;
    font-weight: 600;
    line-height: var(--wig-leading, 1.16);
    color: color-mix(in srgb, var(--wig-ink) 75%, var(--wig-muted));
  }

  @page {
    size: letter;
    margin: 0.25in;
  }

  @media print {
    body {
      background: #fff;
    }

    .print-toolbar {
      display: none;
    }

    .wig-sheet {
      padding: 0;
      gap: 0.15in;
    }

    .wig-card {
      border: 1px solid #ccc;
      box-shadow: none;
      border-radius: 0;
    }
  }
`;

export function renderWigCardsHtml(cards: WigColorCard[], options?: { title?: string }): string {
  const title = options?.title?.trim() || "Wig inventory cards";
  const cardMarkup = cards.map(renderCard).join("");
  const countLabel = `${cards.length} card${cards.length === 1 ? "" : "s"} · sorted by color · 3×5 in`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${WIG_CARD_STYLES}</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" onclick="window.print()">Print cards</button>
    <p>${escapeHtml(countLabel)} — up to ${WIGS_PER_CARD} wigs per card; splits when needed. Text shrinks to fit.</p>
  </div>
  <main class="wig-sheet">${cardMarkup}</main>
</body>
</html>`;
}
