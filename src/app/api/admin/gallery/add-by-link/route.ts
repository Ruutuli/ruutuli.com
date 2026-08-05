import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, readJsonBody, unauthorized } from "@/lib/admin/api";
import { addGalleryItemsByLinks } from "@/lib/store/galleryStore";
import { GallerySection, isGallerySection } from "@/types/gallery";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<{
    links?: string | string[];
    cosplayId?: string;
    gallerySection?: GallerySection;
  }>(request);
  const raw = body?.links;
  const links = Array.isArray(raw)
    ? raw
    : (raw ?? "")
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

  if (links.length === 0) return badRequest("At least one image link is required");
  if (links.length > 20) return badRequest("Maximum 20 links per batch");

  const cosplayId = typeof body?.cosplayId === "string" ? body.cosplayId.trim() : undefined;
  const gallerySection = isGallerySection(body?.gallerySection) ? body.gallerySection : undefined;

  const result = await addGalleryItemsByLinks(links, {
    cosplayId: cosplayId || undefined,
    gallerySection,
  });
  return NextResponse.json({ ok: true, ...result });
}
