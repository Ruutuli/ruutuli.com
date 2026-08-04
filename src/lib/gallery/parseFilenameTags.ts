/** Guess convention and photographer from common cosplay photo filenames. */
export function parseGalleryFilenameTags(
  filename: string,
  knownConventions: string[] = [],
): { convention?: string; photographer?: string } {
  const base = filename.replace(/\.[^.]+$/i, "").trim();
  if (!base) return {};

  const semicolonParsed = parseSemicolonFormat(base, knownConventions);
  if (semicolonParsed) return semicolonParsed;

  let photographer: string | undefined;
  let convention: string | undefined;

  const byPatterns = [
    /\b(?:photo(?:graphy)?|pic(?:s)?|image|shoot)\s+by\s+(.+?)(?:\s[-–|]|$)/i,
    /\bby\s+(.+?)(?:\s[-–|]|$)/i,
    /\bphotog(?:rapher)?[:\s]+(.+?)(?:\s[-–|]|$)/i,
  ];

  for (const pattern of byPatterns) {
    const match = base.match(pattern);
    if (match?.[1]) {
      photographer = cleanSegment(match[1]);
      break;
    }
  }

  const atMatch = base.match(/@([a-zA-Z0-9_.-]{2,})/);
  if (atMatch?.[1]) {
    photographer = photographer ?? `@${atMatch[1]}`;
  }

  const sortedKnown = [...knownConventions].sort((a, b) => b.length - a.length);
  const lowerBase = base.toLowerCase();
  for (const con of sortedKnown) {
    if (con && lowerBase.includes(con.toLowerCase())) {
      convention = con;
      break;
    }
  }

  if (!convention) {
    convention = matchConventionInText(base);
  }

  if (!photographer) {
    const segments = base.split(/\s*[-–|]\s*/).map(cleanSegment).filter(Boolean);
    if (segments.length >= 2) {
      const last = segments[segments.length - 1]!;
      if (looksLikePhotographer(last) && !looksLikeConvention(last)) {
        photographer = cleanPhotographerSegment(last);
      }
    }
  }

  if (photographer && convention && photographer.toLowerCase() === convention.toLowerCase()) {
    photographer = undefined;
  }

  return {
    convention: convention || undefined,
    photographer: photographer || undefined,
  };
}

/**
 * Ruu's usual format: `Character ; Con Year ; Photographer`
 * e.g. `!!!cindy ; katsucon 2017 ; EBK (2)UPLOADED.jpg`
 */
function parseSemicolonFormat(
  base: string,
  knownConventions: string[],
): { convention?: string; photographer?: string } | null {
  if (!base.includes(";")) return null;

  const segments = base
    .split(/\s*;\s*/)
    .map((segment) => cleanSegment(stripLeadingNoise(segment)))
    .filter(Boolean);

  if (segments.length < 2) return null;

  let convention: string | undefined;
  let photographer: string | undefined;

  if (segments.length >= 3) {
    convention = resolveConvention(segments[1]!, knownConventions, base);
    photographer = cleanPhotographerSegment(segments[2]!);
  } else {
    const [first, second] = segments;
    if (first && (looksLikeConvention(first) || /\b\d{4}\b/.test(first))) {
      convention = resolveConvention(first, knownConventions, base);
      photographer = cleanPhotographerSegment(second!);
    } else if (second) {
      convention = resolveConvention(first!, knownConventions, base);
      photographer = cleanPhotographerSegment(second);
    }
  }

  if (!convention && !photographer) return null;

  if (photographer && convention && photographer.toLowerCase() === convention.toLowerCase()) {
    photographer = undefined;
  }

  return {
    convention: convention || undefined,
    photographer: photographer || undefined,
  };
}

function resolveConvention(segment: string, knownConventions: string[], fullBase: string): string | undefined {
  const cleaned = cleanSegment(segment);
  if (!cleaned) return undefined;

  const lower = cleaned.toLowerCase();
  const sortedKnown = [...knownConventions].sort((a, b) => b.length - a.length);
  for (const con of sortedKnown) {
    if (con && lower.includes(con.toLowerCase())) return con;
  }

  const matched = matchConventionInText(cleaned);
  if (matched) return matched;

  return titleCaseConvention(cleaned);
}

function matchConventionInText(text: string): string | undefined {
  const builtInConPatterns: { pattern: RegExp; normalize: (m: RegExpMatchArray) => string }[] = [
    { pattern: /\bmag\s*fest(?:\s*(\d{2,4}))?\b/i, normalize: (m) => (m[1] ? `MAGFest ${m[1]}` : "MAGFest") },
    { pattern: /\bdragon\s*con(?:\s*(\d{2,4}))?\b/i, normalize: (m) => (m[1] ? `Dragon Con ${m[1]}` : "Dragon Con") },
    { pattern: /\banime\s*expo(?:\s*(\d{2,4}))?\b/i, normalize: (m) => (m[1] ? `Anime Expo ${m[1]}` : "Anime Expo") },
    { pattern: /\bcolossal\s*con(?:\s*(\d{2,4}))?\b/i, normalize: (m) => (m[1] ? `Colossal Con ${m[1]}` : "Colossal Con") },
    { pattern: /\bkatsucon(?:\s*(\d{2,4}))?\b/i, normalize: (m) => (m[1] ? `Katsucon ${m[1]}` : "Katsucon") },
    { pattern: /\botakon(?:\s*(\d{2,4}))?\b/i, normalize: (m) => (m[1] ? `Otakon ${m[1]}` : "Otakon") },
    { pattern: /\bpax(?:\s*(?:east|west|south|unplugged))?(?:\s*(\d{2,4}))?\b/i, normalize: (m) => `PAX${m[1] ? ` ${m[1]}` : ""}` },
  ];

  for (const { pattern, normalize } of builtInConPatterns) {
    const match = text.match(pattern);
    if (match) return normalize(match);
  }

  return undefined;
}

function titleCaseConvention(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => {
      if (/^\d{4}$/.test(word)) return word;
      if (word.length <= 3 && /^[a-z]+$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function stripLeadingNoise(value: string): string {
  return value.replace(/^[!#*+\-–|]+\s*/, "").trim();
}

function cleanPhotographerSegment(value: string): string {
  return cleanSegment(value)
    .replace(/\(\d+\)\s*uploaded?\s*$/i, "")
    .replace(/\s*uploaded?\s*$/i, "")
    .replace(/\(\d+\)\s*$/i, "")
    .trim();
}

function cleanSegment(value: string): string {
  return value.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
}

function looksLikePhotographer(value: string): boolean {
  const v = value.toLowerCase();
  if (v.startsWith("@")) return true;
  if (/\b(by|con|fest|expo|magfest|dragon)\b/.test(v)) return false;
  return value.length >= 2 && value.length <= 48;
}

function looksLikeConvention(value: string): boolean {
  return /\b(con|fest|expo|magfest|otakon|pax|katsu)\b/i.test(value);
}
