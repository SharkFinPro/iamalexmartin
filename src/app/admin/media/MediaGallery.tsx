"use client";

import { useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFileVideo,
  faFileAudio,
  faFilePdf,
  faFileLines,
  faFileImage,
  faTrash,
  faMagnifyingGlass,
  faArrowUpWideShort,
  faArrowDownWideShort
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { MediaAsset } from "@/lib/getAssets";
import EditableText from "@/components/EditableText";
import {
  publishAsset,
  unpublishAsset,
  renameAsset,
  deleteAsset
} from "../contentActions";
import MediaUploader from "./MediaUploader";
import Modal from "@/components/Modal";
import styles from "./media.module.scss";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > -1 ? fileName.slice(dot + 1).toUpperCase() : "FILE";
}

/** Filename without its extension — the default display name when untitled. */
function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

// Broad media categories used by the type filter. Derived from the MIME type so
// the same buckets drive both filtering and the filter dropdown labels.
type FileKind = "image" | "video" | "audio" | "pdf" | "document" | "other";

function fileKind(mime: string | null): FileKind {
  const m = mime ?? "";
  if (m.startsWith("image/")) return "image";
  if (m.startsWith("video/")) return "video";
  if (m.startsWith("audio/")) return "audio";
  if (m === "application/pdf") return "pdf";
  if (m.startsWith("text/") || m.includes("word") || m.includes("document")) {
    return "document";
  }
  return "other";
}

const KIND_LABELS: Record<FileKind, string> = {
  image: "Images",
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  document: "Documents",
  other: "Other"
};

function placeholderIcon(mime: string): IconDefinition {
  if (mime.startsWith("video/")) return faFileVideo;
  if (mime.startsWith("audio/")) return faFileAudio;
  if (mime === "application/pdf") return faFilePdf;
  if (mime.startsWith("text/")) return faFileLines;
  return faFile;
}

/** Renders the right preview for an asset based on its MIME type. */
function Preview({ asset }: { asset: MediaAsset }) {
  const mime = asset.mimeType ?? "";

  if (mime.startsWith("image/")) {
    return (
      <Image
        src={asset.url}
        alt={asset.fileName}
        fill
        sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 240px"
        className={styles.img}
      />
    );
  }

  if (mime.startsWith("video/")) {
    return (
      <video
        className={styles.video}
        src={asset.url}
        controls
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  // No visual thumbnail available — show a file-type placeholder.
  return (
    <div className={styles.placeholder}>
      <FontAwesomeIcon icon={placeholderIcon(mime)} className={styles.placeholderIcon} />
      <span className={styles.placeholderExt}>{fileExtension(asset.fileName)}</span>
    </div>
  );
}

// How long (ms) the pointer must rest on a card before selection mode engages.
const LONG_PRESS_MS = 450;

function MediaCard({
  asset,
  selected,
  selectionMode,
  compact,
  onToggleSelect,
  onLongPress,
  onStatusChange,
  onRequestDelete
}: {
  asset: MediaAsset;
  selected: boolean;
  selectionMode: boolean;
  compact: boolean;
  onToggleSelect: (id: string) => void;
  onLongPress: (id: string) => void;
  onStatusChange: (id: string, status: MediaAsset["status"]) => void;
  onRequestDelete: (ids: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A long-press engages selection on pointer-down; swallow the click that
  // fires on the following pointer-up so it doesn't immediately toggle back off.
  const suppressClick = useRef(false);

  function startLongPress() {
    cancelLongPress();
    longPressTimer.current = setTimeout(() => {
      suppressClick.current = true;
      onLongPress(asset.id);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  // In selection mode, a click anywhere on the card toggles it — except on the
  // interactive controls (buttons, the rename field, the checkbox itself).
  function handleCardClick(e: React.MouseEvent) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!selectionMode) return;
    if (
      (e.target as HTMLElement).closest(
        "button, input, label, a, textarea, [contenteditable='true']"
      )
    ) {
      return;
    }
    onToggleSelect(asset.id);
  }

  const isDraft = asset.status === "draft";
  // Fall back to the filename (minus extension) when the asset has no title.
  const displayName = asset.title?.trim() || baseName(asset.fileName);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    const result = isDraft
      ? await publishAsset(asset.id)
      : await unpublishAsset(asset.id);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      onStatusChange(asset.id, isDraft ? "published" : "draft");
    }
  }

  return (
    <li
      className={`${styles.card} ${compact ? styles.cardCompact : ""} ${
        isDraft ? styles.cardDraft : ""
      } ${selected ? styles.cardSelected : ""} ${
        selectionMode ? styles.cardSelectable : ""
      }`}
      onClick={handleCardClick}
    >
      <div
        className={styles.thumb}
        onPointerDown={selectionMode ? undefined : startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onPointerCancel={cancelLongPress}
        // Long-press to enter selection mode without a visible control; once in
        // selection mode the checkbox below takes over.
        onContextMenu={selectionMode ? undefined : (e) => e.preventDefault()}
      >
        {selectionMode && (
          <label className={styles.selectCheckbox}>
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(asset.id)}
              aria-label={`Select ${displayName}`}
            />
          </label>
        )}
        <Preview asset={asset} />
        {compact && isDraft && (
          <span className={styles.compactBadge} title="Draft (unpublished)">
            Draft
          </span>
        )}
      </div>
      {compact ? (
        <div className={styles.compactName} title={`${displayName} · ${asset.fileName}`}>
          {displayName}
        </div>
      ) : (
      <div className={styles.meta}>
        <p className={styles.fileName} title={displayName}>
          <EditableText
            model="Asset"
            id={asset.id}
            field="title"
            value={displayName}
            editable
            action={(next) =>
              renameAsset(
                asset.id,
                Array.isArray(next) ? next.join("") : next,
                !isDraft
              )
            }
          >
            {displayName}
          </EditableText>
        </p>
        <p className={styles.subName} title={asset.fileName}>
          {asset.fileName}
        </p>
        <dl className={styles.specs}>
          <div>
            <dt>Dimensions</dt>
            <dd>
              {asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—"}
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatBytes(asset.size)}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd title={asset.mimeType ?? undefined}>{asset.mimeType ?? "—"}</dd>
          </div>
          <div>
            <dt>Uploaded</dt>
            <dd>{formatDate(asset.createdAt)}</dd>
          </div>
        </dl>
        <div className={styles.statusRow}>
          <span
            className={`${styles.badge} ${isDraft ? styles.badgeDraft : styles.badgePublished}`}
          >
            {isDraft ? "Draft" : "Published"}
          </span>
          <div className={styles.cardActions}>
            <button
              type="button"
              className={isDraft ? styles.publishBtn : styles.unpublishBtn}
              onClick={handleToggle}
              disabled={busy}
            >
              {busy
                ? isDraft
                  ? "Publishing…"
                  : "Unpublishing…"
                : isDraft
                ? "Publish"
                : "Unpublish"}
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => onRequestDelete([asset.id])}
              disabled={busy}
              aria-label={`Delete ${displayName}`}
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
        {error && <span className={styles.actionError}>{error}</span>}
      </div>
      )}
    </li>
  );
}

// Presentational client island. Holds optimistic publish/selection state and
// drives single + bulk publish/unpublish/delete over the Server-Action boundary.
export default function MediaGallery({ assets }: { assets: MediaAsset[] }) {
  const [items, setItems] = useState(assets);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Selection UI (checkboxes + bulk bar) is hidden until a card is long-pressed.
  const [selectionMode, setSelectionMode] = useState(false);
  // Pending deletion awaiting confirmation; null when no dialog is open.
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // --- Browsing controls -------------------------------------------------
  // Search, filters and sort are kept here so toggling the metadata view never
  // resets them; the view toggle only changes how the same result set renders.
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MediaAsset["status"]>("all");
  const [kindFilter, setKindFilter] = useState<"all" | FileKind>("all");
  const [sortKey, setSortKey] = useState<"date" | "name" | "size" | "type" | "status">(
    "date"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [hideMetadata, setHideMetadata] = useState(false);

  // File kinds actually present in the library, so the type filter only offers
  // categories that exist.
  const availableKinds = useMemo(() => {
    const kinds = new Set<FileKind>();
    items.forEach((a) => kinds.add(fileKind(a.mimeType)));
    return Array.from(kinds);
  }, [items]);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (kindFilter !== "all" && fileKind(a.mimeType) !== kindFilter) return false;
      if (q) {
        const name = `${a.title ?? ""} ${a.fileName}`.toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const name = (a: MediaAsset) => (a.title?.trim() || a.fileName).toLowerCase();

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return name(a).localeCompare(name(b)) * dir;
        case "size":
          return ((a.size ?? 0) - (b.size ?? 0)) * dir;
        case "type":
          return (a.mimeType ?? "").localeCompare(b.mimeType ?? "") * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        case "date":
        default:
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
          );
      }
    });
  }, [items, query, statusFilter, kindFilter, sortKey, sortDir]);

  const hasActiveFilters =
    query.trim() !== "" || statusFilter !== "all" || kindFilter !== "all";

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
    setKindFilter("all");
  }

  function setStatus(id: string, status: MediaAsset["status"]) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  // Newly uploaded assets are prepended (Hygraph orders the library newest-first).
  function addAsset(asset: MediaAsset) {
    setItems((prev) => [asset, ...prev.filter((a) => a.id !== asset.id)]);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Leaving selection mode once nothing is selected keeps the grid clean.
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  }

  // A long-press on any card turns on selection mode and selects that card.
  function startSelection(id: string) {
    setSelectionMode(true);
    setSelected((prev) => new Set(prev).add(id));
  }

  function clearSelection() {
    setSelected(new Set());
    setSelectionMode(false);
  }

  const selectedIds = items.filter((a) => selected.has(a.id)).map((a) => a.id);

  // Apply publish/unpublish to every selected asset, optimistically updating
  // each on success. Collects the first failure to surface to the user.
  async function bulkSetPublished(publish: boolean) {
    setBulkBusy(true);
    setBulkError(null);
    let firstError: string | null = null;

    for (const id of selectedIds) {
      const result = publish ? await publishAsset(id) : await unpublishAsset(id);
      if ("error" in result) {
        firstError ??= result.error;
      } else {
        setStatus(id, publish ? "published" : "draft");
      }
    }

    setBulkBusy(false);
    if (firstError) setBulkError(firstError);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBulkBusy(true);
    setBulkError(null);
    let firstError: string | null = null;
    const deleted: string[] = [];

    for (const id of pendingDelete) {
      const result = await deleteAsset(id);
      if ("error" in result) {
        firstError ??= result.error;
      } else {
        deleted.push(id);
      }
    }

    if (deleted.length) {
      const gone = new Set(deleted);
      setItems((prev) => prev.filter((a) => !gone.has(a.id)));
      setSelected((prev) => {
        const next = new Set(prev);
        deleted.forEach((id) => next.delete(id));
        return next;
      });
    }

    setBulkBusy(false);
    setPendingDelete(null);
    if (firstError) setBulkError(firstError);
  }

  const draftCount = items.filter((a) => a.status === "draft").length;
  const selectedCount = selectedIds.length;
  const deleteCount = pendingDelete?.length ?? 0;
  const deleteTitleId = useId();

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          {hasActiveFilters
            ? `${visibleItems.length} of ${items.length} ${
                items.length === 1 ? "asset" : "assets"
              }`
            : `${items.length} ${items.length === 1 ? "asset" : "assets"}`}
          {draftCount > 0 && ` · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}
        </p>
        <MediaUploader onUploaded={addAsset} />
      </div>

      {items.length > 0 && (
        <div className={styles.controls} role="region" aria-label="Sort and filter">
          <div className={styles.search}>
            <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.searchIcon} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name…"
              aria-label="Search media by name"
            />
          </div>

          <label className={styles.control}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Unpublished</option>
            </select>
          </label>

          <label className={styles.control}>
            <span>Type</span>
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}
            >
              <option value="all">All</option>
              {availableKinds.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.control}>
            <span>Sort by</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            >
              <option value="date">Upload date</option>
              <option value="name">Name</option>
              <option value="size">File size</option>
              <option value="type">File type</option>
              <option value="status">Status</option>
            </select>
          </label>

          <button
            type="button"
            className={styles.iconToggle}
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            aria-label={`Sort ${sortDir === "asc" ? "ascending" : "descending"}`}
            title={sortDir === "asc" ? "Ascending" : "Descending"}
          >
            <FontAwesomeIcon
              icon={sortDir === "asc" ? faArrowUpWideShort : faArrowDownWideShort}
            />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={resetFilters}
            >
              Clear filters
            </button>
          )}

          <button
            type="button"
            className={`${styles.viewToggle} ${
              hideMetadata ? styles.viewToggleActive : ""
            }`}
            onClick={() => setHideMetadata((v) => !v)}
            aria-pressed={hideMetadata}
            title={
              hideMetadata
                ? "Show full details for managing media"
                : "Hide details for a clean browsing gallery"
            }
          >
            <FontAwesomeIcon icon={faFileImage} />
            {hideMetadata ? "Show metadata" : "Hide metadata"}
          </button>
        </div>
      )}

      {selectedCount > 0 && (
        <div className={styles.bulkBar} role="region" aria-label="Bulk actions">
          <span className={styles.bulkCount}>{selectedCount} selected</span>
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.publishBtn}
              onClick={() => bulkSetPublished(true)}
              disabled={bulkBusy}
            >
              Publish
            </button>
            <button
              type="button"
              className={styles.unpublishBtn}
              onClick={() => bulkSetPublished(false)}
              disabled={bulkBusy}
            >
              Unpublish
            </button>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => setPendingDelete(selectedIds)}
              disabled={bulkBusy}
            >
              Delete
            </button>
            <button
              type="button"
              className={styles.unpublishBtn}
              onClick={clearSelection}
              disabled={bulkBusy}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {bulkError && (
        <p className={`${styles.actionError} ${styles.bulkErrorText}`}>{bulkError}</p>
      )}

      {items.length === 0 ? (
        <div className={styles.state}>
          <p className={styles.stateTitle}>No media yet</p>
          <p className={styles.stateBody}>
            Upload an asset above, or add assets directly in the CMS.
          </p>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className={styles.state}>
          <p className={styles.stateTitle}>No matching media</p>
          <p className={styles.stateBody}>
            No assets match the current filters.{" "}
            <button type="button" className={styles.linkBtn} onClick={resetFilters}>
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <ul className={`${styles.grid} ${hideMetadata ? styles.gridCompact : ""}`}>
          {visibleItems.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              selected={selected.has(asset.id)}
              selectionMode={selectionMode}
              compact={hideMetadata}
              onToggleSelect={toggleSelect}
              onLongPress={startSelection}
              onStatusChange={setStatus}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </ul>
      )}

      {pendingDelete && (
        <Modal
          onClose={() => { if (!bulkBusy) setPendingDelete(null); }}
          labelledBy={deleteTitleId}
          overlayClassName={styles.modalOverlay}
          closeOnOverlayClick={!bulkBusy}
        >
          <div className={`${styles.modal} ${styles.confirmModal}`}>
            <h2 className={styles.modalTitle} id={deleteTitleId}>
              Delete {deleteCount} {deleteCount === 1 ? "asset" : "assets"}?
            </h2>
            <p className={styles.stateBody}>
              This permanently removes {deleteCount === 1 ? "the asset" : "these assets"} from
              the CMS. This can&apos;t be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.unpublishBtn}
                onClick={() => setPendingDelete(null)}
                disabled={bulkBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={confirmDelete}
                disabled={bulkBusy}
              >
                {bulkBusy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
