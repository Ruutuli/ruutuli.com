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
  water: "#06b6d4",
  /** Multi / prism / rainbow effect colors file with white. */
  multi: "#f8fafc",
  mixed: "#f8fafc",
  prism: "#f8fafc",
  rainbow: "#f8fafc",
  magenta: "#d946ef",
  peach: "#fdba74",
  cream: "#fef3c7",
  none: "#e2e8f0",
};

const LIGHT_SWATCHES = new Set(["#f8fafc", "#fef3c7", "#e8c872", "#fdba74", "#e2e8f0", "#d4b896"]);

/** Rainbow swatch for multi / prism / streak effect colors. */
const MULTI_EFFECT_SWATCH =
  "linear-gradient(135deg, #f8fafc 0%, #67e8f9 18%, #3b82f6 40%, #8b5cf6 62%, #ec4899 82%, #f8fafc 100%)";

const MULTI_EFFECT_TOKENS = ["multi", "mixed", "prism", "rainbow"] as const;

/** True for multi / prism / rainbow effect labels (file under white). */
export function isMultiEffectWigColor(name: string): boolean {
  const lower = name.toLowerCase();
  return MULTI_EFFECT_TOKENS.some((token) => lower.includes(token));
}

/** @deprecated Use isMultiEffectWigColor — kept for any older imports. */
export function isMultiWaterWigColor(name: string): boolean {
  return isMultiEffectWigColor(name);
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
  if (isMultiEffectWigColor(lower)) return WIG_COLOR_MAP.white;

  for (const [key, hex] of Object.entries(WIG_COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }

  return "#d4b8c4";
}

export function resolveWigSwatch(name: string): { from: string; to?: string } {
  if (isMultiEffectWigColor(name)) {
    return { from: WIG_COLOR_MAP.white, to: WIG_COLOR_MAP.purple };
  }
  const { primary, secondary } = parseWigColorSegments(name);
  const from = resolveSwatchColor(primary);
  if (!secondary) return { from };
  return { from, to: resolveSwatchColor(secondary) };
}

/** CSS background for swatches — gradient when the name has two colors separated by ";". */
export function wigSwatchBackground(name: string): string {
  if (isMultiEffectWigColor(name)) return MULTI_EFFECT_SWATCH;
  const { from, to } = resolveWigSwatch(name);
  if (!to || to === from) return from;
  return `linear-gradient(135deg, ${from} 0%, ${from} 42%, ${to} 100%)`;
}

export function swatchNeedsBorder(hex: string): boolean {
  return LIGHT_SWATCHES.has(hex.toLowerCase());
}

export function swatchNeedsBorderForName(name: string): boolean {
  if (isMultiEffectWigColor(name)) return true;
  const { from, to } = resolveWigSwatch(name);
  return swatchNeedsBorder(from) || (to ? swatchNeedsBorder(to) : false);
}

/** Filter/group key — multi/prism/rainbow group with white. */
export function getWigColorFamily(name: string): string {
  if (isMultiEffectWigColor(name)) return "white";

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
