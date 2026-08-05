"use client";

import { useState } from "react";
import { CosplaySource } from "@/types/cosplay";
import { AdminButton, AdminField } from "./ui";

const SOURCE_ITEM_DATALIST_ID = "cosplay-source-item-suggestions";

const SOURCE_LABELS = [
  "Wig",
  "Contacts / Eyes",
  "Top",
  "Bottom",
  "Shoes",
  "Socks",
  "Prop",
  "Accessories",
  "Reference",
  "Tutorial",
  "Inspiration",
  "Other",
] as const;

export default function AdminCosplaySourcesEditor({
  sources,
  onChange,
  autoSave = false,
}: {
  sources: CosplaySource[];
  onChange: (sources: CosplaySource[]) => void;
  autoSave?: boolean;
}) {
  const [newLabel, setNewLabel] = useState<string>("Wig");
  const [newDetail, setNewDetail] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function updateSource(index: number, patch: Partial<CosplaySource>) {
    onChange(sources.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function deleteSource(index: number) {
    onChange(sources.filter((_, i) => i !== index));
  }

  function addSource() {
    const detail = newDetail.trim();
    if (!detail) return;
    onChange([
      ...sources,
      {
        label: newLabel.trim() || "Other",
        detail,
        url: newUrl.trim() || undefined,
      },
    ]);
    setNewDetail("");
    setNewUrl("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-closet-pink/40 bg-closet-blush/15 px-4 py-3.5">
        <p className="text-sm font-semibold text-closet-brown">Sources & credits</p>
        <p className="mt-0.5 text-xs text-closet-brown-light">
          Track where you got your wig, contacts, props, and other pieces — great for your own reference and sharing with others.
          {autoSave ? " Changes save automatically." : ""}
        </p>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-closet-pink/60 bg-closet-blush/10 px-5 py-10 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-closet-rose shadow-sm">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </span>
          <p className="mt-3 font-semibold text-closet-brown">No sources logged yet</p>
          <p className="mt-1 text-sm text-closet-brown-light">Add where you bought or sourced each piece below.</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {sources.map((source, index) => (
            <li
              key={index}
              className="group rounded-2xl border border-closet-pink/50 bg-gradient-to-br from-white to-closet-blush/15 p-4 shadow-sm"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <AdminField
                    label="Item"
                    value={source.label}
                    onChange={(v) => updateSource(index, { label: v })}
                    placeholder="Wig, Makeup, Belt…"
                    list={SOURCE_ITEM_DATALIST_ID}
                    className="min-w-0 flex-1 sm:max-w-[9rem]"
                  />
                  <button
                    type="button"
                    onClick={() => deleteSource(index)}
                    className="mt-6 shrink-0 rounded-lg p-2 text-closet-brown-light transition hover:bg-rose-50 hover:text-rose-600"
                    title="Remove source"
                    aria-label={`Remove ${source.label}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <label className="block min-w-0 text-sm">
                  <span className="mb-1.5 block font-semibold text-closet-brown">Source / product</span>
                  <input
                    type="text"
                    value={source.detail}
                    onChange={(e) => updateSource(index, { detail: e.target.value })}
                    placeholder="Arda Wigs — Jasmine in Cobalt Blue"
                    className="admin-input w-full"
                  />
                </label>
                <label className="block min-w-0 text-sm">
                  <span className="mb-1.5 block font-semibold text-closet-brown">Link (optional)</span>
                  <input
                    type="url"
                    value={source.url ?? ""}
                    onChange={(e) => updateSource(index, { url: e.target.value.trim() || undefined })}
                    placeholder="https://..."
                    className="admin-input w-full"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-closet-pink/50 bg-closet-blush/20 p-4 sm:p-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-closet-rose">Add source</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <AdminField
            label="Item"
            value={newLabel}
            onChange={setNewLabel}
            placeholder="Wig, Makeup, Belt…"
            list={SOURCE_ITEM_DATALIST_ID}
            className="lg:w-40"
          />
          <label className="block min-w-0 flex-1 text-sm">
            <span className="mb-1.5 block font-semibold text-closet-brown">Source / product</span>
            <input
              type="text"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSource();
                }
              }}
              placeholder="Pinkyparadise EOS Pink, Amazon boots, etc."
              className="admin-input w-full"
            />
          </label>
          <label className="block min-w-0 flex-1 text-sm">
            <span className="mb-1.5 block font-semibold text-closet-brown">Link (optional)</span>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://..."
              className="admin-input w-full"
            />
          </label>
          <AdminButton variant="primary" onClick={addSource} disabled={!newDetail.trim()} className="shrink-0">
            Add source
          </AdminButton>
        </div>
      </div>

      <datalist id={SOURCE_ITEM_DATALIST_ID}>
        {SOURCE_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </div>
  );
}
