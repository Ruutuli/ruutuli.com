"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function useClientPagination<T>(items: T[], defaultPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
  };
}

export function AdminTableMeta({
  rangeStart,
  rangeEnd,
  total,
  sortLabel,
  className = "",
}: {
  rangeStart: number;
  rangeEnd: number;
  total: number;
  sortLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-closet-pink/50 px-4 py-3 text-xs font-semibold text-closet-brown-light sm:px-5 ${className}`}
    >
      <span>
        {total === 0 ? "No results" : `Showing ${rangeStart}–${rangeEnd} of ${total}`}
        {sortLabel ? <span className="text-closet-brown-light/80"> · {sortLabel}</span> : null}
      </span>
    </div>
  );
}

export function AdminTablePagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = "",
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}) {
  if (totalPages <= 1 && pageSize === PAGE_SIZE_OPTIONS[0]) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-closet-pink/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${className}`}
    >
      <label className="flex items-center gap-2 text-xs font-semibold text-closet-brown-light">
        Rows per page
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="admin-select-sm"
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="admin-btn-secondary admin-btn-touch !px-3 !py-2 text-xs disabled:opacity-40"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        <div className="hidden items-center gap-0.5 sm:flex">
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-xs text-closet-brown-light">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`admin-btn-touch min-h-[36px] min-w-[36px] rounded-lg px-2 text-xs font-bold ${
                  p === page ? "bg-closet-rose text-white" : "text-closet-brown hover:bg-closet-blush/50"
                }`}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-xs font-semibold text-closet-brown-light sm:hidden">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="admin-btn-secondary admin-btn-touch !px-3 !py-2 text-xs disabled:opacity-40"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

export function AdminDataTable({
  children,
  minWidth = 720,
  className = "",
}: {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}) {
  return (
    <div className={`admin-table-scroll ${className}`}>
      <table className="admin-table w-full text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-closet-blush/95 text-xs uppercase tracking-wide text-closet-brown-light backdrop-blur-sm">
      {children}
    </thead>
  );
}

export function AdminTableSortHeader({
  label,
  active,
  direction,
  onSort,
  align = "left",
  className = "",
}: {
  label: string;
  active?: boolean;
  direction?: "asc" | "desc";
  onSort?: () => void;
  align?: "left" | "right" | "center";
  className?: string;
}) {
  const alignClass =
    align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";

  if (!onSort) {
    return (
      <th className={`px-4 py-3.5 font-bold ${alignClass} ${className}`}>
        {label}
      </th>
    );
  }

  return (
    <th className={`px-4 py-3.5 font-bold ${alignClass} ${className}`}>
      <button
        type="button"
        onClick={onSort}
        className={`admin-btn-touch inline-flex min-h-[36px] items-center gap-1 hover:text-closet-rose ${
          active ? "text-closet-rose" : ""
        } ${align === "right" ? "ml-auto" : ""}`}
      >
        {label}
        {active && direction ? (
          <span className="text-[10px] font-bold" aria-hidden>
            {direction === "asc" ? "↑" : "↓"}
          </span>
        ) : (
          <span className="text-[10px] opacity-30" aria-hidden>
            ↕
          </span>
        )}
      </button>
    </th>
  );
}

export function AdminTableActionsHeader({ className = "" }: { className?: string }) {
  return (
    <th
      className={`sticky right-0 z-20 bg-closet-blush/95 px-4 py-3.5 text-right font-bold ${className}`}
    >
      Actions
    </th>
  );
}

export function AdminTableActionsCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td
      className={`sticky right-0 bg-white/95 px-4 py-3.5 text-right backdrop-blur-sm group-hover:bg-closet-blush/20 sm:bg-transparent sm:backdrop-blur-none ${className}`}
    >
      {children}
    </td>
  );
}
