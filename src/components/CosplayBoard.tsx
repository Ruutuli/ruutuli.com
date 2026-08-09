"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Cosplay,
  CosplayPart,
  CosplayPartCategory,
  CosplaySource,
  CosplayTodo,
  getCosplayPartsPercent,
  getCosplayTodoProgress,
  getOpenCosplayTodos,
  isCosplayTodoDone,
} from "@/types/cosplay";
import {
  BUILD_TASK_STATUS_LABELS,
  BUILD_TASK_TYPE_LABELS,
} from "@/types/task";
import { formatEventDate } from "@/data/calendar";
import { resolveCosplayTodoDisplay, formatTodoCost, todoLinkHostname } from "@/lib/cosplay/todos";
import { getCosplayProgressPercent } from "@/lib/siteConfig";
import {
  buildCosplayPhotoFallbacks,
  filterCosplayImages,
  isCosplayPlaceholderImage,
  resolveCosplayDisplayPhoto,
} from "@/lib/cosplay/images";
import { GoogleDriveImage } from "@/components/GoogleDriveImage";
import { GalleryPhotoCreditMap } from "@/lib/gallery/photoCredits";
import CosplayPhotoGallery from "@/components/CosplayPhotoGallery";
import RosterImageSlot from "@/components/RosterImageSlot";
import { swatchNeedsBorderForName, wigSwatchBackground } from "@/lib/wigColors";

type BoardTab = "overview" | "pieces" | "reference" | "gallery" | "convention" | "todos" | "sources";

const TAB_LABELS: { id: BoardTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "todos", label: "To-Do List" },
  { id: "pieces", label: "Costume Pieces" },
  { id: "sources", label: "Sources & Links" },
  { id: "reference", label: "References" },
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

const REDUNDANT_PART_LABELS: Record<string, string[]> = {
  tops: ["top", "tops"],
  bottoms: ["bottom", "bottoms"],
  accessories: ["accessories", "accessory"],
  props: ["prop", "props"],
  other: ["other"],
};

function isRedundantPartLabel(part: CosplayPart, group: string): boolean {
  if (group === "Wig & Eyes" || group === "Legwear & Shoes") return false;
  const label = part.label.trim().toLowerCase();
  return REDUNDANT_PART_LABELS[group.trim().toLowerCase()]?.includes(label) ?? false;
}

function wigEyesShortLabel(part: CosplayPart): string {
  if (part.category === "wig") return "Wig";
  if (part.category === "eyes") return "Eyes";
  return part.label;
}

function isWigOrEyesPart(part: CosplayPart): boolean {
  return part.category === "wig" || part.category === "eyes";
}

function partByCategory(parts: CosplayPart[] | undefined, category: CosplayPartCategory) {
  return parts?.find((p) => p.category === category);
}

function ColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
      style={{
        background: wigSwatchBackground(color),
        boxShadow: swatchNeedsBorderForName(color) ? "inset 0 0 0 1px rgba(0,0,0,0.12)" : undefined,
      }}
      aria-hidden
    />
  );
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
  if (group === "Wig & Eyes") {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 2 6 2.5 6 5.5a6 6 0 11-12 0C6 5.5 9 5 12 3z" />
        <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
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

function linkHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function SourceLabelIcon({ label }: { label: string }) {
  const className = "h-3.5 w-3.5 shrink-0";
  const normalized = label.trim().toLowerCase();

  if (normalized.includes("wig")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 2 6 2.5 6 5.5a6 6 0 11-12 0C6 5.5 9 5 12 3z" />
      </svg>
    );
  }
  if (normalized.includes("eye") || normalized.includes("contact")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  if (normalized.includes("shoe") || normalized.includes("sock")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20l2-10h4l1 4h5l2 6H5z" />
      </svg>
    );
  }
  if (normalized.includes("top") || normalized.includes("bottom")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7l2-3h8l2 3v11a2 2 0 01-2 2H8a2 2 0 01-2-2V7z" />
      </svg>
    );
  }
  if (normalized.includes("prop")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 4L20 9.5 9.5 20 4 14.5 14.5 4z" />
      </svg>
    );
  }
  if (normalized.includes("tutorial") || normalized.includes("reference") || normalized.includes("inspiration")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  if (normalized.includes("accessor")) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4c2 2.5 5 3 5 6a5 5 0 11-10 0c0-3 3-3.5 5-6z" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-closet-rose/50 transition group-hover:text-closet-rose"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

const SOURCE_GROUP_ORDER = [
  "Wig",
  "Contacts / Eyes",
  "Top",
  "Bottom",
  "Shoes",
  "Socks",
  "Prop",
  "Accessories",
  "Reference",
  "Tutorial",
  "Inspiration",
  "Other",
] as const;

function sourceGroupRank(label: string): number {
  const idx = SOURCE_GROUP_ORDER.indexOf(label as (typeof SOURCE_GROUP_ORDER)[number]);
  return idx >= 0 ? idx : SOURCE_GROUP_ORDER.length;
}

function SourceCard({ source }: { source: CosplaySource }) {
  const hostname = source.url ? linkHostname(source.url) : null;
  const hasImage = !!source.image && !isCosplayPlaceholderImage(source.image);

  const cardClass =
    "group flex h-full flex-col overflow-hidden rounded-2xl border border-closet-pink/45 bg-gradient-to-br from-white to-closet-blush/20 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-closet-rose/45 hover:shadow-closet-soft";

  const content = (
    <>
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden border-b border-closet-pink/30 bg-closet-blush/35">
        {hasImage ? (
          <GoogleDriveImage
            src={source.image!}
            alt=""
            fill
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, 280px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-closet-rose/35">
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
        )}
        {source.url ? (
          <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/90 text-closet-rose shadow-sm">
            <ExternalLinkIcon />
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-closet-pink/50 bg-closet-blush/50 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-closet-rose">
          <SourceLabelIcon label={source.label} />
          {source.label}
        </span>
        <p className="text-sm font-semibold leading-snug text-closet-brown transition-colors group-hover:text-closet-rose">
          {source.detail}
        </p>
        {hostname ? <p className="mt-auto truncate text-xs text-closet-brown-light">{hostname}</p> : null}
      </div>
    </>
  );

  if (source.url) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer" className={cardClass}>
        {content}
      </a>
    );
  }

  return <article className={cardClass}>{content}</article>;
}

function CosplaySourcesList({
  sources,
  cosplayId,
  isAdmin,
}: {
  sources: CosplaySource[];
  cosplayId: string;
  isAdmin: boolean;
}) {
  const sortedSources = useMemo(() => {
    return [...sources].sort((a, b) => {
      const rankDiff = sourceGroupRank(a.label) - sourceGroupRank(b.label);
      if (rankDiff !== 0) return rankDiff;
      return a.detail.localeCompare(b.detail);
    });
  }, [sources]);

  const linkCount = sources.filter((s) => s.url).length;

  if (sources.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-closet-pink/60 bg-closet-blush/15 px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-closet-rose shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </span>
        <p className="mt-4 font-sans text-base font-bold text-closet-brown">No sources yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-closet-brown-light">
          Track where pieces came from, plus reference links and tutorials for this build.
        </p>
        {isAdmin ? (
          <Link
            href={`/admin/cosplays/${cosplayId}/edit?tab=sources`}
            className="closet-btn-outline mt-5 !px-5 !py-2 !text-sm"
          >
            Add sources & links
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-closet-pink/40 bg-closet-blush/20 px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-closet-rose">Build resources</p>
          <p className="mt-0.5 text-sm text-closet-brown-light">
            {sources.length} source{sources.length === 1 ? "" : "s"}
            {linkCount > 0 ? ` · ${linkCount} link${linkCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        {isAdmin ? (
          <Link
            href={`/admin/cosplays/${cosplayId}/edit?tab=sources`}
            className="text-xs font-semibold text-closet-rose hover:text-closet-mauve"
          >
            Manage →
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedSources.map((source, i) => (
          <SourceCard key={`${source.label}-${source.detail}-${i}`} source={source} />
        ))}
      </div>
    </div>
  );
}

function CosplayTodoList({
  todos,
  isRetired,
}: {
  todos: CosplayTodo[];
  isRetired: boolean;
}) {
  if (todos.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-closet-brown-light">
        Nothing on the to-do list yet.
      </p>
    );
  }

  const grouped = (["todo", "buy", "check"] as const)
    .map((type) => ({
      type,
      items: todos.filter((t) => t.type === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map(({ type, items }) => (
        <div key={type}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-closet-rose">
            {BUILD_TASK_TYPE_LABELS[type]}
          </h3>
          <ul className="divide-y divide-closet-pink/35 rounded-xl border border-closet-pink/45 bg-white/60">
            {items.map((task) => {
              const done = isCosplayTodoDone(task);
              const { label, link, cost } = resolveCosplayTodoDisplay(task);
              const linkLabel = link ? (todoLinkHostname(link) ?? link) : null;
              return (
                <li
                  key={task.id}
                  className={`flex items-start gap-3 px-4 py-3.5 ${done ? "opacity-55" : ""}`}
                >
                  {!isRetired && <CheckIcon owned={done} />}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span
                        className={`text-sm font-semibold text-closet-brown ${done ? "line-through" : ""}`}
                      >
                        {label}
                      </span>
                      {cost != null ? (
                        <span className="shrink-0 text-sm font-bold text-closet-brown">
                          {formatTodoCost(cost)}
                        </span>
                      ) : null}
                    </span>
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-closet-rose hover:underline"
                      >
                        <ExternalLinkIcon />
                        <span className="truncate">{linkLabel}</span>
                      </a>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-closet-brown-light">
                      {BUILD_TASK_STATUS_LABELS[task.status]}
                      {task.dueDate ? ` · Due ${formatEventDate(task.dueDate)}` : ""}
                      {task.notes ? ` · ${task.notes}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function CosplayBoard({
  cosplay,
  todos,
  photoCredits = {},
  buildPhotoUrls = [],
  referencePhotoUrls = [],
  conventionPhotoUrls = [],
  displayPhotoCandidates,
  isAdmin = false,
}: {
  cosplay: Cosplay;
  todos: CosplayTodo[];
  photoCredits?: GalleryPhotoCreditMap;
  buildPhotoUrls?: string[];
  referencePhotoUrls?: string[];
  conventionPhotoUrls?: string[];
  displayPhotoCandidates?: { cosplayPhotos: string[]; referencePhotos: string[] };
  isAdmin?: boolean;
}) {
  const [tab, setTab] = useState<BoardTab>("overview");

  const isRetired = cosplay.status === "retired";
  const overall = isRetired ? 0 : getCosplayProgressPercent(cosplay, todos);
  const partsPercent = getCosplayPartsPercent(cosplay);
  const doneTasks = todos.filter(isCosplayTodoDone).length;
  const openTasks = getOpenCosplayTodos(todos);
  const sources = cosplay.sources ?? [];

  const wig = partByCategory(cosplay.parts, "wig");
  const eyes = partByCategory(cosplay.parts, "eyes");
  const props = (cosplay.parts ?? []).filter((p) => p.category === "prop");
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

  const referencePhotos = useMemo(() => filterCosplayImages(referencePhotoUrls), [referencePhotoUrls]);

  const conventionPhotos = useMemo(() => filterCosplayImages(conventionPhotoUrls), [conventionPhotoUrls]);

  const { cosplay: cosplayPhotoFallbacks, reference: referencePhotoFallbacks } = useMemo(
    () => buildCosplayPhotoFallbacks(displayPhotoCandidates, [...conventionPhotoUrls, ...buildPhotoUrls, ...referencePhotoUrls]),
    [displayPhotoCandidates, conventionPhotoUrls, buildPhotoUrls, referencePhotoUrls],
  );

  const heroImage = useMemo(
    () => resolveCosplayDisplayPhoto(cosplay, cosplayPhotoFallbacks, referencePhotoFallbacks),
    [cosplay, cosplayPhotoFallbacks, referencePhotoFallbacks],
  );

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
        {isAdmin ? (
          <Link href={`/admin/cosplays/${cosplay.id}/edit`} className="closet-btn-outline !py-1.5 !text-xs sm:!text-sm">
            Edit
          </Link>
        ) : null}
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

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-closet-pink/50 bg-closet-blush/30 px-3 py-3 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-closet-rose">Wig</p>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  {wig?.name ? <ColorSwatch color={wig.name} /> : null}
                  <p className="text-xs font-semibold leading-snug text-closet-brown sm:text-sm">
                    {wig?.name || "—"}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-closet-pink/50 bg-closet-blush/30 px-3 py-3 text-center">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-closet-rose">Eyes</p>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  {eyes?.name ? <ColorSwatch color={eyes.name} /> : null}
                  <p className="text-xs font-semibold leading-snug text-closet-brown sm:text-sm">
                    {eyes?.name || "—"}
                  </p>
                </div>
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
                onClick={() => setTab("todos")}
                className="closet-btn-outline !rounded-xl !border-closet-rose/50 !px-5 !py-2.5 !text-sm"
              >
                To-Do List
                {openTasks.length > 0 ? ` (${openTasks.length})` : ""}
              </button>
            </div>

            {(cosplay.deadline || (!isRetired && partsPercent !== null) || (todos.length > 0 && !isRetired)) && (
              <div className="flex flex-wrap gap-2">
                {!isRetired && partsPercent !== null ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-closet-pink/50 bg-closet-blush/40 px-3 py-1.5 text-xs">
                    <span className="h-1.5 w-10 overflow-hidden rounded-full bg-closet-blush">
                      <span
                        className="block h-full rounded-full bg-closet-rose"
                        style={{ width: `${partsPercent}%` }}
                      />
                    </span>
                    <span className="font-semibold tabular-nums text-closet-brown">{partsPercent}%</span>
                    <span className="text-closet-brown-light">parts owned</span>
                  </span>
                ) : null}
                {cosplay.deadline ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-closet-pink/50 bg-white/60 px-3 py-1.5 text-xs text-closet-brown">
                    <span className="text-closet-brown-light">Deadline</span>
                    <span className="font-semibold">{formatEventDate(cosplay.deadline)}</span>
                  </span>
                ) : null}
                {!isRetired && todos.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-closet-pink/50 bg-white/60 px-3 py-1.5 text-xs">
                    <span className="font-semibold tabular-nums text-closet-brown">
                      {doneTasks}/{todos.length}
                    </span>
                    <span className="text-closet-brown-light">tasks done</span>
                  </span>
                ) : null}
              </div>
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
              {t.id === "todos" && openTasks.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-closet-rose/15 px-1.5 py-0.5 text-[10px] font-bold text-closet-rose">
                  {openTasks.length}
                </span>
              ) : null}
              {t.id === "sources" && sources.length > 0 ? (
                <span className="ml-1.5 rounded-full bg-closet-rose/15 px-1.5 py-0.5 text-[10px] font-bold text-closet-rose">
                  {sources.length}
                </span>
              ) : null}
              {tab === t.id && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-closet-rose" />
              )}
            </button>
          ))}
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
                  getFallbackLabel={labelPhoto}
                  emptyMessage="No photos tagged yet."
                />
              </div>
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
                  label={props.length === 1 ? "Prop" : "Props"}
                  value={props.length ? props.map((p) => p.name).join(", ") : "None"}
                  icon={detailIcons.prop}
                />
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* Sources & Links */}
      {tab === "sources" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div>
              <h2 className="font-sans text-base font-bold text-closet-brown">Sources & Links</h2>
              <p className="text-xs text-closet-brown-light">
                Where pieces came from, plus references and tutorials for this build.
              </p>
            </div>
            {isAdmin && sources.length > 0 ? (
              <Link
                href={`/admin/cosplays/${cosplay.id}/edit?tab=sources`}
                className="shrink-0 text-xs font-semibold text-closet-rose hover:text-closet-mauve"
              >
                Edit sources →
              </Link>
            ) : null}
          </div>
          <div className="p-4 sm:p-6">
            <CosplaySourcesList sources={sources} cosplayId={cosplay.id} isAdmin={isAdmin} />
          </div>
        </section>
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
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...CHECKLIST_GROUP_ORDER, "Wig & Eyes" as const]
                  .map((group) => {
                    const items =
                      group === "Wig & Eyes"
                        ? (cosplay.parts ?? []).filter(
                            (p) => p.category === "wig" || p.category === "eyes",
                          )
                        : (cosplay.parts ?? []).filter(
                            (p) => checklistGroup(p) === group && !isWigOrEyesPart(p),
                          );
                    return { group, items };
                  })
                  .filter((g) => g.items.length > 0)
                  .map(({ group, items }) => {
                    const ownedCount = items.filter((p) => p.owned).length;
                    return (
                      <div
                        key={group}
                        className="overflow-hidden rounded-2xl border border-closet-pink/45 bg-white/50"
                      >
                        <div className="flex items-center gap-2 border-b border-closet-pink/35 bg-closet-blush/25 px-4 py-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/70">
                            <GroupIcon group={group} />
                          </span>
                          <h3 className="min-w-0 flex-1 text-xs font-bold uppercase tracking-[0.14em] text-closet-brown">
                            {group}
                          </h3>
                          {!isRetired && (
                            <span className="shrink-0 text-[0.65rem] font-semibold tabular-nums text-closet-brown-light">
                              {ownedCount}/{items.length}
                            </span>
                          )}
                        </div>
                        <ul className="divide-y divide-closet-pink/25 px-4 py-1">
                          {items.map((part) => {
                            const showLabel = !isRedundantPartLabel(part, group);
                            const isWigEyes = group === "Wig & Eyes";
                            return (
                              <li
                                key={`${part.category}-${part.name}`}
                                className="flex items-center gap-2.5 py-2.5"
                              >
                                {!isRetired && <CheckIcon owned={part.owned} />}
                                {isWigEyes ? (
                                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                                    <span className="shrink-0 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-closet-rose/75">
                                      {wigEyesShortLabel(part)}
                                    </span>
                                    <span
                                      className={`text-right text-sm font-semibold ${
                                        isRetired || part.owned
                                          ? "text-closet-brown"
                                          : "text-closet-brown-light"
                                      }`}
                                    >
                                      {part.name}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                                    <span
                                      className={`text-sm font-medium leading-snug ${
                                        isRetired || part.owned
                                          ? "text-closet-brown"
                                          : "text-closet-brown-light"
                                      }`}
                                    >
                                      {part.name}
                                    </span>
                                    {showLabel && (
                                      <span className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wider text-closet-rose/70">
                                        {part.label}
                                      </span>
                                    )}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Reference Gallery */}
      {tab === "reference" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header justify-between">
            <h2 className="font-sans text-base font-bold text-closet-brown">References</h2>
            {referencePhotos.length > 0 && (
              <span className="text-xs font-semibold text-closet-brown-light">
                {referencePhotos.length} image{referencePhotos.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="p-4 sm:p-6">
            <CosplayPhotoGallery
              photos={referencePhotos}
              photoCredits={photoCredits}
              characterName={cosplay.character}
              variant="build"
              getFallbackLabel={labelPhoto}
              emptyMessage="Tag photos as Reference gallery in the admin to show detailed reference images here."
            />
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
          <div className="cosplan-panel-header">
            <h2 className="font-sans text-base font-bold text-closet-brown">Gallery</h2>
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
                getFallbackLabel={labelPhoto}
                emptyMessage="Nothing here yet."
              />
            )}
          </div>
        </section>
      )}

      {/* To-Do List */}
      {tab === "todos" && (
        <section className="cosplan-panel overflow-hidden">
          <div className="cosplan-panel-header justify-between">
            <h2 className="font-sans text-base font-bold text-closet-brown">To-Do List</h2>
            {todos.length > 0 && (
              <span className="text-xs font-semibold text-closet-brown">
                {getCosplayTodoProgress(todos)}% · {doneTasks}/{todos.length}
              </span>
            )}
          </div>
          <div className="p-4 sm:p-6">
            <CosplayTodoList todos={todos} isRetired={isRetired} />
          </div>
        </section>
      )}
    </div>
  );
}
