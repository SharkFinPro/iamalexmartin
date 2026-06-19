"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBold,
  faItalic,
  faUnderline,
  faCode,
  faListUl,
  faListOl,
  faLink,
  faLinkSlash,
  faImage,
  faRemoveFormat,
  faCheck,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { MediaAsset } from "@/lib/getAssets";
import { astToHtml, htmlToAst, assetToImageNode, imageNodeHtml, isSafeUrl } from "./richTextAst";
import AssetPicker from "./AssetPicker";
import styles from "./RichTextEditor.module.scss";

type SaveResult = { ok: true } | { error: string };

type Props = {
  initialContent: any; // raw rich-text AST ({ children } or array)
  onSave: (content: { children: any[] }) => Promise<SaveResult>;
  onCancel: () => void;
};

// Block formats offered in the toolbar dropdown. Values are the tag names
// `formatBlock` (and `queryCommandValue`) work with, so the dropdown can both
// apply and reflect the block under the caret.
const BLOCKS: { value: string; label: string }[] = [
  { value: "p", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
  { value: "h4", label: "Heading 4" },
  { value: "h5", label: "Heading 5" },
  { value: "h6", label: "Heading 6" },
  { value: "blockquote", label: "Quote" },
  { value: "pre", label: "Code block" }
];

const BLOCK_VALUES = new Set(BLOCKS.map((b) => b.value));

// Toolbar inline/list state, mirrored from the live selection.
type ToolbarState = {
  block: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  code: boolean;
  ul: boolean;
  ol: boolean;
};

const INITIAL_STATE: ToolbarState = {
  block: "p",
  bold: false,
  italic: false,
  underline: false,
  code: false,
  ul: false,
  ol: false
};

/** Nearest ancestor element with the given tag between `node` and `root`. */
function closestTag(node: Node | null, root: Node | null, tag: string): HTMLElement | null {
  while (node && node !== root) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === tag) {
      return node as HTMLElement;
    }
    node = node.parentNode;
  }
  return null;
}

/**
 * Minimal contentEditable rich-text editor producing Hygraph's AST. Formatting
 * runs through the browser's execCommand (tag-based output, no extra deps);
 * images are inserted inline via the AssetPicker, which reuses the Media Library.
 * The toolbar reflects the formatting under the caret/selection.
 */
export default function RichTextEditor({ initialContent, onSave, onCancel }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  // Selection captured before the picker steals focus, so the image lands where
  // the caret was.
  const savedRange = useRef<Range | null>(null);
  // The image figure the user clicked (void elements can't hold a text caret, so
  // we track selection ourselves to support Delete/Backspace).
  const selectedFigure = useRef<HTMLElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toolbar, setToolbar] = useState<ToolbarState>(INITIAL_STATE);

  // Read the current selection's formatting into toolbar state so the controls
  // show what's active. Only runs while the caret is inside the editor.
  const syncToolbar = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) return;

    try {
      let block = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      // Browsers report a bare line as "div" or ""; normalize to paragraph, and
      // ignore anything we don't offer (e.g. "li") so the select stays valid.
      if (block === "div" || block === "") block = "p";
      if (!BLOCK_VALUES.has(block)) block = "p";

      setToolbar({
        block,
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        // No execCommand for inline code; detect a <code> ancestor instead.
        code: !!closestTag(sel.anchorNode, editor, "CODE"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList")
      });
    } catch {
      /* queryCommand* can throw in odd selection states; ignore. */
    }
  }, []);

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
    syncToolbar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the toolbar in sync as the caret/selection moves anywhere on the page.
  useEffect(() => {
    document.addEventListener("selectionchange", syncToolbar);
    return () => document.removeEventListener("selectionchange", syncToolbar);
  }, [syncToolbar]);

  function clearImageSelection() {
    if (selectedFigure.current) {
      selectedFigure.current.classList.remove(styles.imageSelected);
      selectedFigure.current = null;
    }
  }

  // Click an image to select it (outline it); clicking elsewhere clears it.
  function handleSurfaceClick(e: React.MouseEvent) {
    const figure = (e.target as HTMLElement).closest?.(
      "figure[data-rt-image]"
    ) as HTMLElement | null;
    if (figure === selectedFigure.current) return;
    clearImageSelection();
    if (figure && editorRef.current?.contains(figure)) {
      figure.classList.add(styles.imageSelected);
      selectedFigure.current = figure;
    }
  }

  // Delete/Backspace removes a selected image; any other typing deselects it.
  function handleKeyDown(e: React.KeyboardEvent) {
    const figure = selectedFigure.current;
    if (!figure) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      figure.remove();
      selectedFigure.current = null;
      editorRef.current?.focus();
      syncToolbar();
    } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
      clearImageSelection();
    }
  }

  function exec(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncToolbar();
  }

  function applyBlock(value: string) {
    if (!value) return;
    // Toggle headings/quote/code back to a paragraph when reselected.
    const next = value !== "p" && toolbar.block === value ? "p" : value;
    exec("formatBlock", `<${next}>`);
  }

  function addLink() {
    const url = (window.prompt("Link URL") || "").trim();
    if (!url) return;
    if (!isSafeUrl(url)) {
      setError("Links must start with http(s)://, mailto:, /, or #.");
      return;
    }
    exec("createLink", url);
  }

  // Inline code has no execCommand; wrap the selection in <code>, or unwrap the
  // enclosing <code> when it's already active.
  function toggleInlineCode() {
    const editor = editorRef.current;
    editor?.focus();
    const sel = window.getSelection();
    if (!editor || !sel || sel.rangeCount === 0) return;

    const existing = closestTag(sel.anchorNode, editor, "CODE");
    if (existing) {
      const parent = existing.parentNode;
      if (parent) {
        while (existing.firstChild) parent.insertBefore(existing.firstChild, existing);
        parent.removeChild(existing);
      }
    } else {
      const range = sel.getRangeAt(0);
      if (range.collapsed) return; // nothing selected to wrap
      const code = document.createElement("code");
      try {
        code.appendChild(range.extractContents());
        range.insertNode(code);
        const after = document.createRange();
        after.selectNodeContents(code);
        sel.removeAllRanges();
        sel.addRange(after);
      } catch {
        /* selection spanned non-text boundaries; leave content unchanged */
      }
    }
    syncToolbar();
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
    syncToolbar();
  }

  async function handleSave() {
    if (!editorRef.current) return;
    setSaving(true);
    setError("");
    try {
      const content = htmlToAst(editorRef.current);
      const result = await onSave(content);
      if ("error" in result) setError(result.error);
    } catch (e: any) {
      setError(e?.message || "Failed to save content.");
    } finally {
      setSaving(false);
    }
  }

  // Toolbar buttons must not steal the selection from the editor.
  function toolbarButton(
    icon: IconDefinition,
    label: string,
    onAction: () => void,
    active = false
  ) {
    return (
      <button
        type="button"
        className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ""}`}
        title={label}
        aria-label={label}
        aria-pressed={active}
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
          value={toolbar.block}
          aria-label="Text style"
          onMouseDown={saveSelection}
          onChange={(e) => applyBlock(e.target.value)}
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <span className={styles.toolDivider} />

        {toolbarButton(faBold, "Bold", () => exec("bold"), toolbar.bold)}
        {toolbarButton(faItalic, "Italic", () => exec("italic"), toolbar.italic)}
        {toolbarButton(faUnderline, "Underline", () => exec("underline"), toolbar.underline)}
        {toolbarButton(faCode, "Inline code", toggleInlineCode, toolbar.code)}

        <span className={styles.toolDivider} />

        {toolbarButton(
          faListUl,
          "Bulleted list",
          () => exec("insertUnorderedList"),
          toolbar.ul
        )}
        {toolbarButton(
          faListOl,
          "Numbered list",
          () => exec("insertOrderedList"),
          toolbar.ol
        )}

        <span className={styles.toolDivider} />

        {toolbarButton(faLink, "Insert link", addLink)}
        {toolbarButton(faLinkSlash, "Remove link", () => exec("unlink"))}
        {toolbarButton(faImage, "Insert image", openPicker)}
        {toolbarButton(faRemoveFormat, "Clear formatting", () => exec("removeFormat"))}
      </div>

      <div
        ref={editorRef}
        className={styles.surface}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Rich text content"
        onKeyDown={handleKeyDown}
        onKeyUp={syncToolbar}
        onClick={handleSurfaceClick}
        onMouseUp={syncToolbar}
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
