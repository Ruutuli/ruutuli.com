import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, readJsonBody, unauthorized } from "@/lib/admin/api";
import { reorderCosplays } from "@/lib/store/cosplayStore";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const body = await readJsonBody<{ orderedIds?: string[] }>(request);
  if (!body?.orderedIds?.length) {
    return badRequest("orderedIds array is required");
  }

  const cosplays = await reorderCosplays(body.orderedIds);
  return NextResponse.json(cosplays);
}
