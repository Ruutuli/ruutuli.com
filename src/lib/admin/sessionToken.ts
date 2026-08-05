import crypto from "crypto";

export const ADMIN_COOKIE = "ruutuli_admin_session";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

function getSessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function createSessionToken(): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Admin auth is not configured");
  }

  const issuedAt = Date.now().toString();
  const sig = crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
  return `${issuedAt}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!isAdminAuthConfigured()) return false;
  if (!token) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;

  const expected = crypto.createHmac("sha256", secret).update(issuedAt).digest("hex");
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age < SESSION_MAX_AGE_SEC * 1000;
}

export function sessionMaxAgeSec(): number {
  return SESSION_MAX_AGE_SEC;
}
