"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Wig } from "@/types/wig";
import {
  getWigColorFamily,
  resolveWigSwatch,
  swatchNeedsBorderForName,
  wigColorFamilyLabel,
  wigSwatchBackground,
} from "@/lib/wigColors";
import { IconPlus } from "./icons";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  AdminSelect,
  AdminStatCard,
  AdminToast,
} from "./ui";
import {
  AdminDataTable,
  AdminTableActionsCell,
  AdminTableActionsHeader,
  AdminTableHead,
  AdminTableMeta,
  AdminTablePagination,
  AdminTableSortHeader,
  useClientPagination,
} from "./AdminDataTable";

type SortKey = "brand" | "character" | "color" | "length" | "style";
type ViewMode = "cards" | "table";

const LENGTHS = ["Short", "Medium", "Long", "Pigtails"];

/** Print-card order for color filter pills. */
const COLOR_PILL_ORDER = [
  "pink",
  "red",
  "orange",
  "blonde",
  "blond",
  "green",
  "teal",
  "blue",
  "navy",
  "purple",
  "black",
  "gray",
  "grey",
  "white",
  "brown",
  "brunette",
  "other",
];

function colorFamilySortIndex(family: string): number {
  const idx = COLOR_PILL_ORDER.indexOf(family);
  return idx === -1 ? COLOR_PILL_ORDER.length : idx;
}

const BRAND_RING: Record<string, string> = {
  Arda: "ring-closet-rose/60",
  "Arda Silky": "ring-closet-rose/50",
  "Wig Is Fashion": "ring-violet-400/60",
  Epic: "ring-sky-400/60",
  Rolecos: "ring-emerald-400/60",
  Uwowo: "ring-amber-400/60",
};

const SORT_LABELS: Record<SortKey, string> = {
  brand: "Brand",
  character: "Character",
  color: "Color",
  length: "Length",
  style: "Style",
};

function emptyWig(): Partial<Wig> {
  return { brand: "", style: "", length: "", character: "", color: "" };
}

function sortWigs(list: Wig[], key: SortKey, dir: "asc" | "desc"): Wig[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = (a[key] ?? "").toLowerCase();
    const bv = (b[key] ?? "").toLowerCase();
    return av.localeCompare(bv) * mult;
  });
}

function WigColorSwatch({ color, size = "md" }: { color: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span
      className={`inline-block shrink-0 rounded-full ring-1 ring-black/10 ${dim}`}
      style={{
        background: wigSwatchBackground(color),
        boxShadow: swatchNeedsBorderForName(color) ? "inset 0 0 0 1px rgba(0,0,0,0.12)" : undefined,
      }}
      title={color}
    />
  );
}

function WigColorBadge({ color }: { color: string }) {
  const family = getWigColorFamily(color);
  const { from, to } = resolveWigSwatch(color);
  const badgeBackground = to
    ? `linear-gradient(135deg, ${from}28 0%, ${from}22 45%, ${to}38 100%)`
    : `${from}22`;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: badgeBackground,
        color: family === "black" || family === "navy" ? "#1c1917" : "#5c4033",
        boxShadow: `inset 0 0 0 1px ${from}55`,
      }}
    >
      <WigColorSwatch color={color} size="sm" />
      {color}
    </span>
  );
}

function ColorFilterPills({
  families,
  active,
  onSelect,
  className = "",
}: {
  families: [string, number][];
  active: string;
  onSelect: (family: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] ${className}`}>
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold ${
          active === "all" ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
        }`}
      >
        All colors
      </button>
      {families.map(([family, count]) => (
        <button
          key={family}
          type="button"
          onClick={() => onSelect(active === family ? "all" : family)}
          className={`admin-btn-touch inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold ring-1 ${
            active === family
              ? "bg-closet-rose text-white ring-closet-rose"
              : "bg-white text-closet-brown ring-closet-pink/50"
          }`}
        >
          <WigColorSwatch color={family === "other" ? "mixed" : family} size="sm" />
          {wigColorFamilyLabel(family)} ({count})
        </button>
      ))}
    </div>
  );
}

function WigMobileRow({
  wig,
  selected,
  onToggle,
  onEdit,
  onRemove,
}: {
  wig: Wig;
  selected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const meta = [wig.character ? wig.brand : null, wig.length, wig.style].filter(Boolean).join(" · ");

  return (
    <li className="flex items-stretch gap-1 border-b border-closet-pink/35 last:border-b-0">
      <label className="admin-btn-touch flex shrink-0 items-center px-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 accent-closet-rose"
          aria-label={`Select ${wig.character || wig.brand}`}
        />
      </label>
      <button
        type="button"
        onClick={onEdit}
        className="admin-btn-touch flex min-w-0 flex-1 items-center gap-3 px-2 py-3 text-left active:bg-closet-blush/40"
      >
        <span
          className="w-1 shrink-0 self-stretch rounded-full"
          style={{ background: wigSwatchBackground(wig.color) }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-closet-brown">{wig.character || wig.brand}</p>
          {meta ? <p className="mt-0.5 truncate text-xs text-closet-brown-light">{meta}</p> : null}
          <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-closet-brown">
            <WigColorSwatch color={wig.color} size="sm" />
            <span className="truncate">{wig.color}</span>
          </p>
        </div>
      </button>
      <div className="flex shrink-0 flex-col justify-center gap-1 border-l border-closet-pink/30 px-2 py-2">
        <AdminButton variant="ghost" className="admin-btn-touch !min-h-[40px] !px-3 text-xs" onClick={onEdit}>
          Edit
        </AdminButton>
        <AdminButton variant="danger" className="admin-btn-touch !min-h-[40px] !px-3 text-xs" onClick={onRemove}>
          Remove
        </AdminButton>
      </div>
    </li>
  );
}

export default function AdminWigManager({ initial }: { initial: Wig[] }) {
  const [wigs, setWigs] = useState(initial);
  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [lengthFilter, setLengthFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<Partial<Wig> | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brands = useMemo(() => Array.from(new Set(wigs.map((w) => w.brand))).sort(), [wigs]);
  const colors = useMemo(() => Array.from(new Set(wigs.map((w) => w.color))).sort(), [wigs]);
  const styles = useMemo(() => Array.from(new Set(wigs.map((w) => w.style).filter(Boolean))).sort(), [wigs]);
  const colorFamilies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const w of wigs) {
      const f = getWigColorFamily(w.color);
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => {
      const orderDiff = colorFamilySortIndex(a[0]) - colorFamilySortIndex(b[0]);
      if (orderDiff !== 0) return orderDiff;
      return b[1] - a[1];
    });
  }, [wigs]);

  const topBrands = useMemo(
    () =>
      brands
        .map((b) => ({ brand: b, count: wigs.filter((w) => w.brand === b).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    [brands, wigs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = wigs.filter((w) => {
      if (brandFilter !== "all" && w.brand !== brandFilter) return false;
      if (lengthFilter !== "all" && w.length !== lengthFilter) return false;
      if (colorFilter !== "all" && getWigColorFamily(w.color) !== colorFilter) return false;
      if (!q) return true;
      return (
        w.brand.toLowerCase().includes(q) ||
        (w.character ?? "").toLowerCase().includes(q) ||
        w.color.toLowerCase().includes(q) ||
        w.style.toLowerCase().includes(q) ||
        w.length.toLowerCase().includes(q)
      );
    });
    return sortWigs(matched, sortBy, sortDir);
  }, [wigs, query, brandFilter, lengthFilter, colorFilter, sortBy, sortDir]);

  const pagination = useClientPagination(filtered, 50);

  const sortLabel =
    sortBy !== "brand" || sortDir !== "asc"
      ? `sorted by ${SORT_LABELS[sortBy]} (${sortDir === "asc" ? "A→Z" : "Z→A"})`
      : undefined;

  const stats = useMemo(
    () => ({
      total: wigs.length,
      brands: brands.length,
      colors: colors.length,
      withCharacter: wigs.filter((w) => w.character?.trim()).length,
    }),
    [wigs, brands, colors],
  );

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  async function saveWig(options?: { addAnother?: boolean }) {
    if (!editing?.brand?.trim() || !editing.color?.trim()) {
      setMessage("Brand and color are required");
      return;
    }
    setSaving(true);

    const payload = {
      ...editing,
      brand: editing.brand.trim(),
      color: editing.color.trim(),
      style: editing.style?.trim() ?? "",
      length: editing.length?.trim() ?? "",
      character: editing.character?.trim() || undefined,
    };

    const isNew = !editing.id;
    const res = await fetch("/api/admin/wigs", {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save wig");
      return;
    }

    const saved = (await res.json()) as Wig;
    setWigs((prev) => (isNew ? [...prev, saved] : prev.map((w) => (w.id === saved.id ? saved : w))));

    if (options?.addAnother && isNew) {
      setEditing(emptyWig());
      setMessage("Wig added — add another");
      return;
    }

    setEditing(null);
    setMessage(isNew ? "Wig added" : "Wig updated");
  }

  function openAddWig() {
    setEditing(emptyWig());
  }

  async function remove(id: string) {
    if (!confirm("Delete this wig from inventory?")) return;
    const res = await fetch(`/api/admin/wigs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Could not delete wig");
      return;
    }
    setWigs((prev) => prev.filter((w) => w.id !== id));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setMessage("Wig removed");
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectFiltered() {
    setSelectedIds(new Set(filtered.map((w) => w.id)));
  }

  function selectPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const w of pagination.pageItems) next.add(w.id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function printSelectedLabels() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(",");
    window.open(`/api/admin/wigs/labels?ids=${encodeURIComponent(ids)}`, "_blank");
  }

  const pageAllSelected =
    pagination.pageItems.length > 0 && pagination.pageItems.every((w) => selectedIds.has(w.id));
  const pageSomeSelected = pagination.pageItems.some((w) => selectedIds.has(w.id));

  function togglePageSelection() {
    if (pageAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const w of pagination.pageItems) next.delete(w.id);
        return next;
      });
      return;
    }
    selectPage();
  }

  const hasFilters = brandFilter !== "all" || lengthFilter !== "all" || colorFilter !== "all" || query.trim();

  function clearFilters() {
    setBrandFilter("all");
    setLengthFilter("all");
    setColorFilter("all");
    setQuery("");
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <AdminPageHeader
        title="Wig inventory"
        description="Add, edit, or remove wigs while you stock."
        action={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/api/admin/wigs/cards"
              target="_blank"
              className="admin-btn-secondary admin-btn-touch hidden text-sm sm:inline-flex"
            >
              Print wig cards
            </Link>
            <Link
              href="/api/admin/wigs/labels"
              target="_blank"
              className="admin-btn-secondary admin-btn-touch hidden text-sm sm:inline-flex"
            >
              Print Avery 5260
            </Link>
            <AdminButton variant="primary" className="admin-btn-touch hidden lg:inline-flex" onClick={openAddWig}>
              <IconPlus />
              Add wig
            </AdminButton>
          </div>
        }
      />

      <div className="hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total wigs" value={stats.total} accent="rose" />
        <AdminStatCard label="Brands" value={stats.brands} accent="blush" />
        <AdminStatCard label="Unique colors" value={stats.colors} accent="peach" />
        <AdminStatCard label="Assigned to builds" value={stats.withCharacter} hint="Have a character name" accent="brown" />
      </div>

      <details className="hidden rounded-2xl border border-closet-pink/60 bg-white shadow-closet sm:block lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-closet-brown [&::-webkit-details-marker]:hidden">
          Stats & print
        </summary>
        <div className="space-y-4 border-t border-closet-pink/40 px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <AdminStatCard label="Total" value={stats.total} accent="rose" />
            <AdminStatCard label="Brands" value={stats.brands} accent="blush" />
          </div>
          <div className="flex flex-col gap-2">
            <Link href="/api/admin/wigs/cards" target="_blank" className="admin-btn-secondary admin-btn-touch w-full text-sm">
              Print wig cards
            </Link>
            <Link href="/api/admin/wigs/labels" target="_blank" className="admin-btn-secondary admin-btn-touch w-full text-sm">
              Print Avery 5260 labels
            </Link>
          </div>
        </div>
      </details>

      <AdminCard className="hidden p-4 sm:block sm:p-5 lg:block">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-closet-brown">Print by color</p>
            <p className="mt-0.5 text-xs text-closet-brown-light">
              3×5 in cards — up to 14 wigs per card, splits if more. Text shrinks to fit.
            </p>
          </div>
          <Link href="/api/admin/wigs/cards" target="_blank" className="admin-btn-primary shrink-0 text-sm">
            Print all cards
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["pink", "Pink"],
            ["red", "Red"],
            ["orange", "Orange"],
            ["blonde", "Blonde"],
            ["green", "Green / Teal"],
            ["blue", "Blue"],
            ["purple", "Purple"],
            ["black", "Black"],
            ["gray", "Gray / Silver"],
            ["white", "White"],
            ["brown", "Brown"],
          ].map(([id, label]) => (
            <Link
              key={id}
              href={`/api/admin/wigs/cards?category=${id}`}
              target="_blank"
              className="rounded-full bg-closet-blush/50 px-3 py-1 text-xs font-bold text-closet-brown ring-1 ring-closet-pink/50 hover:bg-closet-rose hover:text-white hover:ring-closet-rose"
            >
              {label}
            </Link>
          ))}
        </div>
      </AdminCard>

      <AdminCard className="hidden p-4 sm:block sm:p-5 lg:block">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-closet-brown">Avery 5260 labels</p>
            <p className="mt-0.5 text-xs text-closet-brown-light">
              30 labels/sheet · check wigs below to print a custom set · or print all / by color here
            </p>
          </div>
          <Link href="/api/admin/wigs/labels" target="_blank" className="admin-btn-primary shrink-0 text-sm">
            Print all labels
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["pink", "Pink"],
            ["red", "Red"],
            ["orange", "Orange"],
            ["blonde", "Blonde"],
            ["green", "Green / Teal"],
            ["blue", "Blue"],
            ["purple", "Purple"],
            ["black", "Black"],
            ["gray", "Gray / Silver"],
            ["white", "White"],
            ["brown", "Brown"],
          ].map(([id, label]) => (
            <Link
              key={id}
              href={`/api/admin/wigs/labels?category=${id}`}
              target="_blank"
              className="rounded-full bg-closet-blush/50 px-3 py-1 text-xs font-bold text-closet-brown ring-1 ring-closet-pink/50 hover:bg-closet-rose hover:text-white hover:ring-closet-rose"
            >
              {label}
            </Link>
          ))}
        </div>
      </AdminCard>

      <details className="rounded-2xl border border-closet-pink/60 bg-white shadow-closet lg:hidden">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-bold text-closet-brown [&::-webkit-details-marker]:hidden">
          Print by color
        </summary>
        <div className="space-y-3 border-t border-closet-pink/40 px-4 py-4">
          <Link href="/api/admin/wigs/cards" target="_blank" className="admin-btn-primary admin-btn-touch w-full text-sm">
            Print all wig cards
          </Link>
          <Link href="/api/admin/wigs/labels" target="_blank" className="admin-btn-secondary admin-btn-touch w-full text-sm">
            Print Avery 5260 labels
          </Link>
          <p className="text-xs text-closet-brown-light">Cards · color pills open 3×5 inventory cards</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["pink", "Pink"],
              ["red", "Red"],
              ["orange", "Orange"],
              ["blonde", "Blonde"],
              ["green", "Green / Teal"],
              ["blue", "Blue"],
              ["purple", "Purple"],
              ["black", "Black"],
              ["gray", "Gray / Silver"],
              ["white", "White"],
              ["brown", "Brown"],
            ].map(([id, label]) => (
              <Link
                key={id}
                href={`/api/admin/wigs/cards?category=${id}`}
                target="_blank"
                className="admin-btn-touch rounded-full bg-closet-blush/50 px-3 py-2 text-xs font-bold text-closet-brown ring-1 ring-closet-pink/50"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="text-xs text-closet-brown-light">Labels · color pills open Avery 5260 sheets</p>
          <div className="flex flex-wrap gap-2">
            {[
              ["pink", "Pink"],
              ["red", "Red"],
              ["orange", "Orange"],
              ["blonde", "Blonde"],
              ["green", "Green / Teal"],
              ["blue", "Blue"],
              ["purple", "Purple"],
              ["black", "Black"],
              ["gray", "Gray / Silver"],
              ["white", "White"],
              ["brown", "Brown"],
            ].map(([id, label]) => (
              <Link
                key={`label-${id}`}
                href={`/api/admin/wigs/labels?category=${id}`}
                target="_blank"
                className="admin-btn-touch rounded-full bg-closet-blush/50 px-3 py-2 text-xs font-bold text-closet-brown ring-1 ring-closet-pink/50"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </details>

      {/* Stock toolbar */}
      <div className="space-y-3 lg:space-y-4">
        <AdminSearch
          value={query}
          onChange={setQuery}
          placeholder="Search while stocking…"
          className="w-full"
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="admin-input admin-select admin-btn-touch min-w-0 flex-1 sm:min-w-[148px] sm:flex-none"
            aria-label="Sort wigs by"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                Sort: {label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="admin-btn-secondary admin-btn-touch shrink-0 !px-3"
            title={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
          <div className="hidden rounded-xl ring-1 ring-closet-pink/60 lg:flex">
            {(["cards", "table"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`admin-btn-touch px-3 py-2 text-xs font-bold capitalize first:rounded-l-xl last:rounded-r-xl ${
                  viewMode === mode ? "bg-closet-rose text-white" : "bg-white text-closet-brown"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <ColorFilterPills
          className="lg:hidden"
          families={colorFamilies}
          active={colorFilter}
          onSelect={setColorFilter}
        />

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {brandFilter !== "all" && (
              <span className="rounded-full bg-closet-rose/15 px-3 py-1 text-xs font-bold text-closet-rose ring-1 ring-closet-rose/30">
                {brandFilter}
              </span>
            )}
            {colorFilter !== "all" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-closet-rose/15 px-3 py-1 text-xs font-bold text-closet-rose ring-1 ring-closet-rose/30">
                <WigColorSwatch color={colorFilter === "other" ? "mixed" : colorFilter} size="sm" />
                {wigColorFamilyLabel(colorFilter)}
              </span>
            )}
            {lengthFilter !== "all" && (
              <span className="rounded-full bg-closet-rose/15 px-3 py-1 text-xs font-bold text-closet-rose ring-1 ring-closet-rose/30">
                {lengthFilter}
              </span>
            )}
            <button type="button" onClick={clearFilters} className="admin-btn-touch text-xs font-bold text-closet-rose underline">
              Clear
            </button>
          </div>
        )}

        <div className={`space-y-4 border-t border-closet-pink/30 pt-3 lg:hidden ${filtersOpen ? "block" : "hidden"}`}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setBrandFilter("all")}
              className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold ${
                brandFilter === "all" ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
              }`}
            >
              All brands ({wigs.length})
            </button>
            {topBrands.map(({ brand, count }) => (
              <button
                key={brand}
                type="button"
                onClick={() => setBrandFilter(brandFilter === brand ? "all" : brand)}
                className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold ${
                  brandFilter === brand ? "bg-closet-rose text-white" : "bg-white ring-1 ring-closet-pink/50 text-closet-brown"
                }`}
              >
                {brand} ({count})
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["all", ...LENGTHS] as const).map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setLengthFilter(len)}
                className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold capitalize ${
                  lengthFilter === len ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
                }`}
              >
                {len === "all" ? "All lengths" : len}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters — desktop only */}
      <div className="hidden space-y-4 lg:block">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <button
            type="button"
            onClick={() => setBrandFilter("all")}
            className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold ${
              brandFilter === "all" ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
            }`}
          >
            All brands ({wigs.length})
          </button>
          {topBrands.map(({ brand, count }) => (
            <button
              key={brand}
              type="button"
              onClick={() => setBrandFilter(brandFilter === brand ? "all" : brand)}
              className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold ${
                brandFilter === brand ? "bg-closet-rose text-white" : "bg-white ring-1 ring-closet-pink/50 text-closet-brown"
              }`}
            >
              {brand} ({count})
            </button>
          ))}
        </div>

        <ColorFilterPills families={colorFamilies} active={colorFilter} onSelect={setColorFilter} />

        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:items-center lg:overflow-visible lg:pb-0">
          <span className="hidden shrink-0 text-xs font-bold uppercase tracking-wider text-closet-brown-light lg:inline">Length:</span>
          {(["all", ...LENGTHS] as const).map((len) => (
            <button
              key={len}
              type="button"
              onClick={() => setLengthFilter(len)}
              className={`admin-btn-touch shrink-0 rounded-full px-4 py-2.5 text-xs font-bold capitalize ${
                lengthFilter === len ? "bg-closet-rose text-white" : "bg-closet-blush/50 text-closet-brown"
              }`}
            >
              {len === "all" ? "All lengths" : len}
            </button>
          ))}
        </div>
      </div>

      <AdminCard className="!overflow-visible">
        {filtered.length === 0 ? (
          <AdminEmptyState
            title={wigs.length === 0 ? "No wigs yet" : "No wigs match your filters"}
            description={
              wigs.length === 0
                ? "Add your first wig to start tracking inventory."
                : "Try clearing filters or a different search."
            }
          />
        ) : (
          <>
            <AdminTableMeta
              rangeStart={pagination.rangeStart}
              rangeEnd={pagination.rangeEnd}
              total={pagination.total}
              sortLabel={sortLabel}
            />

            <div className="flex flex-col gap-2 border-b border-closet-pink/40 px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
              <div className="flex flex-wrap items-center gap-2">
                <AdminButton variant="secondary" className="admin-btn-touch text-xs" onClick={selectFiltered}>
                  Select filtered ({filtered.length})
                </AdminButton>
                <AdminButton variant="secondary" className="admin-btn-touch text-xs" onClick={selectPage}>
                  Select page
                </AdminButton>
                {selectedIds.size > 0 ? (
                  <AdminButton variant="ghost" className="admin-btn-touch text-xs" onClick={clearSelection}>
                    Clear ({selectedIds.size})
                  </AdminButton>
                ) : null}
              </div>
              <AdminButton
                variant="primary"
                className="admin-btn-touch text-sm"
                disabled={selectedIds.size === 0}
                onClick={printSelectedLabels}
              >
                Print selected labels ({selectedIds.size})
              </AdminButton>
            </div>

            <ul className="lg:hidden">
              {pagination.pageItems.map((w) => (
                <WigMobileRow
                  key={w.id}
                  wig={w}
                  selected={selectedIds.has(w.id)}
                  onToggle={() => toggleSelected(w.id)}
                  onEdit={() => setEditing({ ...w })}
                  onRemove={() => remove(w.id)}
                />
              ))}
            </ul>
            {/* Blank scroll room so the last row clears the fixed bottom bar */}
            <div
              className="lg:hidden"
              aria-hidden="true"
              style={{ height: "calc(5.5rem + env(safe-area-inset-bottom, 0px) + 3.5rem)" }}
            />

            <div className="hidden lg:block">
            {viewMode === "cards" ? (
              <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
                {pagination.pageItems.map((w) => {
                  const swatchBg = wigSwatchBackground(w.color);
                  const brandRing = BRAND_RING[w.brand] ?? "ring-closet-pink/40";
                  const selected = selectedIds.has(w.id);
                  return (
                    <article
                      key={w.id}
                      className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br from-white to-closet-blush/20 shadow-sm ring-1 ${
                        selected
                          ? "border-closet-rose ring-closet-rose/50"
                          : `border-closet-pink/50 ${brandRing}`
                      }`}
                    >
                      <div className="absolute inset-y-0 left-0 w-2 sm:w-1.5" style={{ background: swatchBg }} />
                      <div className="p-4 pl-6 sm:pl-5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-closet-rose">{w.brand}</p>
                            <p className="mt-0.5 font-sans text-base font-bold leading-snug text-closet-brown">
                              {w.character || "Unassigned"}
                            </p>
                          </div>
                          <label className="admin-btn-touch shrink-0 pt-0.5">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelected(w.id)}
                              className="h-4 w-4 accent-closet-rose"
                              aria-label={`Select ${w.character || w.brand}`}
                            />
                          </label>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <WigColorBadge color={w.color} />
                          {w.length && (
                            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-closet-brown ring-1 ring-closet-pink/40">
                              {w.length}
                            </span>
                          )}
                        </div>

                        {w.style && (
                          <p className="mt-2 text-xs leading-snug text-closet-brown-light">{w.style}</p>
                        )}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <AdminButton
                            variant="secondary"
                            className="admin-btn-touch w-full text-sm"
                            onClick={() => setEditing({ ...w })}
                          >
                            Edit
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            className="admin-btn-touch w-full text-sm"
                            onClick={() => remove(w.id)}
                          >
                            Remove
                          </AdminButton>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <AdminDataTable minWidth={760}>
                <AdminTableHead>
                  <tr>
                    <th className="w-10 !pl-4 !pr-1">
                      <input
                        type="checkbox"
                        checked={pageAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = pageSomeSelected && !pageAllSelected;
                        }}
                        onChange={togglePageSelection}
                        className="h-4 w-4 accent-closet-rose"
                        aria-label="Select all on this page"
                      />
                    </th>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                      <AdminTableSortHeader
                        key={key}
                        label={SORT_LABELS[key]}
                        active={sortBy === key}
                        direction={sortBy === key ? sortDir : undefined}
                        onSort={() => toggleSort(key)}
                      />
                    ))}
                    <AdminTableActionsHeader className="!px-5" />
                  </tr>
                </AdminTableHead>
                <tbody>
                  {pagination.pageItems.map((w) => (
                    <tr
                      key={w.id}
                      className={`group admin-table-row ${selectedIds.has(w.id) ? "bg-closet-blush/30" : ""}`}
                    >
                      <td className="!pl-4 !pr-1 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(w.id)}
                          onChange={() => toggleSelected(w.id)}
                          className="h-4 w-4 accent-closet-rose"
                          aria-label={`Select ${w.character || w.brand}`}
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-closet-brown">{w.brand}</span>
                      </td>
                      <td className="px-4 py-3.5">{w.character || "—"}</td>
                      <td className="px-4 py-3.5">
                        <WigColorBadge color={w.color} />
                      </td>
                      <td className="px-4 py-3.5 text-closet-brown-light">{w.length || "—"}</td>
                      <td className="max-w-[200px] px-4 py-3.5 text-closet-brown-light">
                        <span className="line-clamp-2" title={w.style || undefined}>
                          {w.style || "—"}
                        </span>
                      </td>
                      <AdminTableActionsCell className="!px-5">
                        <div className="flex justify-end gap-1">
                          <AdminButton
                            variant="ghost"
                            className="admin-btn-touch text-xs"
                            onClick={() => setEditing({ ...w })}
                          >
                            Edit
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            className="admin-btn-touch text-xs"
                            onClick={() => remove(w.id)}
                          >
                            Remove
                          </AdminButton>
                        </div>
                      </AdminTableActionsCell>
                    </tr>
                  ))}
                </tbody>
              </AdminDataTable>
            )}
            </div>

            <AdminTablePagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
            />
          </>
        )}
      </AdminCard>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-closet-pink/60 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-closet-lg backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className={`admin-btn-touch flex-1 rounded-xl px-4 py-3 text-sm font-bold ${
              filtersOpen || hasFilters ? "bg-closet-blush text-closet-brown ring-1 ring-closet-rose/30" : "admin-btn-secondary"
            }`}
          >
            Filters
          </button>
          <AdminButton variant="primary" className="admin-btn-touch min-w-0 flex-[2] !py-3 text-base" onClick={openAddWig}>
            <IconPlus />
            Add wig
          </AdminButton>
        </div>
      </div>

      {editing && (
        <AdminModal
          title={editing.id ? "Edit wig" : "Add wig"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <AdminButton variant="secondary" className="admin-btn-touch" onClick={() => setEditing(null)}>
                Cancel
              </AdminButton>
              {!editing.id && (
                <AdminButton
                  variant="secondary"
                  className="admin-btn-touch sm:order-last"
                  onClick={() => saveWig({ addAnother: true })}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save & add another"}
                </AdminButton>
              )}
              <AdminButton variant="primary" className="admin-btn-touch" onClick={() => saveWig()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            {editing.color && (
              <div className="flex items-center gap-3 rounded-xl border border-closet-pink/50 bg-closet-blush/20 px-4 py-3">
                <WigColorSwatch color={editing.color} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-closet-brown-light">Preview</p>
                  <p className="font-semibold text-closet-brown">{editing.color || "Enter a color"}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Brand"
                value={editing.brand ?? ""}
                onChange={(v) => setEditing({ ...editing, brand: v })}
                list="wig-brands"
                placeholder="Arda, Wig Is Fashion…"
              />
              <AdminField
                label="Color"
                value={editing.color ?? ""}
                onChange={(v) => setEditing({ ...editing, color: v })}
                list="wig-colors"
                placeholder="Black, Blonde Sandy…"
              />
              <AdminField
                label="Style"
                value={editing.style ?? ""}
                onChange={(v) => setEditing({ ...editing, style: v })}
                list="wig-styles"
                placeholder="Straight, Wavy…"
              />
              <AdminSelect
                label="Length"
                value={editing.length ?? ""}
                onChange={(v) => setEditing({ ...editing, length: v })}
                options={[{ value: "", label: "—" }, ...LENGTHS.map((l) => ({ value: l, label: l }))]}
              />
              <AdminField
                label="Character (optional)"
                value={editing.character ?? ""}
                onChange={(v) => setEditing({ ...editing, character: v })}
                placeholder="Kagome - Inuyasha"
                className="sm:col-span-2"
              />
            </div>

            <datalist id="wig-brands">
              {brands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
            <datalist id="wig-colors">
              {colors.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <datalist id="wig-styles">
              {styles.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </AdminModal>
      )}

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
