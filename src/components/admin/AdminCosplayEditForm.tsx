"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cosplay, CosplayStatus, getCosplayPartsPercent } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { emptyCosplayForm } from "@/lib/cosplay/emptyForm";
import { resolveImageSrc } from "@/lib/utils/googleDriveImage";
import { isCosplayPlaceholderImage } from "@/lib/cosplay/images";
import { GoogleDriveImage } from "@/components/GoogleDriveImage";
import AdminConventionField from "./AdminConventionField";
import { AdminGalleryField, AdminImageField } from "./AdminImageField";
import { AdminCosplayPartsEditor, applyPartsToCosplay } from "./AdminCosplayPartsEditor";
import AdminCosplaySourcesEditor from "./AdminCosplaySourcesEditor";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminSelect,
  AdminStatusBadge,
  AdminTextarea,
  AdminToast,
} from "./ui";

const STATUSES: CosplayStatus[] = ["planned", "in-progress", "completed", "retired"];

type EditTab = "details" | "media" | "parts" | "sources";

const TABS: { id: EditTab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "media", label: "Photos & Gallery" },
  { id: "parts", label: "Costume Parts" },
  { id: "sources", label: "Sources & Credits" },
];

function cloneForEdit(c: Cosplay): Partial<Cosplay> {
  return {
    ...c,
    gallery: [...c.gallery],
    tags: [...c.tags],
    progress: c.progress ? [...c.progress] : [],
    parts: c.parts ? c.parts.map((p) => ({ ...p })) : [],
    sources: c.sources ? c.sources.map((s) => ({ ...s })) : [],
  };
}

function buildSavePayload(form: Partial<Cosplay>): Partial<Cosplay> {
  return applyPartsToCosplay({
    ...form,
    title: form.title || form.character,
    tags:
      typeof form.tags === "string"
        ? (form.tags as unknown as string).split(",").map((s) => s.trim())
        : form.tags,
    gallery:
      typeof form.gallery === "string"
        ? (form.gallery as unknown as string).split("\n").map((s) => s.trim()).filter(Boolean)
        : form.gallery,
  });
}

export default function AdminCosplayEditForm({
  initial,
  isNew = false,
  events: initialEvents,
  extraConventionOptions: initialConventionOptions,
}: {
  initial?: Partial<Cosplay>;
  isNew?: boolean;
  events?: ConEvent[];
  extraConventionOptions?: string[];
}) {
  const saveInFlight = useRef(false);
  const [events, setEvents] = useState<ConEvent[]>(initialEvents ?? []);
  const [extraConventionOptions, setExtraConventionOptions] = useState<string[]>(initialConventionOptions ?? []);
  const [form, setForm] = useState<Partial<Cosplay>>(() => {
    if (isNew) return emptyCosplayForm();
    return cloneForEdit(initial as Cosplay);
  });
  const [created, setCreated] = useState(false);
  const [tab, setTab] = useState<EditTab>("details");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const needsEvents = !initialEvents?.length;
    const needsConventions = initialConventionOptions === undefined;
    if (!needsEvents && !needsConventions) return;

    let cancelled = false;
    void (async () => {
      try {
        const [eventRes, cosplayRes] = await Promise.all([
          needsEvents ? fetch("/api/admin/events") : Promise.resolve(null),
          needsConventions ? fetch("/api/admin/cosplays") : Promise.resolve(null),
        ]);

        if (cancelled) return;

        if (eventRes) {
          if (!eventRes.ok) throw new Error("events fetch failed");
          setEvents((await eventRes.json()) as ConEvent[]);
        }
        if (cosplayRes) {
          if (!cosplayRes.ok) throw new Error("cosplays fetch failed");
          const cosplays = (await cosplayRes.json()) as Cosplay[];
          setExtraConventionOptions(
            [...new Set(cosplays.map((c) => c.convention).filter(Boolean) as string[])].sort(),
          );
        }
      } catch {
        if (!cancelled) setMessage("Could not load calendar data");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialEvents, initialConventionOptions]);

  const isEditing = !isNew || created;

  const partsPct = useMemo(() => {
    if (!form.parts?.length) return null;
    return getCosplayPartsPercent({ parts: form.parts } as Cosplay);
  }, [form.parts]);

  const ownedCount = form.parts?.filter((p) => p.owned).length ?? 0;
  const galleryCount = Array.isArray(form.gallery) ? form.gallery.length : 0;
  const sourcesCount = form.sources?.length ?? 0;

  const title = !isEditing ? "New build" : form.character || "Edit build";
  const canSave = !!(form.character?.trim() && form.series?.trim());

  async function save() {
    if (!canSave || saveInFlight.current) return;

    const payload = buildSavePayload(form);
    const snapshot = cloneForEdit(form as Cosplay);

    if (isEditing && form.id) {
      saveInFlight.current = true;
      setForm(cloneForEdit({ ...payload, id: form.id } as Cosplay));
      setMessage("Saved");

      const slowTimer = window.setTimeout(() => setSaving(true), 400);

      try {
        const res = await fetch("/api/admin/cosplays", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: form.id }),
        });
        if (!res.ok) throw new Error("save failed");
        const saved = (await res.json()) as Cosplay;
        setForm(cloneForEdit(saved));
      } catch {
        setForm(snapshot);
        setMessage("Could not save cosplay");
      } finally {
        window.clearTimeout(slowTimer);
        setSaving(false);
        saveInFlight.current = false;
      }
      return;
    }

    saveInFlight.current = true;
    setSaving(true);

    try {
      const res = await fetch("/api/admin/cosplays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("create failed");

      const saved = (await res.json()) as Cosplay;
      setForm(cloneForEdit(saved));
      setCreated(true);
      window.history.replaceState(null, "", `/admin/cosplays/${saved.id}/edit`);
      setMessage("Cosplay created");
    } catch {
      setMessage("Could not save cosplay");
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  }

  async function remove() {
    if (!form.id || !confirm("Delete this cosplay permanently?")) return;
    const res = await fetch(`/api/admin/cosplays?id=${encodeURIComponent(form.id)}`, { method: "DELETE" });
    if (!res.ok) {
      setMessage("Could not delete");
      return;
    }
    window.location.href = "/admin/cosplays";
  }

  function update(patch: Partial<Cosplay>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const charArtSrc = form.characterArt ? resolveImageSrc(form.characterArt) : "";
  const hasCharArt = !isCosplayPlaceholderImage(form.characterArt) && !!form.characterArt?.trim();
  const hasPhoto = !isCosplayPlaceholderImage(form.image) && !!form.image?.trim();

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/admin/cosplays"
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-closet-rose hover:underline"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to roster
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            {isEditing && !isCosplayPlaceholderImage(form.characterArt) && charArtSrc && (
              <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-xl border border-closet-pink/50 bg-closet-blush shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={charArtSrc} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="font-sans text-2xl font-bold text-closet-brown sm:text-3xl">{title}</h1>
              {isEditing && (
                <p className="mt-0.5 text-sm text-closet-brown-light">
                  {form.series}
                  {form.outfit && form.outfit !== "Default" ? ` · ${form.outfit}` : ""}
                </p>
              )}
            </div>
            {isEditing && form.status && (
              <AdminStatusBadge status={form.status} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEditing && form.id && (
            <>
              <Link href={`/roster/${form.id}`} target="_blank" className="admin-btn-secondary text-sm">
                View on site
              </Link>
              <Link
                href={`/api/admin/cosplays/pin-cards?id=${encodeURIComponent(form.id)}`}
                target="_blank"
                className="admin-btn-secondary text-sm"
              >
                Print pin card
              </Link>
              <AdminButton variant="danger" onClick={remove}>
                Delete
              </AdminButton>
            </>
          )}
        </div>
      </div>

      {/* Summary chips */}
      {isEditing && (
        <div className="flex flex-wrap gap-2">
          {partsPct != null && form.status !== "retired" && (
            <span className="rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-bold text-closet-brown">
              {ownedCount}/{form.parts!.length} parts · {partsPct}%
            </span>
          )}
          <span className="rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-bold text-closet-brown">
            {galleryCount} gallery photo{galleryCount === 1 ? "" : "s"}
          </span>
          {form.spotlight && (
            <span className="rounded-full border border-closet-rose/40 bg-closet-blush px-3 py-1 text-xs font-bold text-closet-rose">
              ★ Homepage spotlight
            </span>
          )}
          {form.featuredForMediaKit && (
            <span className="rounded-full border border-closet-rose/40 bg-closet-blush px-3 py-1 text-xs font-bold text-closet-rose">
              Media Kit featured
            </span>
          )}
          {form.convention && (
            <span className="rounded-full border border-violet-300/60 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-900">
              🎫 {form.convention}
            </span>
          )}
        </div>
      )}

      {/* Convention — always visible */}
      <AdminConventionField
        value={form.convention ?? ""}
        onChange={(convention) => update({ convention: convention || undefined })}
        events={events}
        extraOptions={extraConventionOptions}
      />

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-closet-pink/50 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-t-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.id
                ? "bg-white text-closet-rose shadow-sm ring-1 ring-closet-pink/50 ring-b-0"
                : "text-closet-brown-light hover:bg-closet-blush/40 hover:text-closet-brown"
            }`}
          >
            {t.label}
            {t.id === "parts" && form.parts?.length ? (
              <span className="ml-1.5 opacity-70">
                ({form.status === "retired" ? form.parts.length : `${ownedCount}/${form.parts.length}`})
              </span>
            ) : null}
            {t.id === "media" && galleryCount > 0 ? (
              <span className="ml-1.5 opacity-70">({galleryCount})</span>
            ) : null}
            {t.id === "sources" && sourcesCount > 0 ? (
              <span className="ml-1.5 opacity-70">({sourcesCount})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === "details" && (
        <AdminCard className="p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <AdminField
              label="Character"
              value={form.character ?? ""}
              onChange={(v) => update({ character: v })}
            />
            <AdminField label="Series" value={form.series ?? ""} onChange={(v) => update({ series: v })} />
            <AdminField label="Outfit" value={form.outfit ?? ""} onChange={(v) => update({ outfit: v })} />
            <AdminField label="Title" value={form.title ?? ""} onChange={(v) => update({ title: v })} placeholder="Defaults to character name" />
            <AdminSelect
              label="Status"
              value={form.status ?? "planned"}
              onChange={(v) => update({ status: v as CosplayStatus })}
              options={STATUSES.map((s) => ({
                value: s,
                label: s === "in-progress" ? "In progress" : s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
            {!form.parts?.length && form.status !== "retired" && (
              <AdminField
                label="Progress %"
                value={String(form.progress?.[0]?.percent ?? 0)}
                onChange={(v) => update({ progress: [{ label: "Overall", percent: Number(v) || 0 }] })}
                type="number"
              />
            )}
            <AdminTextarea
              label="Description"
              value={form.description ?? ""}
              onChange={(v) => update({ description: v })}
              rows={4}
              className="sm:col-span-2"
            />
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-closet-pink/50 bg-closet-blush/20 px-4 py-3.5 sm:col-span-2">
              <input
                type="checkbox"
                checked={!!form.spotlight}
                onChange={(e) => update({ spotlight: e.target.checked })}
                className="h-4 w-4 rounded border-closet-pink text-closet-rose focus:ring-closet-rose/30"
              />
              <div>
                <span className="text-sm font-semibold text-closet-brown">Featured spotlight on home page</span>
                <p className="text-xs text-closet-brown-light">Shows this build prominently on the homepage</p>
              </div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-closet-pink/50 bg-closet-blush/20 px-4 py-3.5 sm:col-span-2">
              <input
                type="checkbox"
                checked={!!form.featuredForMediaKit}
                onChange={(e) => update({ featuredForMediaKit: e.target.checked })}
                className="h-4 w-4 rounded border-closet-pink text-closet-rose focus:ring-closet-rose/30"
              />
              <div>
                <span className="text-sm font-semibold text-closet-brown">Featured on Media Kit</span>
                <p className="text-xs text-closet-brown-light">Shows in the Featured Work section on the public Media Kit page</p>
              </div>
            </label>
          </div>
        </AdminCard>
      )}

      {tab === "media" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          {/* Preview column */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-closet-pink/50 bg-closet-blush/30 shadow-closet">
              <p className="border-b border-closet-pink/40 bg-white/80 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-closet-brown-light">
                Roster card preview
              </p>
              <div className="grid grid-cols-2 gap-px bg-closet-pink/30 p-px">
                <div>
                  <p className="bg-white/90 px-2 py-1 text-center text-[9px] font-bold uppercase text-closet-brown-light">
                    Reference
                  </p>
                  <div className="relative aspect-[3/4] bg-closet-blush">
                    {hasCharArt ? (
                      <GoogleDriveImage
                        src={form.characterArt!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-closet-brown-light">No art</div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="bg-white/90 px-2 py-1 text-center text-[9px] font-bold uppercase text-closet-brown-light">
                    Featured
                  </p>
                  <div className="relative aspect-[3/4] bg-closet-blush">
                    {hasPhoto ? (
                      <GoogleDriveImage
                        src={form.image!}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-closet-brown-light">No photo</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-closet-brown-light">
              Reference = card front · Featured = card back
            </p>
          </div>

          {/* Fields column */}
          <AdminCard className="space-y-6 p-5 sm:p-6">
            <AdminImageField
              label="Character art"
              value={form.characterArt ?? ""}
              onChange={(v) => update({ characterArt: v })}
            />
            <AdminImageField
              label="Cosplay photo"
              value={form.image ?? ""}
              onChange={(v) => update({ image: v })}
            />
            <AdminField
              label="Cosplay photo object position"
              value={form.imagePosition ?? ""}
              onChange={(v) => update({ imagePosition: v || undefined })}
              placeholder="center top"
            />
            <AdminField
              label="Character art object position"
              value={form.characterArtPosition ?? ""}
              onChange={(v) => update({ characterArtPosition: v || undefined })}
              placeholder="center top"
            />
            <AdminGalleryField
              label="Gallery"
              value={Array.isArray(form.gallery) ? form.gallery : []}
              onChange={(gallery) => update({ gallery })}
            />
          </AdminCard>
        </div>
      )}

      {tab === "parts" && (
        <AdminCard className="p-5 sm:p-6">
          <AdminCosplayPartsEditor
            key={form.id ?? "new"}
            parts={form.parts ?? []}
            expanded
            trackProgress={form.status !== "retired"}
            onChange={(parts) => update(applyPartsToCosplay({ ...form, parts }))}
          />
        </AdminCard>
      )}

      {tab === "sources" && (
        <AdminCard className="p-5 sm:p-6">
          <AdminCosplaySourcesEditor
            sources={form.sources ?? []}
            onChange={(sources) => update({ sources })}
          />
        </AdminCard>
      )}

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-closet-pink/50 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6 lg:pl-[calc(16rem+2rem)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <p className="hidden text-sm text-closet-brown-light sm:block">
            {!canSave ? "Character and series are required" : "Changes are saved when you click Save"}
          </p>
          <div className="ml-auto flex gap-3">
            <Link href="/admin/cosplays" className="admin-btn-secondary">
              Cancel
            </Link>
            <AdminButton variant="primary" onClick={save} disabled={saving || !canSave}>
              {saving ? "Saving…" : isEditing ? "Save changes" : "Create build"}
            </AdminButton>
          </div>
        </div>
      </div>

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
