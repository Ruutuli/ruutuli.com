"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Cosplay, CosplayStatus, dedupeCosplaysById, getCosplayPartsPercent } from "@/types/cosplay";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { resolveImageSrc } from "@/lib/utils/googleDriveImage";
import {
  COSPLAY_SORT_OPTIONS,
  CosplaySortBy,
  sortCosplays,
} from "@/lib/cosplay/sort";
import { IconPlus } from "./icons";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminSearch,
  AdminSelect,
  AdminStatusBadge,
  AdminToast,
} from "./ui";

const STATUSES: CosplayStatus[] = ["planned", "in-progress", "completed", "retired"];

export default function AdminCosplayManager({ initial }: { initial?: Cosplay[] }) {
  const [cosplays, setCosplays] = useState<Cosplay[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial?.length);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CosplayStatus | "all">("all");
  const [sortBy, setSortBy] = useState<CosplaySortBy>("custom");
  const [message, setMessage] = useState("");
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (initial?.length) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/admin/cosplays");
        if (!res.ok) throw new Error("fetch failed");
        const data = dedupeCosplaysById((await res.json()) as Cosplay[]);
        if (!cancelled) setCosplays(data);
      } catch {
        if (!cancelled) setMessage("Could not load roster");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initial]);

  const canReorder = sortBy === "custom" && statusFilter === "all" && !query.trim();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = cosplays.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.character.toLowerCase().includes(q) ||
        c.series.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
    return sortCosplays(matched, sortBy);
  }, [cosplays, query, statusFilter, sortBy]);

  const counts = useMemo(
    () => ({
      all: cosplays.length,
      planned: cosplays.filter((c) => c.status === "planned").length,
      "in-progress": cosplays.filter((c) => c.status === "in-progress").length,
      completed: cosplays.filter((c) => c.status === "completed").length,
      retired: cosplays.filter((c) => c.status === "retired").length,
    }),
    [cosplays],
  );

  async function remove(id: string) {
    if (!id?.trim() || id === "undefined") {
      setMessage("Could not delete — missing build id. Refresh and try again.");
      return;
    }
    if (!confirm("Delete this cosplay?")) return;
    const res = await fetch(`/api/admin/cosplays?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Could not delete");
      return;
    }
    setCosplays((prev) => prev.filter((c) => c.id !== id));
    setMessage("Cosplay deleted");
  }

  async function moveBuild(id: string, direction: -1 | 1) {
    if (!canReorder || reordering) return;

    const ordered = sortCosplays(cosplays, "custom");
    const index = ordered.findIndex((c) => c.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= ordered.length) return;

    const nextIds = ordered.map((c) => c.id);
    [nextIds[index], nextIds[swapIndex]] = [nextIds[swapIndex], nextIds[index]];

    setReordering(true);
    try {
      const res = await fetch("/api/admin/cosplays/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: nextIds }),
      });
      if (!res.ok) {
        setMessage("Could not save roster order");
        return;
      }
      const updated = dedupeCosplaysById((await res.json()) as Cosplay[]);
      setCosplays(updated);
      setMessage("Roster order updated");
    } finally {
      setReordering(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Roster"
        description={`${cosplays.length} builds on your roster`}
        action={
          <Link href="/admin/cosplays/new" className="admin-btn-primary inline-flex items-center gap-2">
            <IconPlus />
            Add build
          </Link>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Search character, series, id…"
          className="max-w-md flex-1"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <AdminSelect
            label="Sort by"
            value={sortBy}
            onChange={(v) => setSortBy(v as CosplaySortBy)}
            options={COSPLAY_SORT_OPTIONS}
            className="w-full min-w-[11rem] sm:w-auto"
          />
          <div className="flex flex-wrap gap-2 pb-0.5">
            {(["all", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  statusFilter === s
                    ? "bg-closet-rose text-white"
                    : "bg-white text-closet-brown-light ring-1 ring-closet-pink/60 hover:bg-closet-blush/40"
                }`}
              >
                {s === "all" ? "All" : s === "in-progress" ? "In progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1.5 opacity-70">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {canReorder && (
        <p className="text-sm text-closet-brown-light">
          Use the arrows to set the public roster order. Visitors see this when they pick{" "}
          <span className="font-semibold text-closet-brown">Custom order</span>.
        </p>
      )}

      <AdminCard>
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-closet-blush/60" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            title="No roster builds found"
            description={
              query || statusFilter !== "all"
                ? "Try a different search or filter."
                : "Add your first build to get started."
            }
          />
        ) : (
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-closet-blush/90 text-xs uppercase tracking-wide text-closet-brown-light backdrop-blur-sm">
                <tr>
                  {canReorder && <th className="w-16 px-3 py-3.5 font-bold">Order</th>}
                  <th className="px-5 py-3.5 font-bold">Build</th>
                  <th className="px-4 py-3.5 font-bold">Series</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Progress</th>
                  <th className="px-4 py-3.5 font-bold">Spotlight</th>
                  <th className="px-5 py-3.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const partsPct = getCosplayPartsPercent(c);
                  const progress =
                    partsPct ?? c.progress?.[0]?.percent ?? (c.status === "completed" ? 100 : 0);
                  const partsLabel =
                    c.parts?.length != null && c.parts.length > 0
                      ? `${c.parts.filter((p) => p.owned).length}/${c.parts.length}`
                      : null;
                  const customOrder = sortCosplays(cosplays, "custom");
                  const customIndex = customOrder.findIndex((item) => item.id === c.id);

                  return (
                    <tr key={c.id} className="admin-table-row">
                      {canReorder && (
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveBuild(c.id, -1)}
                              disabled={reordering || customIndex <= 0}
                              className="admin-btn-icon !h-7 !w-7 disabled:opacity-30"
                              aria-label={`Move ${c.character} up`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveBuild(c.id, 1)}
                              disabled={reordering || customIndex >= customOrder.length - 1}
                              className="admin-btn-icon !h-7 !w-7 disabled:opacity-30"
                              aria-label={`Move ${c.character} down`}
                            >
                              ↓
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/cosplays/${c.id}/edit`}
                          className="flex items-center gap-3 hover:opacity-80"
                        >
                          <div className="relative flex h-11 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-closet-pink/50 bg-closet-blush">
                            {!isCosplayPlaceholderImage(c.characterArt) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolveImageSrc(c.characterArt)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-display text-sm font-bold text-closet-rose/40">
                                {c.character.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-closet-brown">{c.character}</p>
                            <p className="text-xs text-closet-brown-light">{c.outfit ?? "Default"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-closet-brown-light">{c.series}</td>
                      <td className="px-4 py-3.5">
                        <AdminStatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {c.status === "retired" ? (
                          <span className="text-xs text-closet-brown-light">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-closet-blush">
                              <div className="h-full rounded-full bg-closet-rose" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs font-semibold text-closet-brown-light">
                              {progress}%
                              {partsLabel ? ` · ${partsLabel} parts` : ""}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.spotlight ? (
                          <span className="text-closet-rose" title="Homepage spotlight">
                            ★
                          </span>
                        ) : (
                          <span className="text-closet-brown-light/40">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/admin/cosplays/${c.id}/edit`} className="admin-btn-ghost mr-1 text-closet-rose">
                          Edit
                        </Link>
                        <AdminButton variant="danger" onClick={() => remove(c.id)}>
                          Delete
                        </AdminButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
