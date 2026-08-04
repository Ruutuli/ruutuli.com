import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, readJsonBody, unauthorized } from "@/lib/admin/api";
import { addGalleryItemsByLinks } from "@/lib/store/galleryStore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<{ links?: string | string[] }>(request);
  const raw = body?.links;
  const links = Array.isArray(raw)
    ? raw
    : (raw ?? "")
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  if (links.length === 0) return badRequest("At least one Drive link or file ID is required");
  if (links.length > 20) return badRequest("Maximum 20 links per batch");

  const result = await addGalleryItemsByLinks(links);
  return NextResponse.json({ ok: true, ...result });
}
