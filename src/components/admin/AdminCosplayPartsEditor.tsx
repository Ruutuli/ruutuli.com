"use client";

import { useMemo, useState } from "react";
import {
  Cosplay,
  CosplayPart,
  CosplayPartCategory,
  getCosplayPartsPercent,
  syncCosplayProgressFromParts,
} from "@/types/cosplay";
import { AdminButton } from "./ui";

const PART_TEMPLATE: { category: CosplayPartCategory; label: string; slots: number }[] = [
  { category: "wig", label: "Wig Color", slots: 1 },
  { category: "eyes", label: "Eye Color", slots: 1 },
  { category: "top", label: "Top", slots: 4 },
  { category: "bottom", label: "Bottom", slots: 3 },
  { category: "socks", label: "Socks", slots: 1 },
  { category: "shoes", label: "Shoes", slots: 1 },
  { category: "accessories", label: "Accessories", slots: 4 },
  { category: "other", label: "Other", slots: 2 },
  { category: "prop", label: "Prop", slots: 1 },
];

type SlotRow = {
  key: string;
  category: CosplayPartCategory;
  label: string;
  name: string;
  owned: boolean;
};

function buildSlotsFromParts(parts: CosplayPart[]): SlotRow[] {
  const slots: SlotRow[] = [];

  for (const section of PART_TEMPLATE) {
    const existing = parts.filter((p) => p.category === section.category);
    const rowCount = Math.max(section.slots, existing.length);

    for (let i = 0; i < rowCount; i++) {
      const part = existing[i];
      slots.push({
        key: `${section.category}-${i}`,
        category: section.category,
        label: section.label,
        name: part?.name ?? "",
        owned: part?.owned ?? false,
      });
    }
  }

  return slots;
}

function slotsToParts(slots: SlotRow[]): CosplayPart[] {
  return slots
    .filter((s) => s.name.trim())
    .map((s) => ({
      category: s.category,
      label: s.label,
      name: s.name.trim(),
      owned: s.owned,
    }));
}

function sectionsFromSlots(slots: SlotRow[]) {
  return PART_TEMPLATE.map((section) => ({
    ...section,
    rows: slots.filter((s) => s.category === section.category),
  }));
}

export function AdminCosplayPartsEditor({
  parts,
  onChange,
  expanded = false,
  trackProgress = true,
}: {
  parts: CosplayPart[];
  onChange: (parts: CosplayPart[]) => void;
  expanded?: boolean;
  trackProgress?: boolean;
}) {
  const [slots, setSlots] = useState(() => buildSlotsFromParts(parts));

  const savedParts = useMemo(() => slotsToParts(slots), [slots]);
  const pct = savedParts.length ? getCosplayPartsPercent({ parts: savedParts } as Cosplay) : 0;
  const owned = savedParts.filter((p) => p.owned).length;
  const sections = useMemo(() => sectionsFromSlots(slots), [slots]);

  function commit(nextSlots: SlotRow[]) {
    setSlots(nextSlots);
    onChange(slotsToParts(nextSlots));
  }

  function updateSlot(key: string, patch: Partial<Pick<SlotRow, "name" | "owned">>) {
    commit(slots.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }

  function addRow(category: CosplayPartCategory, label: string) {
    const count = slots.filter((s) => s.category === category).length;
    commit([
      ...slots,
      {
        key: `${category}-${count}-${Date.now()}`,
        category,
        label,
        name: "",
        owned: false,
      },
    ]);
  }

  function removeRow(key: string) {
    commit(slots.filter((s) => s.key !== key));
  }

  function setAllOwned(owned: boolean) {
    commit(
      slots.map((s) => (s.name.trim() ? { ...s, owned } : s)),
    );
  }

  function renderSlotRow(row: SlotRow, canRemove: boolean) {
    const filled = !!row.name.trim();
    return (
      <div
        key={row.key}
        className={`flex items-center gap-2 ${filled ? "" : "opacity-70"}`}
      >
        <input
          type="checkbox"
          checked={row.owned}
          disabled={!filled || !trackProgress}
          onChange={(e) => updateSlot(row.key, { owned: e.target.checked })}
          className={`h-4 w-4 shrink-0 rounded border-closet-pink text-closet-rose disabled:opacity-40 ${trackProgress ? "" : "hidden"}`}
          title={filled ? (row.owned ? "Owned" : "Not owned yet") : "Fill in a name first"}
        />
        <input
          type="text"
          value={row.name}
          onChange={(e) => {
            const name = e.target.value;
            updateSlot(row.key, {
              name,
              owned: name.trim() ? row.owned : false,
            });
          }}
          placeholder="Leave blank if N/A"
          className={`admin-input min-w-0 flex-1 py-2 text-sm ${
            filled && row.owned ? "font-medium" : ""
          }`}
        />
        {canRemove && filled && (
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            className="shrink-0 rounded-lg p-2 text-closet-brown-light transition hover:bg-rose-50 hover:text-rose-600"
            title="Clear this row"
            aria-label="Remove row"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (expanded) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-sans text-lg font-bold text-closet-brown">Costume checklist</h3>
            <p className="text-sm text-closet-brown-light">
              Fill in what this build includes — blank rows aren&apos;t part of the cosplay.
            </p>
          </div>
          {savedParts.length > 0 && trackProgress && (
            <div className="min-w-[140px]">
              <div className="mb-1 flex justify-between text-xs font-semibold text-closet-brown-light">
                <span>{owned}/{savedParts.length} owned</span>
                <span className="text-closet-rose">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-closet-blush">
                <div className="h-full bg-closet-rose transition-all" style={{ width: `${pct ?? 0}%` }} />
              </div>
            </div>
          )}
        </div>

        {savedParts.length > 0 && trackProgress && (
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setAllOwned(true)} className="text-xs">
              Mark all owned
            </AdminButton>
            <AdminButton variant="ghost" onClick={() => setAllOwned(false)} className="text-xs">
              Mark all missing
            </AdminButton>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const filledCount = section.rows.filter((r) => r.name.trim()).length;
            const canAddMore = section.slots > 1 || section.rows.length > 0;
            return (
              <section
                key={section.category}
                className="rounded-xl border border-closet-pink/50 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-bold text-closet-brown">{section.label}</h4>
                  {filledCount > 0 ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-closet-rose">
                      {filledCount} item{filledCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-closet-brown-light">
                      N/A
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {section.rows.map((row, rowIndex) =>
                    renderSlotRow(row, rowIndex >= section.slots),
                  )}
                </div>
                {canAddMore && section.slots > 1 && (
                  <button
                    type="button"
                    onClick={() => addRow(section.category, section.label)}
                    className="mt-3 text-xs font-semibold text-closet-rose hover:underline"
                  >
                    + Add another {section.label.toLowerCase()}
                  </button>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  /* Compact checklist */
  const grouped = PART_TEMPLATE.map((section) => ({
    ...section,
    items: savedParts.filter((p) => p.category === section.category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-closet-brown">Costume parts</p>
          <p className="text-xs text-closet-brown-light">
            {savedParts.length === 0
              ? "No parts filled in"
              : trackProgress
                ? `${owned}/${savedParts.length} owned · ${pct}% complete`
                : `${savedParts.length} part${savedParts.length === 1 ? "" : "s"} listed`}
          </p>
        </div>
      </div>
      {grouped.length === 0 ? (
        <p className="text-sm text-closet-brown-light">No costume parts yet.</p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-closet-pink/50 bg-closet-blush/15 p-3">
          {grouped.map((group) => (
            <div key={group.category}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-closet-rose">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((part) => (
                  <li key={`${part.category}-${part.name}`} className="text-sm text-closet-brown">
                    {trackProgress ? (part.owned ? "✓ " : "○ ") : null}
                    {part.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function applyPartsToCosplay(cosplay: Partial<Cosplay>): Partial<Cosplay> {
  if (!cosplay.parts?.length) return cosplay;
  return syncCosplayProgressFromParts(cosplay as Cosplay);
}
