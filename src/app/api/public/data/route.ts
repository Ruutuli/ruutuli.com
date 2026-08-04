import { NextResponse } from "next/server";
import { getCosplays } from "@/lib/store/cosplayStore";
import { getTasks } from "@/lib/store/taskStore";
import { getSiteConfig } from "@/lib/server/siteConfig";

export async function GET() {
  const [cosplays, tasks, site] = await Promise.all([getCosplays(), getTasks(), getSiteConfig()]);
  return NextResponse.json({ cosplays, tasks, site });
}
