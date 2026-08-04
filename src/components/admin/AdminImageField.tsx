"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildImageLoadAttempts,
  normalizeImageUrl,
  parseImageUrlsFromText,
  extractFirstImageUrl,
} from "@/lib/utils/googleDriveImage";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
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

export function AdminGalleryField({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  className?: string;
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

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-closet-brown">{label}</span>
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setPickerOpen(true)} className="text-xs">
              Add from Drive
            </AdminButton>
            <AdminButton variant="secondary" onClick={pasteFromClipboard} className="text-xs">
              Paste links
            </AdminButton>
            <AdminButton
              variant="ghost"
              onClick={() => setShowBulk((v) => !v)}
              className="text-xs"
            >
              {showBulk ? "Hide bulk paste" : "Bulk paste"}
            </AdminButton>
          </div>
        </div>

        {value.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
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
        )}

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData("text");
              const urls = parseImageUrlsFromText(text);
              if (urls.length > 0) {
                e.preventDefault();
                addUrls(urls);
                setUrlInput("");
              }
            }}
            placeholder="Paste one or more image URLs"
            className="admin-input flex-1"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          />
          <AdminButton variant="secondary" onClick={addUrl} disabled={!urlInput.trim()}>
            Add
          </AdminButton>
        </div>

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

        <p className="text-xs text-closet-brown-light">
          {value.length} photo{value.length === 1 ? "" : "s"} in gallery
        </p>
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
