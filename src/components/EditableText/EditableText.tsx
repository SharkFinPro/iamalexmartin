"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import { updateProjectField } from "@/app/admin/contentActions";
import styles from "./EditableText.module.scss";

type Props = {
  slug: string;
  field: string;
  value: string | string[];
  editable?: boolean;
  multiline?: boolean;
  children: React.ReactNode; // normal (non-admin) rendering of the value
};

const isList = (v: string | string[]): v is string[] => Array.isArray(v);

/**
 * Wraps a project field. When `editable` is false it just renders `children`.
 * In admin mode it adds a pencil that swaps in an input bound to
 * updateProjectField. List fields (e.g. tags) are edited as comma-separated text.
 */
export default function EditableText({ slug, field, value, editable, multiline, children }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(isList(value) ? value.join(", ") : value);
  // Optimistic display of the saved value: the read CDN lags after a write, so
  // refetching would briefly show the old text. `null` means "use children".
  const [display, setDisplay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!editable) {
    return <>{children}</>;
  }

  async function save() {
    setSaving(true);
    setError("");

    const next = isList(value)
      ? draft.split(",").map((s) => s.trim()).filter(Boolean)
      : draft;

    const result = await updateProjectField(slug, field, next);
    setSaving(false);

    if ("error" in result) {
      setError(result.error);
    } else {
      setEditing(false);
      setDisplay(Array.isArray(next) ? next.join(", ") : next);
    }
  }

  if (!editing) {
    return (
      <span className={styles.wrapper}>
        {display === null ? children : display}
        <button
          type="button"
          className={styles.editButton}
          aria-label={`Edit ${field}`}
          onClick={() => setEditing(true)}
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
      </span>
    );
  }

  return (
    <span className={styles.editor}>
      {multiline ? (
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} />
      ) : (
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      )}
      <span className={styles.controls}>
        <button type="button" onClick={save} disabled={saving} aria-label="Save">
          <FontAwesomeIcon icon={faCheck} />
        </button>
        <button type="button" onClick={() => setEditing(false)} disabled={saving} aria-label="Cancel">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </span>
  );
}
