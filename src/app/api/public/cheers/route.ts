import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  addCheer,
  getCheerCounts,
  getVisitorCheeredToday,
} from "@/lib/store/cheerStore";

export const dynamic = "force-dynamic";

const CHEER_VID_COOKIE = "cheer_vid";
const CHEER_VID_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

function cheerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CHEER_VID_MAX_AGE,
  };
}

async function ensureVisitorId(): Promise<{ visitorId: string; isNew: boolean }> {
  const jar = await cookies();
  const existing = jar.get(CHEER_VID_COOKIE)?.value?.trim();
  if (existing) return { visitorId: existing, isNew: false };
  return { visitorId: randomUUID(), isNew: true };
}

function applyVisitorCookie(response: NextResponse, visitorId: string, isNew: boolean) {
  if (isNew) {
    response.cookies.set(CHEER_VID_COOKIE, visitorId, cheerCookieOptions());
  }
  return response;
}

function parseIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ].slice(0, 100);
}

export async function GET(request: NextRequest) {
  const ids = parseIds(request.nextUrl.searchParams.get("ids"));
  const { visitorId, isNew } = await ensureVisitorId();

  const counts = await getCheerCounts(ids.length ? ids : undefined);
  const cheeredToday = ids.length
    ? await getVisitorCheeredToday(visitorId, ids)
    : ({} as Record<string, boolean>);

  const payload = ids.length
    ? Object.fromEntries(
        ids.map((id) => [
          id,
          {
            count: counts[id] ?? 0,
            alreadyCheeredToday: Boolean(cheeredToday[id]),
          },
        ]),
      )
    : Object.fromEntries(
        Object.entries(counts).map(([id, count]) => [
          id,
          { count, alreadyCheeredToday: false },
        ]),
      );

  const response = NextResponse.json({ cheers: payload });
  return applyVisitorCookie(response, visitorId, isNew);
}

export async function POST(request: NextRequest) {
  let body: { cosplayId?: string } | null = null;
  try {
    body = (await request.json()) as { cosplayId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cosplayId = body?.cosplayId?.trim();
  if (!cosplayId) {
    return NextResponse.json({ error: "cosplayId is required" }, { status: 400 });
  }

  const { visitorId, isNew } = await ensureVisitorId();
  const result = await addCheer(cosplayId, visitorId);

  if (!result.ok) {
    const status =
      result.error === "not_found" ? 404 : result.error === "not_cheerable" ? 400 : 400;
    const message =
      result.error === "not_found"
        ? "Cosplay not found"
        : result.error === "not_cheerable"
          ? "This build is not open for cheers"
          : "Invalid request";
    const response = NextResponse.json({ error: message }, { status });
    return applyVisitorCookie(response, visitorId, isNew);
  }

  const response = NextResponse.json({
    cosplayId,
    count: result.count,
    alreadyCheeredToday: result.alreadyCheeredToday,
  });
  return applyVisitorCookie(response, visitorId, isNew);
}
