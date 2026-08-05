import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { unauthorized } from "@/lib/admin/api";
import { restoreGalleryFromDrive } from "@/lib/store/galleryStore";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  try {
    const result = await restoreGalleryFromDrive();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    logger.error("GalleryRestore", "Restore failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      {
        error: "Gallery restore failed",
        hint: err instanceof Error ? err.message : "Check Drive credentials and folder sharing",
      },
      { status: 500 },
    );
  }
}
