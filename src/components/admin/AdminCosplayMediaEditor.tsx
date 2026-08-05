"use client";

import { useState } from "react";
import { Cosplay } from "@/types/cosplay";
import { GoogleDriveImage } from "@/components/GoogleDriveImage";
import {
  AdminCosplaySectionGalleryField,
  AdminGalleryField,
  AdminImageField,
} from "./AdminImageField";
import { AdminCard, AdminField } from "./ui";

function MediaSectionHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-closet-pink/40 bg-closet-blush/15 px-5 py-4">
      <div>
        <h3 className="font-sans text-base font-bold text-closet-brown">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-closet-brown-light">{description}</p>}
      </div>
      {badge && (
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-closet-rose ring-1 ring-closet-pink/50">
          {badge}
        </span>
      )}
    </div>
  );
}

export function AdminCosplayMediaEditor({
  form,
  update,
  cosplayId,
  hasCharArt,
  hasPhoto,
}: {
  form: Partial<Cosplay>;
  update: (patch: Partial<Cosplay>) => void;
  cosplayId?: string;
  hasCharArt: boolean;
  hasPhoto: boolean;
}) {
  const [showFraming, setShowFraming] = useState(false);
  const galleryCount = Array.isArray(form.gallery) ? form.gallery.length : 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-closet-brown-light">
        Paste a Google Drive link or any direct image URL (.jpg, .png, etc.). Page URLs like Pinterest won&apos;t work.
      </p>

      {/* Roster card */}
      <AdminCard className="overflow-hidden">
        <MediaSectionHeader
          title="Roster card"
          description="Reference art shows on the card front · Featured photo on the back"
        />
        <div className="grid gap-6 p-5 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-amber-200/70 bg-amber-50/40">
              <p className="border-b border-amber-200/60 bg-white/80 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-amber-800/80">
                Reference · front
              </p>
              <div className="relative aspect-[3/4] bg-closet-blush">
                {hasCharArt ? (
                  <GoogleDriveImage
                    src={form.characterArt!}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: form.characterArtPosition ?? "center top" }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-closet-brown-light">
                    No art yet
                  </div>
                )}
              </div>
            </div>
            <AdminImageField
              label="Character art"
              value={form.characterArt ?? ""}
              onChange={(v) => update({ characterArt: v })}
              variant="compact"
            />
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-closet-pink/60 bg-closet-blush/30">
              <p className="border-b border-closet-pink/40 bg-white/80 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-widest text-closet-rose/90">
                Featured · back
              </p>
              <div className="relative aspect-[3/4] bg-closet-blush">
                {hasPhoto ? (
                  <GoogleDriveImage
                    src={form.image!}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: form.imagePosition ?? "center top" }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-closet-brown-light">
                    No photo yet
                  </div>
                )}
              </div>
            </div>
            <AdminImageField
              label="Cosplay photo"
              value={form.image ?? ""}
              onChange={(v) => update({ image: v })}
              variant="compact"
            />
          </div>
        </div>

        <div className="border-t border-closet-pink/30 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowFraming((v) => !v)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold text-closet-brown-light transition hover:text-closet-brown"
          >
            <span>Framing & crop position</span>
            <span className="text-closet-rose">{showFraming ? "Hide" : "Show"}</span>
          </button>
          {showFraming && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <AdminField
                label="Featured photo position"
                value={form.imagePosition ?? ""}
                onChange={(v) => update({ imagePosition: v || undefined })}
                placeholder="center top"
              />
              <AdminField
                label="Character art position"
                value={form.characterArtPosition ?? ""}
                onChange={(v) => update({ characterArtPosition: v || undefined })}
                placeholder="center top"
              />
            </div>
          )}
        </div>
      </AdminCard>

      {/* Page galleries */}
      {cosplayId ? (
        <AdminCard className="overflow-hidden">
          <MediaSectionHeader
            title="Page galleries"
            description="Shown on the public cosplay page under References and Build Gallery"
          />
          <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-closet-pink/30">
            <div className="p-5">
              <AdminCosplaySectionGalleryField cosplayId={cosplayId} section="reference" embedded />
            </div>
            <div className="border-t border-closet-pink/30 p-5 lg:border-t-0">
              <AdminCosplaySectionGalleryField cosplayId={cosplayId} section="build" embedded />
            </div>
          </div>
        </AdminCard>
      ) : (
        <AdminCard className="overflow-hidden">
          <MediaSectionHeader title="Page galleries" />
          <p className="px-5 py-6 text-sm text-closet-brown-light">
            Save this build first to add reference and build gallery photos.
          </p>
        </AdminCard>
      )}

      {/* Legacy extra URLs */}
      <AdminCard className="overflow-hidden">
        <MediaSectionHeader
          title="Extra photo URLs"
          description="Optional fallback images stored on the build record"
          badge={galleryCount > 0 ? `${galleryCount} photo${galleryCount === 1 ? "" : "s"}` : undefined}
        />
        <div className="p-5">
          <AdminGalleryField
            label=""
            value={Array.isArray(form.gallery) ? form.gallery : []}
            onChange={(gallery) => update({ gallery })}
            variant="embedded"
          />
        </div>
      </AdminCard>
    </div>
  );
}
