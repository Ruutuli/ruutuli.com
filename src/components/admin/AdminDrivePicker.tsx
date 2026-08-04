"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { browseDriveFolderAction, searchDriveImagesAction } from "@/lib/admin/driveActions";
import { AdminButton, AdminSearch } from "./ui";
import { IconClose } from "./icons";

export interface DriveImageOption {
  id: string;
  name: string;
  viewUrl: string;
  proxyUrl: string;
}

interface DriveFolderOption {
  id: string;
  name: string;
}

interface AdminDrivePickerProps {
  open: boolean;
  onClose: () => void;
  /** Called with image view URLs when mode is single/multiple. */
  onSelect?: (urls: string[]) => void;
  /**
   * single/multiple — pick photos.
   * folder — navigate subfolders and confirm the current folder (e.g. gallery sync).
   */
  mode?: "single" | "multiple" | "folder";
  title?: string;
  /** Called when mode is "folder" and the user confirms the current folder. */
  onSelectFolder?: (folder: { id: string; name: string }) => void;
  folderConfirmLabel?: string;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export default function AdminDrivePicker({
  open,
  onClose,
  onSelect,
  mode = "single",
  title = "Choose from Google Drive",
  onSelectFolder,
  folderConfirmLabel = "Use this folder",
}: AdminDrivePickerProps) {
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [trail, setTrail] = useState<BreadcrumbItem[]>([]);
  const [folders, setFolders] = useState<DriveFolderOption[]>([]);
  const [images, setImages] = useState<DriveImageOption[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<DriveImageOption[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const isFolderMode = mode === "folder";
  const currentFolderId = trail.length ? trail[trail.length - 1]!.id : rootFolderId;
  const currentFolderName = trail.length
    ? trail[trail.length - 1]!.name
    : "[COS]";

  const loadFolder = useCallback((folderId?: string) => {
    startTransition(async () => {
      setError("");
      setSelected(new Set());
      setSearchResults(null);

      const result = await browseDriveFolderAction(folderId);

      if (!result.ok) {
        setError(`${result.error}${result.hint ? ` — ${result.hint}` : ""}`);
        setFolders([]);
        setImages([]);
        return;
      }

      setRootFolderId(result.rootFolderId);
      setFolders(result.folders);
      setImages(result.images);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setTrail([]);
    setSearchResults(null);
    loadFolder();
  }, [open, loadFolder]);

  useEffect(() => {
    if (!open || !currentFolderId) return;
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await searchDriveImagesAction(currentFolderId, query);
        if (!result.ok) {
          setSearchResults([]);
          return;
        }
        setSearchResults(result.images);
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [open, query, currentFolderId]);

  const displayedImages = searchResults ?? images;
  const isSearching = query.trim().length > 0;
  const loading = isPending;

  const filteredFolders = useMemo(() => {
    if (isSearching) return [];
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, query, isSearching]);

  function openFolder(folder: DriveFolderOption) {
    setTrail((prev) => [...prev, folder]);
    loadFolder(folder.id);
  }

  function goToBreadcrumb(index: number) {
    if (index < 0) {
      setTrail([]);
      loadFolder(rootFolderId ?? undefined);
      return;
    }
    const next = trail.slice(0, index + 1);
    setTrail(next);
    loadFolder(next[next.length - 1]!.id);
  }

  function toggleSelect(viewUrl: string) {
    if (isFolderMode || !onSelect) return;

    if (mode === "single") {
      onSelect([viewUrl]);
      onClose();
      return;
    }

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(viewUrl)) next.delete(viewUrl);
      else next.add(viewUrl);
      return next;
    });
  }

  function confirmMultiple() {
    if (!onSelect) return;
    onSelect(Array.from(selected));
    onClose();
  }

  function confirmFolder() {
    if (!currentFolderId || !onSelectFolder) return;
    onSelectFolder({ id: currentFolderId, name: currentFolderName });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="admin-modal-backdrop z-[70]" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-closet-pink/70 bg-white shadow-closet-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-closet-pink/50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-sans text-xl font-bold text-closet-brown">{title}</h2>
            <p className="mt-0.5 text-xs text-closet-brown-light">
              {isFolderMode
                ? "Open a subfolder, then confirm to sync photos from that folder (and its nested folders)."
                : "Open a subfolder (e.g. [PHOTOS] or [Cosplay]) or pick a photo"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="admin-btn-icon" aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-closet-pink/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <nav className="flex min-w-0 flex-wrap items-center gap-1 text-xs font-semibold text-closet-brown-light">
            <button
              type="button"
              onClick={() => goToBreadcrumb(-1)}
              className="truncate rounded px-1.5 py-0.5 hover:bg-closet-blush/60 hover:text-closet-brown"
            >
              [COS]
            </button>
            {trail.map((item, index) => (
              <span key={item.id} className="flex min-w-0 items-center gap-1">
                <span className="text-closet-pink">/</span>
                <button
                  type="button"
                  onClick={() => goToBreadcrumb(index)}
                  className="max-w-[140px] truncate rounded px-1.5 py-0.5 hover:bg-closet-blush/60 hover:text-closet-brown"
                >
                  {item.name}
                </button>
              </span>
            ))}
          </nav>
          {!isFolderMode && (
            <AdminSearch
              value={query}
              onChange={setQuery}
              placeholder="Search this folder & subfolders…"
              className="w-full sm:max-w-xs"
            />
          )}
        </div>

        <div className="min-h-[280px] flex-1 overflow-y-auto p-4 sm:p-5">
          {loading && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-closet-blush/60" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-red-800">{error}</p>
              {error.toLowerCase().includes("unauthorized") && (
                <p className="mt-2 text-xs text-red-700">
                  Try signing out and back in at <a href="/admin/login" className="underline">/admin/login</a>.
                </p>
              )}
            </div>
          )}

          {!loading && !error && filteredFolders.length === 0 && displayedImages.length === 0 && (
            <p className="py-16 text-center text-sm text-closet-brown-light">
              {isSearching ? "No matching images in this folder tree." : "This folder is empty."}
            </p>
          )}

          {!loading && !error && filteredFolders.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-closet-brown-light">
                Subfolders
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {filteredFolders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => openFolder(folder)}
                    className="flex items-center gap-2 rounded-xl border border-closet-pink/50 bg-closet-blush/25 px-3 py-2.5 text-left transition-colors hover:border-closet-rose/50 hover:bg-closet-blush/50"
                  >
                    <span className="text-lg" aria-hidden>
                      📁
                    </span>
                    <span className="truncate text-sm font-semibold text-closet-brown">{folder.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && !error && !isFolderMode && displayedImages.length > 0 && (
            <>
              <p className="mb-3 text-xs font-semibold text-closet-brown-light">
                {isSearching ? "Search results" : "Photos"} · {displayedImages.length} image
                {displayedImages.length === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {displayedImages.map((img) => {
                  const isSelected = selected.has(img.viewUrl);
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => toggleSelect(img.viewUrl)}
                      className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "border-closet-rose ring-2 ring-closet-rose/30"
                          : "border-closet-pink/40 hover:border-closet-rose/50"
                      }`}
                    >
                      <div className="aspect-[3/4] bg-closet-blush/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.proxyUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-closet-brown/80 to-transparent px-2 pb-2 pt-6">
                        <p className="truncate text-[10px] font-semibold text-white">{img.name}</p>
                      </div>
                      {mode === "multiple" && isSelected && (
                        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-closet-rose text-white">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {!loading && !error && isFolderMode && images.length > 0 && (
            <p className="mt-2 text-xs text-closet-brown-light">
              {images.length} photo{images.length === 1 ? "" : "s"} in this folder
              {folders.length > 0 ? ` · ${folders.length} subfolder${folders.length === 1 ? "" : "s"}` : ""}
              {" "}(nested folders are included when you sync)
            </p>
          )}
        </div>

        {mode === "multiple" && (
          <div className="flex items-center justify-between gap-3 border-t border-closet-pink/50 px-5 py-4 sm:px-6">
            <p className="text-sm font-semibold text-closet-brown-light">{selected.size} selected</p>
            <div className="flex gap-2">
              <AdminButton variant="secondary" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={confirmMultiple} disabled={selected.size === 0}>
                Add selected
              </AdminButton>
            </div>
          </div>
        )}

        {isFolderMode && (
          <div className="flex items-center justify-between gap-3 border-t border-closet-pink/50 px-5 py-4 sm:px-6">
            <p className="min-w-0 truncate text-sm font-semibold text-closet-brown-light">
              Sync: <span className="text-closet-brown">{currentFolderName}</span>
            </p>
            <div className="flex shrink-0 gap-2">
              <AdminButton variant="secondary" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton variant="primary" onClick={confirmFolder} disabled={!currentFolderId || loading}>
                {folderConfirmLabel}
              </AdminButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
