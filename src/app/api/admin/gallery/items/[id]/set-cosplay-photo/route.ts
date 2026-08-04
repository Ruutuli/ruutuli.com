import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, readJsonBody, unauthorized } from "@/lib/admin/api";
import {
  CosplayPhotoRole,
  clearGalleryImageAsCosplayPhoto,
  setGalleryImageAsCosplayPhoto,
} from "@/lib/store/galleryStore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await readJsonBody<{ cosplayId?: string; role?: CosplayPhotoRole; clear?: boolean }>(request);

  const cosplayId = body?.cosplayId?.trim();
  const role = body?.role;
  const clear = body?.clear === true;

  if (!cosplayId) return badRequest("cosplayId is required");
  if (role !== "characterArt" && role !== "image") {
    return badRequest('role must be "characterArt" or "image"');
  }

  const result = clear
    ? await clearGalleryImageAsCosplayPhoto(id, cosplayId, role)
    : await setGalleryImageAsCosplayPhoto(id, cosplayId, role);
  if (!result) return notFound("Gallery item or cosplay not found, or photo is not set to this image");

  return NextResponse.json({
    ok: true,
    role,
    clear,
    cosplay: result.cosplay,
    galleryItem: result.galleryItem,
  });
}
