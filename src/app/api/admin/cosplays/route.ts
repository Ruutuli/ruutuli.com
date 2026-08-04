import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, requireAdmin } from "@/lib/admin/auth";
import { badRequest, notFound, readJsonBody, unauthorized } from "@/lib/admin/api";
import {
  createCosplay,
  deleteCosplay,
  getCosplaysForAdminList,
  nextCosplaySortOrder,
  updateCosplay,
} from "@/lib/store/cosplayStore";
import { Cosplay } from "@/types/cosplay";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const cosplays = await getCosplaysForAdminList();
  return NextResponse.json(cosplays);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<Cosplay>>(request);
  if (!body?.character || !body.series) {
    return badRequest("character and series are required");
  }

  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : await nextCosplaySortOrder();

  const cosplay = await createCosplay({
    title: body.title || body.character,
    character: body.character,
    series: body.series,
    status: body.status || "planned",
    description: body.description || "",
    characterArt: body.characterArt || "",
    image: body.image || "",
    gallery: body.gallery || [],
    accent: body.accent || "from-rose-500 to-red-700",
    tags: body.tags || [],
    outfit: body.outfit,
    convention: body.convention,
    deadline: body.deadline,
    progress: body.progress,
    parts: body.parts,
    sources: body.sources,
    featured: body.featured,
    spotlight: body.spotlight,
    sortOrder,
  });

  return NextResponse.json(cosplay, { status: 201 });
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<Partial<Cosplay> & { id?: string }>(request);
  if (!body?.id) return badRequest("id is required");

  const updated = await updateCosplay(body.id, body);
  if (!updated) return notFound("Cosplay not found");
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return badRequest("id query param is required");

  const ok = await deleteCosplay(id);
  if (!ok) return notFound("Cosplay not found");
  return NextResponse.json({ ok: true });
}
