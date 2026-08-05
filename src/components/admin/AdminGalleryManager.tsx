"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Cosplay } from "@/types/cosplay";
import { ConEvent } from "@/types/event";
import { GalleryItem, GalleryPublishedFilter, GalleryImageTypeFilter, GalleryImageType, GallerySection, GallerySectionFilter, GallerySortBy, GALLERY_SECTION_LABELS, GalleryListResult } from "@/types/gallery";
import { getGalleryAdminImageSrc, ADMIN_GALLERY_THUMB_WIDTH } from "@/lib/utils/googleDriveImage";
import { GALLERY_DEFAULT_PAGE_SIZE, GALLERY_PAGE_SIZES } from "@/lib/gallery/constants";
import { filterCosplaysByQuery, cosplayPickerSubtitle } from "@/lib/gallery/suggestCosplayFromFilename";
import AdminGalleryEditModal from "./AdminGalleryEditModal";
import { IconTrash } from "./icons";
import {
  AdminButton,
  AdminCard,
  AdminEmptyState,
  AdminField,
  AdminModal,
  AdminPageHeader,
  AdminSearch,
  AdminSelect,
  AdminStatCard,
  AdminToast,
} from "./ui";

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const HIDE_LIVE_STORAGE_KEY = "gallery-hide-live";

function readHideLivePreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(HIDE_LIVE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AdminGalleryManager({
  cosplays: initialCosplays,
  events: initialEvents,
}: {
  cosplays?: Cosplay[];
  events?: ConEvent[];
} = {}) {
  const [cosplays, setCosplays] = useState<Cosplay[]>(initialCosplays ?? []);
  const [events, setEvents] = useState<ConEvent[]>(initialEvents ?? []);
  const [referenceLoading, setReferenceLoading] = useState(!initialCosplays?.length || !initialEvents?.length);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, unpublished: 0, unlinked: 0, excluded: 0 });
  const [facets, setFacets] = useState<{ conventions: string[]; photographers: string[]; folders: { id: string; name: string }[] }>({
    conventions: [],
    photographers: [],
    folders: [],
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(GALLERY_DEFAULT_PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<GalleryPublishedFilter>("all");
  const [cosplayFilter, setCosplayFilter] = useState("");
  const [conventionFilter, setConventionFilter] = useState("");
  const [photographerFilter, setPhotographerFilter] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [sortBy, setSortBy] = useState<GallerySortBy>("folder");
  const [imageTypeFilter, setImageTypeFilter] = useState<GalleryImageTypeFilter>("all");
  const [gallerySectionFilter, setGallerySectionFilter] = useState<GallerySectionFilter>("all");
  const [hideLivePhotos, setHideLivePhotos] = useState(false);
  const [liveOnly, setLiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState("");
  const [showAddLinks, setShowAddLinks] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [editTags, setEditTags] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCosplayIds, setEditCosplayIds] = useState<string[]>([]);
  const [editConvention, setEditConvention] = useState("");
  const [editPhotographer, setEditPhotographer] = useState("");
  const [editImageType, setEditImageType] = useState<GalleryImageType | null>(null);
  const [editGallerySection, setEditGallerySection] = useState<GallerySection | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingPhoto, setSettingPhoto] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<GalleryItem | null>(null);
  const [removing, setRemoving] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkTag, setShowBulkTag] = useState(false);
  const [bulkTagCosplayIds, setBulkTagCosplayIds] = useState<string[]>([]);
  const [bulkTagQuery, setBulkTagQuery] = useState("");
  const [bulkTagAllMatching, setBulkTagAllMatching] = useState(false);
  const [bulkTagging, setBulkTagging] = useState(false);
  const [bulkTagConvention, setBulkTagConvention] = useState("");
  const [bulkTagPhotographer, setBulkTagPhotographer] = useState("");
  const [bulkTagGallerySection, setBulkTagGallerySection] = useState<"" | GallerySection>("");
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [bulkDeleteAllMatching, setBulkDeleteAllMatching] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const editingIdRef = useRef<string | null>(null);
  const publishedAtOpenRef = useRef(false);
  const setPhotoRequestRef = useRef(0);
  const loadAbortRef = useRef<AbortController | null>(null);
  const filterSignatureRef = useRef("");

  useEffect(() => {
    setHideLivePhotos(readHideLivePreference());
  }, []);

  useEffect(() => {
    if (initialCosplays?.length && initialEvents?.length) return;

    let cancelled = false;
    void (async () => {
      try {
        const [cosplayRes, eventRes] = await Promise.all([
          initialCosplays?.length ? Promise.resolve(null) : fetch("/api/admin/cosplays"),
          initialEvents?.length ? Promise.resolve(null) : fetch("/api/admin/events"),
        ]);

        if (cancelled) return;

        if (cosplayRes) {
          if (!cosplayRes.ok) throw new Error("cosplays fetch failed");
          setCosplays((await cosplayRes.json()) as Cosplay[]);
        }
        if (eventRes) {
          if (!eventRes.ok) throw new Error("events fetch failed");
          setEvents((await eventRes.json()) as ConEvent[]);
        }
      } catch {
        if (!cancelled) setMessage("Could not load roster data");
      } finally {
        if (!cancelled) setReferenceLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialCosplays, initialEvents]);

  useEffect(() => {
    editingIdRef.current = editing?.id ?? null;
  }, [editing]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const filterSignature = useMemo(
    () =>
      JSON.stringify({
        debouncedQuery,
        publishedFilter,
        hideLivePhotos,
        liveOnly,
        cosplayFilter,
        conventionFilter,
        photographerFilter,
        folderFilter,
        sortBy,
        imageTypeFilter,
        gallerySectionFilter,
        limit,
      }),
    [
      debouncedQuery,
      publishedFilter,
      hideLivePhotos,
      liveOnly,
      cosplayFilter,
      conventionFilter,
      photographerFilter,
      folderFilter,
      sortBy,
      imageTypeFilter,
      gallerySectionFilter,
      limit,
    ],
  );

  const cosplayMap = useMemo(() => new Map(cosplays.map((c) => [c.id, c])), [cosplays]);
  const uniqueCosplays = useMemo(() => Array.from(cosplayMap.values()), [cosplayMap]);
  const conventionOptions = useMemo(() => facets.conventions, [facets.conventions]);
  const photographerOptions = useMemo(() => facets.photographers, [facets.photographers]);

  const loadItems = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);

    let fetchPage = page;
    const filtersChanged = filterSignature !== filterSignatureRef.current;
    const includeMeta = filtersChanged || filterSignatureRef.current === "";
    if (filtersChanged) {
      filterSignatureRef.current = filterSignature;
      fetchPage = 1;
      if (page !== 1) setPage(1);
    }

    loadAbortRef.current?.abort();
    const controller = new AbortController();
    loadAbortRef.current = controller;

    const params = new URLSearchParams({
      page: String(fetchPage),
      limit: String(limit),
    });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (publishedFilter !== "all") params.set("published", publishedFilter);
    if (hideLivePhotos) params.set("hideLive", "1");
    if (liveOnly) params.set("liveOnly", "1");
    if (cosplayFilter) params.set("cosplayId", cosplayFilter);
    if (conventionFilter) params.set("convention", conventionFilter);
    if (photographerFilter) params.set("photographer", photographerFilter);
    if (folderFilter) params.set("folderId", folderFilter);
    if (sortBy !== "folder") params.set("sortBy", sortBy);
    if (imageTypeFilter !== "all") params.set("imageType", imageTypeFilter);
    if (gallerySectionFilter !== "all") params.set("gallerySection", gallerySectionFilter);
    if (!includeMeta) {
      params.set("includeStats", "0");
      params.set("includeFacets", "0");
    }

    try {
      const res = await fetch(`/api/admin/gallery/items?${params}`, { signal: controller.signal });

      if (!res.ok) {
        if (!controller.signal.aborted) {
          setLoading(false);
          setMessage("Could not load gallery");
        }
        return;
      }

      const data = (await res.json()) as GalleryListResult;
      if (controller.signal.aborted) return;

      setItems(data.items);
      setTotal(data.total);
      if (data.stats) setStats(data.stats);
      if (data.facets) setFacets(data.facets);
      setLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!controller.signal.aborted) {
        setLoading(false);
        setMessage("Could not load gallery");
      }
    }
  }, [page, limit, debouncedQuery, publishedFilter, hideLivePhotos, liveOnly, cosplayFilter, conventionFilter, photographerFilter, folderFilter, sortBy, imageTypeFilter, gallerySectionFilter, filterSignature]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedQuery, publishedFilter, hideLivePhotos, liveOnly, cosplayFilter, conventionFilter, photographerFilter, folderFilter, sortBy, imageTypeFilter, gallerySectionFilter, limit]);

  const currentListFilters = useMemo(
    () => ({
      q: debouncedQuery.trim() || undefined,
      published: publishedFilter !== "all" ? publishedFilter : undefined,
      hideLivePhotos: hideLivePhotos || undefined,
      liveOnly: liveOnly || undefined,
      cosplayId: cosplayFilter || undefined,
      convention: conventionFilter || undefined,
      photographer: photographerFilter || undefined,
      folderId: folderFilter || undefined,
      imageType: imageTypeFilter !== "all" ? imageTypeFilter : undefined,
      gallerySection: gallerySectionFilter !== "all" ? gallerySectionFilter : undefined,
      sortBy: sortBy !== "folder" ? sortBy : undefined,
    }),
    [
      debouncedQuery,
      publishedFilter,
      hideLivePhotos,
      liveOnly,
      cosplayFilter,
      conventionFilter,
      photographerFilter,
      folderFilter,
      imageTypeFilter,
      gallerySectionFilter,
      sortBy,
    ],
  );

  const bulkTagCosplayOptions = useMemo(
    () => filterCosplaysByQuery(uniqueCosplays, bulkTagQuery),
    [uniqueCosplays, bulkTagQuery],
  );

  function mergeVisibleGalleryItem(
    prev: GalleryItem[],
    item: GalleryItem,
  ): { items: GalleryItem[]; totalDelta: number } {
    const wasVisible = prev.some((i) => i.id === item.id);
    const shouldHide = (hideLivePhotos && item.published) || (liveOnly && !item.published);

    if (shouldHide) {
      return {
        items: prev.filter((i) => i.id !== item.id),
        totalDelta: wasVisible ? -1 : 0,
      };
    }

    if (wasVisible) {
      return {
        items: prev.map((i) => (i.id === item.id ? item : i)),
        totalDelta: 0,
      };
    }

    if (liveOnly && !item.published) {
      return { items: prev, totalDelta: 0 };
    }

    return {
      items: [...prev, item],
      totalDelta: 1,
    };
  }

  function applyVisibleGalleryItem(item: GalleryItem) {
    let totalDelta = 0;
    setItems((prev) => {
      const merged = mergeVisibleGalleryItem(prev, item);
      totalDelta = merged.totalDelta;
      return merged.items;
    });
    if (totalDelta !== 0) {
      setTotal((prev) => Math.max(0, prev + totalDelta));
    }
  }

  const refreshFacetsFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/gallery/items?limit=1&page=1");
      if (!res.ok) return;
      const data = (await res.json()) as GalleryListResult;
      if (data.facets) setFacets(data.facets);
    } catch {
      /* ignore */
    }
  }, []);

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setShowBulkTag(false);
    setBulkTagCosplayIds([]);
    setBulkTagQuery("");
    setBulkTagAllMatching(false);
    setBulkTagConvention("");
    setBulkTagPhotographer("");
    setBulkTagGallerySection("");
    setShowBulkDelete(false);
    setBulkDeleteAllMatching(false);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllOnPage() {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }

  function openBulkTag(allMatching: boolean) {
    setBulkTagAllMatching(allMatching);
    setBulkTagCosplayIds([]);
    setBulkTagQuery("");
    setBulkTagConvention("");
    setBulkTagPhotographer("");
    setBulkTagGallerySection("");
    setShowBulkTag(true);
  }

  function toggleBulkTagCosplay(cosplayId: string) {
    setBulkTagCosplayIds((prev) =>
      prev.includes(cosplayId) ? prev.filter((id) => id !== cosplayId) : [...prev, cosplayId],
    );
  }

  async function confirmBulkTag() {
    const count = bulkTagAllMatching ? total : selectedIds.size;
    if (count === 0) return;
    if (bulkTagCosplayIds.length === 0 && !bulkTagGallerySection && !bulkTagConvention.trim() && !bulkTagPhotographer.trim()) {
      setMessage("Pick a character, gallery section, convention, or photographer to apply");
      return;
    }

    const label = bulkTagCosplayIds.map((id) => cosplayMap.get(id)?.character).filter(Boolean).join(", ");
    const sectionLabel = bulkTagGallerySection ? GALLERY_SECTION_LABELS[bulkTagGallerySection] : "";
    const scope = bulkTagAllMatching ? `all ${count.toLocaleString()} matching photos` : `${count} selected photo${count === 1 ? "" : "s"}`;
    const action = [label && `tag as ${label}`, sectionLabel && `mark as ${sectionLabel}`].filter(Boolean).join(" and ");
    if (!confirm(`${action ? `${action.charAt(0).toUpperCase()}${action.slice(1)} for ` : "Update "}${scope}?`)) return;

    setBulkTagging(true);
    const body = {
      ...(bulkTagAllMatching
        ? { filters: currentListFilters }
        : { itemIds: Array.from(selectedIds) }),
      ...(bulkTagCosplayIds.length > 0 ? { cosplayIds: bulkTagCosplayIds, mode: "add" as const } : {}),
      ...(bulkTagConvention.trim() ? { convention: bulkTagConvention.trim() } : {}),
      ...(bulkTagPhotographer.trim() ? { photographer: bulkTagPhotographer.trim() } : {}),
      ...(bulkTagGallerySection ? { gallerySection: bulkTagGallerySection } : {}),
    };

    const res = await fetch("/api/admin/gallery/bulk-tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBulkTagging(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(typeof data.error === "string" ? data.error : "Could not tag photos");
      return;
    }

    const data = (await res.json()) as { updated: number; skipped: number; total: number };
    setMessage(`Tagged ${data.updated} photo${data.updated === 1 ? "" : "s"} as ${label}${data.skipped ? ` (${data.skipped} unchanged)` : ""}`);
    setShowBulkTag(false);
    exitSelectMode();
    void loadItems();
  }

  function openBulkDelete(allMatching: boolean) {
    setBulkDeleteAllMatching(allMatching);
    setShowBulkDelete(true);
  }

  async function confirmBulkDelete() {
    const count = bulkDeleteAllMatching ? total : selectedIds.size;
    if (count === 0) return;

    setBulkDeleting(true);
    const body = bulkDeleteAllMatching
      ? { filters: currentListFilters }
      : { itemIds: Array.from(selectedIds) };

    const res = await fetch("/api/admin/gallery/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBulkDeleting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(typeof data.error === "string" ? data.error : "Could not remove photos");
      return;
    }

    const data = (await res.json()) as { removed: number; skipped: number; total: number };
    setMessage(
      `Removed ${data.removed} photo${data.removed === 1 ? "" : "s"} from gallery${data.skipped ? ` (${data.skipped} already gone)` : ""}`,
    );
    setShowBulkDelete(false);
    if (editing && (bulkDeleteAllMatching || selectedIds.has(editing.id))) {
      setEditing(null);
    }
    exitSelectMode();
    void loadItems();
  }

  async function syncFromDrive() {
    if (!confirm("Sync all images from your Google Drive cosplay folders? This may take a minute.")) return;
    setSyncing(true);
    const res = await fetch("/api/admin/gallery/sync", { method: "POST" });
    setSyncing(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ? `${data.error}${data.hint ? ` — ${data.hint}` : ""}` : "Sync failed");
      return;
    }

    const data = (await res.json()) as { synced: number; skipped: number };
    setMessage(`Synced ${data.synced} images${data.skipped ? ` (${data.skipped} skipped)` : ""}`);
    void loadItems();
  }

  async function restoreFromDrive() {
    const countLabel = stats.excluded > 0 ? `${stats.excluded.toLocaleString()} previously removed photo${stats.excluded === 1 ? "" : "s"}` : "previously removed photos";
    if (
      !confirm(
        `Restore ${countLabel} from Google Drive?\n\nThis clears the removal block list and re-imports those files. Tags and publish status will need to be set again.`,
      )
    ) {
      return;
    }

    setRestoring(true);
    const res = await fetch("/api/admin/gallery/restore", { method: "POST" });
    setRestoring(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error ? `${data.error}${data.hint ? ` — ${data.hint}` : ""}` : "Restore failed");
      return;
    }

    const data = (await res.json()) as { cleared: number; synced: number; skipped: number };
    setMessage(
      `Restored ${data.synced} image${data.synced === 1 ? "" : "s"} from Drive${
        data.cleared ? ` (cleared ${data.cleared} removal${data.cleared === 1 ? "" : "s"})` : ""
      }${data.skipped ? ` · ${data.skipped} skipped` : ""}`,
    );
    void loadItems();
  }

  async function addByLinks() {
    const res = await fetch("/api/admin/gallery/add-by-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ links: linkInput }),
    });

    if (!res.ok) {
      setMessage("Could not add links");
      return;
    }

    const data = (await res.json()) as { added: number; errors: string[] };
    setMessage(
      data.added
        ? `Added ${data.added} image${data.added === 1 ? "" : "s"}${data.errors.length ? ` · ${data.errors.length} skipped` : ""}`
        : data.errors[0] ?? "No new images added",
    );
    setLinkInput("");
    setShowAddLinks(false);
    void loadItems();
  }

  function isEditDirty(): boolean {
    if (!editing) return false;
    const tags = parseTags(editTags);
    const sortedCurrent = [...editing.cosplayIds].sort();
    const sortedEdit = [...editCosplayIds].sort();
    const cosplayIdsEqual =
      sortedCurrent.length === sortedEdit.length && sortedCurrent.every((id, index) => id === sortedEdit[index]);
    const tagsEqual =
      tags.length === editing.tags.length && tags.every((tag, index) => tag === editing.tags[index]);

    return (
      editing.published !== publishedAtOpenRef.current ||
      !tagsEqual ||
      editNotes !== (editing.notes ?? "") ||
      editConvention.trim() !== (editing.convention ?? "") ||
      editPhotographer.trim() !== (editing.photographer ?? "") ||
      editImageType !== (editing.imageType ?? null) ||
      editGallerySection !== (editing.gallerySection ?? null) ||
      !cosplayIdsEqual
    );
  }

  function buildEditPayload() {
    if (!editing) return null;
    return {
      published: editing.published,
      tags: parseTags(editTags),
      notes: editNotes,
      cosplayIds: editCosplayIds,
      convention: editConvention,
      photographer: editPhotographer,
      imageType: editImageType,
      gallerySection: editGallerySection,
    };
  }

  async function persistGalleryEdits(options?: { closeAfter?: boolean; silent?: boolean }): Promise<boolean> {
    if (!editing) return true;
    if (!isEditDirty()) {
      if (options?.closeAfter) {
        setPhotoRequestRef.current += 1;
        setSettingPhoto(null);
        setEditing(null);
      }
      return true;
    }

    const snapshot = editing;
    const payload = buildEditPayload();
    if (!payload) return true;

    const addedCharacter = payload.cosplayIds.some((id) => !editing.cosplayIds.includes(id));
    const resolvedGallerySection =
      payload.gallerySection ?? (addedCharacter ? "convention" : null);

    const optimistic: GalleryItem = {
      ...editing,
      tags: payload.tags,
      notes: payload.notes,
      cosplayIds: payload.cosplayIds,
      convention: payload.convention.trim() || undefined,
      photographer: payload.photographer.trim() || undefined,
      imageType: payload.imageType,
      gallerySection: resolvedGallerySection ?? undefined,
      published: addedCharacter ? true : editing.published,
    };

    applyVisibleGalleryItem(optimistic);
    if (options?.closeAfter) {
      setPhotoRequestRef.current += 1;
      setSettingPhoto(null);
      setEditing(null);
    }
    if (!options?.silent) setMessage("Image updated");

    const slowTimer = window.setTimeout(() => setSaving(true), 400);

    try {
      const res = await fetch(`/api/admin/gallery/items/${encodeURIComponent(editing.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("save failed");

      const updated = (await res.json()) as GalleryItem;
      applyVisibleGalleryItem(updated);
      publishedAtOpenRef.current = updated.published;
      void refreshFacetsFromServer();
      if (updated.published !== snapshot.published) {
        setStats((prev) => ({
          ...prev,
          published: prev.published + (updated.published ? 1 : -1),
          unpublished: prev.unpublished + (updated.published ? -1 : 1),
        }));
      }
      if (!options?.closeAfter && editingIdRef.current === updated.id) {
        setEditing(updated);
        setEditConvention(updated.convention ?? "");
        setEditPhotographer(updated.photographer ?? "");
        setEditCosplayIds([...updated.cosplayIds]);
        setEditTags(updated.tags.join(", "));
        setEditNotes(updated.notes ?? "");
        setEditImageType(updated.imageType ?? null);
        setEditGallerySection(updated.gallerySection ?? null);
      }
      return true;
    } catch {
      setItems((prev) => prev.map((i) => (i.id === snapshot.id ? snapshot : i)));
      if (options?.closeAfter) setEditing(snapshot);
      setMessage("Could not save");
      return false;
    } finally {
      window.clearTimeout(slowTimer);
      setSaving(false);
    }
  }

  async function closeEdit() {
    await persistGalleryEdits({ closeAfter: true, silent: true });
  }

  function openEdit(item: GalleryItem) {
    setPhotoRequestRef.current += 1;
    setSettingPhoto(null);
    const linkedEvent = item.eventId ? events.find((e) => e.id === item.eventId) : undefined;
    setEditing(item);
    publishedAtOpenRef.current = item.published;
    setEditTags(item.tags.join(", "));
    setEditNotes(item.notes ?? "");
    setEditCosplayIds([...item.cosplayIds]);
    setEditConvention(item.convention ?? linkedEvent?.title ?? "");
    setEditPhotographer(item.photographer ?? "");
    setEditImageType(item.imageType ?? null);
    setEditGallerySection(item.gallerySection ?? null);
  }

  async function saveEdit() {
    await persistGalleryEdits({ closeAfter: true });
  }

  function requestRemove(item: GalleryItem) {
    setPendingRemove(item);
  }

  async function confirmRemove() {
    if (!pendingRemove) return;
    const id = pendingRemove.id;
    setRemoving(true);

    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
      published: pendingRemove.published ? Math.max(0, prev.published - 1) : prev.published,
      unpublished: !pendingRemove.published ? Math.max(0, prev.unpublished - 1) : prev.unpublished,
      unlinked:
        !pendingRemove.published && pendingRemove.cosplayIds.length === 0
          ? Math.max(0, prev.unlinked - 1)
          : prev.unlinked,
    }));
    setPendingRemove(null);
    if (editing?.id === id) setEditing(null);

    const res = await fetch(`/api/admin/gallery/items/${encodeURIComponent(id)}`, { method: "DELETE" });
    setRemoving(false);

    if (!res.ok) {
      setMessage("Could not remove image");
      void loadItems();
      return;
    }

    setMessage("Image removed from gallery");
  }

  function toggleCosplayLink(cosplayId: string) {
    const adding = !editCosplayIds.includes(cosplayId);
    setEditCosplayIds((prev) =>
      prev.includes(cosplayId) ? prev.filter((id) => id !== cosplayId) : [...prev, cosplayId],
    );
    if (adding) {
      setEditing((item) => (item ? { ...item, published: true } : item));
      setEditGallerySection((section) => section ?? "convention");
    }
  }

  async function setCosplayPhoto(cosplayId: string, role: "characterArt" | "image", clear = false) {
    if (!editing) return;
    const galleryItemId = editing.id;
    const saved = await persistGalleryEdits({ silent: true });
    if (!saved) return;

    const requestId = ++setPhotoRequestRef.current;
    setSettingPhoto(`${cosplayId}-${role}`);

    try {
      const res = await fetch(
        `/api/admin/gallery/items/${encodeURIComponent(galleryItemId)}/set-cosplay-photo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cosplayId, role, clear }),
        },
      );

      if (requestId !== setPhotoRequestRef.current) return;

      if (!res.ok) {
        setMessage(clear ? "Could not remove cosplay photo" : "Could not update cosplay photo");
        return;
      }

      const data = (await res.json()) as {
        cosplay: Cosplay;
        galleryItem: GalleryItem;
        role: "characterArt" | "image";
        clear?: boolean;
      };

      if (requestId !== setPhotoRequestRef.current) return;

      setCosplays((prev) => prev.map((c) => (c.id === data.cosplay.id ? data.cosplay : c)));
      applyVisibleGalleryItem(data.galleryItem);

      if (editingIdRef.current === galleryItemId) {
        setEditing(data.galleryItem);
        setEditCosplayIds(data.galleryItem.cosplayIds);
        setEditConvention(data.galleryItem.convention ?? "");
        setEditPhotographer(data.galleryItem.photographer ?? "");
        setEditImageType(data.galleryItem.imageType ?? null);
        setEditGallerySection(data.galleryItem.gallerySection ?? null);
      }

      if (clear) {
        setMessage(
          role === "characterArt"
            ? `Removed character reference for ${data.cosplay.character}`
            : `Removed featured photo for ${data.cosplay.character}`,
        );
      } else {
        setMessage(
          role === "characterArt"
            ? `Set as character reference for ${data.cosplay.character}`
            : `Set as featured roster photo for ${data.cosplay.character}`,
        );
      }
    } finally {
      if (requestId === setPhotoRequestRef.current) {
        setSettingPhoto(null);
      }
    }
  }

  async function parseFromFilename() {
    if (!editing) return;
    const galleryItemId = editing.id;
    const res = await fetch(`/api/admin/gallery/items/${encodeURIComponent(galleryItemId)}/parse-filename`, {
      method: "POST",
    });
    if (!res.ok) {
      setMessage("Could not parse filename");
      return;
    }
    const item = (await res.json()) as GalleryItem;
    if (editingIdRef.current !== galleryItemId) return;
    setEditing(item);
    setEditConvention(item.convention ?? "");
    setEditPhotographer(item.photographer ?? "");
    setMessage("Parsed convention & photographer from filename");
    applyVisibleGalleryItem(item);
    void refreshFacetsFromServer();
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (publishedFilter !== "all") {
      const labels: Record<GalleryPublishedFilter, string> = {
        all: "",
        published: "Live",
        unpublished: "Not live",
        unlinked: "Unlinked (not live)",
      };
      chips.push({ key: "status", label: labels[publishedFilter], onClear: () => setPublishedFilter("all") });
    }
    if (hideLivePhotos) {
      chips.push({ key: "hideLive", label: "Hiding live", onClear: () => toggleHideLivePhotos(false) });
    }
    if (liveOnly) {
      chips.push({ key: "liveOnly", label: "Live only", onClear: () => toggleLiveOnly(false) });
    }
    if (cosplayFilter) {
      const name = cosplayMap.get(cosplayFilter)?.character ?? cosplayFilter;
      chips.push({ key: "cosplay", label: name, onClear: () => setCosplayFilter("") });
    }
    if (conventionFilter) {
      chips.push({ key: "con", label: conventionFilter, onClear: () => setConventionFilter("") });
    }
    if (photographerFilter) {
      chips.push({ key: "photog", label: photographerFilter, onClear: () => setPhotographerFilter("") });
    }
    if (folderFilter) {
      const folder = facets.folders.find((f) => f.id === folderFilter);
      chips.push({ key: "folder", label: folder?.name ?? "Folder", onClear: () => setFolderFilter("") });
    }
    if (imageTypeFilter !== "all") {
      const labels: Record<Exclude<GalleryImageTypeFilter, "all">, string> = {
        reference: "Reference",
        featured: "Featured",
        unset: "Untagged",
      };
      chips.push({
        key: "type",
        label: labels[imageTypeFilter as Exclude<GalleryImageTypeFilter, "all">],
        onClear: () => setImageTypeFilter("all"),
      });
    }
    if (gallerySectionFilter !== "all") {
      const labels: Record<Exclude<GallerySectionFilter, "all">, string> = {
        build: "Build gallery",
        convention: "Gallery",
        unset: "No section",
      };
      chips.push({
        key: "section",
        label: labels[gallerySectionFilter as Exclude<GallerySectionFilter, "all">],
        onClear: () => setGallerySectionFilter("all"),
      });
    }
    if (sortBy !== "folder") {
      chips.push({ key: "sort", label: "Sort: Filename", onClear: () => setSortBy("folder") });
    }
    return chips;
  }, [
    publishedFilter,
    hideLivePhotos,
    liveOnly,
    cosplayFilter,
    conventionFilter,
    photographerFilter,
    folderFilter,
    imageTypeFilter,
    gallerySectionFilter,
    sortBy,
    cosplayMap,
    facets.folders,
  ]);

  function clearAllFilters() {
    setQuery("");
    setPublishedFilter("all");
    setHideLivePhotos(false);
    setLiveOnly(false);
    try {
      localStorage.setItem(HIDE_LIVE_STORAGE_KEY, "0");
    } catch {
      /* ignore */
    }
    setCosplayFilter("");
    setConventionFilter("");
    setPhotographerFilter("");
    setFolderFilter("");
    setImageTypeFilter("all");
    setGallerySectionFilter("all");
    setSortBy("folder");
  }

  function toggleLiveOnly(checked: boolean) {
    setLiveOnly(checked);
    if (checked) {
      setHideLivePhotos(false);
      try {
        localStorage.setItem(HIDE_LIVE_STORAGE_KEY, "0");
      } catch {
        /* ignore */
      }
    }
  }

  function toggleHideLivePhotos(checked: boolean) {
    setHideLivePhotos(checked);
    if (checked) setLiveOnly(false);
    try {
      localStorage.setItem(HIDE_LIVE_STORAGE_KEY, checked ? "1" : "0");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gallery"
        description="Browse, sync, and organize cosplay photos from Google Drive"
        action={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={() => setShowAddLinks((v) => !v)}>
              Add by link
            </AdminButton>
            {stats.excluded > 0 && (
              <AdminButton variant="secondary" onClick={restoreFromDrive} disabled={restoring || syncing}>
                {restoring ? "Restoring…" : `Restore removed (${stats.excluded.toLocaleString()})`}
              </AdminButton>
            )}
            <AdminButton variant="primary" onClick={syncFromDrive} disabled={syncing || restoring}>
              {syncing ? "Syncing…" : "Sync from Drive"}
            </AdminButton>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Total" value={stats.total} accent="blush" />
        <AdminStatCard label="Live" value={stats.published} accent="rose" />
        <AdminStatCard label="Not live" value={stats.unpublished} hint="Hidden from the public site" accent="peach" />
        <AdminStatCard label="Unlinked" value={stats.unlinked} hint="No cosplay linked" accent="brown" />
      </div>

      {stats.excluded > 0 && (
        <AdminCard className="flex flex-col gap-3 border-closet-peach/60 bg-closet-peach/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-semibold text-closet-brown">
              {stats.excluded.toLocaleString()} photo{stats.excluded === 1 ? "" : "s"} removed from gallery
            </p>
            <p className="mt-1 text-sm text-closet-brown-light">
              Still on Google Drive — restore brings them back. You&apos;ll need to re-tag and publish them.
            </p>
          </div>
          <AdminButton variant="primary" onClick={restoreFromDrive} disabled={restoring || syncing}>
            {restoring ? "Restoring…" : "Restore from Drive"}
          </AdminButton>
        </AdminCard>
      )}

      {showAddLinks && (
        <AdminCard className="p-5">
          <p className="mb-2 text-sm font-semibold text-closet-brown">Add by Google Drive link</p>
          <p className="mb-3 text-xs text-closet-brown-light">
            Paste share URLs or file IDs, one per line (max 20).
          </p>
          <textarea
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            rows={4}
            placeholder="https://drive.google.com/file/d/…"
            className="admin-input mb-3 w-full resize-y"
          />
          <div className="flex gap-2">
            <AdminButton variant="primary" onClick={addByLinks} disabled={!linkInput.trim()}>
              Add images
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setShowAddLinks(false)}>
              Cancel
            </AdminButton>
          </div>
        </AdminCard>
      )}

      <AdminCard className="overflow-hidden">
        {/* Search */}
        <div className="border-b border-closet-pink/40 bg-closet-blush/20 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AdminSearch
              value={query}
              onChange={setQuery}
              placeholder="Search filenames, conventions, photographers, tags…"
              className="sm:flex-1"
            />
            <div className="flex shrink-0 flex-wrap gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-closet-pink/50 bg-white px-3 py-2.5 text-sm font-semibold text-closet-brown transition hover:border-closet-rose/50">
                <input
                  type="checkbox"
                  checked={liveOnly}
                  onChange={(e) => toggleLiveOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-closet-pink text-closet-rose"
                />
                Live photos only
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-closet-pink/50 bg-white px-3 py-2.5 text-sm font-semibold text-closet-brown transition hover:border-closet-rose/50">
                <input
                  type="checkbox"
                  checked={hideLivePhotos}
                  onChange={(e) => toggleHideLivePhotos(e.target.checked)}
                  className="h-4 w-4 rounded border-closet-pink text-closet-rose"
                />
                Hide live photos
              </label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-5 px-4 py-5 sm:px-5">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-closet-brown-light">
              Filter photos
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AdminSelect
                label="Status"
                value={publishedFilter}
                onChange={(v) => setPublishedFilter(v as GalleryPublishedFilter)}
                options={[
                  { value: "all", label: "All status" },
                  { value: "published", label: "Live" },
                  { value: "unpublished", label: "Not live" },
                  { value: "unlinked", label: "Unlinked (not live)" },
                ]}
              />
              <AdminSelect
                label="Roster build"
                value={cosplayFilter}
                onChange={setCosplayFilter}
                disabled={referenceLoading}
                options={[
                  { value: "", label: referenceLoading ? "Loading builds…" : "All characters" },
                  ...Array.from(cosplayMap.values()).map((c) => ({ value: c.id, label: c.character })),
                ]}
              />
              <AdminSelect
                label="Image type"
                value={imageTypeFilter}
                onChange={(v) => setImageTypeFilter(v as GalleryImageTypeFilter)}
                options={[
                  { value: "all", label: "All types" },
                  { value: "reference", label: "Reference image" },
                  { value: "featured", label: "Featured image" },
                  { value: "unset", label: "Untagged" },
                ]}
              />
              <AdminSelect
                label="Gallery section"
                value={gallerySectionFilter}
                onChange={(v) => setGallerySectionFilter(v as GallerySectionFilter)}
                options={[
                  { value: "all", label: "All sections" },
                  { value: "build", label: "Build gallery" },
                  { value: "convention", label: "Gallery" },
                  { value: "unset", label: "Untagged section" },
                ]}
              />
              <AdminSelect
                label="Convention"
                value={conventionFilter}
                onChange={setConventionFilter}
                options={[
                  { value: "", label: "All conventions" },
                  ...conventionOptions.map((c) => ({ value: c, label: c })),
                ]}
              />
              <AdminSelect
                label="Photographer"
                value={photographerFilter}
                onChange={setPhotographerFilter}
                options={[
                  { value: "", label: "All photographers" },
                  ...photographerOptions.map((p) => ({ value: p, label: p })),
                ]}
              />
              <AdminSelect
                label="Drive folder"
                value={folderFilter}
                onChange={setFolderFilter}
                options={[
                  { value: "", label: "All folders" },
                  ...facets.folders.map((f) => ({ value: f.id, label: f.name })),
                ]}
              />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-closet-brown-light">Active:</span>
              {activeFilters.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-closet-rose/40 bg-closet-blush px-3 py-1 text-xs font-semibold text-closet-brown transition hover:border-closet-rose hover:bg-closet-blush/80"
                >
                  {chip.label}
                  <span className="text-closet-rose" aria-hidden>
                    ×
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-closet-rose hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Sort & results bar */}
          <div className="flex flex-col gap-4 border-t border-closet-pink/40 pt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
              <AdminSelect
                label="Sort by"
                value={sortBy}
                onChange={(v) => setSortBy(v as GallerySortBy)}
                options={[
                  { value: "folder", label: "Drive folder" },
                  { value: "name", label: "Filename" },
                ]}
              />
              <AdminSelect
                label="Per page"
                value={String(limit)}
                onChange={(v) => setLimit(Number(v))}
                options={GALLERY_PAGE_SIZES.map((n) => ({ value: String(n), label: `${n} photos` }))}
              />
            </div>
            <div className="text-right sm:pb-1">
              <p className="font-sans text-2xl font-bold text-closet-brown">{total.toLocaleString()}</p>
              <p className="text-xs font-semibold text-closet-brown-light">
                {total === 1 ? "photo matches" : "photos match"}
                {loading ? " · loading…" : page > 1 || totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
              </p>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard className="p-4 sm:p-5">
        {!loading && items.length > 0 && (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-closet-brown-light">
              {selectMode ? (
                <>Select photos to tag as a character or remove from gallery</>
              ) : (
                <>
                  Click a photo to edit details · Tap the{" "}
                  <span className="inline-flex translate-y-0.5 align-middle">
                    <IconTrash className="h-3.5 w-3.5" />
                  </span>{" "}
                  button to remove from gallery
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectMode ? (
                <>
                  <AdminButton variant="secondary" onClick={selectAllOnPage} disabled={items.length === 0}>
                    Select page ({items.length})
                  </AdminButton>
                  {total > items.length && (
                    <AdminButton variant="secondary" onClick={() => openBulkTag(true)}>
                      Tag all matching ({total.toLocaleString()})
                    </AdminButton>
                  )}
                  <AdminButton
                    variant="primary"
                    onClick={() => openBulkTag(false)}
                    disabled={selectedIds.size === 0}
                  >
                    Tag selected ({selectedIds.size})
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    onClick={() => openBulkDelete(false)}
                    disabled={selectedIds.size === 0}
                  >
                    Delete selected ({selectedIds.size})
                  </AdminButton>
                  {total > items.length && (
                    <AdminButton variant="danger" onClick={() => openBulkDelete(true)}>
                      Delete all matching ({total.toLocaleString()})
                    </AdminButton>
                  )}
                  <AdminButton variant="ghost" onClick={exitSelectMode}>
                    Cancel
                  </AdminButton>
                </>
              ) : (
                <AdminButton variant="secondary" onClick={() => setSelectMode(true)}>
                  Select photos
                </AdminButton>
              )}
            </div>
          </div>
        )}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-closet-blush/60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <AdminEmptyState
            title="No gallery images yet"
            description={
              stats.excluded > 0
                ? 'Photos were removed from the gallery but are still on Drive. Click "Restore from Drive" above to bring them back.'
                : 'Click "Sync from Drive" to import photos, then filter by subfolder below.'
            }
          />
        ) : (
          <>
            <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${loading ? "opacity-60" : ""}`}>
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-xl border bg-closet-blush/30 text-left transition-all hover:shadow-closet ${
                    selectMode && !isSelected ? "opacity-45" : ""
                  } ${
                    isSelected
                      ? "border-closet-rose ring-2 ring-closet-rose/50 opacity-100"
                      : "border-closet-pink/50 hover:border-closet-rose/60"
                  }`}
                >
                  {selectMode ? (
                    <button
                      type="button"
                      onClick={() => toggleSelected(item.id)}
                      className="block w-full text-left"
                    >
                      <div className="aspect-[3/4] bg-closet-blush/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getGalleryAdminImageSrc(item.viewUrl, { driveFileId: item.driveFileId, width: ADMIN_GALLERY_THUMB_WIDTH })}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-closet-brown/85 to-transparent px-2 pb-2 pt-8">
                        <p className="truncate text-[10px] font-semibold text-white">{item.name}</p>
                        {item.cosplayIds.length > 0 && (
                          <p className="truncate text-[9px] text-white/80">
                            {item.cosplayIds.map((id) => cosplayMap.get(id)?.character).filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </button>
                  ) : (
                  <button type="button" onClick={() => openEdit(item)} className="block w-full text-left">
                    <div className="aspect-[3/4] bg-closet-blush/40">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getGalleryAdminImageSrc(item.viewUrl, { driveFileId: item.driveFileId, width: ADMIN_GALLERY_THUMB_WIDTH })}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-closet-brown/85 to-transparent px-2 pb-2 pt-8">
                      <p className="truncate text-[10px] font-semibold text-white">{item.name}</p>
                      {item.folderName && (
                        <p className="truncate text-[9px] font-medium text-closet-peach/90">📁 {item.folderName}</p>
                      )}
                      {item.convention && (
                        <p className="truncate text-[9px] font-medium text-closet-peach">{item.convention}</p>
                      )}
                      {item.photographer && (
                        <p className="truncate text-[9px] text-white/75">📷 {item.photographer}</p>
                      )}
                      {item.cosplayIds.length > 0 && (
                        <p className="truncate text-[9px] text-white/80">
                          {item.cosplayIds.map((id) => cosplayMap.get(id)?.character).filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </button>
                  )}
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-1 p-1.5">
                    <div className="flex min-w-0 flex-wrap gap-1">
                      {selectMode && (
                        <span
                          className={`pointer-events-none flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold shadow-sm ${
                            isSelected
                              ? "border-white bg-closet-rose text-white"
                              : "border-white/90 bg-closet-brown/50 text-white"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      )}
                      {!selectMode && item.gallerySection && (
                        <span
                          className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm ${
                            item.gallerySection === "build" ? "bg-sky-600" : "bg-violet-600"
                          }`}
                        >
                          {item.gallerySection === "build" ? "Build" : "Gallery"}
                        </span>
                      )}
                      {!selectMode && item.imageType && (
                        <span
                          className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm ${
                            item.imageType === "reference" ? "bg-amber-500" : "bg-closet-rose"
                          }`}
                        >
                          {item.imageType === "reference" ? "Ref" : "Feature"}
                        </span>
                      )}
                      {!selectMode && item.published && (
                        <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                          Live
                        </span>
                      )}
                    </div>
                    {!selectMode && (
                    <button
                      type="button"
                      onClick={() => requestRemove(item)}
                      className="pointer-events-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/80 bg-rose-600 text-white shadow-md transition hover:bg-rose-700 hover:scale-105 active:scale-95"
                      title="Remove from gallery"
                      aria-label={`Remove ${item.name} from gallery`}
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-2">
                <AdminButton variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  Previous
                </AdminButton>
                <span className="text-sm font-semibold text-closet-brown-light">
                  Page {page} of {totalPages}
                </span>
                <AdminButton
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </AdminButton>
              </div>
            )}
          </>
        )}
      </AdminCard>

      {editing && (
        <AdminGalleryEditModal
          item={editing}
          cosplays={uniqueCosplays}
          conventionOptions={conventionOptions}
          photographerOptions={photographerOptions}
          editTags={editTags}
          editNotes={editNotes}
          editConvention={editConvention}
          editPhotographer={editPhotographer}
          editCosplayIds={editCosplayIds}
          editImageType={editImageType}
          editGallerySection={editGallerySection}
          published={editing.published}
          saving={saving}
          settingPhoto={settingPhoto}
          onClose={closeEdit}
          onSave={saveEdit}
          onRemove={() => requestRemove(editing)}
          onPublishedChange={(published) => setEditing({ ...editing, published })}
          onTagsChange={setEditTags}
          onNotesChange={setEditNotes}
          onConventionChange={setEditConvention}
          onPhotographerChange={setEditPhotographer}
          onToggleCosplay={toggleCosplayLink}
          onImageTypeChange={setEditImageType}
          onGallerySectionChange={setEditGallerySection}
          onSetCosplayPhoto={setCosplayPhoto}
          onParseFilename={parseFromFilename}
        />
      )}

      {pendingRemove && (
        <AdminModal
          title="Remove from gallery?"
          onClose={() => !removing && setPendingRemove(null)}
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setPendingRemove(null)} disabled={removing}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={confirmRemove} disabled={removing}>
                {removing ? "Removing…" : "Remove image"}
              </AdminButton>
            </>
          }
        >
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl border border-closet-pink/50 bg-closet-blush/40 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getGalleryAdminImageSrc(pendingRemove.viewUrl, { driveFileId: pendingRemove.driveFileId, width: ADMIN_GALLERY_THUMB_WIDTH })}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <p className="font-semibold text-closet-brown">{pendingRemove.name}</p>
              <p className="text-sm text-closet-brown-light">
                This removes the photo from your gallery only. The file stays on Google Drive. Use{" "}
                <strong>Restore from Drive</strong> to bring it back.
              </p>
            </div>
          </div>
        </AdminModal>
      )}

      {showBulkTag && (
        <AdminModal
          title="Tag as character"
          onClose={() => !bulkTagging && setShowBulkTag(false)}
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setShowBulkTag(false)} disabled={bulkTagging}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={confirmBulkTag}
                disabled={
                  bulkTagging ||
                  (bulkTagCosplayIds.length === 0 &&
                    !bulkTagGallerySection &&
                    !bulkTagConvention.trim() &&
                    !bulkTagPhotographer.trim())
                }
              >
                {bulkTagging
                  ? "Tagging…"
                  : `Tag ${bulkTagAllMatching ? total.toLocaleString() : selectedIds.size} photo${
                      (bulkTagAllMatching ? total : selectedIds.size) === 1 ? "" : "s"
                    }`}
              </AdminButton>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-closet-brown-light">
              {bulkTagAllMatching
                ? `Link all ${total.toLocaleString()} photos matching your current filters to the selected character(s). Existing links are kept.`
                : `Link ${selectedIds.size} selected photo${selectedIds.size === 1 ? "" : "s"} to the chosen character(s). Existing links are kept.`}
            </p>
            <AdminSearch
              value={bulkTagQuery}
              onChange={setBulkTagQuery}
              placeholder="Search characters…"
            />
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-closet-pink/50 bg-closet-blush/20 p-2">
              {bulkTagCosplayOptions.length === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-closet-brown-light">No matches</p>
              ) : (
                bulkTagCosplayOptions.slice(0, 50).map((c) => {
                  const active = bulkTagCosplayIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleBulkTagCosplay(c.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition ${
                        active ? "bg-closet-rose/15 ring-1 ring-closet-rose/40" : "hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                          active ? "border-closet-rose bg-closet-rose text-white" : "border-closet-pink bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-semibold text-closet-brown">
                        {c.character}
                        <span className="font-normal text-closet-brown-light"> · {cosplayPickerSubtitle(c)}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminSelect
                label="Gallery section"
                value={bulkTagGallerySection}
                onChange={(v) => setBulkTagGallerySection(v as "" | GallerySection)}
                options={[
                  { value: "", label: "Gallery (default)" },
                  { value: "build", label: "Build gallery" },
                  { value: "convention", label: "Gallery (force all)" },
                ]}
              />
              <AdminField
                label="Convention (optional)"
                value={bulkTagConvention}
                onChange={setBulkTagConvention}
                placeholder="Katsucon 2017"
                list="bulk-tag-conventions"
              />
              <AdminField
                label="Photographer (optional)"
                value={bulkTagPhotographer}
                onChange={setBulkTagPhotographer}
                placeholder="EBK"
                list="bulk-tag-photographers"
              />
            </div>
            <p className="text-xs text-closet-brown-light">
              Character tags go to the normal Gallery tab by default. Pick Build gallery only for WIP / progress shots.
            </p>
            <datalist id="bulk-tag-conventions">
              {conventionOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <datalist id="bulk-tag-photographers">
              {photographerOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        </AdminModal>
      )}

      {showBulkDelete && (
        <AdminModal
          title="Remove photos from gallery?"
          onClose={() => !bulkDeleting && setShowBulkDelete(false)}
          footer={
            <>
              <AdminButton variant="secondary" onClick={() => setShowBulkDelete(false)} disabled={bulkDeleting}>
                Cancel
              </AdminButton>
              <AdminButton variant="danger" onClick={confirmBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting
                  ? "Removing…"
                  : `Remove ${bulkDeleteAllMatching ? total.toLocaleString() : selectedIds.size} photo${
                      (bulkDeleteAllMatching ? total : selectedIds.size) === 1 ? "" : "s"
                    }`}
              </AdminButton>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm font-semibold text-closet-brown">
              {bulkDeleteAllMatching
                ? `Remove all ${total.toLocaleString()} photos matching your current filters?`
                : `Remove ${selectedIds.size} selected photo${selectedIds.size === 1 ? "" : "s"}?`}
            </p>
            <p className="text-sm text-closet-brown-light">
              This removes them from your gallery only. Files stay on Google Drive. Use{" "}
              <strong>Restore from Drive</strong> to bring them back.
            </p>
          </div>
        </AdminModal>
      )}

      <AdminToast message={message} onDone={() => setMessage("")} />
    </div>
  );
}
