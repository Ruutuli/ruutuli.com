export const ADMIN_COOKIE = "ruutuli_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function getSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Admin auth is not configured");
  }

  const issuedAt = Date.now().toString();
  const sig = await hmacSha256Hex(secret, issuedAt);
  return `${issuedAt}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!isAdminAuthConfigured()) return false;
  if (!token) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;

  const expected = await hmacSha256Hex(secret, issuedAt);
  if (!timingSafeEqual(sig, expected)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age < SESSION_MAX_AGE_SEC * 1000;
}

export function sessionMaxAgeSec(): number {
  return SESSION_MAX_AGE_SEC;
}
