"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faImage, faVideo, faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import AssetPicker from "@/components/RichTextEditor/AssetPicker";
import { isSafeUrl } from "@/components/RichTextEditor/richTextAst";
import type { MediaAsset } from "@/lib/getAssets";
import {
  assetToImageRef,
  assetToVideoRef,
  CALLOUT_VARIANTS,
  STATS_MAX,
  STATS_MIN,
  HERO_MAX_ACTIONS,
  type HeroBlock,
  type FeatureGridBlock,
  type StatsBlock,
  type TechStackBlock,
  type GalleryBlock,
  type VideoBlock,
  type CalloutBlock,
  type CtaBlock,
  type GalleryImage
} from "../blocks";
import styles from "./ProjectPageEditor.module.scss";

// Each form is controlled: it receives the draft block and emits the next draft
// on every change. The orchestrator owns Save/Cancel and persistence; these
// components only collect input and surface inline guardrails. The matching
// `isBlockComplete` check (below) mirrors the server's sanitize rules so a block
// can't be saved into a state that would be silently dropped.

// ---------------------------------------------------------------------------
// Completeness (client guardrail mirroring sanitizeProjectPage)
// ---------------------------------------------------------------------------

export function isBlockComplete(block: any): boolean {
  switch (block?.type) {
    case "hero":
      return !!String(block.headline ?? "").trim();
    case "richText":
      return Array.isArray(block.content?.children);
    case "featureGrid":
      return (
        Array.isArray(block.items) &&
        block.items.some((i: any) => String(i?.title ?? "").trim())
      );
    case "stats":
      return (
        Array.isArray(block.items) &&
        block.items.filter((i: any) => String(i?.value ?? "").trim() && String(i?.label ?? "").trim())
          .length >= STATS_MIN
      );
    case "techStack":
      return (
        Array.isArray(block.groups) &&
        block.groups.some(
          (g: any) => String(g?.label ?? "").trim() && Array.isArray(g?.items) && g.items.length > 0
        )
      );
    case "gallery":
      return Array.isArray(block.images) && block.images.some((i: any) => String(i?.src ?? "").trim());
    case "video":
      return !!String(block.src ?? "").trim();
    case "callout":
      return !!String(block.text ?? "").trim();
    case "cta":
      return !!String(block.label ?? "").trim() && !!String(block.href ?? "").trim();
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Small shared field helpers
// ---------------------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function MediaPickerButton({
  onPick,
  label,
  accept = "image",
  icon = faImage
}: {
  onPick: (a: MediaAsset) => void;
  label: string;
  accept?: "image" | "video";
  icon?: typeof faImage;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={styles.secondaryBtn} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={icon} /> {label}
      </button>
      {open && (
        <AssetPicker
          title={label}
          accept={accept}
          onSelect={(asset) => {
            onPick(asset);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export function HeroForm({
  block,
  onChange
}: {
  block: HeroBlock;
  onChange: (b: HeroBlock) => void;
}) {
  const roleItems = block.roleItems ?? [];
  const actions = block.actions ?? [];

  return (
    <div className={styles.form}>
      <Field label="Eyebrow (optional)">
        <input
          type="text"
          value={block.eyebrow ?? ""}
          placeholder="e.g. Web Application"
          onChange={(e) => onChange({ ...block, eyebrow: e.target.value })}
        />
      </Field>

      <Field label="Headline (required)">
        <input
          type="text"
          value={block.headline}
          onChange={(e) => onChange({ ...block, headline: e.target.value })}
        />
      </Field>

      <Field label="Summary (optional)">
        <textarea
          rows={3}
          value={block.summary ?? ""}
          onChange={(e) => onChange({ ...block, summary: e.target.value })}
        />
      </Field>

      <fieldset className={styles.subgroup}>
        <legend>Key facts</legend>
        {roleItems.map((item, i) => (
          <div key={i} className={styles.row}>
            <input
              type="text"
              value={item}
              placeholder="e.g. Role: Lead Engineer"
              onChange={(e) => {
                const next = [...roleItems];
                next[i] = e.target.value;
                onChange({ ...block, roleItems: next });
              }}
            />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={`Remove fact ${i + 1}`}
              onClick={() => onChange({ ...block, roleItems: roleItems.filter((_, j) => j !== i) })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addRowBtn}
          onClick={() => onChange({ ...block, roleItems: [...roleItems, ""] })}
        >
          <FontAwesomeIcon icon={faPlus} /> Add fact
        </button>
      </fieldset>

      <fieldset className={styles.subgroup}>
        <legend>Lead image</legend>
        {block.image?.src && (
          <div className={styles.imagePreviewRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.image.src} alt="" className={styles.imagePreview} />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Remove image"
              onClick={() => onChange({ ...block, image: undefined })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
        <MediaPickerButton
          label={block.image ? "Replace image" : "Add image"}
          onPick={(asset) => onChange({ ...block, image: assetToImageRef(asset) })}
        />
        {block.image?.src && (
          <Field label="Image alt text (describe the image; leave blank if decorative)">
            <input
              type="text"
              value={block.image.alt ?? ""}
              onChange={(e) =>
                onChange({ ...block, image: { ...block.image!, alt: e.target.value } })
              }
            />
          </Field>
        )}
      </fieldset>

      <fieldset className={styles.subgroup}>
        <legend>Buttons (up to {HERO_MAX_ACTIONS})</legend>
        {actions.map((action, i) => {
          const invalid = action.href.trim() !== "" && !isSafeUrl(action.href);
          return (
            <div key={i} className={styles.actionRow}>
              <input
                type="text"
                value={action.label}
                placeholder="Button label"
                onChange={(e) => {
                  const next = [...actions];
                  next[i] = { ...next[i], label: e.target.value };
                  onChange({ ...block, actions: next });
                }}
              />
              <input
                type="text"
                value={action.href}
                placeholder="https://… or /path"
                aria-invalid={invalid}
                onChange={(e) => {
                  const next = [...actions];
                  next[i] = { ...next[i], href: e.target.value };
                  onChange({ ...block, actions: next });
                }}
              />
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={`Remove button ${i + 1}`}
                onClick={() => onChange({ ...block, actions: actions.filter((_, j) => j !== i) })}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          );
        })}
        {actions.length < HERO_MAX_ACTIONS && (
          <button
            type="button"
            className={styles.addRowBtn}
            onClick={() => onChange({ ...block, actions: [...actions, { label: "", href: "" }] })}
          >
            <FontAwesomeIcon icon={faPlus} /> Add button
          </button>
        )}
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function StatsForm({
  block,
  onChange
}: {
  block: StatsBlock;
  onChange: (b: StatsBlock) => void;
}) {
  const items = block.items ?? [];
  return (
    <div className={styles.form}>
      <Field label="Heading (optional)">
        <input
          type="text"
          value={block.heading ?? ""}
          placeholder="e.g. Results"
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </Field>

      <fieldset className={styles.subgroup}>
        <legend>
          Metrics ({STATS_MIN}–{STATS_MAX})
        </legend>
        {items.map((item, i) => (
          <div key={i} className={styles.statRow}>
            <input
              type="text"
              value={item.value}
              placeholder="Value (e.g. 40%)"
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], value: e.target.value };
                onChange({ ...block, items: next });
              }}
            />
            <input
              type="text"
              value={item.label}
              placeholder="Label (e.g. faster builds)"
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], label: e.target.value };
                onChange({ ...block, items: next });
              }}
            />
            <input
              type="text"
              value={item.caption ?? ""}
              placeholder="Caption (optional)"
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], caption: e.target.value };
                onChange({ ...block, items: next });
              }}
            />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={`Remove metric ${i + 1}`}
              disabled={items.length <= STATS_MIN}
              onClick={() => onChange({ ...block, items: items.filter((_, j) => j !== i) })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
        {items.length < STATS_MAX && (
          <button
            type="button"
            className={styles.addRowBtn}
            onClick={() => onChange({ ...block, items: [...items, { value: "", label: "" }] })}
          >
            <FontAwesomeIcon icon={faPlus} /> Add metric
          </button>
        )}
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tech stack
// ---------------------------------------------------------------------------

export function TechStackForm({
  block,
  onChange
}: {
  block: TechStackBlock;
  onChange: (b: TechStackBlock) => void;
}) {
  const groups = block.groups ?? [];
  const [chipDrafts, setChipDrafts] = useState<Record<number, string>>({});

  function commitChip(groupIndex: number) {
    const raw = (chipDrafts[groupIndex] ?? "").trim();
    if (!raw) return;
    // Allow comma-separated entry: "React, TypeScript".
    const additions = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const next = groups.map((g, i) =>
      i === groupIndex ? { ...g, items: [...g.items, ...additions] } : g
    );
    onChange({ ...block, groups: next });
    setChipDrafts((d) => ({ ...d, [groupIndex]: "" }));
  }

  return (
    <div className={styles.form}>
      <Field label="Heading (optional)">
        <input
          type="text"
          value={block.heading ?? ""}
          placeholder="e.g. Built with"
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </Field>

      {groups.map((group, gi) => (
        <fieldset key={gi} className={styles.subgroup}>
          <legend>Group {gi + 1}</legend>
          <div className={styles.row}>
            <input
              type="text"
              value={group.label}
              placeholder="Group label (e.g. Frontend)"
              onChange={(e) => {
                const next = [...groups];
                next[gi] = { ...next[gi], label: e.target.value };
                onChange({ ...block, groups: next });
              }}
            />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={`Remove group ${gi + 1}`}
              onClick={() => onChange({ ...block, groups: groups.filter((_, j) => j !== gi) })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>

          {group.items.length > 0 && (
            <ul className={styles.chipList}>
              {group.items.map((item, ii) => (
                <li key={ii} className={styles.editChip}>
                  {item}
                  <button
                    type="button"
                    aria-label={`Remove ${item}`}
                    onClick={() => {
                      const next = [...groups];
                      next[gi] = { ...next[gi], items: next[gi].items.filter((_, j) => j !== ii) };
                      onChange({ ...block, groups: next });
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.row}>
            <input
              type="text"
              value={chipDrafts[gi] ?? ""}
              placeholder="Add technology, press Enter"
              onChange={(e) => setChipDrafts((d) => ({ ...d, [gi]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  commitChip(gi);
                }
              }}
            />
            <button type="button" className={styles.secondaryBtn} onClick={() => commitChip(gi)}>
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>
        </fieldset>
      ))}

      <button
        type="button"
        className={styles.addRowBtn}
        onClick={() => onChange({ ...block, groups: [...groups, { label: "", items: [] }] })}
      >
        <FontAwesomeIcon icon={faPlus} /> Add group
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

export function GalleryForm({
  block,
  onChange
}: {
  block: GalleryBlock;
  onChange: (b: GalleryBlock) => void;
}) {
  const images = block.images ?? [];

  function update(i: number, patch: Partial<GalleryImage>) {
    const next = [...images];
    next[i] = { ...next[i], ...patch };
    onChange({ ...block, images: next });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange({ ...block, images: next });
  }

  return (
    <div className={styles.form}>
      <Field label="Heading (optional)">
        <input
          type="text"
          value={block.heading ?? ""}
          placeholder="e.g. Screenshots"
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </Field>

      <Field label="Size">
        <select
          value={block.layout ?? "auto"}
          onChange={(e) => onChange({ ...block, layout: e.target.value === "wide" ? "wide" : "auto" })}
        >
          <option value="auto">Standard grid</option>
          <option value="wide">Larger tiles</option>
        </select>
      </Field>

      <fieldset className={styles.subgroup}>
        <legend>Images</legend>
        {images.map((img, i) => (
          <div key={i} className={styles.galleryEditRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt="" className={styles.imagePreview} />
            <div className={styles.galleryEditFields}>
              <input
                type="text"
                value={img.alt ?? ""}
                placeholder="Alt text (leave blank if decorative)"
                onChange={(e) => update(i, { alt: e.target.value })}
              />
              <input
                type="text"
                value={img.caption ?? ""}
                placeholder="Caption (optional)"
                onChange={(e) => update(i, { caption: e.target.value })}
              />
            </div>
            <div className={styles.galleryEditActions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={`Move image ${i + 1} up`}
                disabled={i === 0}
                onClick={() => move(i, i - 1)}
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={`Move image ${i + 1} down`}
                disabled={i === images.length - 1}
                onClick={() => move(i, i + 1)}
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={`Remove image ${i + 1}`}
                onClick={() => onChange({ ...block, images: images.filter((_, j) => j !== i) })}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          </div>
        ))}
        <MediaPickerButton
          label="Add image"
          onPick={(asset) =>
            onChange({ ...block, images: [...images, assetToImageRef(asset)] })
          }
        />
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Video
// ---------------------------------------------------------------------------

export function VideoForm({
  block,
  onChange
}: {
  block: VideoBlock;
  onChange: (b: VideoBlock) => void;
}) {
  return (
    <div className={styles.form}>
      <fieldset className={styles.subgroup}>
        <legend>Video</legend>
        {block.src ? (
          <div className={styles.imagePreviewRow}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={block.src} muted preload="metadata" className={styles.imagePreview} />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Remove video"
              onClick={() => onChange({ ...block, src: "", mimeType: undefined })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ) : (
          <p className={styles.fieldLabel}>No video selected yet.</p>
        )}
        <MediaPickerButton
          accept="video"
          icon={faVideo}
          label={block.src ? "Replace video" : "Choose video"}
          onPick={(asset) => onChange({ ...block, ...assetToVideoRef(asset) })}
        />
      </fieldset>

      <fieldset className={styles.subgroup}>
        <legend>Poster image (optional)</legend>
        {block.poster?.src && (
          <div className={styles.imagePreviewRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.poster.src} alt="" className={styles.imagePreview} />
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Remove poster"
              onClick={() => onChange({ ...block, poster: undefined })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        )}
        <MediaPickerButton
          label={block.poster ? "Replace poster" : "Add poster"}
          onPick={(asset) => onChange({ ...block, poster: assetToImageRef(asset) })}
        />
      </fieldset>

      <Field label="Caption (optional)">
        <input
          type="text"
          value={block.caption ?? ""}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature grid
// ---------------------------------------------------------------------------

export function FeatureGridForm({
  block,
  onChange
}: {
  block: FeatureGridBlock;
  onChange: (b: FeatureGridBlock) => void;
}) {
  const items = block.items ?? [];

  return (
    <div className={styles.form}>
      <Field label="Heading (optional)">
        <input
          type="text"
          value={block.heading ?? ""}
          placeholder="e.g. Key Features"
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </Field>

      <fieldset className={styles.subgroup}>
        <legend>Items</legend>
        <p className={styles.fieldLabel}>
          Add a description to any item to switch the whole grid to larger cards.
        </p>
        {items.map((item, i) => (
          <div key={i} className={styles.featureEditRow}>
            <div className={styles.featureEditFields}>
              <input
                type="text"
                value={item.title}
                placeholder="Title (e.g. Ray tracing)"
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], title: e.target.value };
                  onChange({ ...block, items: next });
                }}
              />
              <textarea
                rows={2}
                value={item.description ?? ""}
                placeholder="Description (optional)"
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], description: e.target.value };
                  onChange({ ...block, items: next });
                }}
              />
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label={`Remove item ${i + 1}`}
              disabled={items.length <= 1}
              onClick={() => onChange({ ...block, items: items.filter((_, j) => j !== i) })}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addRowBtn}
          onClick={() => onChange({ ...block, items: [...items, { title: "" }] })}
        >
          <FontAwesomeIcon icon={faPlus} /> Add item
        </button>
      </fieldset>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

export function CalloutForm({
  block,
  onChange
}: {
  block: CalloutBlock;
  onChange: (b: CalloutBlock) => void;
}) {
  return (
    <div className={styles.form}>
      <Field label="Style">
        <select
          value={block.variant}
          onChange={(e) => onChange({ ...block, variant: e.target.value as CalloutBlock["variant"] })}
        >
          {CALLOUT_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v === "quote" ? "Pull quote" : v.charAt(0).toUpperCase() + v.slice(1)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Text (required)">
        <textarea
          rows={3}
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      </Field>

      {block.variant === "quote" && (
        <Field label="Attribution (optional)">
          <input
            type="text"
            value={block.attribution ?? ""}
            placeholder="e.g. Jane Doe, CTO"
            onChange={(e) => onChange({ ...block, attribution: e.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Call to action
// ---------------------------------------------------------------------------

export function CtaForm({
  block,
  onChange
}: {
  block: CtaBlock;
  onChange: (b: CtaBlock) => void;
}) {
  const invalidHref = block.href.trim() !== "" && !isSafeUrl(block.href);
  return (
    <div className={styles.form}>
      <Field label="Heading (optional)">
        <input
          type="text"
          value={block.heading ?? ""}
          placeholder="e.g. Explore the source"
          onChange={(e) => onChange({ ...block, heading: e.target.value })}
        />
      </Field>

      <Field label="Text (optional)">
        <input
          type="text"
          value={block.text ?? ""}
          placeholder="e.g. Vulkan Renderer is open source and built with CMake."
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      </Field>

      <Field label="Button label (required)">
        <input
          type="text"
          value={block.label}
          placeholder="e.g. View on GitHub"
          onChange={(e) => onChange({ ...block, label: e.target.value })}
        />
      </Field>

      <Field label="Button link (required)">
        <input
          type="text"
          value={block.href}
          placeholder="https://… or /path"
          aria-invalid={invalidHref}
          onChange={(e) => onChange({ ...block, href: e.target.value })}
        />
      </Field>
    </div>
  );
}
