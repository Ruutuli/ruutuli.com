import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, readJsonBody, unauthorized } from "@/lib/admin/api";
import { matchEventForConvention, removeGalleryItem, updateGalleryItem } from "@/lib/store/galleryStore";
import { getEvents } from "@/lib/store/eventStore";
import { GalleryItem, isGallerySection } from "@/types/gallery";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody<Partial<GalleryItem>>(request);
  if (!body) return badRequest("Invalid body");

  const patch: Partial<GalleryItem> = {};
  if (typeof body.published === "boolean") patch.published = body.published;
  if (Array.isArray(body.tags)) patch.tags = body.tags;
  if (Array.isArray(body.cosplayIds)) patch.cosplayIds = body.cosplayIds;
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.sortOrder === "number") patch.sortOrder = body.sortOrder;
  if (typeof body.convention === "string") {
    const convention = body.convention.trim() || undefined;
    patch.convention = convention;
    if (convention) {
      const events = await getEvents();
      patch.eventId = matchEventForConvention(convention, events);
    } else {
      patch.eventId = undefined;
    }
  }
  if (typeof body.photographer === "string") patch.photographer = body.photographer.trim() || undefined;
  if (body.imageType === "reference" || body.imageType === "featured") patch.imageType = body.imageType;
  if (body.imageType === null) patch.imageType = null;
  if (isGallerySection(body.gallerySection)) patch.gallerySection = body.gallerySection;
  if (body.gallerySection === null) patch.gallerySection = null;

  const updated = await updateGalleryItem(id, patch);
  if (!updated) return notFound("Gallery item not found");
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const ok = await removeGalleryItem(id);
  if (!ok) return notFound("Gallery item not found");
  return NextResponse.json({ ok: true });
}
