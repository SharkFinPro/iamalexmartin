"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFileVideo,
  faFileAudio,
  faFilePdf,
  faFileLines,
  faTrash
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
  onToggleSelect,
  onLongPress,
  onStatusChange,
  onRequestDelete
}: {
  asset: MediaAsset;
  selected: boolean;
  selectionMode: boolean;
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
      className={`${styles.card} ${isDraft ? styles.cardDraft : ""} ${
        selected ? styles.cardSelected : ""
      } ${selectionMode ? styles.cardSelectable : ""}`}
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
      </div>
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

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          {items.length} {items.length === 1 ? "asset" : "assets"}
          {draftCount > 0 && ` · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}
        </p>
        <MediaUploader onUploaded={addAsset} />
      </div>

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
            Upload an image above, or add assets directly in the CMS.
          </p>
        </div>
      ) : (
        <ul className={styles.grid}>
          {items.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              selected={selected.has(asset.id)}
              selectionMode={selectionMode}
              onToggleSelect={toggleSelect}
              onLongPress={startSelection}
              onStatusChange={setStatus}
              onRequestDelete={setPendingDelete}
            />
          ))}
        </ul>
      )}

      {pendingDelete && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm delete"
        >
          <div className={`${styles.modal} ${styles.confirmModal}`}>
            <h2 className={styles.modalTitle}>
              Delete {deleteCount} {deleteCount === 1 ? "image" : "images"}?
            </h2>
            <p className={styles.stateBody}>
              This permanently removes {deleteCount === 1 ? "the image" : "these images"} from
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
        </div>
      )}
    </>
  );
}
