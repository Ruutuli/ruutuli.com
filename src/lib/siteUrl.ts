const DEFAULT_SITE_URL = "https://ruutuli.com";

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return DEFAULT_SITE_URL;
}
