import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, requireAdmin } from "@/lib/admin/auth";
import { readJsonBody, unauthorized } from "@/lib/admin/api";
import { getMediaKitSettings, saveMediaKitSettings } from "@/lib/store/mediaKitStore";
import { MediaKitSettings } from "@/types/mediaKit";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json(await getMediaKitSettings());
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<MediaKitSettings>(request);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updated = await saveMediaKitSettings(body);
  return NextResponse.json(updated);
}
