"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { updateContentField } from "@/app/admin/contentActions";
import styles from "./EditableText.module.scss";

type Props = {
  model: string;   // Hygraph model API ID (e.g. "Project", "Description")
  id: string;      // entry id
  field: string;
  value: string | string[];
  editable?: boolean;
  multiline?: boolean;
  floatEdit?: boolean; // position the pencil out of flow (for headings/gradient text)
  // Override the default updateContentField write (e.g. assets, which publish
  // stage-aware). When set, model/id/field are used only for the label.
  action?: (next: string | string[]) => Promise<{ ok: true } | { error: string }>;
  children: React.ReactNode; // normal (non-admin) rendering of the value
};

const isList = (v: string | string[]): v is string[] => Array.isArray(v);

/**
 * Wraps a CMS text field. When `editable` is false it just renders `children`.
 * In admin mode it adds a pencil that swaps in an input bound to
 * updateContentField. List fields (e.g. tags) are edited as comma-separated text.
 */
export default function EditableText({ model, id, field, value, editable, multiline, floatEdit, action, children }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(isList(value) ? value.join(", ") : value);
  // Optimistic display of the saved value: the read CDN lags after a write, so
  // refetching would briefly show the old text. `null` means "use children".
  const [display, setDisplay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Re-sync from the server value when it changes (e.g. after router.refresh()
  // or navigating to another entry), but never while the user is mid-edit. A
  // fresh server value supersedes the optimistic `display`, so clear it.
  useEffect(() => {
    if (editing) return;
    setDraft(isList(value) ? value.join(", ") : value);
    setDisplay(null);
  }, [editing, value]);

  if (!editable) {
    return <>{children}</>;
  }

  async function save() {
    setSaving(true);
    setError("");

    const next = isList(value)
      ? draft.split(",").map((s) => s.trim()).filter(Boolean)
      : draft;

    const result = action
      ? await action(next)
      : await updateContentField(model, id, field, next);
    setSaving(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setEditing(false);
      setDisplay(Array.isArray(next) ? next.join(", ") : next);
    }
  }

  // Editing controls may live inside a link/card; never let them navigate.
  function guard(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    };
  }

  if (!editing) {
    return (
      <span className={styles.wrapper}>
        {display === null ? children : display}
        <button
          type="button"
          className={`${styles.editButton} ${floatEdit ? styles.editButtonFloat : ""}`}
          aria-label={`Edit ${field}`}
          onClick={guard(() => setEditing(true))}
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
      </span>
    );
  }

  return (
    <span className={styles.editor} onClick={(e) => e.preventDefault()}>
      {multiline ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
      ) : (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      )}
      <span className={styles.controls}>
        <button type="button" onClick={guard(save)} disabled={saving} aria-label="Save">
          <FontAwesomeIcon icon={faCheck} />
        </button>
        <button type="button" onClick={guard(() => setEditing(false))} disabled={saving} aria-label="Cancel">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </span>
  );
}
