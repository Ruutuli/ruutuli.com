export const WIG_COLOR_MAP: Record<string, string> = {
  black: "#1c1917",
  blue: "#3b82f6",
  navy: "#1e3a5f",
  pink: "#ec4899",
  hotpink: "#db2777",
  red: "#dc2626",
  crimson: "#b91c1c",
  brown: "#78350f",
  brunette: "#5c4033",
  beige: "#d4b896",
  gold: "#d4a017",
  blonde: "#e8c872",
  blond: "#e8c872",
  yellow: "#eab308",
  green: "#16a34a",
  emerald: "#059669",
  purple: "#9333ea",
  violet: "#7c3aed",
  lavender: "#a78bfa",
  orange: "#ea580c",
  white: "#f8fafc",
  grey: "#9ca3af",
  gray: "#9ca3af",
  silver: "#cbd5e1",
  aqua: "#06b6d4",
  cyan: "#0891b2",
  teal: "#0d9488",
  turquoise: "#14b8a6",
  /** Multi / prism / mixed effect colors file with water (aqua–teal). */
  water: "#06b6d4",
  multi: "#06b6d4",
  mixed: "#06b6d4",
  prism: "#06b6d4",
  rainbow: "#06b6d4",
  magenta: "#d946ef",
  peach: "#fdba74",
  cream: "#fef3c7",
  none: "#e2e8f0",
};

const LIGHT_SWATCHES = new Set(["#f8fafc", "#fef3c7", "#e8c872", "#fdba74", "#e2e8f0", "#d4b896"]);

/** Watercolor / multi-streak swatch — aqua through violet. */
const MULTI_WATER_SWATCH =
  "linear-gradient(135deg, #67e8f9 0%, #22d3ee 18%, #06b6d4 36%, #3b82f6 55%, #8b5cf6 78%, #ec4899 100%)";

const MULTI_WATER_TOKENS = ["multi", "mixed", "prism", "rainbow", "watercolor", "water"] as const;

/** True when the label is a multi/effect color that belongs with water (aqua–teal). */
export function isMultiWaterWigColor(name: string): boolean {
  const lower = name.toLowerCase();
  return MULTI_WATER_TOKENS.some((token) => {
    if (token === "water") {
      // Avoid matching unrelated words; allow bare "water" / "watercolor".
      return (
        lower === "water" ||
        lower.includes("watercolor") ||
        /(^|[^a-z])water([^a-z]|$)/.test(lower)
      );
    }
    return lower.includes(token);
  });
}

export function parseWigColorSegments(name: string): { primary: string; secondary?: string } {
  const parts = name
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    primary: parts[0] ?? name.trim(),
    secondary: parts[1],
  };
}

export function getWigColorPrimary(name: string): string {
  return parseWigColorSegments(name).primary;
}

/** Resolve a color label (single segment or full string) to a hex swatch. */
export function resolveSwatchColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower === "none" || lower === "n/a") return WIG_COLOR_MAP.none;
  if (isMultiWaterWigColor(lower)) return WIG_COLOR_MAP.water;

  for (const [key, hex] of Object.entries(WIG_COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }

  return "#d4b8c4";
}

export function resolveWigSwatch(name: string): { from: string; to?: string } {
  if (isMultiWaterWigColor(name)) {
    return { from: WIG_COLOR_MAP.water, to: WIG_COLOR_MAP.purple };
  }
  const { primary, secondary } = parseWigColorSegments(name);
  const from = resolveSwatchColor(primary);
  if (!secondary) return { from };
  return { from, to: resolveSwatchColor(secondary) };
}

/** CSS background for swatches — gradient when the name has two colors separated by ";". */
export function wigSwatchBackground(name: string): string {
  if (isMultiWaterWigColor(name)) return MULTI_WATER_SWATCH;
  const { from, to } = resolveWigSwatch(name);
  if (!to || to === from) return from;
  return `linear-gradient(135deg, ${from} 0%, ${from} 42%, ${to} 100%)`;
}

export function swatchNeedsBorder(hex: string): boolean {
  return LIGHT_SWATCHES.has(hex.toLowerCase());
}

export function swatchNeedsBorderForName(name: string): boolean {
  if (isMultiWaterWigColor(name)) return false;
  const { from, to } = resolveWigSwatch(name);
  return swatchNeedsBorder(from) || (to ? swatchNeedsBorder(to) : false);
}

/** Filter/group key — multi/prism/etc. group with water (teal). */
export function getWigColorFamily(name: string): string {
  if (isMultiWaterWigColor(name)) return "teal";

  const lower = getWigColorPrimary(name).toLowerCase();
  const keys = Object.keys(WIG_COLOR_MAP)
    .filter((key) => key !== "none")
    .sort((a, b) => b.length - a.length);

  for (const key of keys) {
    if (lower.includes(key)) return key;
  }

  return "other";
}

export function wigColorFamilyLabel(family: string): string {
  if (family === "other") return "Other";
  return family.charAt(0).toUpperCase() + family.slice(1);
}
