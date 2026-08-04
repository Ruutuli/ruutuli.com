import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { notFound, unauthorized } from "@/lib/admin/api";
import { parseGalleryItemFilenameTags } from "@/lib/store/galleryStore";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const updated = await parseGalleryItemFilenameTags(id, true);
  if (!updated) return notFound("Gallery item not found");
  return NextResponse.json(updated);
}
