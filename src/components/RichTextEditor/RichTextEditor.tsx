"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faUnderline,
  faListUl,
  faListOl,
  faQuoteRight,
  faLink,
  faImage,
  faCheck,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import type { MediaAsset } from "@/lib/getAssets";
import { astToHtml, htmlToAst, assetToImageNode, imageNodeHtml } from "./richTextAst";
import AssetPicker from "./AssetPicker";
import styles from "./RichTextEditor.module.scss";

type SaveResult = { ok: true } | { error: string };

type Props = {
  initialContent: any; // raw rich-text AST ({ children } or array)
  onSave: (content: { children: any[] }) => Promise<SaveResult>;
  onCancel: () => void;
};

// Block formats offered in the toolbar dropdown.
const BLOCKS: { value: string; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" }
];

/**
 * Minimal contentEditable rich-text editor producing Hygraph's AST. Formatting
 * runs through the browser's execCommand (tag-based output, no extra deps);
 * images are inserted inline via the AssetPicker, which reuses the Media Library.
 */
export default function RichTextEditor({ initialContent, onSave, onCancel }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Selection captured before the picker steals focus, so the image lands where
  // the caret was.
  const savedRange = useRef<Range | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load the existing content once; thereafter the DOM is the source of truth.
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = astToHtml(initialContent);
    }
    // Emit semantic tags (<b>, <i>, <u>) instead of inline CSS where supported.
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* not all browsers support the toggle; serialization handles CSS too */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function applyBlock(value: string) {
    if (!value) return;
    exec("formatBlock", `<${value}>`);
  }

  function addLink() {
    const url = window.prompt("Link URL");
    if (url) exec("createLink", url);
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function openPicker() {
    saveSelection();
    setPickerOpen(true);
  }

  function insertImage(asset: MediaAsset) {
    setPickerOpen(false);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
    const node = assetToImageNode(asset);
    // Trailing paragraph gives the caret a place to land after the void figure.
    document.execCommand("insertHTML", false, `${imageNodeHtml(node)}<p><br></p>`);
  }

  async function handleSave() {
    if (!editorRef.current) return;
    setSaving(true);
    setError("");
    const content = htmlToAst(editorRef.current);
    const result = await onSave(content);
    setSaving(false);
    if ("error" in result) setError(result.error);
  }

  // Toolbar buttons must not steal the selection from the editor.
  function toolbarButton(
    icon: typeof faBold,
    label: string,
    onAction: () => void
  ) {
    return (
      <button
        type="button"
        className={styles.toolBtn}
        title={label}
        aria-label={label}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onAction}
      >
        <FontAwesomeIcon icon={icon} />
      </button>
    );
  }

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <select
          className={styles.blockSelect}
          defaultValue=""
          aria-label="Text style"
          onMouseDown={() => saveSelection()}
          onChange={(e) => {
            applyBlock(e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Style
          </option>
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <span className={styles.toolDivider} />

        {toolbarButton(faBold, "Bold", () => exec("bold"))}
        {toolbarButton(faItalic, "Italic", () => exec("italic"))}
        {toolbarButton(faUnderline, "Underline", () => exec("underline"))}

        <span className={styles.toolDivider} />

        {toolbarButton(faListUl, "Bulleted list", () => exec("insertUnorderedList"))}
        {toolbarButton(faListOl, "Numbered list", () => exec("insertOrderedList"))}
        {toolbarButton(faQuoteRight, "Quote", () => applyBlock("blockquote"))}

        <span className={styles.toolDivider} />

        {toolbarButton(faLink, "Insert link", addLink)}
        {toolbarButton(faImage, "Insert image", openPicker)}
      </div>

      <div
        ref={editorRef}
        className={styles.surface}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text content"
        onBlur={saveSelection}
      />

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={saving}
        >
          <FontAwesomeIcon icon={faXmark} /> Cancel
        </button>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          <FontAwesomeIcon icon={faCheck} /> {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {pickerOpen && (
        <AssetPicker onSelect={insertImage} onClose={() => setPickerOpen(false)} />
      )}
    </div>
  );
}
