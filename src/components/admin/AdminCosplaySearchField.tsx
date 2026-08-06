"use client";

import { useEffect, useMemo, useState } from "react";
import { Cosplay, formatCosplayBuildLabel, formatCosplayBuildSubtitle } from "@/types/cosplay";
import { AdminField } from "./ui";

function filterCosplays(cosplays: Cosplay[], query: string): Cosplay[] {
  const q = query.trim().toLowerCase();
  if (!q) return cosplays;
  return cosplays.filter(
    (c) =>
      c.character.toLowerCase().includes(q) ||
      c.series.toLowerCase().includes(q) ||
      (c.outfit ?? "").toLowerCase().includes(q) ||
      formatCosplayBuildLabel(c).toLowerCase().includes(q),
  );
}

export default function AdminCosplaySearchField({
  cosplays,
  valueId,
  onChange,
  className = "",
}: {
  cosplays: Cosplay[];
  valueId: string;
  onChange: (cosplayId: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const selected = cosplays.find((c) => c.id === valueId);
    setQuery(selected?.character ?? "");
  }, [valueId, cosplays]);

  const matches = useMemo(() => filterCosplays(cosplays, query).slice(0, 8), [cosplays, query]);

  function pick(cosplay: Cosplay) {
    onChange(cosplay.id);
    setQuery(cosplay.character);
  }

  function handleQueryChange(next: string) {
    setQuery(next);
    const filtered = filterCosplays(cosplays, next);
    const exact = filtered.find((c) => c.character.toLowerCase() === next.trim().toLowerCase());
    if (exact) {
      onChange(exact.id);
      return;
    }
    if (valueId && !filtered.some((c) => c.id === valueId)) {
      onChange("");
    }
  }

  const selected = cosplays.find((c) => c.id === valueId);

  return (
    <div className={className}>
      <AdminField
        label="Character"
        value={query}
        onChange={handleQueryChange}
        placeholder="Search character name…"
      />

      {query.trim() && matches.length > 0 && (
        <ul className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-closet-pink/50 bg-white shadow-sm">
          {matches.map((c) => {
            const active = c.id === valueId;
            return (
              <li key={c.id} className="border-b border-closet-pink/30 last:border-b-0">
                <button
                  type="button"
                  onClick={() => pick(c)}
                  className={`flex w-full flex-col items-start px-4 py-3 text-left transition active:bg-closet-blush/40 ${
                    active ? "bg-closet-blush/50" : "hover:bg-closet-blush/25"
                  }`}
                >
                  <span className="font-semibold text-closet-brown">
                    {active ? "✓ " : ""}
                    {c.character}
                  </span>
                  <span className="text-xs text-closet-brown-light">{formatCosplayBuildSubtitle(c)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query.trim() && matches.length === 0 && (
        <p className="mt-2 text-xs font-medium text-closet-brown-light">No builds match that name.</p>
      )}

      {selected && (
        <p className="mt-2 text-xs text-closet-brown-light">
          Adding to: <strong className="text-closet-brown">{formatCosplayBuildLabel(selected)}</strong>
        </p>
      )}
    </div>
  );
}
