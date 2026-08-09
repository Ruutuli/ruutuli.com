import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/admin/api";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getCheerCounts } from "@/lib/store/cheerStore";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const cheerCounts = await getCheerCounts();
  return NextResponse.json({ cheerCounts });
}
