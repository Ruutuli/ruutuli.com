import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, requireAdmin } from "@/lib/admin/auth";
import { readJsonBody, unauthorized } from "@/lib/admin/api";
import { getSettings, updateSettings } from "@/lib/store/settingsStore";
import { SiteSettings } from "@/types/settings";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json(await getSettings());
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<SiteSettings>>(request);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const updated = await updateSettings(body);
  return NextResponse.json(updated);
}
