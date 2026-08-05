import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  createSessionToken,
  isAdminAuthConfigured,
  sessionMaxAgeSec,
  verifySessionToken,
} from "@/lib/admin/sessionToken";

export {
  ADMIN_COOKIE,
  createSessionToken,
  isAdminAuthConfigured,
  verifySessionToken,
} from "@/lib/admin/sessionToken";

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(ADMIN_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: sessionMaxAgeSec(),
  };
}

export async function requireAdmin(): Promise<void> {
  if (!isAdminAuthConfigured() || !(await isAdminAuthenticated())) {
    throw new Error("UNAUTHORIZED");
  }
}
