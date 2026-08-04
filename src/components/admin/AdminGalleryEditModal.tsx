"use client";

import { useEffect, useMemo, useState } from "react";
import { Cosplay } from "@/types/cosplay";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { GalleryItem, GALLERY_IMAGE_TYPE_LABELS, GALLERY_SECTION_LABELS, GalleryImageType, GallerySection } from "@/types/gallery";
import { getGalleryAdminImageSrc, getGoogleDriveFileId } from "@/lib/utils/googleDriveImage";
import {
  filterCosplaysByQuery,
  suggestCosplaysFromFilename,
  cosplayPickerSubtitle,
} from "@/lib/gallery/suggestCosplayFromFilename";
import {
  AdminButton,
  AdminField,
  AdminModal,
  AdminSearch,
  AdminTextarea,
} from "./ui";

function imageUrlsMatch(a: string, b: string): boolean {
  const idA = getGoogleDriveFileId(a);
  const idB = getGoogleDriveFileId(b);
  if (idA && idB) return idA === idB;
  return a.trim() === b.trim();
}

function CosplayThumb({ src, label }: { src: string; label: string }) {
  if (isCosplayPlaceholderImage(src)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-closet-blush font-display text-xs font-bold text-closet-rose/45">
        {label.charAt(0)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getGalleryAdminImageSrc(src)}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
  );
}

interface AdminGalleryEditModalProps {
  item: GalleryItem;
  cosplays: Cosplay[];
  conventionOptions: string[];
  photographerOptions: string[];
  editTags: string;
  editNotes: string;
  editConvention: string;
  editPhotographer: string;
  editCosplayIds: string[];
  editImageType: GalleryImageType | null;
  editGallerySection: GallerySection | null;
  published: boolean;
  saving: boolean;
  settingPhoto: string | null;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
  onPublishedChange: (published: boolean) => void;
  onTagsChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onConventionChange: (v: string) => void;
  onPhotographerChange: (v: string) => void;
  onToggleCosplay: (cosplayId: string) => void;
  onImageTypeChange: (imageType: GalleryImageType | null) => void;
  onGallerySectionChange: (section: GallerySection | null) => void;
  onSetCosplayPhoto: (cosplayId: string, role: "characterArt" | "image", clear?: boolean) => void;
  onParseFilename: () => void;
}

export default function AdminGalleryEditModal({
  item,
  cosplays,
  conventionOptions,
  photographerOptions,
  editTags,
  editNotes,
  editConvention,
  editPhotographer,
  editCosplayIds,
  editImageType,
  editGallerySection,
  published,
  saving,
  settingPhoto,
  onClose,
  onSave,
  onRemove,
  onPublishedChange,
  onTagsChange,
  onNotesChange,
  onConventionChange,
  onPhotographerChange,
  onToggleCosplay,
  onImageTypeChange,
  onGallerySectionChange,
  onSetCosplayPhoto,
  onParseFilename,
}: AdminGalleryEditModalProps) {
  const [cosplayQuery, setCosplayQuery] = useState("");
  const [showAllCosplays, setShowAllCosplays] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    setCosplayQuery("");
    setShowAllCosplays(false);
    setShowCredits(!!editConvention || !!editPhotographer);
    setShowExtra(!!editTags || !!editNotes);
  }, [item.id, editConvention, editPhotographer, editTags, editNotes]);

  const cosplayMap = useMemo(() => new Map(cosplays.map((c) => [c.id, c])), [cosplays]);
  const uniqueCosplays = useMemo(() => Array.from(cosplayMap.values()), [cosplayMap]);
  const suggested = useMemo(
    () => suggestCosplaysFromFilename(item.name, uniqueCosplays).filter((c) => !editCosplayIds.includes(c.id)),
    [item.name, uniqueCosplays, editCosplayIds],
  );
  const linkedCosplays = useMemo(
    () => [...new Set(editCosplayIds)].map((id) => cosplayMap.get(id)).filter(Boolean) as Cosplay[],
    [editCosplayIds, cosplayMap],
  );
  const browseCosplays = useMemo(() => {
    const pool = cosplayQuery.trim() || showAllCosplays ? filterCosplaysByQuery(uniqueCosplays, cosplayQuery) : [];
    return pool.filter((c) => !editCosplayIds.includes(c.id));
  }, [uniqueCosplays, cosplayQuery, showAllCosplays, editCosplayIds]);

  const datalistId = `gallery-conventions-${item.id}`;
  const photographerDatalistId = `gallery-photographers-${item.id}`;
  const linkingLocked = !!settingPhoto || saving;

  return (
    <AdminModal
      title={item.name}
      onClose={onClose}
      xl
      footer={
        <>
          <AdminButton variant="danger" onClick={onRemove}>
            Remove image
          </AdminButton>
          <div className="flex-1" />
          <AdminButton variant="secondary" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </AdminButton>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)]">
        {/* Preview column */}
        <div className="space-y-3 lg:sticky lg:top-0 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-closet-pink/50 bg-closet-blush/30 shadow-closet">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={item.driveFileId}
              src={getGalleryAdminImageSrc(item.viewUrl, { driveFileId: item.driveFileId, width: 800 })}
              alt=""
              className="aspect-[3/4] w-full object-cover"
              decoding="async"
            />
          </div>
          <a
            href={item.viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-semibold text-closet-rose hover:underline"
          >
            Open in Google Drive
          </a>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-closet-pink/50 bg-white px-3 py-2.5 text-sm font-semibold text-closet-brown">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => onPublishedChange(e.target.checked)}
              className="h-4 w-4 rounded border-closet-pink text-closet-rose"
            />
            Live on site
          </label>

          <div className="rounded-xl border border-closet-pink/50 bg-white p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-closet-brown-light">
              Image type
            </p>
            <div className="grid gap-2">
              {(["reference", "featured"] as const).map((type) => {
                const active = editImageType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={linkingLocked}
                    onClick={() => onImageTypeChange(active ? null : type)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-bold transition ${
                      active
                        ? type === "reference"
                          ? "border-amber-400 bg-amber-50 text-amber-900"
                          : "border-closet-rose bg-closet-blush text-closet-brown"
                        : "border-closet-pink/50 bg-closet-blush/20 text-closet-brown-light hover:border-closet-pink"
                    }`}
                  >
                    {active ? "✓ " : ""}
                    {GALLERY_IMAGE_TYPE_LABELS[type].toUpperCase()}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-closet-brown-light">
              Reference = roster card front · Featured = flip card back
            </p>
          </div>

          <div className="rounded-xl border border-closet-pink/50 bg-white p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-closet-brown-light">
              Page gallery
            </p>
            <div className="grid gap-2">
              {(["build", "convention"] as const).map((section) => {
                const active = editGallerySection === section;
                return (
                  <button
                    key={section}
                    type="button"
                    disabled={linkingLocked}
                    onClick={() => onGallerySectionChange(active ? null : section)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs font-bold transition ${
                      active
                        ? section === "build"
                          ? "border-sky-400 bg-sky-50 text-sky-900"
                          : "border-violet-400 bg-violet-50 text-violet-900"
                        : "border-closet-pink/50 bg-closet-blush/20 text-closet-brown-light hover:border-closet-pink"
                    }`}
                  >
                    {active ? "✓ " : ""}
                    {GALLERY_SECTION_LABELS[section].toUpperCase()}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-snug text-closet-brown-light">
              Build = progress & WIP shots · Gallery = finished cosplay photos
            </p>
          </div>
        </div>

        {/* Main column — character first */}
        <div className="space-y-5">
          {/* 1. Character linking */}
          <section className="rounded-2xl border-2 border-closet-rose/35 bg-gradient-to-br from-closet-blush/50 to-white p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-closet-rose">Step 1</p>
              <h3 className="font-sans text-lg font-bold text-closet-brown">Which character is this?</h3>
              <p className="mt-1 text-xs text-closet-brown-light">
                Link the roster build this photo belongs to — reference & feature actions appear once linked.
              </p>
            </div>

            {suggested.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-closet-brown-light">
                  Suggested from filename
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggested.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={linkingLocked}
                      onClick={() => onToggleCosplay(c.id)}
                      className="flex items-center gap-2 rounded-xl border border-closet-rose/40 bg-white px-2 py-1.5 pr-3 shadow-sm transition hover:border-closet-rose hover:bg-closet-blush/30 disabled:opacity-50"
                    >
                      <div className="relative h-9 w-7 shrink-0 overflow-hidden rounded-md border border-closet-pink/40 bg-closet-blush">
                        <CosplayThumb src={c.characterArt} label={c.character} />
                      </div>
                      <span className="text-left text-sm font-semibold text-closet-brown">
                        {c.character}
                        <span className="block text-[10px] font-medium text-closet-brown-light">
                          {cosplayPickerSubtitle(c)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {linkedCosplays.length > 0 && (
              <div className="mb-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wide text-closet-brown-light">Linked</p>
                {linkedCosplays.map((c) => {
                  const isRef = imageUrlsMatch(c.characterArt, item.viewUrl);
                  const isFeatured = imageUrlsMatch(c.image, item.viewUrl);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-closet-pink/60 bg-white p-3 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-11 w-9 shrink-0 overflow-hidden rounded-lg border border-closet-pink/40 bg-closet-blush">
                            <CosplayThumb src={c.characterArt} label={c.character} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-closet-brown">{c.character}</p>
                            <p className="text-xs text-closet-brown-light">{cosplayPickerSubtitle(c)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={linkingLocked}
                          onClick={() => onToggleCosplay(c.id)}
                          className="text-xs font-semibold text-closet-rose hover:underline disabled:opacity-50"
                        >
                          Unlink
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <AdminButton
                          variant={isRef ? "danger" : "secondary"}
                          className="w-full justify-center text-xs"
                          disabled={!!settingPhoto}
                          onClick={() => onSetCosplayPhoto(c.id, "characterArt", isRef)}
                        >
                          {settingPhoto === `${c.id}-characterArt`
                            ? "Saving…"
                            : isRef
                              ? "Remove as character reference"
                              : "Use as character reference"}
                        </AdminButton>
                        <AdminButton
                          variant={isFeatured ? "danger" : "secondary"}
                          className="w-full justify-center text-xs"
                          disabled={!!settingPhoto}
                          onClick={() => onSetCosplayPhoto(c.id, "image", isFeatured)}
                        >
                          {settingPhoto === `${c.id}-image`
                            ? "Saving…"
                            : isFeatured
                              ? "Remove as featured photo"
                              : "Use as featured photo"}
                        </AdminButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <AdminSearch
              value={cosplayQuery}
              onChange={(v) => {
                setCosplayQuery(v);
                if (v.trim()) setShowAllCosplays(true);
              }}
              placeholder="Search all characters…"
              className="mb-2"
            />

            {!showAllCosplays && !cosplayQuery.trim() && linkedCosplays.length === 0 && suggested.length === 0 && (
              <AdminButton
                variant="secondary"
                disabled={linkingLocked}
                onClick={() => setShowAllCosplays(true)}
                className="w-full text-sm"
              >
                Browse roster
              </AdminButton>
            )}

            {(showAllCosplays || cosplayQuery.trim()) && (
              <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-closet-pink/50 bg-white/80 p-2">
                {browseCosplays.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-closet-brown-light">No matches</p>
                ) : (
                  browseCosplays.slice(0, 40).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={linkingLocked}
                      onClick={() => onToggleCosplay(c.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-closet-blush/40 disabled:opacity-50"
                    >
                      <div className="relative h-8 w-6 shrink-0 overflow-hidden rounded border border-closet-pink/40 bg-closet-blush">
                        <CosplayThumb src={c.characterArt} label={c.character} />
                      </div>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-closet-brown">
                        {c.character}
                        <span className="font-normal text-closet-brown-light"> · {cosplayPickerSubtitle(c)}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-closet-rose">+ Link</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </section>

          {/* 2. Credits — collapsed by default */}
          <section className="rounded-2xl border border-closet-pink/50 bg-white">
            <button
              type="button"
              onClick={() => setShowCredits((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-closet-brown-light">Step 2</p>
                <p className="text-sm font-bold text-closet-brown">Convention & photographer</p>
              </div>
              <span className="text-closet-brown-light">{showCredits ? "−" : "+"}</span>
            </button>
            {showCredits && (
              <div className="space-y-3 border-t border-closet-pink/40 px-4 pb-4 pt-3">
                <AdminField
                  label="Convention"
                  value={editConvention}
                  onChange={onConventionChange}
                  placeholder="Katsucon 2017"
                  list={datalistId}
                />
                <datalist id={datalistId}>
                  {conventionOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <AdminField
                  label="Photographer"
                  value={editPhotographer}
                  onChange={onPhotographerChange}
                  placeholder="EBK"
                  list={photographerDatalistId}
                />
                <datalist id={photographerDatalistId}>
                  {photographerOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <AdminButton variant="ghost" onClick={onParseFilename} className="text-xs">
                  Parse from filename
                </AdminButton>
              </div>
            )}
          </section>

          {/* 3. Extra */}
          <section className="rounded-2xl border border-closet-pink/50 bg-white">
            <button
              type="button"
              onClick={() => setShowExtra((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-closet-brown-light">Optional</p>
                <p className="text-sm font-bold text-closet-brown">Tags & notes</p>
              </div>
              <span className="text-closet-brown-light">{showExtra ? "−" : "+"}</span>
            </button>
            {showExtra && (
              <div className="space-y-3 border-t border-closet-pink/40 px-4 pb-4 pt-3">
                <AdminField label="Tags" value={editTags} onChange={onTagsChange} placeholder="wip, group shot" />
                <AdminTextarea label="Notes" value={editNotes} onChange={onNotesChange} />
                <p className="break-all text-[10px] text-closet-brown-light">{item.viewUrl}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminModal>
  );
}
