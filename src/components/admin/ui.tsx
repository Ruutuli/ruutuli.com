"use client";

import { ReactNode, useEffect } from "react";
import { CosplayStatus } from "@/types/cosplay";
import { IconClose } from "./icons";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-sans text-2xl font-bold text-closet-brown sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-closet-brown-light">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-closet-pink/60 bg-white shadow-closet ${className}`}>
      {children}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  accent = "rose",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "rose" | "peach" | "brown" | "blush";
}) {
  const accents = {
    rose: "from-closet-rose/15 to-closet-blush/40 border-closet-rose/20",
    peach: "from-closet-peach/15 to-closet-blush/30 border-closet-peach/25",
    brown: "from-closet-brown/5 to-closet-blush/30 border-closet-brown/10",
    blush: "from-closet-blush to-white border-closet-pink/50",
  };

  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 shadow-closet ${accents[accent]}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-closet-brown-light">{label}</p>
      <p className="mt-2 font-sans text-3xl font-bold text-closet-brown">{value}</p>
      {hint && <p className="mt-1 text-xs font-medium text-closet-brown-light">{hint}</p>}
    </div>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-closet-brown-light"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        inputMode="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="admin-input w-full !pl-11"
      />
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: CosplayStatus }) {
  const styles: Record<CosplayStatus, string> = {
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
    "in-progress": "bg-amber-100 text-amber-900 border-amber-200",
    planned: "bg-slate-100 text-slate-700 border-slate-200",
    retired: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  const labels: Record<CosplayStatus, string> = {
    completed: "Completed",
    "in-progress": "In progress",
    planned: "Planned",
    retired: "Retired",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  className = "",
  type,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "admin-btn-primary",
    secondary: "admin-btn-secondary",
    ghost: "admin-btn-ghost",
    danger: "admin-btn-danger",
  };

  return (
    <button type={type ?? "button"} className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function AdminField({
  label,
  value,
  onChange,
  className = "",
  type = "text",
  placeholder,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  type?: string;
  placeholder?: string;
  list?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-semibold text-closet-brown">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        autoComplete={list ? "off" : undefined}
        className="admin-input w-full"
      />
    </label>
  );
}

export function AdminTextarea({
  label,
  value,
  onChange,
  rows = 3,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-semibold text-closet-brown">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="admin-input w-full resize-y" />
    </label>
  );
}

export function AdminSelect({
  label,
  value,
  onChange,
  options,
  className = "",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block font-semibold text-closet-brown">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="admin-input admin-select w-full disabled:opacity-60"
      >
        {options.map((o, index) => (
          <option key={`${o.value}-${index}`} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-closet-blush/60 text-closet-rose">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <p className="font-sans text-lg font-bold text-closet-brown">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-closet-brown-light">{description}</p>}
    </div>
  );
}

export function AdminToast({ message, onDone }: { message: string; onDone?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div className="admin-toast left-4 right-4 sm:left-auto sm:right-6" role="status">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {message}
    </div>
  );
}

export function AdminModal({
  title,
  children,
  onClose,
  footer,
  wide = false,
  xl = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer: ReactNode;
  wide?: boolean;
  xl?: boolean;
}) {
  const sizeClass = xl ? "max-w-7xl" : wide ? "max-w-3xl" : "";
  const bodyClass = xl ? "max-h-[min(82vh,760px)]" : "max-h-[min(60vh,520px)]";

  /** Defer unmount so the same click cannot hit the page underneath the backdrop. */
  function closeModal() {
    window.requestAnimationFrame(onClose);
  }

  return (
    <div className="admin-modal-backdrop" onClick={closeModal}>
      <div
        className={`admin-modal ${sizeClass}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-closet-pink/50 px-6 py-4">
          <h2 id="admin-modal-title" className="font-sans text-xl font-bold text-closet-brown">
            {title}
          </h2>
          <button type="button" onClick={closeModal} className="admin-btn-icon" aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className={`${bodyClass} overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5`}>{children}</div>
        <div className="flex flex-col-reverse gap-2 border-t border-closet-pink/50 px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 [&_.admin-btn-primary]:min-h-[44px] [&_.admin-btn-secondary]:min-h-[44px] [&_.admin-btn-primary]:w-full sm:[&_.admin-btn-primary]:w-auto [&_.admin-btn-secondary]:w-full sm:[&_.admin-btn-secondary]:w-auto">
          {footer}
        </div>
      </div>
    </div>
  );
}
