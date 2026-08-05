import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, readJsonBody, unauthorized } from "@/lib/admin/api";
import { createWig, deleteWig, getWigs, updateWig } from "@/lib/store/wigStore";
import { Wig } from "@/types/wig";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  return NextResponse.json(await getWigs());
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<Wig>>(request);
  if (!body?.brand || !body.color) return badRequest("brand and color are required");

  const wig = await createWig({
    brand: body.brand,
    style: body.style || "",
    length: body.length || "",
    character: body.character,
    color: body.color,
  });

  return NextResponse.json(wig, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<Wig> & { id?: string }>(request);
  if (!body?.id) return badRequest("id is required");

  const updated = await updateWig(body.id, body);
  if (!updated) return notFound("Wig not found");
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("id is required");

  const ok = await deleteWig(id);
  if (!ok) return notFound("Wig not found");
  return NextResponse.json({ ok: true });
}
