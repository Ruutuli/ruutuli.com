"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Cosplay,
  CosplayPart,
  CosplayPartCategory,
  getCosplayPartsPercent,
} from "@/types/cosplay";
import {
  BUILD_TASK_STATUS_LABELS,
  BUILD_TASK_TYPE_LABELS,
  BuildTask,
  getBuildTaskProgress,
  getOpenBuildTasks,
  isBuildTaskDone,
} from "@/types/task";
import { formatEventDate } from "@/data/calendar";
import { getCosplayProgressPercent } from "@/lib/siteConfig";
import { filterCosplayImages, getCosplayDisplayImage } from "@/lib/cosplay/images";
import { GalleryPhotoCreditMap } from "@/lib/gallery/photoCredits";
import CosplayPhotoGallery from "@/components/CosplayPhotoGallery";
import RosterImageSlot from "@/components/RosterImageSlot";

type BoardTab = "overview" | "pieces" | "gallery" | "convention" | "notes";

const TAB_LABELS: { id: BoardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "pieces", label: "Costume Pieces" },
  { id: "gallery", label: "Build Gallery" },
  { id: "convention", label: "Gallery" },
];

const CHECKLIST_GROUP_ORDER = [
  "Tops",
  "Bottoms",
  "Legwear & Shoes",
  "Accessories",
  "Props",
  "Other",
] as const;

function checklistGroup(part: CosplayPart): (typeof CHECKLIST_GROUP_ORDER)[number] {
  switch (part.category) {
    case "top":
      return "Tops";
    case "bottom":
      return "Bottoms";
    case "socks":
    case "shoes":
      return "Legwear & Shoes";
    case "accessories":
      return "Accessories";
    case "prop":
      return "Props";
    default:
      return "Other";
  }
}

function partByCategory(parts: CosplayPart[] | undefined, category: CosplayPartCategory) {
  return parts?.find((p) => p.category === category);
}

function statusLabel(status: Cosplay["status"]) {
  if (status === "completed") return "Complete";
  if (status === "in-progress") return "In Progress";
  if (status === "retired") return "Retired";
  return "Planned";
}

function CheckIcon({ owned }: { owned: boolean }) {
  if (owned) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
        aria-hidden
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 shrink-0 rounded-full border-2 border-closet-pink/70 bg-white"
      aria-hidden
    />
  );
}

function GroupIcon({ group }: { group: string }) {
  const className = "h-4 w-4 text-closet-rose";
  if (group === "Tops") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l2-3h8l2 3v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" />
      </svg>
    );
  }
  if (group === "Bottoms") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8l1 7-3 9h-4l-3-9 1-7z" />
      </svg>
    );
  }
  if (group === "Legwear & Shoes") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20l2-10h4l1 4h5l2 6H5z" />
      </svg>
    );
  }
  if (group === "Props") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 4L20 9.5 9.5 20 4 14.5 14.5 4z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c2 2.5 5 3 5 6a5 5 0 11-10 0c0-3 3-3.5 5-6z" />
    </svg>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-closet-blush text-closet-rose">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-closet-rose/80">
          {label}
        </span>
        <span className="mt-0.5 block text-sm font-semibold text-closet-brown">{value}</span>
      </span>
    </li>
  );
}

function galleryLabel(src: string, index: number, parts?: CosplayPart[]): string {
  const part = parts?.[index];
  if (part) return part.name;
  const file = src.split("/").pop()?.split("?")[0] ?? "";
  const clean = file.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]/g, " ");
  if (clean && clean !== "box-blank" && clean.length < 28) {
    return clean.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return `Photo ${index + 1}`;
}

export default function CosplayBoard({
  cosplay,
  tasks,
  photoCredits = {},
  buildPhotoUrls = [],
  conventionPhotoUrls = [],
}: {
  cosplay: Cosplay;
  tasks: BuildTask[];
  photoCredits?: GalleryPhotoCreditMap;
  buildPhotoUrls?: string[];
  conventionPhotoUrls?: string[];
}) {
  const [tab, setTab] = useState<BoardTab>("overview");

  const isRetired = cosplay.status === "retired";
  const overall = isRetired ? 0 : getCosplayProgressPercent(cosplay);
  const partsPercent = getCosplayPartsPercent(cosplay);
  const doneTasks = tasks.filter(isBuildTaskDone).length;
  const openTasks = getOpenBuildTasks(tasks);
  const nextUp = openTasks.slice(0, 5);

  const wig = partByCategory(cosplay.parts, "wig");
  const eyes = partByCategory(cosplay.parts, "eyes");
  const prop = partByCategory(cosplay.parts, "prop");
  const showOutfit = Boolean(cosplay.outfit && cosplay.outfit.toLowerCase() !== "default");

  const checklistGroups = useMemo(() => {
    const costumeParts = (cosplay.parts ?? []).filter(
      (p) => p.category !== "wig" && p.category !== "eyes",
    );
    return CHECKLIST_GROUP_ORDER.map((group) => ({
      group,
      items: costumeParts.filter((p) => checklistGroup(p) === group),
    })).filter((g) => g.items.length > 0);
  }, [cosplay.parts]);

  const buildPhotos = useMemo(() => filterCosplayImages(buildPhotoUrls), [buildPhotoUrls]);

  const conventionPhotos = useMemo(() => filterCosplayImages(conventionPhotoUrls), [conventionPhotoUrls]);

  const heroImage = getCosplayDisplayImage(cosplay.image, cosplay.characterArt);

  const labelPhoto = (src: string, index: number) => galleryLabel(src, index, cosplay.parts);

  const detailIcons = {
    series: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
      </svg>
    ),
    character: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 20a8 8 0 0116 0" />
      </svg>
    ),
    outfit: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l2-3h8l2 3v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" />
      </svg>
    ),
    convention: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    wig: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c3.5 0 6-2 6-5.5S15 4 12 4 6 5.5 6 8.5 8.5 14 12 14zm-3 2c-2 1-3 2.5-3 4.5h12c0-2-1-3.5-3-4.5" />
      </svg>
    ),
    eyes: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
    prop: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 4L20 9.5 9.5 20 4 14.5 14.5 4z" />
      </svg>
    ),
  };

  return (
    <div className="cosplan-shell space-y-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-closet-brown-light">
          <Link href="/" className="hover:text-closet-rose">
            Home
          </Link>
          <span aria-hidden>/</span>
          <Link href="/roster" className="hover:text-closet-rose">
            Cosplays
          </Link>
          <span aria-hidden>/</span>
          <span className="font-semibold text-closet-brown">{cosplay.character}</span>
        </nav>
        <Link href={`/admin/cosplays/${cosplay.id}/edit`} className="closet-btn-outline !py-1.5 !text-xs sm:!text-sm">
          Edit
        </Link>
      </div>

      {/* Hero */}
      <section className="cosplan-panel animate-fade-up overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="relative min-h-[280px] overflow-hidden bg-closet-blush/40 sm:min-h-[360px] lg:min-h-[420px]">
            <RosterImageSlot
              src={heroImage}
              alt={`${cosplay.character} cosplay`}
              emptyLabel={cosplay.character}
              emptyHint="No photos yet"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          <div className="flex flex-col justify-center gap-4 p-5 sm:p-7 lg:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sans text-3xl font-bold text-closet-brown sm:text-4xl lg:text-[2.6rem]">
                  {cosplay.character}
                </h1>
                <span className="text-closet-rose" aria-hidden>
                  ✦
                </span>
              </div>
              <p className="mt-1 font-sans text-base italic text-closet-rose sm:text-lg">
                {cosplay.series}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {showOutfit && (
                <span className="rounded-full border border-closet-pink/70 bg-closet-blush/60 px-3 py-1 text-xs font-semibold text-closet-brown">
                  Outfit: {cosplay.outfit}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-closet-pink/60 bg-white px-3 py-1 text-xs font-semibold text-closet-brown">
                {statusLabel(cosplay.status)}
                {!isRetired && (
                  <>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-closet-blush sm:w-20">
                      <span className="block h-full rounded-full bg-closet-rose" style={{ width: `${overall}%` }} />
                    </span>
                    <span className="tabular-nums text-closet-rose">{overall}%</span>
                  </>
                )}
              </span>
            </div>

            {cosplay.description && (
              <p className="max-w-xl text-sm leading-relaxed text-closet-brown sm:text-[0.95rem]">
                {cosplay.description}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-closet-pink/50 bg-closet-blush/30 px-3 py-3 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-closet-rose">Convention</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-closet-brown sm:text-sm">
                  {cosplay.convention || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-closet-pink/50 bg-closet-blush/30 px-3 py-3 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-closet-rose">Wig</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-closet-brown sm:text-sm">
                  {wig?.name || "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-closet-pink/50 bg-closet-blush/30 px-3 py-3 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-closet-rose">Eyes</p>
                <p className="mt-1 text-xs font-semibold leading-snug text-closet-brown sm:text-sm">
                  {eyes?.name || "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setTab("gallery")}
                className="closet-btn !rounded-xl !px-5"
              >
                View Gallery
              </button>
              <button
                type="button"
                onClick={() => setTab("notes")}
                className="closet-btn-outline !rounded-xl !border-closet-rose/50 !px-5 !py-2.5 !text-sm"
              >
                Build Notes
              </button>
            </div>

            {(cosplay.deadline || (!isRetired && partsPercent !== null) || (tasks.length > 0 && !isRetired)) && (
              <p className="text-xs text-closet-brown-light">
                {!isRetired && partsPercent !== null ? `${partsPercent}% parts owned` : null}
                {!isRetired && partsPercent !== null && cosplay.deadline ? " · " : null}
                {cosplay.deadline ? `Deadline ${formatEventDate(cosplay.deadline)}` : null}
                {!isRetired && tasks.length > 0 ? `${cosplay.deadline ? " · " : ""}${doneTasks}/${tasks.length} tasks` : null}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-closet-pink/50">
        <div className="-mb-px flex gap-1 overflow-x-auto sm:flex-wrap sm:gap-2">
          {TAB_LABELS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${
                tab === t.id
                  ? "text-closet-rose"
                  : "text-closet-brown-light hover:text-closet-brown"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-closet-rose" />
              )}
            </button>
          ))}
          {tab === "notes" && (
            <button
              type="button"
              className="relative px-3 py-3 text-sm font-semibold text-closet-rose sm:px-4"
            >
              Build Notes
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-closet-rose" />
            </button>
          )}
        </div>
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          <section className="cosplan-panel overflow-hidden">
            <div className="cosplan-panel-header">
              <h2 className="font-sans text-base font-bold text-closet-brown">Costume Checklist</h2>
              {partsPercent !== null && (
                <span className="ml-auto text-xs font-semibold text-closet-brown">
                  {partsPercent}% owned
                </span>
              )}
            </div>
            <div className="p-4 sm:p-6">
              {checklistGroups.length === 0 ? (
                <p className="py-6 text-center text-sm text-closet-brown-light">
                  Nothing on the checklist yet.
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {checklistGroups.map(({ group, items }) => (
                    <div key={group}>
                      <div className="mb-3 flex items-center gap-2 border-b border-closet-pink/40 pb-2">
                        <GroupIcon group={group} />
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-closet-brown">
                          {group}
                        </h3>
                      </div>
                      <ul className="space-y-2.5">
                        {items.map((part) => (
                          <li key={`${part.category}-${part.name}`} className="flex items-start gap-2.5">
                            {!isRetired && <CheckIcon owned={part.owned} />}
                            <span
                              className={`text-sm font-medium leading-snug ${
                                isRetired || part.owned ? "text-closet-brown" : "text-closet-brown-light"
                              }`}
                            >
                              {part.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
            <section className="cosplan-panel overflow-hidden">
              <div className="cosplan-panel-header justify-between">
                <h2 className="font-sans text-base font-bold text-closet-brown">Gallery</h2>
                <button
                  type="button"
                  onClick={() => setTab("convention")}
                  className="text-xs font-semibold text-closet-rose hover:text-closet-mauve"
                >
                  Full gallery →
                </button>
              </div>
              <div className="p-4 sm:p-5">
                <CosplayPhotoGallery
                  photos={conventionPhotos}
                  photoCredits={photoCredits}
                  characterName={cosplay.character}
                  variant="compact"
                  maxVisible={4}
                  getFallbackLabel={(src, i) => cosplay.convention || labelPhoto(src, i)}
                  emptyMessage="No photos tagged yet."
                />
              </div>

              {nextUp.length > 0 && (
                <div className="border-t border-closet-pink/40 px-4 py-4 sm:px-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-closet-brown">
                      Next up
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTab("notes")}
                      className="text-xs font-semibold text-closet-rose hover:text-closet-mauve"
                    >
                      All notes →
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {nextUp.map((task) => (
                      <li key={task.id} className="flex items-start gap-2.5 text-sm">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-closet-rose" aria-hidden />
                        <span>
                          <span className="font-semibold text-closet-brown">{task.label}</span>
                          <span className="ml-1.5 text-xs text-closet-brown-light">
                            {BUILD_TASK_TYPE_LABELS[task.type]}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="cosplan-panel overflow-hidden">
              <div className="cosplan-panel-header">
                <h2 className="font-sans text-base font-bold text-closet-brown">Costume Details</h2>
              </div>
              <ul className="divide-y divide-closet-pink/35 px-4 py-2 sm:px-5">
                <DetailRow label="Series" value={cosplay.series} icon={detailIcons.series} />
                <DetailRow label="Character" value={cosplay.character} icon={detailIcons.character} />
                {showOutfit && (
                  <DetailRow label="Outfit" value={cosplay.outfit!} icon={detailIcons.outfit} />
                )}
                <DetailRow
                  label="Convention"
                  value={cosplay.convention || "—"}
                  icon={detailIcons.convention}
                />
                <DetailRow label="Wig Color" value={wig?.name || "—"} icon={detailIcons.wig} />
                <DetailRow label="Eye Color" value={eyes?.name || "—"} icon={detailIcons.eyes} />
                <DetailRow label="Prop" value={prop?.name || "None"} icon={detailIcons.prop} />
              </ul>
            </section>

            {(cosplay.sources?.length ?? 0) > 0 && (
              <section className="cosplan-panel overflow-hidden lg:col-span-2">
                <div className="cosplan-panel-header">
                  <h2 className="font-sans text-base font-bold text-closet-brown">Sources & Credits</h2>
                </div>
                <ul className="divide-y divide-closet-pink/35 px-4 py-2 sm:px-5">
                  {cosplay.sources!.map((source, i) => (
                    <li key={`${source.label}-${i}`} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                      <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-closet-rose sm:w-28">
                        {source.label}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-closet-brown">
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-closet-rose hover:underline"
                          >
                            {source.detail}
                          </a>
                        ) : (
                          source.detail
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {/* Costume Pieces */}
      {tab === "pieces" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header justify-between">
            <h2 className="font-sans text-base font-bold text-closet-brown">Costume Pieces</h2>
            {partsPercent !== null && (
              <span className="text-xs font-semibold text-closet-brown">
                {(cosplay.parts ?? []).filter((p) => p.owned).length}/{(cosplay.parts ?? []).length} owned
              </span>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {(cosplay.parts ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-closet-brown-light">
                Nothing here yet.
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...CHECKLIST_GROUP_ORDER, "Wig & Eyes" as const]
                  .map((group) => {
                    const items =
                      group === "Wig & Eyes"
                        ? (cosplay.parts ?? []).filter(
                            (p) => p.category === "wig" || p.category === "eyes",
                          )
                        : (cosplay.parts ?? []).filter((p) => checklistGroup(p) === group);
                    return { group, items };
                  })
                  .filter((g) => g.items.length > 0)
                  .map(({ group, items }) => (
                    <div
                      key={group}
                      className="rounded-2xl border border-closet-pink/45 bg-closet-blush/20 p-4"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <GroupIcon group={group === "Wig & Eyes" ? "Accessories" : group} />
                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-closet-brown">
                          {group}
                        </h3>
                      </div>
                      <ul className="space-y-2.5">
                        {items.map((part) => (
                          <li
                            key={`${part.category}-${part.name}`}
                            className="flex items-start gap-2.5 rounded-xl bg-white/80 px-3 py-2"
                          >
                            {!isRetired && <CheckIcon owned={part.owned} />}
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-closet-brown">
                                {part.name}
                              </span>
                              <span className="text-[0.65rem] font-medium uppercase tracking-wider text-closet-rose/80">
                                {part.label}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Build Gallery */}
      {tab === "gallery" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header justify-between">
            <h2 className="font-sans text-base font-bold text-closet-brown">Build Gallery</h2>
            {buildPhotos.length > 0 && (
              <span className="text-xs font-semibold text-closet-brown-light">
                {buildPhotos.length} photo{buildPhotos.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="p-4 sm:p-6">
            <CosplayPhotoGallery
              photos={buildPhotos}
              photoCredits={photoCredits}
              characterName={cosplay.character}
              variant="build"
              getFallbackLabel={labelPhoto}
              emptyMessage="Tag photos as Build gallery in the admin to show progress shots here."
            />
          </div>
        </section>
      )}

      {/* Gallery */}
      {tab === "convention" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header justify-between">
            <h2 className="font-sans text-base font-bold text-closet-brown">Gallery</h2>
            {cosplay.convention && (
              <span className="text-xs font-semibold text-closet-rose">{cosplay.convention}</span>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {conventionPhotos.length === 0 ? (
              <p className="py-12 text-center text-sm text-closet-brown-light">
                No photos tagged yet.
              </p>
            ) : (
              <CosplayPhotoGallery
                photos={conventionPhotos}
                photoCredits={photoCredits}
                characterName={cosplay.character}
                getFallbackLabel={(src, i) => cosplay.convention || labelPhoto(src, i)}
                emptyMessage="Nothing here yet."
              />
            )}
          </div>
        </section>
      )}

      {/* Build Notes / Tasks */}
      {tab === "notes" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header justify-between">
            <h2 className="font-sans text-base font-bold text-closet-brown">Build Notes</h2>
            <span className="text-xs font-semibold text-closet-brown">
              {getBuildTaskProgress(tasks)}% · {doneTasks}/{tasks.length}
            </span>
          </div>
          <ul className="divide-y divide-closet-pink/35 px-4 py-2">
            {tasks.length === 0 ? (
              <li className="py-8 text-center text-sm text-closet-brown-light">
                No notes or tasks yet.
              </li>
            ) : (
              tasks.map((task) => {
                const done = isBuildTaskDone(task);
                return (
                  <li key={task.id} className={`flex items-start gap-3 py-3.5 ${done ? "opacity-55" : ""}`}>
                    <CheckIcon owned={done} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold text-closet-brown ${done ? "line-through" : ""}`}
                      >
                        {task.label}
                      </span>
                      <span className="text-xs text-closet-brown-light">
                        {BUILD_TASK_TYPE_LABELS[task.type]} · {BUILD_TASK_STATUS_LABELS[task.status]}
                        {typeof task.estimatedCost === "number" ? ` · $${task.estimatedCost}` : ""}
                        {task.notes ? ` · ${task.notes}` : ""}
                      </span>
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
