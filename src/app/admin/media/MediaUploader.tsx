"use client";

import { useRef, useState } from "react";
import { Cropper, type CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import type { MediaAsset } from "@/lib/getAssets";
import { uploadAsset } from "../contentActions";
import styles from "./media.module.scss";

// Free-form crop is always available (no aspect ratio); the 2:1 preset matches
// how project images are displayed across the site.
const FREE_RATIO = undefined;
const WIDE_RATIO = 2;

type Preset = "free" | "wide";

/** Pick an output type that preserves transparency for PNGs, else JPEG. */
function outputType(sourceType: string): { mime: string; ext: string } {
  if (sourceType === "image/png") return { mime: "image/png", ext: "png" };
  if (sourceType === "image/webp") return { mime: "image/webp", ext: "webp" };
  return { mime: "image/jpeg", ext: "jpg" };
}

/** Filename without its extension. */
function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export default function MediaUploader({
  onUploaded
}: {
  onUploaded: (asset: MediaAsset) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<CropperRef>(null);

  // The image being cropped: a data URL + the originating file (for name/type).
  // A data URL (not a blob: object URL) is used so it passes the site CSP, whose
  // img-src allows `data:` but not `blob:`.
  const [source, setSource] = useState<{ url: string; file: File } | null>(null);
  const [preset, setPreset] = useState<Preset>("free");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSource(null);
    setPreset("free");
    setTitle("");
    setBusy(false);
    setError(null);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file later.
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    setTitle(baseName(file.name));

    const reader = new FileReader();
    reader.onload = () => setSource({ url: reader.result as string, file });
    reader.onerror = () => setError("Couldn't read the selected file.");
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    const cropper = cropperRef.current;
    if (!cropper || !source) return;

    const canvas = cropper.getCanvas();
    if (!canvas) {
      setError("Couldn't read the crop. Try again.");
      return;
    }

    const { mime, ext } = outputType(source.file.type);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, mime, 0.92)
    );
    if (!blob) {
      setError("Couldn't export the cropped image.");
      return;
    }

    const cropped = new File([blob], `${baseName(source.file.name)}.${ext}`, { type: mime });

    const formData = new FormData();
    formData.append("file", cropped);
    if (title.trim()) formData.append("title", title.trim());

    setBusy(true);
    setError(null);
    const result = await uploadAsset(formData);
    if ("error" in result) {
      setBusy(false);
      setError(result.error);
      return;
    }
    onUploaded(result.asset);
    reset();
  }

  return (
    <>
      <button
        type="button"
        className={styles.uploadBtn}
        onClick={() => fileInputRef.current?.click()}
      >
        <FontAwesomeIcon icon={faUpload} />
        Upload media
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
      />
      {!source && error && <p className={styles.actionError}>{error}</p>}

      {source && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Crop and upload image"
        >
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <h2 className={styles.modalTitle}>Crop &amp; upload</h2>
              <div className={styles.ratioGroup} role="group" aria-label="Crop aspect ratio">
                <button
                  type="button"
                  className={`${styles.ratioBtn} ${preset === "wide" ? styles.ratioActive : ""}`}
                  aria-pressed={preset === "wide"}
                  onClick={() => setPreset("wide")}
                >
                  2:1
                </button>
                <button
                  type="button"
                  className={`${styles.ratioBtn} ${preset === "free" ? styles.ratioActive : ""}`}
                  aria-pressed={preset === "free"}
                  onClick={() => setPreset("free")}
                >
                  Free-form
                </button>
              </div>
            </div>

            <div className={styles.cropArea}>
              <Cropper
                ref={cropperRef}
                src={source.url}
                className={styles.cropper}
                // Source is a local object URL: skip the cross-origin handling
                // and the EXIF-orientation fetch the cropper does by default —
                // either can reject and leave the canvas blank/unreadable.
                crossOrigin={false}
                checkOrientation={false}
                // `key` forces the stencil to re-init when the preset changes so
                // a switch to/from a fixed ratio reshapes the selection cleanly.
                key={preset}
                // Free-form starts covering the whole image; the 2:1 preset
                // starts as the largest centered 2:1 box that fits the image.
                defaultSize={({ imageSize }: { imageSize: { width: number; height: number } }) =>
                  preset === "wide"
                    ? (() => {
                        const width = Math.min(imageSize.width, imageSize.height * WIDE_RATIO);
                        return { width, height: width / WIDE_RATIO };
                      })()
                    : { width: imageSize.width, height: imageSize.height }
                }
                stencilProps={{
                  aspectRatio: preset === "wide" ? WIDE_RATIO : FREE_RATIO
                }}
              />
            </div>

            <label className={styles.titleField}>
              <span>Display name</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Optional"
              />
            </label>

            {error && <p className={styles.actionError}>{error}</p>}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.unpublishBtn}
                onClick={reset}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.publishBtn}
                onClick={handleSave}
                disabled={busy}
              >
                {busy ? "Uploading…" : "Crop & upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
