"use client";

import { useState } from "react";
import { Cosplay } from "@/types/cosplay";
import {
  MediaKitAudienceDetails,
  MediaKitCollaborationService,
  MediaKitHeroImage,
  MediaKitPastCollaboration,
  MediaKitPlatform,
  MediaKitPlatformId,
  MediaKitPressFeature,
  MediaKitSettings,
} from "@/types/mediaKit";
import { AdminImageField } from "./AdminImageField";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminPageHeader,
  AdminTextarea,
  AdminToast,
} from "./ui";

const PLATFORM_LABELS: Record<MediaKitPlatformId, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitch: "Twitch",
  bluesky: "Bluesky",
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-closet-pink/40 bg-closet-blush/30 px-5 py-3 font-sans text-sm font-bold text-closet-brown">
      {children}
    </h2>
  );
}

function HeroImageEditor({
  label,
  image,
  cosplays,
  onChange,
  onRemove,
}: {
  label: string;
  image: MediaKitHeroImage;
  cosplays: Cosplay[];
  onChange: (image: MediaKitHeroImage) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-closet-pink/50 bg-closet-blush/15 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-closet-brown">{label}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-closet-rose hover:underline">
            Remove
          </button>
        )}
      </div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-closet-brown-light">
          Cosplay from roster
        </span>
        <select
          className="admin-input w-full"
          value={image.cosplayId ?? ""}
          onChange={(e) =>
            onChange({ ...image, cosplayId: e.target.value || undefined, src: e.target.value ? undefined : image.src })
          }
        >
          <option value="">— Pick from roster —</option>
          {cosplays.map((c) => (
            <option key={c.id} value={c.id}>
              {c.character} ({c.series})
            </option>
          ))}
        </select>
      </label>
      {!image.cosplayId && (
        <AdminImageField
          label="Image URL"
          value={image.src ?? ""}
          onChange={(v) => onChange({ ...image, src: v })}
        />
      )}
      <AdminField label="Alt text" value={image.alt} onChange={(v) => onChange({ ...image, alt: v })} />
      <AdminField
        label="Object position"
        value={image.objectPosition ?? ""}
        onChange={(v) => onChange({ ...image, objectPosition: v || undefined })}
        placeholder="center top"
      />
      <AdminField
        label="Rotation (degrees)"
        value={String(image.rotation ?? 0)}
        onChange={(v) => onChange({ ...image, rotation: Number(v) || 0 })}
        type="number"
      />
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  renderItem,
  onAdd,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (item: T) => void, remove: () => void) => React.ReactNode;
  onAdd: () => T;
  addLabel: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) =>
        renderItem(
          item,
          index,
          (updated) => {
            const next = [...items];
            next[index] = updated;
            onChange(next);
          },
          () => onChange(items.filter((_, i) => i !== index)),
        ),
      )}
      <AdminButton
        variant="ghost"
        onClick={() => onChange([...items, onAdd()])}
        className="w-full justify-center"
      >
        + {addLabel}
      </AdminButton>
    </div>
  );
}

export default function AdminMediaKitForm({
  initial,
  cosplays,
}: {
  initial: MediaKitSettings;
  cosplays: Cosplay[];
}) {
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(patch: Partial<MediaKitSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function updateHero(patch: Partial<MediaKitSettings["hero"]>) {
    setSettings((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  }

  function updatePlatform(id: MediaKitPlatformId, patch: Partial<MediaKitPlatform>) {
    setSettings((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }

  function updateAudience(patch: Partial<MediaKitAudienceDetails>) {
    setSettings((prev) => ({
      ...prev,
      audienceDetails: { ...prev.audienceDetails, ...patch },
    }));
  }

  async function save() {
    const snapshot = settings;
    setMessage("Media kit saved");

    const slowTimer = window.setTimeout(() => setSaving(true), 400);

    try {
      const res = await fetch("/api/admin/media-kit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("save failed");
      setSettings(await res.json());
    } catch {
      setSettings(snapshot);
      setMessage("Could not save media kit");
    } finally {
      window.clearTimeout(slowTimer);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminPageHeader
        title="Media Kit"
        description="Content shown on the public Media Kit page for brands and collaborators."
      />

      <AdminCard>
        <SectionTitle>Hero & introduction</SectionTitle>
        <div className="space-y-5 p-5">
          <AdminField label="Eyebrow" value={settings.eyebrow} onChange={(v) => update({ eyebrow: v })} />
          <AdminField
            label="Heading"
            value={settings.heading}
            onChange={(v) => update({ heading: v })}
            placeholder="Leave empty for “Hi, I’m {name}!”"
          />
          <AdminTextarea
            label="Introduction"
            value={settings.introduction}
            onChange={(v) => update({ introduction: v })}
            rows={3}
          />
          <HeroImageEditor
            label="Main hero photo"
            image={settings.hero.main ?? { alt: "", rotation: 0 }}
            cosplays={cosplays}
            onChange={(main) => updateHero({ main })}
          />
          <div className="space-y-3">
            <p className="text-sm font-bold text-closet-brown">Secondary hero photos (up to 2)</p>
            {(settings.hero.secondary.length ? settings.hero.secondary : [{ alt: "", rotation: 3 }]).map(
              (img, index) => (
                <HeroImageEditor
                  key={index}
                  label={`Secondary photo ${index + 1}`}
                  image={img}
                  cosplays={cosplays}
                  onChange={(updated) => {
                    const secondary = [...(settings.hero.secondary.length ? settings.hero.secondary : [{ alt: "", rotation: 3 }])];
                    secondary[index] = updated;
                    updateHero({ secondary: secondary.slice(0, 2) });
                  }}
                  onRemove={
                    settings.hero.secondary.length > 0
                      ? () => updateHero({ secondary: settings.hero.secondary.filter((_, i) => i !== index) })
                      : undefined
                  }
                />
              ),
            )}
            {settings.hero.secondary.length < 2 && (
              <AdminButton
                variant="ghost"
                onClick={() =>
                  updateHero({
                    secondary: [
                      ...settings.hero.secondary,
                      { alt: "", rotation: settings.hero.secondary.length === 0 ? 3 : -2 },
                    ],
                  })
                }
              >
                + Add secondary photo
              </AdminButton>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-closet-brown">Rotating roster photos</p>
            <p className="text-xs text-closet-brown-light">
              Pick cosplays to cycle through on the main hero image. Overrides the static main photo when set.
            </p>
            <select
              multiple
              className="admin-input min-h-[120px] w-full rounded-2xl"
              value={settings.hero.rotatingCosplayIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                updateHero({ rotatingCosplayIds: selected });
              }}
            >
              {cosplays.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.character} ({c.series})
                </option>
              ))}
            </select>
          </div>
          <AdminField
            label="Rotation interval (ms)"
            value={String(settings.hero.rotationIntervalMs)}
            onChange={(v) => updateHero({ rotationIntervalMs: Number(v) || 5000 })}
            type="number"
          />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle>Contact & statistics</SectionTitle>
        <div className="space-y-5 p-5">
          <AdminField
            label="Business email"
            value={settings.businessEmail}
            onChange={(v) => update({ businessEmail: v })}
            placeholder="For collaborators — leave empty to use contact form"
          />
          <AdminField label="Location" value={settings.location} onChange={(v) => update({ location: v })} />
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-closet-pink/50 bg-closet-blush/20 px-4 py-3">
            <input
              type="checkbox"
              checked={settings.showLocationPublicly}
              onChange={(e) => update({ showLocationPublicly: e.target.checked })}
              className="h-4 w-4 rounded border-closet-pink text-closet-rose"
            />
            <span className="text-sm font-semibold text-closet-brown">Show location publicly</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-3">
            <AdminField
              label="Years cosplaying"
              value={settings.yearsCosplaying}
              onChange={(v) => update({ yearsCosplaying: v })}
              placeholder="10+"
            />
            <AdminField
              label="Completed cosplays"
              value={settings.completedCosplays}
              onChange={(v) => update({ completedCosplays: v })}
              placeholder="25+"
            />
            <AdminField
              label="Conventions attended"
              value={settings.conventionsAttended}
              onChange={(v) => update({ conventionsAttended: v })}
              placeholder="15"
            />
          </div>
          <AdminField
            label="YouTube URL (hero social icon)"
            value={settings.youtubeUrl}
            onChange={(v) => update({ youtubeUrl: v })}
          />
          <AdminField
            label="Bluesky URL (hero social icon)"
            value={settings.blueskyUrl}
            onChange={(v) => update({ blueskyUrl: v })}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle>Collaboration services</SectionTitle>
        <div className="space-y-4 p-5">
          <ListEditor
            items={settings.collaborationServices}
            onChange={(collaborationServices) => update({ collaborationServices })}
            onAdd={() => ({ title: "", description: "" })}
            addLabel="Add service"
            renderItem={(item, _i, setItem, remove) => (
              <div key={_i} className="space-y-3 rounded-xl border border-closet-pink/50 p-4">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-closet-brown">Service</p>
                  <button type="button" onClick={remove} className="text-xs text-closet-rose hover:underline">
                    Remove
                  </button>
                </div>
                <AdminField label="Title" value={item.title} onChange={(v) => setItem({ ...item, title: v })} />
                <AdminTextarea
                  label="Description"
                  value={item.description}
                  onChange={(v) => setItem({ ...item, description: v })}
                  rows={2}
                />
              </div>
            )}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle>Platforms & audience</SectionTitle>
        <div className="space-y-5 p-5">
          {settings.platforms.map((platform) => (
            <div key={platform.id} className="space-y-3 rounded-xl border border-closet-pink/50 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={platform.enabled}
                  onChange={(e) => updatePlatform(platform.id, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-closet-pink text-closet-rose"
                />
                <span className="text-sm font-bold text-closet-brown">{PLATFORM_LABELS[platform.id]}</span>
              </label>
              <AdminField
                label="Handle"
                value={platform.handle ?? ""}
                onChange={(v) => updatePlatform(platform.id, { handle: v })}
              />
              <AdminField
                label="Profile URL"
                value={platform.url ?? ""}
                onChange={(v) => updatePlatform(platform.id, { url: v })}
                placeholder="Falls back to site social URL"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminField
                  label="Followers"
                  value={platform.followers ?? ""}
                  onChange={(v) => updatePlatform(platform.id, { followers: v })}
                />
                <AdminField
                  label="Subscribers"
                  value={platform.subscribers ?? ""}
                  onChange={(v) => updatePlatform(platform.id, { subscribers: v })}
                />
                <AdminField
                  label="Engagement rate"
                  value={platform.engagementRate ?? ""}
                  onChange={(v) => updatePlatform(platform.id, { engagementRate: v })}
                  placeholder="8.7%"
                />
                <AdminField
                  label="Average views"
                  value={platform.averageViews ?? ""}
                  onChange={(v) => updatePlatform(platform.id, { averageViews: v })}
                />
                <AdminField
                  label="Monthly reach"
                  value={platform.monthlyReach ?? ""}
                  onChange={(v) => updatePlatform(platform.id, { monthlyReach: v })}
                />
              </div>
            </div>
          ))}
          <AdminField
            label="Metrics last updated"
            value={settings.metricsLastUpdated}
            onChange={(v) => update({ metricsLastUpdated: v })}
            placeholder="August 2026"
          />
          <AdminField
            label="Primary age range"
            value={settings.audienceDetails.primaryAgeRange ?? ""}
            onChange={(v) => updateAudience({ primaryAgeRange: v })}
          />
          <AdminField
            label="Top countries (comma-separated)"
            value={(settings.audienceDetails.topCountries ?? []).join(", ")}
            onChange={(v) =>
              updateAudience({
                topCountries: v.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <AdminField
            label="Audience interests (comma-separated)"
            value={(settings.audienceDetails.interests ?? []).join(", ")}
            onChange={(v) =>
              updateAudience({
                interests: v.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
          />
          <AdminField
            label="Average content reach"
            value={settings.audienceDetails.averageContentReach ?? ""}
            onChange={(v) => updateAudience({ averageContentReach: v })}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle>Past collaborations</SectionTitle>
        <div className="p-5">
          <ListEditor
            items={settings.pastCollaborations}
            onChange={(pastCollaborations) => update({ pastCollaborations })}
            onAdd={() => ({ name: "" } as MediaKitPastCollaboration)}
            addLabel="Add collaboration"
            renderItem={(item, _i, setItem, remove) => (
              <div key={_i} className="mb-3 space-y-3 rounded-xl border border-closet-pink/50 p-4">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-closet-brown">Collaboration</p>
                  <button type="button" onClick={remove} className="text-xs text-closet-rose hover:underline">
                    Remove
                  </button>
                </div>
                <AdminField label="Organization" value={item.name} onChange={(v) => setItem({ ...item, name: v })} />
                <AdminImageField label="Logo URL" value={item.logo ?? ""} onChange={(v) => setItem({ ...item, logo: v })} />
                <AdminField label="Type" value={item.type ?? ""} onChange={(v) => setItem({ ...item, type: v })} />
                <AdminField label="Year" value={item.year ?? ""} onChange={(v) => setItem({ ...item, year: v })} />
                <AdminField label="Link" value={item.url ?? ""} onChange={(v) => setItem({ ...item, url: v })} />
              </div>
            )}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle>Press & features</SectionTitle>
        <div className="p-5">
          <ListEditor
            items={settings.pressFeatures}
            onChange={(pressFeatures) => update({ pressFeatures })}
            onAdd={() => ({ publication: "", title: "" } as MediaKitPressFeature)}
            addLabel="Add press feature"
            renderItem={(item, _i, setItem, remove) => (
              <div key={_i} className="mb-3 space-y-3 rounded-xl border border-closet-pink/50 p-4">
                <div className="flex justify-between">
                  <p className="text-sm font-bold text-closet-brown">Press entry</p>
                  <button type="button" onClick={remove} className="text-xs text-closet-rose hover:underline">
                    Remove
                  </button>
                </div>
                <AdminField
                  label="Publication"
                  value={item.publication}
                  onChange={(v) => setItem({ ...item, publication: v })}
                />
                <AdminField label="Title" value={item.title} onChange={(v) => setItem({ ...item, title: v })} />
                <AdminField label="Date" value={item.date ?? ""} onChange={(v) => setItem({ ...item, date: v })} />
                <AdminImageField
                  label="Thumbnail URL"
                  value={item.thumbnail ?? ""}
                  onChange={(v) => setItem({ ...item, thumbnail: v })}
                />
                <AdminField label="Link" value={item.url ?? ""} onChange={(v) => setItem({ ...item, url: v })} />
              </div>
            )}
          />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle>Downloadable PDF</SectionTitle>
        <div className="space-y-4 p-5">
          <AdminImageField
            label="PDF URL"
            value={settings.pdfUrl}
            onChange={(v) => update({ pdfUrl: v })}
          />
          <AdminField
            label="Download filename"
            value={settings.pdfFileName}
            onChange={(v) => update({ pdfFileName: v })}
            placeholder="ruu-media-kit.pdf"
          />
          {!settings.pdfUrl?.trim() && (
            <p className="text-xs text-closet-brown-light">
              No PDF uploaded — the download button will be hidden on the public site (admins see a disabled state).
            </p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-closet-pink/35 bg-closet-blush/20 px-5 py-4">
          <p className="text-xs text-closet-brown-light">Mark cosplays as “Featured on Media Kit” in the roster editor.</p>
          <AdminButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save media kit"}
          </AdminButton>
        </div>
      </AdminCard>

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
