import "server-only";

import { Wig } from "@/types/wig";
import { swatchNeedsBorderForName, wigSwatchBackground } from "@/lib/wigColors";
import { categorizeWigColor, WigColorCategory } from "@/lib/print/wigCard";

/** Avery 5260: 30 labels per US Letter sheet (3 × 10). */
export const LABELS_PER_SHEET = 30;
export const LABEL_COLS = 3;
export const LABEL_ROWS = 10;

export interface WigLabelEntry {
  id: string;
  brand: string;
  style: string;
  length: string;
  character?: string;
  color: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toEntry(wig: Wig): WigLabelEntry {
  return {
    id: wig.id,
    brand: wig.brand,
    style: wig.style,
    length: wig.length,
    character: wig.character?.trim() || undefined,
    color: wig.color,
  };
}

const COLOR_CATEGORY_ORDER: WigColorCategory[] = [
  "pink",
  "red",
  "orange",
  "blonde",
  "green",
  "blue",
  "purple",
  "black",
  "gray",
  "white",
  "brown",
];

const COLOR_CATEGORY_RANK = new Map(
  COLOR_CATEGORY_ORDER.map((id, index) => [id, index]),
);

/** Color family first (same order as print cards), then color name, then character. */
export function sortLabelEntries(entries: WigLabelEntry[]): WigLabelEntry[] {
  return [...entries].sort((a, b) => {
    const aCat = COLOR_CATEGORY_RANK.get(categorizeWigColor(a.color)) ?? 99;
    const bCat = COLOR_CATEGORY_RANK.get(categorizeWigColor(b.color)) ?? 99;
    if (aCat !== bCat) return aCat - bCat;

    const color = a.color.localeCompare(b.color);
    if (color !== 0) return color;

    const aTitle = (a.character || a.brand).toLowerCase();
    const bTitle = (b.character || b.brand).toLowerCase();
    const title = aTitle.localeCompare(bTitle);
    if (title !== 0) return title;

    return a.brand.localeCompare(b.brand);
  });
}

export function buildWigLabelEntries(
  wigs: Wig[],
  categories?: WigColorCategory[],
): WigLabelEntry[] {
  const allowed = categories?.length ? new Set(categories) : null;
  const entries: WigLabelEntry[] = [];

  for (const wig of wigs) {
    if (allowed && !allowed.has(categorizeWigColor(wig.color))) continue;
    entries.push(toEntry(wig));
  }

  return sortLabelEntries(entries);
}

function chunkLabels(entries: WigLabelEntry[]): (WigLabelEntry | null)[][] {
  if (entries.length === 0) return [];
  const sheets: (WigLabelEntry | null)[][] = [];

  for (let i = 0; i < entries.length; i += LABELS_PER_SHEET) {
    const slice = entries.slice(i, i + LABELS_PER_SHEET);
    const padded: (WigLabelEntry | null)[] = [...slice];
    while (padded.length < LABELS_PER_SHEET) padded.push(null);
    sheets.push(padded);
  }

  return sheets;
}

function labelTitle(entry: WigLabelEntry): string {
  return entry.character || entry.brand;
}

/** Shrink title for long "Character - Series" names on a 2.625" label. */
function titleFontSize(title: string): string {
  const len = title.length;
  if (len <= 18) return "9pt";
  if (len <= 26) return "8pt";
  if (len <= 34) return "7pt";
  if (len <= 44) return "6pt";
  return "5.5pt";
}

function renderLabel(entry: WigLabelEntry | null): string {
  if (!entry) {
    return `<div class="label label--empty" aria-hidden="true"></div>`;
  }

  const title = labelTitle(entry);
  const style =
    entry.style?.trim() && entry.style.trim() !== entry.color.trim()
      ? entry.style.trim()
      : null;
  const metaParts = [
    entry.character ? entry.brand : null,
    style,
    entry.length || null,
  ].filter(Boolean);
  const meta = metaParts.join(" · ");
  const swatchBg = wigSwatchBackground(entry.color);
  const swatchBorder = swatchNeedsBorderForName(entry.color)
    ? "border:1px solid #c4b5b0;"
    : "border:1px solid transparent;";

  return `<div class="label" data-wig-id="${escapeHtml(entry.id)}">
  <div class="label-inner">
    <p class="label-title" style="font-size:${titleFontSize(title)}">${escapeHtml(title)}</p>
    ${meta ? `<p class="label-meta">${escapeHtml(meta)}</p>` : ""}
    <div class="label-color-row">
      <span class="label-swatch" style="background:${escapeHtml(swatchBg)};${swatchBorder}" aria-hidden="true"></span>
      <span class="label-color">${escapeHtml(entry.color)}</span>
    </div>
  </div>
</div>`;
}

function renderSheet(cells: (WigLabelEntry | null)[], sheetIndex: number, sheetCount: number): string {
  const labels = cells.map(renderLabel).join("");
  const pageAttr = sheetIndex < sheetCount - 1 ? ' data-page-break="1"' : "";

  return `<section class="label-sheet"${pageAttr}>${labels}</section>`;
}

const WIG_LABEL_STYLES = `
  :root {
    color-scheme: light;
    --label-ink: #2c211c;
    --label-muted: #7a5a4a;
    --label-line: #ecd9e4;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    color: var(--label-ink);
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
    border-bottom: 1px solid var(--label-line);
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
    color: var(--label-muted);
    max-width: 42rem;
  }

  .sheets {
    padding: 0.5rem;
  }

  /* Avery 5260 geometry — US Letter, 3×10, 2.625" × 1" */
  .label-sheet {
    width: 8.5in;
    height: 11in;
    margin: 0 auto 0.5rem;
    padding: 0.5in 0.1875in;
    display: grid;
    grid-template-columns: repeat(3, 2.625in);
    grid-template-rows: repeat(10, 1in);
    column-gap: 0.125in;
    row-gap: 0;
    background: #fff;
    box-shadow: 0 4px 18px rgba(61, 43, 31, 0.1);
  }

  .label {
    width: 2.625in;
    height: 1in;
    overflow: hidden;
    border: 1px dashed #e8d5de;
  }

  .label--empty {
    border-color: transparent;
  }

  .label-inner {
    height: 100%;
    padding: 0.08in 0.1in 0.07in;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.02in;
  }

  .label-title {
    margin: 0;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0.01em;
    color: var(--label-ink);
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .label-meta {
    margin: 0;
    font-size: 6.5pt;
    font-weight: 600;
    line-height: 1.15;
    color: var(--label-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .label-color-row {
    display: flex;
    align-items: center;
    gap: 0.06in;
    min-width: 0;
  }

  .label-swatch {
    flex-shrink: 0;
    width: 0.14in;
    height: 0.14in;
    border-radius: 999px;
  }

  .label-color {
    font-size: 6.5pt;
    font-weight: 600;
    line-height: 1.15;
    color: color-mix(in srgb, var(--label-ink) 80%, var(--label-muted));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  @page {
    size: letter;
    margin: 0;
  }

  @media print {
    body {
      background: #fff;
    }

    .print-toolbar {
      display: none !important;
    }

    .sheets {
      padding: 0;
    }

    .label-sheet {
      margin: 0;
      box-shadow: none;
      page-break-after: always;
      break-after: page;
    }

    .label-sheet:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .label {
      border: none;
    }
  }
`;

export function renderWigLabelsHtml(
  entries: WigLabelEntry[],
  options?: { title?: string },
): string {
  const title = options?.title?.trim() || "Wig labels — Avery 5260";
  const sheets = chunkLabels(entries);
  const sheetCount = sheets.length;
  const sheetMarkup = sheets.map((cells, i) => renderSheet(cells, i, sheetCount)).join("");
  const sheetLabel = sheetCount === 1 ? "1 sheet" : `${sheetCount} sheets`;
  const countLabel = `${entries.length} label${entries.length === 1 ? "" : "s"} · ${sheetLabel} · Avery 5260 (30-up) · sorted by color`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${WIG_LABEL_STYLES}</style>
</head>
<body>
  <div class="print-toolbar">
    <button type="button" onclick="window.print()">Print labels</button>
    <p>${escapeHtml(countLabel)}. Use Chrome · Letter · 100% scale · no headers/footers.</p>
  </div>
  <main class="sheets">${sheetMarkup || `<p style="padding:2rem;text-align:center;color:var(--label-muted)">No wigs to label.</p>`}</main>
</body>
</html>`;
}
