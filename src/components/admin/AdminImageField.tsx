"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildImageLoadAttempts,
  normalizeImageUrl,
  parseImageUrlsFromText,
  extractFirstImageUrl,
} from "@/lib/utils/googleDriveImage";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { GalleryItem, GallerySection, GALLERY_SECTION_LABELS } from "@/types/gallery";
import AdminDrivePicker from "./AdminDrivePicker";
import { AdminButton } from "./ui";

function AdminThumbnail({
  src,
  alt,
  className = "h-full w-full object-cover",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const loadAttempts = buildImageLoadAttempts(src);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setAttemptIndex(0);
    setFailed(false);
  }, [src]);

  if (!src?.trim() || isCosplayPlaceholderImage(src) || loadAttempts.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-closet-blush px-2 text-center text-[10px] font-medium text-closet-brown-light">
        No preview
      </div>
    );
  }

  if (failed || attemptIndex >= loadAttempts.length) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-closet-blush px-2 text-center text-[10px] font-medium text-closet-brown-light">
        Preview failed
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={loadAttempts[attemptIndex]!}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        setAttemptIndex((current) => {
          const next = current + 1;
          if (next >= loadAttempts.length) setFailed(true);
          return next;
        });
      }}
    />
  );
}

export function AdminImageField({
  label,
  value,
  onChange,
  className = "",
  variant = "default",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  variant?: "default" | "compact";
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function applyUrl(raw: string) {
    const normalized = extractFirstImageUrl(raw);
    onChange(normalized);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        applyUrl(text);
        return;
      }
    } catch {
      /* fall through to focus input for manual paste */
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  if (variant === "compact") {
    return (
      <>
        <div className={`space-y-2 ${className}`}>
          <span className="text-xs font-semibold text-closet-brown">{label}</span>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => onChange(normalizeImageUrl(e.target.value))}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                const url = extractFirstImageUrl(text);
                if (url) {
                  e.preventDefault();
                  onChange(url);
                }
              }}
              placeholder="Paste image link…"
              className="admin-input min-w-0 flex-1 py-2 text-sm"
            />
            <AdminButton variant="secondary" onClick={() => setPickerOpen(true)} className="shrink-0 text-xs">
              Drive
            </AdminButton>
            <AdminButton variant="secondary" onClick={pasteFromClipboard} className="shrink-0 text-xs">
              Paste
            </AdminButton>
            {value && (
              <AdminButton variant="ghost" onClick={() => onChange("")} className="shrink-0 text-xs">
                Clear
              </AdminButton>
            )}
          </div>
        </div>

        <AdminDrivePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(urls) => urls[0] && applyUrl(urls[0])}
          mode="single"
          title={`Choose ${label.toLowerCase()}`}
        />
      </>
    );
  }

  return (
    <>
      <div className={`space-y-2 ${className}`}>
        <span className="block text-sm font-semibold text-closet-brown">{label}</span>
        <div className="flex gap-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-closet-pink/50 bg-closet-blush">
            <AdminThumbnail src={value} alt="" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => onChange(normalizeImageUrl(e.target.value))}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                const url = extractFirstImageUrl(text);
                if (url) {
                  e.preventDefault();
                  onChange(url);
                }
              }}
              placeholder="https://… or Google Drive link"
              className="admin-input w-full"
            />
            <div className="flex flex-wrap gap-2">
              <AdminButton variant="secondary" onClick={() => setPickerOpen(true)} className="text-xs">
                Browse Google Drive
              </AdminButton>
              <AdminButton variant="secondary" onClick={pasteFromClipboard} className="text-xs">
                Paste link
              </AdminButton>
              {value && (
                <AdminButton variant="ghost" onClick={() => onChange("")} className="text-xs">
                  Clear
                </AdminButton>
              )}
            </div>
            <p className="text-xs text-closet-brown-light">
              Paste a direct image link (.jpg, .png, etc.) — not a Pinterest/Twitter page URL. Google Drive file links work too.
            </p>
          </div>
        </div>
      </div>

      <AdminDrivePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(urls) => urls[0] && applyUrl(urls[0])}
        mode="single"
        title={`Choose ${label.toLowerCase()}`}
      />
    </>
  );
}

function AdminGalleryAddBar({
  urlInput,
  onUrlInputChange,
  onAdd,
  onPasteText,
  onPaste,
  onDrive,
  adding = false,
  placeholder = "Paste image link…",
}: {
  urlInput: string;
  onUrlInputChange: (v: string) => void;
  onAdd: () => void;
  onPasteText: (text: string) => void;
  onPaste: () => void;
  onDrive: () => void;
  adding?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="text"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={urlInput}
        onChange={(e) => onUrlInputChange(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          if (text.trim()) {
            e.preventDefault();
            onPasteText(text);
          }
        }}
        placeholder={placeholder}
        className="admin-input min-w-[12rem] flex-1 py-2 text-sm"
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
      />
      <AdminButton variant="primary" onClick={onAdd} disabled={!urlInput.trim() || adding} className="text-xs">
        {adding ? "Adding…" : "Add"}
      </AdminButton>
      <AdminButton variant="secondary" onClick={onDrive} className="text-xs">
        Drive
      </AdminButton>
      <AdminButton variant="secondary" onClick={onPaste} className="text-xs">
        Paste
      </AdminButton>
    </div>
  );
}

export function AdminGalleryField({
  label,
  value,
  onChange,
  className = "",
  variant = "default",
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  className?: string;
  variant?: "default" | "embedded";
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  function removeUrl(url: string) {
    onChange(value.filter((entry) => entry !== url));
  }

  function addUrls(urls: string[]) {
    if (!urls.length) return;
    const merged = [...value];
    for (const raw of urls) {
      const url = normalizeImageUrl(raw);
      if (url && !merged.includes(url)) merged.push(url);
    }
    onChange(merged);
  }

  function addUrl() {
    addUrls(parseImageUrlsFromText(urlInput));
    setUrlInput("");
  }

  function addBulk() {
    addUrls(parseImageUrlsFromText(bulkInput));
    setBulkInput("");
    setShowBulk(false);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      addUrls(parseImageUrlsFromText(text));
    } catch {
      /* clipboard blocked */
    }
  }

  const isEmbedded = variant === "embedded";

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {!isEmbedded && label && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-closet-brown">{label}</span>
          </div>
        )}

        {value.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {value.map((url) => (
              <div
                key={url}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-closet-pink/50 bg-closet-blush"
              >
                <AdminThumbnail src={url} alt="" />
                <button
                  type="button"
                  onClick={() => removeUrl(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-closet-brown/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-closet-pink/50 bg-closet-blush/15 px-4 py-8 text-center">
            <p className="text-sm text-closet-brown-light">No extra photos yet</p>
          </div>
        )}

        <AdminGalleryAddBar
          urlInput={urlInput}
          onUrlInputChange={setUrlInput}
          onAdd={addUrl}
          onPasteText={(text) => {
            addUrls(parseImageUrlsFromText(text));
            setUrlInput("");
          }}
          onPaste={pasteFromClipboard}
          onDrive={() => setPickerOpen(true)}
        />

        {!isEmbedded && (
          <AdminButton
            variant="ghost"
            onClick={() => setShowBulk((v) => !v)}
            className="text-xs"
          >
            {showBulk ? "Hide bulk paste" : "Bulk paste"}
          </AdminButton>
        )}

        {showBulk && (
          <div className="space-y-2 rounded-xl border border-closet-pink/50 bg-closet-blush/20 p-3">
            <p className="text-xs font-semibold text-closet-brown">
              Paste multiple links — one per line or separated by commas
            </p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={4}
              placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.png"}
              className="admin-input w-full resize-y"
            />
            <AdminButton variant="secondary" onClick={addBulk} disabled={!bulkInput.trim()} className="text-xs">
              Add all URLs
            </AdminButton>
          </div>
        )}

        {!isEmbedded && (
          <p className="text-xs text-closet-brown-light">
            {value.length} photo{value.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <AdminDrivePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(urls) => addUrls(urls)}
        mode="multiple"
        title="Add gallery photos"
      />
    </>
  );
}

const COSPLAY_SECTION_GALLERY_CONFIG: Record<
  Extract<GallerySection, "build" | "reference">,
  {
    title: string;
    shortTitle: string;
    description: string;
    panelClass: string;
    thumbClass: string;
    accentClass: string;
    pickerTitle: string;
  }
> = {
  reference: {
    title: "Reference gallery",
    shortTitle: "References",
    description: "Screenshots, concept art, detail refs",
    panelClass: "rounded-xl border border-amber-200/70 bg-amber-50/30",
    thumbClass: "border-amber-200/80 bg-amber-50/50",
    accentClass: "text-amber-800",
    pickerTitle: "Add reference photos",
  },
  build: {
    title: "Build gallery",
    shortTitle: "Build",
    description: "WIP shots and progress photos",
    panelClass: "rounded-xl border border-sky-200/70 bg-sky-50/30",
    thumbClass: "border-sky-200/80 bg-sky-50/50",
    accentClass: "text-sky-900",
    pickerTitle: "Add build photos",
  },
};

export function AdminCosplaySectionGalleryField({
  cosplayId,
  section,
  className = "",
  embedded = false,
}: {
  cosplayId: string;
  section: Extract<GallerySection, "build" | "reference">;
  className?: string;
  embedded?: boolean;
}) {
  const config = COSPLAY_SECTION_GALLERY_CONFIG[section];
  const sectionLabel = GALLERY_SECTION_LABELS[section].toLowerCase();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkInput, setLinkInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        cosplayId,
        gallerySection: section,
        limit: "100",
        includeStats: "0",
        includeFacets: "0",
      });
      const res = await fetch(`/api/admin/gallery/items?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as { items: GalleryItem[] };
      setItems(data.items ?? []);
    } catch {
      setMessage(`Could not load ${sectionLabel} photos`);
    } finally {
      setLoading(false);
    }
  }, [cosplayId, section, sectionLabel]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  async function addLinks(raw: string) {
    const links = parseImageUrlsFromText(raw);
    if (!links.length) return;

    setAdding(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/gallery/add-by-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links, cosplayId, gallerySection: section }),
      });
      if (!res.ok) throw new Error("add failed");
      const data = (await res.json()) as { added: number; updated: number; errors: string[] };
      const total = data.added + (data.updated ?? 0);
      if (total > 0) {
        setMessage(
          `Added ${total} photo${total === 1 ? "" : "s"} to ${sectionLabel}${
            data.errors.length ? ` · ${data.errors.length} skipped` : ""
          }`,
        );
      } else {
        setMessage(data.errors[0] ?? "No new photos added");
      }
      setLinkInput("");
      await loadItems();
    } catch {
      setMessage("Could not add links");
    } finally {
      setAdding(false);
    }
  }

  async function removeItem(item: GalleryItem) {
    const nextCosplayIds = item.cosplayIds.filter((id) => id !== cosplayId);
    try {
      const res = await fetch(`/api/admin/gallery/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cosplayIds: nextCosplayIds }),
      });
      if (!res.ok) throw new Error("remove failed");
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch {
      setMessage("Could not remove photo");
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      await addLinks(text);
    } catch {
      /* clipboard blocked */
    }
  }

  const content = (
    <>
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h4 className={`text-sm font-bold ${config.accentClass}`}>
            {embedded ? config.shortTitle : config.title}
          </h4>
          <p className="text-[11px] text-closet-brown-light">{config.description}</p>
        </div>
        {!loading && (
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-closet-brown-light ring-1 ring-closet-pink/40">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-closet-brown-light">Loading…</p>
      ) : items.length > 0 ? (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border ${config.thumbClass}`}
            >
              <AdminThumbnail src={item.viewUrl} alt={item.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => void removeItem(item)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-closet-brown/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Remove from ${sectionLabel}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={`mb-3 rounded-lg border border-dashed px-3 py-6 text-center ${config.thumbClass}`}>
          <p className="text-xs text-closet-brown-light">No photos yet</p>
        </div>
      )}

      <AdminGalleryAddBar
        urlInput={linkInput}
        onUrlInputChange={setLinkInput}
        onAdd={() => void addLinks(linkInput)}
        onPasteText={(text) => void addLinks(text)}
        onPaste={() => void pasteFromClipboard()}
        onDrive={() => setPickerOpen(true)}
        adding={adding}
      />

      {message && <p className="mt-2 text-xs font-medium text-closet-rose">{message}</p>}
    </>
  );

  return (
    <>
      {embedded ? (
        <div className={className}>{content}</div>
      ) : (
        <div className={`space-y-3 border-t border-closet-pink/40 pt-6 ${className} ${config.panelClass} p-4`}>
          {content}
        </div>
      )}

      <AdminDrivePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(urls) => void addLinks(urls.join("\n"))}
        mode="multiple"
        title={config.pickerTitle}
      />
    </>
  );
}

/** @deprecated Use AdminCosplaySectionGalleryField with section="build" */
export function AdminBuildGalleryField({
  cosplayId,
  className = "",
}: {
  cosplayId: string;
  className?: string;
}) {
  return <AdminCosplaySectionGalleryField cosplayId={cosplayId} section="build" className={className} />;
}
