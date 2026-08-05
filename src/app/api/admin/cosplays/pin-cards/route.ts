import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, unauthorized } from "@/lib/admin/api";
import { getCosplayById, getCosplays } from "@/lib/store/cosplayStore";
import { buildPinCardData, renderPinCardsHtml } from "@/lib/print/pinCard";

function parseIdList(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format")?.trim().toLowerCase() ?? "html";
  const all = searchParams.get("all") === "1";
  const id = searchParams.get("id");
  const ids = parseIdList(searchParams.get("ids"));

  let cosplayIds: string[] = [];
  if (all) {
    const cosplays = await getCosplays();
    cosplayIds = cosplays.map((cosplay) => cosplay.id);
  } else if (ids.length > 0) {
    cosplayIds = ids;
  } else if (id?.trim()) {
    cosplayIds = [id.trim()];
  } else {
    return badRequest("Provide id, ids, or all=1");
  }

  if (cosplayIds.length === 0) {
    return badRequest("No cosplays matched the request");
  }

  const cosplays = [];
  for (const cosplayId of cosplayIds) {
    const cosplay = await getCosplayById(cosplayId);
    if (!cosplay) return notFound(`Cosplay not found: ${cosplayId}`);
    cosplays.push(cosplay);
  }

  const cards = cosplays.map(buildPinCardData);

  if (format === "json") {
    return NextResponse.json({ cards, count: cards.length });
  }

  if (format !== "html") {
    return badRequest("format must be html or json");
  }

  const html = renderPinCardsHtml(cards);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
