"use client";

import { useMemo, useState } from "react";
import { Wig } from "@/types/wig";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminSearch,
  AdminToast,
} from "./ui";

export default function AdminWigManager({ initial }: { initial: Wig[] }) {
  const [wigs, setWigs] = useState(initial);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return wigs;
    return wigs.filter(
      (w) =>
        w.brand.toLowerCase().includes(q) ||
        (w.character ?? "").toLowerCase().includes(q) ||
        w.color.toLowerCase().includes(q) ||
        w.style.toLowerCase().includes(q),
    );
  }, [wigs, query]);

  const brands = useMemo(() => new Set(wigs.map((w) => w.brand)).size, [wigs]);

  async function remove(id: string) {
    if (!confirm("Delete this wig from inventory?")) return;
    const res = await fetch(`/api/admin/wigs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Could not delete wig");
      return;
    }
    setWigs((prev) => prev.filter((w) => w.id !== id));
    setMessage("Wig removed");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Wigs"
        description={`${wigs.length} wigs · ${brands} brands`}
      />

      <AdminSearch
        value={query}
        onChange={setQuery}
        placeholder="Search brand, character, color, style…"
        className="max-w-lg"
      />

      <AdminCard>
        {filtered.length === 0 ? (
          <AdminEmptyState title="No wigs found" description="Try a different search term." />
        ) : (
          <>
            <div className="border-b border-closet-pink/50 px-5 py-3 text-xs font-semibold text-closet-brown-light">
              Showing {filtered.length} of {wigs.length}
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-closet-blush/90 text-xs uppercase tracking-wide text-closet-brown-light backdrop-blur-sm">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Brand</th>
                    <th className="px-4 py-3.5 font-bold">Character</th>
                    <th className="px-4 py-3.5 font-bold">Color</th>
                    <th className="px-4 py-3.5 font-bold">Style</th>
                    <th className="px-4 py-3.5 font-bold">Length</th>
                    <th className="px-5 py-3.5 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((w) => (
                    <tr key={w.id} className="admin-table-row">
                      <td className="px-5 py-3.5 font-bold text-closet-brown">{w.brand}</td>
                      <td className="px-4 py-3.5">{w.character || "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-lg bg-closet-blush/50 px-2 py-0.5 text-xs font-semibold text-closet-brown">
                          {w.color}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-closet-brown-light">{w.style}</td>
                      <td className="px-4 py-3.5 text-closet-brown-light">{w.length}</td>
                      <td className="px-5 py-3.5 text-right">
                        <AdminButton variant="danger" onClick={() => remove(w.id)}>
                          Delete
                        </AdminButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminCard>

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
