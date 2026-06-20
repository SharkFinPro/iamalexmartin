"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { listMediaAssets } from "@/app/admin/contentActions";
import type { MediaAsset } from "@/lib/getAssets";
import MediaUploader from "@/app/admin/media/MediaUploader";
import Modal from "@/components/Modal";
import styles from "./RichTextEditor.module.scss";

type Props = {
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
  /** Dialog heading; defaults to the rich-text "Insert image" context. */
  title?: string;
  /** Which media kind to list/pick. Videos can't be uploaded here (the uploader
   *  only crops images), so the upload control is hidden in video mode. */
  accept?: "image" | "video";
};

/**
 * Inline media picker. Loads assets through the same Media Library data layer
 * (via the `listMediaAssets` action), narrows to the requested kind, and lets the
 * admin search + pick one without leaving the page. Used by the rich-text editor,
 * the project image control, and the block editor's image/video pickers.
 */
export default function AssetPicker({
  onSelect,
  onClose,
  title = "Insert image",
  accept = "image"
}: Props) {
  const [assets, setAssets] = useState<MediaAsset[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const titleId = useId();

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

  const images = useMemo(() => {
    const prefix = accept === "video" ? "video/" : "image/";
    const list = (assets ?? []).filter((a) => (a.mimeType ?? "").startsWith(prefix));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => `${a.title ?? ""} ${a.fileName}`.toLowerCase().includes(q));
  }, [assets, query, accept]);

  return (
    <Modal onClose={onClose} labelledBy={titleId} overlayClassName={styles.pickerOverlay}>
      <div className={styles.pickerModal}>
        <div className={styles.pickerHead}>
          <h2 className={styles.pickerTitle} id={titleId}>{title}</h2>
          <div className={styles.pickerHeadActions}>
            {/* Reuse the Media Library's crop & upload widget — a freshly
                uploaded asset is inserted straight into the editor. Images only;
                videos are picked from existing library assets. */}
            {accept === "image" && <MediaUploader onUploaded={onSelect} />}
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
            placeholder={`Search ${accept === "video" ? "videos" : "images"} by name…`}
            aria-label={`Search ${accept === "video" ? "videos" : "images"} by name`}
            autoFocus
          />
        </div>

        {error ? (
          <p className={styles.pickerState} role="alert">
            {error}
          </p>
        ) : assets === null ? (
          <p className={styles.pickerState} role="status" aria-live="polite">Loading media…</p>
        ) : images.length === 0 ? (
          <p className={styles.pickerState}>
            {query.trim()
              ? `No ${accept === "video" ? "videos" : "images"} match your search.`
              : `No ${accept === "video" ? "videos" : "images"} in the library yet.`}
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
                      {accept === "video" ? (
                        // eslint-disable-next-line jsx-a11y/media-has-caption
                        <video
                          src={asset.url}
                          muted
                          preload="metadata"
                          className={styles.pickerImg}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Image
                          src={asset.url}
                          alt={name}
                          fill
                          sizes="160px"
                          className={styles.pickerImg}
                        />
                      )}
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
    </Modal>
  );
}
