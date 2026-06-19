"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { listMediaAssets } from "@/app/admin/contentActions";
import type { MediaAsset } from "@/lib/getAssets";
import MediaUploader from "@/app/admin/media/MediaUploader";
import styles from "./RichTextEditor.module.scss";

type Props = {
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
  /** Dialog heading; defaults to the rich-text "Insert image" context. */
  title?: string;
};

/**
 * Inline image picker. Loads assets through the same Media Library data layer
 * (via the `listMediaAssets` action), narrows to images, and lets the admin
 * search + pick one without leaving the page. Used by the rich-text editor and
 * the project image control.
 */
export default function AssetPicker({ onSelect, onClose, title = "Insert image" }: Props) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    listMediaAssets()
      .then((result) => {
        if (!active) return;
        if ("error" in result) setError(result.error);
        else setAssets(result.assets);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message || "Failed to load media.");
      });
    return () => {
      active = false;
    };
  }, []);

  // Close on Escape, matching the other admin dialogs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const images = useMemo(() => {
    const list = (assets ?? []).filter((a) => (a.mimeType ?? "").startsWith("image/"));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => `${a.title ?? ""} ${a.fileName}`.toLowerCase().includes(q));
  }, [assets, query]);

  return (
    <div
      className={styles.pickerOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.pickerModal}>
        <div className={styles.pickerHead}>
          <h2 className={styles.pickerTitle}>{title}</h2>
          <div className={styles.pickerHeadActions}>
            {/* Reuse the Media Library's crop & upload widget — a freshly
                uploaded asset is inserted straight into the editor. */}
            <MediaUploader onUploaded={onSelect} />
            <button
              type="button"
              className={styles.pickerClose}
              onClick={onClose}
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        <div className={styles.pickerSearch}>
          <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.pickerSearchIcon} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search images by name…"
            aria-label="Search images by name"
            autoFocus
          />
        </div>

        {error ? (
          <p className={styles.pickerState} role="alert">
            {error}
          </p>
        ) : assets === null ? (
          <p className={styles.pickerState}>Loading media…</p>
        ) : images.length === 0 ? (
          <p className={styles.pickerState}>
            {query.trim() ? "No images match your search." : "No images in the library yet."}
          </p>
        ) : (
          <ul className={styles.pickerGrid}>
            {images.map((asset) => {
              const name = asset.title?.trim() || asset.fileName;
              return (
                <li key={asset.id}>
                  <button
                    type="button"
                    className={styles.pickerItem}
                    onClick={() => onSelect(asset)}
                    title={name}
                  >
                    <span className={styles.pickerThumb}>
                      <Image
                        src={asset.url}
                        alt={name}
                        fill
                        sizes="160px"
                        className={styles.pickerImg}
                      />
                      {asset.status === "draft" && (
                        <span className={styles.pickerBadge}>Draft</span>
                      )}
                    </span>
                    <span className={styles.pickerName}>{name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
