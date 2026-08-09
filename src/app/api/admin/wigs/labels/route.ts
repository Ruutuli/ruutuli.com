import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { badRequest, unauthorized } from "@/lib/admin/api";
import { getWigs } from "@/lib/store/wigStore";
import { WigColorCategory } from "@/lib/print/wigCard";
import { buildWigLabelEntries, renderWigLabelsHtml } from "@/lib/print/wigLabels";

const VALID_CATEGORIES = new Set<WigColorCategory>([
  "pink",
  "red",
  "orange",
  "blonde",
  "green",
  "blue",
  "purple",
  "black",
  "gray",
  "white",
  "brown",
]);

function parseCategories(raw: string | null): WigColorCategory[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is WigColorCategory => VALID_CATEGORIES.has(value as WigColorCategory));
}

function parseIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format")?.trim().toLowerCase() ?? "html";
  const categories = parseCategories(searchParams.get("categories") ?? searchParams.get("category"));
  const ids = parseIds(searchParams.get("ids"));

  const wigs = await getWigs();
  const entries = buildWigLabelEntries(wigs, {
    categories: categories.length > 0 ? categories : undefined,
    ids: ids.length > 0 ? ids : undefined,
  });

  if (entries.length === 0) {
    return badRequest(
      ids.length > 0
        ? "No wigs matched the selected labels"
        : "No wigs matched the requested color categories",
    );
  }

  if (format === "json") {
    return NextResponse.json({
      labels: entries,
      count: entries.length,
      sheets: Math.ceil(entries.length / 30),
    });
  }

  if (format !== "html") {
    return badRequest("format must be html or json");
  }

  const html = renderWigLabelsHtml(entries);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
