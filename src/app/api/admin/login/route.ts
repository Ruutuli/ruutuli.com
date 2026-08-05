import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  createSessionToken,
  getAdminPassword,
  sessionCookieOptions,
} from "@/lib/admin/auth";
import { badRequest, readJsonBody } from "@/lib/admin/api";

export async function POST(request: Request) {
  const password = getAdminPassword();
  if (!password) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_PASSWORD in .env" },
      { status: 503 }
    );
  }

  const body = await readJsonBody<{ password?: string }>(request as never);
  if (!body?.password) return badRequest("Password is required");

  if (body.password !== password) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, sessionCookieOptions());

  return NextResponse.json({ ok: true });
}
