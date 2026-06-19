"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import RichTextWidget from "@/components/RichTextWidget";
import { updateRichTextField } from "@/app/admin/contentActions";
import RichTextEditor from "./RichTextEditor";
import styles from "./RichTextEditor.module.scss";

type Props = {
  model: string; // Hygraph model API ID (e.g. "Project")
  id: string; // entry id
  field: string; // RichText field API ID (e.g. "projectPageContent")
  value: any; // raw rich-text AST ({ children })
};

/**
 * Admin-only wrapper around a RichText field. Renders the normal RichTextWidget
 * with an "Edit content" affordance; clicking it swaps in the editor. On save it
 * keeps the new AST locally (optimistic — the read CDN lags after a write) so the
 * widget re-renders the change immediately. Visitors never mount this component;
 * the page renders RichTextWidget directly for them.
 */
export default function EditableRichText({ model, id, field, value }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState<any>(value);

  async function save(next: { children: any[] }): Promise<{ ok: true } | { error: string }> {
    const result = await updateRichTextField(model, id, field, next);
    if ("error" in result) {
      return { error: result.error };
    }
    setContent(next);
    setEditing(false);
    return { ok: true };
  }

  if (editing) {
    return (
      <RichTextEditor
        initialContent={content}
        onSave={save}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className={styles.displayWrap}>
      <button
        type="button"
        className={styles.editLaunch}
        onClick={() => setEditing(true)}
      >
        <FontAwesomeIcon icon={faPen} /> Edit content
      </button>
      <RichTextWidget content={content} />
    </div>
  );
}
