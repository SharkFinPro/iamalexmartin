"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faPen,
  faTrash,
  faPlus,
  faCheck,
  faXmark,
  faEye,
  faEyeSlash
} from "@fortawesome/free-solid-svg-icons";
import RichTextEditor from "@/components/RichTextEditor/RichTextEditor";
import { updateBlockLayout } from "@/app/admin/contentActions";
import { useDragReorder } from "@/components/useDragReorder";
import ProjectBlocks from "../ProjectBlocks";
import {
  createBlock,
  BLOCK_LABELS,
  BLOCK_DESCRIPTIONS,
  type Block,
  type BlockType,
  type RichTextBlock
} from "../blocks";
import {
  HeroForm,
  FeatureGridForm,
  StatsForm,
  TechStackForm,
  GalleryForm,
  VideoForm,
  CalloutForm,
  CtaForm,
  isBlockComplete
} from "./BlockForms";
import styles from "./ProjectPageEditor.module.scss";

const BLOCK_ORDER: BlockType[] = [
  "hero",
  "richText",
  "featureGrid",
  "stats",
  "techStack",
  "gallery",
  "video",
  "callout",
  "cta"
];

type Props = {
  /** Hygraph entry id holding the block layout. */
  entryId: string;
  /** Title used only to seed a new hero block's headline. */
  title: string;
  initialBlocks: Block[];
  /** Hygraph model API ID owning the block-layout field. */
  model?: string;
  /** Json field on `model` storing the `Block[]`. */
  field?: string;
  /** Render hero images at their natural ratio in the preview (About page). */
  naturalHeroImage?: boolean;
};

/**
 * Admin authoring surface for a block-layout page (project case-studies and the
 * About page share it). Editors add blocks from a curated palette, reorder them
 * (pointer + keyboard, via useDragReorder), and edit each block in a purpose-built
 * form. Structural changes (add/reorder/delete) and committed edits persist
 * through `updateBlockLayout`, which returns the sanitized list we then adopt — so
 * the editor always reflects exactly what's stored. Because the preview reuses the
 * visitor renderer, this surface *is* the preview.
 */
export default function ProjectPageEditor({
  entryId,
  title,
  initialBlocks,
  model = "Project",
  field = "projectPage",
  naturalHeroImage = false
}: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Block | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  async function persist(next: Block[]): Promise<{ ok: true } | { ok: false; error: string }> {
    setBlocks(next);
    setSaving(true);
    setError("");
    setStatus("");
    const result = await updateBlockLayout(model, entryId, field, next);
    setSaving(false);
    if ("error" in result) {
      setError(result.error);
      return { ok: false, error: result.error };
    }
    // Adopt the sanitized server copy so local state can't drift from storage.
    setBlocks(result.blocks);
    setStatus("Saved");
    return { ok: true };
  }

  const drag = useDragReorder<Block>({
    items: blocks,
    setItems: setBlocks,
    getKey: (b) => b.id,
    onCommit: (orderedKeys) => {
      const byId = new Map(blocksRef.current.map((b) => [b.id, b]));
      const ordered = orderedKeys.map((k) => byId.get(k)).filter(Boolean) as Block[];
      void persist(ordered);
    }
  });

  function addBlock(type: BlockType) {
    setPaletteOpen(false);
    const block = createBlock(type, title);
    setBlocks((prev) => [...prev, block]);
    setEditingId(block.id);
    setDraft(structuredClone(block));
    setIsNew(true);
    setError("");
    setStatus("");
  }

  function startEdit(block: Block) {
    setEditingId(block.id);
    setDraft(structuredClone(block));
    setIsNew(false);
    setError("");
    setStatus("");
  }

  function cancelEdit() {
    if (isNew && editingId) {
      // Discard a never-saved block entirely.
      setBlocks((prev) => prev.filter((b) => b.id !== editingId));
    }
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
  }

  async function commitEdit() {
    if (!draft) return;
    if (!isBlockComplete(draft)) {
      setError("Please complete the required fields before saving this block.");
      return;
    }
    const next = blocksRef.current.map((b) => (b.id === draft.id ? draft : b));
    const result = await persist(next);
    if (!("error" in result)) {
      setEditingId(null);
      setDraft(null);
      setIsNew(false);
    }
  }

  async function deleteBlock(id: string) {
    if (!window.confirm("Delete this block? This can't be undone.")) return;
    if (editingId === id) cancelEdit();
    await persist(blocksRef.current.filter((b) => b.id !== id));
  }

  // Save handler the rich-text editor expects ({ ok } | { error }).
  async function saveRichText(block: RichTextBlock, content: { children: any[] }) {
    const nextBlock: RichTextBlock = { ...block, content };
    const next = blocksRef.current.map((b) => (b.id === block.id ? nextBlock : b));
    const result = await persist(next);
    if ("error" in result) return { error: result.error };
    setEditingId(null);
    setDraft(null);
    setIsNew(false);
    return { ok: true } as const;
  }

  function renderForm(block: Block) {
    switch (block.type) {
      case "hero":
        return <HeroForm block={block} onChange={setDraft} />;
      case "featureGrid":
        return <FeatureGridForm block={block} onChange={setDraft} />;
      case "stats":
        return <StatsForm block={block} onChange={setDraft} />;
      case "techStack":
        return <TechStackForm block={block} onChange={setDraft} />;
      case "gallery":
        return <GalleryForm block={block} onChange={setDraft} />;
      case "video":
        return <VideoForm block={block} onChange={setDraft} />;
      case "callout":
        return <CalloutForm block={block} onChange={setDraft} />;
      case "cta":
        return <CtaForm block={block} onChange={setDraft} />;
      default:
        return null;
    }
  }

  if (previewMode) {
    return (
      <div className={styles.editorRoot}>
        <div className={styles.statusBar}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setPreviewMode(false)}
          >
            <FontAwesomeIcon icon={faEyeSlash} /> Exit preview
          </button>
        </div>
        {blocks.length === 0 ? (
          <p className={styles.empty}>No blocks yet.</p>
        ) : (
          <ProjectBlocks blocks={blocks} naturalHeroImage={naturalHeroImage} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.editorRoot}>
      <div className={styles.statusBar}>
        <span className={styles.statusText} role="status" aria-live="polite">
          {saving ? "Saving…" : error ? "" : status}
        </span>
        {error && (
          <span className={styles.statusError} role="alert">
            {error}
          </span>
        )}
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => setPreviewMode(true)}
          disabled={blocks.length === 0}
        >
          <FontAwesomeIcon icon={faEye} /> Preview
        </button>
      </div>

      {/* Live region for keyboard reordering announcements. */}
      <div className="srOnly" role="status" aria-live="polite">
        {drag.announcement}
      </div>

      {blocks.length === 0 && (
        <p className={styles.empty}>
          This project has no content blocks yet. Add your first block to get started.
        </p>
      )}

      <ul className={styles.blockList}>
        {blocks.map((block, index) => {
          const editing = editingId === block.id;
          const shown = editing && draft ? draft : block;
          const floating = drag.draggingKey === block.id;

          return (
            <li
              key={block.id}
              ref={drag.registerCard(block.id)}
              className={`${styles.blockItem} ${floating ? styles.floating : ""}`}
              style={floating ? drag.floatingStyle : undefined}
            >
              <div className={styles.blockBar}>
                <button
                  type="button"
                  className={styles.dragHandle}
                  aria-label={`Reorder ${BLOCK_LABELS[block.type]} block. Press arrow keys to move, or drag.`}
                  onPointerDown={(e) => drag.startDrag(index, block.id, e)}
                  onKeyDown={drag.keyboardReorder(block.id)}
                >
                  <FontAwesomeIcon icon={faGripVertical} />
                </button>
                <span className={styles.blockTag}>{BLOCK_LABELS[block.type]}</span>
                <div className={styles.blockBarActions}>
                  {!editing && (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Edit ${BLOCK_LABELS[block.type]} block`}
                      onClick={() => startEdit(block)}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.iconBtn}
                    aria-label={`Delete ${BLOCK_LABELS[block.type]} block`}
                    onClick={() => deleteBlock(block.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              {editing && block.type === "richText" ? (
                <RichTextEditor
                  initialContent={(shown as RichTextBlock).content}
                  onSave={(content) => saveRichText(block as RichTextBlock, content)}
                  onCancel={cancelEdit}
                />
              ) : editing ? (
                <div className={styles.editPanel}>
                  {renderForm(draft as Block)}
                  <div className={styles.editActions}>
                    <button type="button" className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
                      <FontAwesomeIcon icon={faXmark} /> Cancel
                    </button>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={commitEdit}
                      disabled={saving || !isBlockComplete(draft)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> {saving ? "Saving…" : "Save block"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.blockPreview}>
                  <ProjectBlocks blocks={[shown]} naturalHeroImage={naturalHeroImage} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.addZone}>
        {paletteOpen ? (
          <div className={styles.palette} role="menu" aria-label="Add a content block">
            <div className={styles.paletteHead}>
              <span>Add a block</span>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Close block menu"
                onClick={() => setPaletteOpen(false)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <ul className={styles.paletteList}>
              {BLOCK_ORDER.map((type) => (
                <li key={type}>
                  <button type="button" className={styles.paletteItem} onClick={() => addBlock(type)} role="menuitem">
                    <span className={styles.paletteItemName}>{BLOCK_LABELS[type]}</span>
                    <span className={styles.paletteItemDesc}>{BLOCK_DESCRIPTIONS[type]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <button type="button" className={styles.addBlockBtn} onClick={() => setPaletteOpen(true)}>
            <FontAwesomeIcon icon={faPlus} /> Add block
          </button>
        )}
      </div>
    </div>
  );
}
