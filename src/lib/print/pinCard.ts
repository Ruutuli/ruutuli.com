import "server-only";

import { Cosplay, CosplayPart, CosplayPartCategory } from "@/types/cosplay";
import {
  getWigColorPrimary,
  resolveSwatchColor,
  swatchNeedsBorderForName,
  wigSwatchBackground,
} from "@/lib/wigColors";

export interface PinCardRowData {
  value: string;
  owned?: boolean;
  swatchColor?: string;
}

export interface PinCardFieldData {
  label: string;
  rows: PinCardRowData[];
}

export interface PinCardData {
  id: string;
  character: string;
  series: string;
  outfit?: string;
  wig?: PinCardRowData;
  contacts?: PinCardRowData;
  fields: PinCardFieldData[];
  itemCount: number;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function outfitDisplay(outfit: string | undefined): string {
  if (!outfit?.trim()) return "";
  if (outfit.trim().toLowerCase() === "default") return "";
  return outfit.trim();
}

function partRows(parts: CosplayPart[], category: CosplayPartCategory): PinCardRowData[] {
  return parts
    .filter((p) => p.category === category && p.name.trim())
    .map((p) => ({
      value: p.name.trim(),
      owned: p.owned,
    }));
}

function lookRow(parts: CosplayPart[], category: "wig" | "eyes"): PinCardRowData | undefined {
  const part = parts.find((p) => p.category === category && p.name.trim());
  if (!part) return undefined;

  const value = part.name.trim();
  return {
    value,
    owned: part.owned,
    swatchColor: resolveSwatchColor(getWigColorPrimary(value)),
  };
}

function pushField(
  fields: PinCardFieldData[],
  label: string,
  rows: PinCardRowData[],
): void {
  if (rows.length === 0) return;
  fields.push({ label, rows });
}

export function buildPinCardData(cosplay: Cosplay): PinCardData {
  const parts = cosplay.parts ?? [];
  const fields: PinCardFieldData[] = [];

  pushField(fields, "Top", partRows(parts, "top"));
  pushField(fields, "Bottom", partRows(parts, "bottom"));
  pushField(fields, "Socks", partRows(parts, "socks"));
  pushField(fields, "Shoes", partRows(parts, "shoes"));
  pushField(fields, "Accessories", partRows(parts, "accessories"));
  pushField(fields, "Other", partRows(parts, "other"));
  pushField(fields, "Prop", partRows(parts, "prop"));

  const wig = lookRow(parts, "wig");
  const contacts = lookRow(parts, "eyes");

  const itemCount =
    fields.reduce((count, field) => count + field.rows.length, 0) +
    (wig ? 1 : 0) +
    (contacts ? 1 : 0);

  return {
    id: cosplay.id,
    character: cosplay.character,
    series: cosplay.series,
    outfit: outfitDisplay(cosplay.outfit) || undefined,
    wig,
    contacts,
    fields,
    itemCount,
  };
}

function renderSwatch(colorName: string): string {
  const border = swatchNeedsBorderForName(colorName) ? " pin-swatch--border" : "";
  const bg = wigSwatchBackground(colorName);
  return `<span class="pin-swatch${border}" style="background:${escapeHtml(bg)}"></span>`;
}

function renderLookCell(label: string, row: PinCardRowData, modifier: string): string {
  const tint = row.swatchColor ?? resolveSwatchColor(getWigColorPrimary(row.value));
  return `<div class="pin-look pin-look--${modifier}" style="--tint:${escapeHtml(tint)}"><span class="pin-look-label">${escapeHtml(label)}</span>${renderSwatch(row.value)}<span class="pin-look-value">${escapeHtml(row.value)}</span></div>`;
}

function renderLookBand(wig?: PinCardRowData, contacts?: PinCardRowData): string {
  if (!wig && !contacts) return "";

  const cells = [
    wig ? renderLookCell("Hair", wig, "wig") : "",
    contacts ? renderLookCell("Contacts", contacts, "contacts") : "",
  ].filter(Boolean);

  return `<div class="pin-look-band">${cells.join("")}</div>`;
}

function renderItem(row: PinCardRowData): string {
  return `<li class="pin-item"><span class="pin-item-text">${escapeHtml(row.value)}</span></li>`;
}

function renderSection(field: PinCardFieldData): string {
  const items = field.rows.map(renderItem).join("");
  return `<section class="pin-section"><h3 class="pin-section-label">${escapeHtml(field.label)}</h3><ul class="pin-items">${items}</ul></section>`;
}

function compactClass(itemCount: number): string {
  if (itemCount > 14) return " pin-card--dense";
  if (itemCount > 10) return " pin-card--compact";
  return "";
}

function renderCard(card: PinCardData): string {
  const outfitMarkup = card.outfit
    ? `<p class="pin-outfit">${escapeHtml(card.outfit)}</p>`
    : "";

  const sections = card.fields.map(renderSection).join("");
  const density = compactClass(card.itemCount);

  const title = `<h2 class="pin-title"><span class="pin-title-character">${escapeHtml(card.character)}</span><span class="pin-title-sep"> – </span><span class="pin-title-series">${escapeHtml(card.series)}</span></h2>`;

  return `<article class="pin-card${density}" data-cosplay-id="${escapeHtml(card.id)}"><header class="pin-hero">${title}${outfitMarkup}</header>${renderLookBand(card.wig, card.contacts)}<div class="pin-body">${sections}</div></article>`;
}

const PIN_CARD_STYLES = `
  :root {
    color-scheme: light;
    --pin-ink: #3d2b1f;
    --pin-muted: #8b5a6b;
    --pin-line: #ecd9e4;
    --pin-rose: #c45c7a;
    --pin-rose-deep: #a84866;
    --pin-blush: #fce8ef;
    --pin-blush-deep: #f5d6e3;
    --pin-card-bg: #fffcfd;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--pin-ink);
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
    border-bottom: 1px solid var(--pin-line);
    backdrop-filter: blur(8px);
  }

  .print-toolbar button {
    border: none;
    background: linear-gradient(135deg, var(--pin-rose) 0%, var(--pin-rose-deep) 100%);
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
    color: var(--pin-muted);
  }

  .pin-sheet {
    display: grid;
    grid-template-columns: repeat(2, 3in);
    gap: 0.2in;
    padding: 0.25in;
    justify-content: center;
  }

  .pin-card {
    width: 3in;
    height: 5in;
    display: flex;
    flex-direction: column;
    font-size: var(--pin-text);
    line-height: var(--pin-leading);
    background: var(--pin-card-bg);
    border: 1px dashed var(--pin-line);
    border-radius: 0.12in;
    overflow: hidden;
    box-shadow: 0 4px 18px rgba(61, 43, 31, 0.1);
    page-break-inside: avoid;
    break-inside: avoid;
    --pin-text: 7pt;
    --pin-title: 9pt;
    --pin-leading: 1.25;
  }

  .pin-hero {
    flex-shrink: 0;
    padding: 0.14in 0.12in 0.11in;
    text-align: center;
    background: linear-gradient(145deg, var(--pin-blush) 0%, var(--pin-blush-deep) 55%, #f0d4e2 100%);
    border-bottom: 1px solid var(--pin-line);
  }

  .pin-title {
    margin: 0;
    font-size: var(--pin-title);
    font-weight: 800;
    line-height: var(--pin-leading);
    letter-spacing: -0.01em;
    color: var(--pin-ink);
  }

  .pin-title-character {
    font-weight: 800;
  }

  .pin-title-sep {
    font-weight: 600;
    color: var(--pin-muted);
  }

  .pin-title-series {
    font-weight: 600;
    font-style: italic;
    color: var(--pin-rose-deep);
  }

  .pin-outfit {
    margin: 0.05in 0 0;
    font-size: inherit;
    font-weight: 600;
    line-height: var(--pin-leading);
    color: var(--pin-muted);
  }

  .pin-look-band {
    flex-shrink: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.06in;
    padding: 0.08in 0.1in;
    background: #fff;
    border-bottom: 1px solid var(--pin-line);
  }

  .pin-look-band:has(.pin-look:only-child) {
    grid-template-columns: 1fr;
  }

  .pin-look {
    display: flex;
    align-items: center;
    gap: 0.06in;
    min-width: 0;
    padding: 0.06in 0.07in;
    border-radius: 0.08in;
    background: color-mix(in srgb, var(--tint) 14%, #fff);
    border: 1px solid color-mix(in srgb, var(--tint) 35%, var(--pin-line));
  }

  .pin-look-label {
    flex-shrink: 0;
    font-size: inherit;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--pin-muted);
  }

  .pin-swatch {
    flex-shrink: 0;
    width: 0.16in;
    height: 0.16in;
    border-radius: 999px;
    box-shadow: inset 0 -1px 2px rgba(0, 0, 0, 0.12);
  }

  .pin-swatch--border {
    border: 1px solid #cbd5e1;
  }

  .pin-look-value {
    flex: 1;
    min-width: 0;
    font-size: inherit;
    font-weight: 700;
    line-height: var(--pin-leading);
    color: var(--pin-ink);
    word-break: break-word;
  }

  .pin-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0.07in 0.1in 0.1in;
    display: flex;
    flex-direction: column;
    gap: 0.05in;
  }

  .pin-section {
    flex-shrink: 0;
  }

  .pin-section-label {
    margin: 0 0 0.03in;
    padding-bottom: 0.02in;
    font-size: inherit;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--pin-rose);
    border-bottom: 1px solid var(--pin-line);
  }

  .pin-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.025in;
  }

  .pin-item {
    font-size: inherit;
    line-height: var(--pin-leading);
    color: var(--pin-ink);
  }

  .pin-item-text {
    word-break: break-word;
  }

  .pin-card--compact .pin-body {
    gap: 0.035in;
    padding-top: 0.05in;
  }

  .pin-card--compact .pin-section-label {
    margin-bottom: 0.02in;
  }

  .pin-card--compact .pin-items {
    gap: 0.015in;
  }

  .pin-card--dense .pin-hero {
    padding: 0.1in 0.1in 0.08in;
  }

  .pin-card--dense .pin-look-band {
    padding: 0.06in 0.08in;
  }

  .pin-card--dense .pin-body {
    gap: 0.025in;
    padding: 0.05in 0.08in 0.08in;
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

    .pin-sheet {
      padding: 0;
      gap: 0.15in;
    }

    .pin-card {
      border: 1px solid #ccc;
      box-shadow: none;
      border-radius: 0;
    }
  }
`;

export function renderPinCardsHtml(cards: PinCardData[], options?: { title?: string }): string {
  const title = options?.title?.trim() || "Cosplay pin cards";
  const cardMarkup = cards.map(renderCard).join("");
  const countLabel = `${cards.length} card${cards.length === 1 ? "" : "s"} · 3×5 in`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${PIN_CARD_STYLES}</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" onclick="window.print()">Print cards</button>
    <p>${escapeHtml(countLabel)} — trim along dashed borders for pin labels.</p>
  </div>
  <main class="pin-sheet">${cardMarkup}</main>
</body>
</html>`;
}
