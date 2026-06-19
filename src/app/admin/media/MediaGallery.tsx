"use client";

import { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faFileVideo,
  faFileAudio,
  faFilePdf,
  faFileLines
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { MediaAsset } from "@/lib/getAssets";
import EditableText from "@/components/EditableText";
import { publishAsset, unpublishAsset, renameAsset } from "../contentActions";
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

function MediaCard({
  asset,
  onStatusChange
}: {
  asset: MediaAsset;
  onStatusChange: (id: string, status: MediaAsset["status"]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <li className={`${styles.card} ${isDraft ? styles.cardDraft : ""}`}>
      <div className={styles.thumb}>
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
        </div>
        {error && <span className={styles.actionError}>{error}</span>}
      </div>
    </li>
  );
}

// Presentational client island. Holds optimistic publish state; future media
// management (select, edit metadata, delete) can hang off this grid.
export default function MediaGallery({ assets }: { assets: MediaAsset[] }) {
  const [items, setItems] = useState(assets);

  function setStatus(id: string, status: MediaAsset["status"]) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  // Newly uploaded assets are prepended (Hygraph orders the library newest-first).
  function addAsset(asset: MediaAsset) {
    setItems((prev) => [asset, ...prev.filter((a) => a.id !== asset.id)]);
  }

  const draftCount = items.filter((a) => a.status === "draft").length;

  return (
    <>
      <div className={styles.toolbar}>
        <p className={styles.count}>
          {items.length} {items.length === 1 ? "asset" : "assets"}
          {draftCount > 0 && ` · ${draftCount} draft${draftCount === 1 ? "" : "s"}`}
        </p>
        <MediaUploader onUploaded={addAsset} />
      </div>

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
            <MediaCard key={asset.id} asset={asset} onStatusChange={setStatus} />
          ))}
        </ul>
      )}
    </>
  );
}
