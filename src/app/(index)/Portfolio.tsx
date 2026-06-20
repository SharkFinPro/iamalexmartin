"use client";

import styles from "./portfolio.module.scss";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import EditableText from "@/components/EditableText";
import Modal from "@/components/Modal";
import { useDragReorder } from "@/components/useDragReorder";
import { useSiteConfig } from "@/components/useSiteConfig";
import {
  createPortfolioCard,
  updatePortfolioCard,
  deletePortfolioCard,
  type PortfolioCard as Card
} from "@/app/admin/contentActions";
import { applyConfigToCards, cardFlags } from "@/lib/siteConfig";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faPen,
  faEye,
  faEyeSlash,
  faPlus,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

library.add(fas);

// Editable card fields, in the order they appear in the modal.
type CardForm = Pick<
  Card,
  "title" | "fontAwesomeIcon" | "description" | "shortDescription" | "linkText" | "link"
>;

// Seed for a brand-new card; the admin fills in the rest in the same modal.
const BLANK_CARD: CardForm = {
  title: "",
  fontAwesomeIcon: "star",
  description: "",
  shortDescription: "",
  linkText: "Learn more",
  link: "/"
};

function cardToForm(card: Card): CardForm {
  return {
    title: card.title ?? "",
    fontAwesomeIcon: card.fontAwesomeIcon ?? "",
    description: card.description ?? "",
    shortDescription: card.shortDescription ?? "",
    linkText: card.linkText ?? "",
    link: card.link ?? ""
  };
}

function CardView({
  card,
  isAdmin,
  hidden,
  innerRef,
  onHandlePointerDown,
  onHandleKeyDown,
  onEdit,
  onToggleHide,
  onDelete,
  floating
}: any) {
  // A bad icon name renders nothing (FontAwesome warns); fall back so the slot
  // never collapses.
  const iconName = card.fontAwesomeIcon || "star";

  return (
    <div
      ref={innerRef}
      className={`${styles.quickLinkCard} ${isAdmin ? styles.adminCard : ""} ${
        hidden ? styles.hiddenCard : ""
      } ${floating ? styles.floating : ""}`}
    >
      {isAdmin && (
        <div className={styles.adminOverlay}>
          {onHandlePointerDown && (
            <button
              type="button"
              className={styles.dragHandle}
              aria-label="Reorder card. Press arrow keys to move, or drag."
              onPointerDown={onHandlePointerDown}
              onKeyDown={onHandleKeyDown}
            >
              <FontAwesomeIcon icon={faGripVertical} />
            </button>
          )}
          <button type="button" aria-label="Edit card" title="Edit card" onClick={onEdit}>
            <FontAwesomeIcon icon={faPen} />
          </button>
          <button
            type="button"
            className={hidden ? "" : styles.flagActive}
            aria-label={hidden ? "Show card" : "Hide card"}
            title={hidden ? "Show card" : "Hide card"}
            onClick={onToggleHide}
          >
            <FontAwesomeIcon icon={hidden ? faEyeSlash : faEye} />
          </button>
          <button
            type="button"
            className={styles.deleteButton}
            aria-label="Delete card"
            title="Delete card"
            onClick={onDelete}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}

      <div className={styles.quickLinkIcon}>
        <FontAwesomeIcon icon={["fas", iconName]} />
      </div>
      <h3>{card.title}</h3>
      <p className={styles.description}>{card.description}</p>
      <p className={styles.shortDescription}>{card.shortDescription}</p>
      <Link href={card.link || "/"}>{card.linkText}</Link>
    </div>
  );
}

/**
 * Modal to create or edit every field of a portfolio card at once, keeping the
 * card itself clean. Note the two separate descriptions: `description` shows on
 * large screens, `shortDescription` on small ones.
 */
function CardEditor({
  initial,
  heading,
  submitLabel,
  onSave,
  onClose
}: {
  initial: CardForm;
  heading: string;
  submitLabel: string;
  onSave: (data: CardForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<CardForm>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const titleId = useId();

  function set<K extends keyof CardForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
    } catch (err: any) {
      setError(err?.message || "Failed to save card.");
      setSaving(false);
    }
  }

  const iconName = form.fontAwesomeIcon.trim() || "star";

  return (
    <Modal onClose={onClose} labelledBy={titleId} overlayClassName={styles.modalOverlay}>
      <form className={styles.modal} onSubmit={submit}>
        <h2 className={styles.modalTitle} id={titleId}>{heading}</h2>

        <label className={styles.field}>
          <span>Title</span>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} required autoFocus />
        </label>

        <label className={styles.field}>
          <span>Icon</span>
          <div className={styles.iconField}>
            <span className={styles.iconPreview}>
              <FontAwesomeIcon icon={["fas", iconName] as any} />
            </span>
            <input
              value={form.fontAwesomeIcon}
              onChange={(e) => set("fontAwesomeIcon", e.target.value)}
              placeholder="star"
            />
          </div>
          <small className={styles.fieldHint}>
            Font Awesome solid icon name, e.g. “star”, “code”, “briefcase”.
          </small>
        </label>

        <label className={styles.field}>
          <span>Description (large screens)</span>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
        </label>

        <label className={styles.field}>
          <span>Short description (small screens)</span>
          <textarea
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            rows={2}
          />
        </label>

        <label className={styles.field}>
          <span>Link text</span>
          <input value={form.linkText} onChange={(e) => set("linkText", e.target.value)} />
        </label>

        <label className={styles.field}>
          <span>Link destination</span>
          <input value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/projects" />
        </label>

        {error && <p className={styles.modalError} role="alert">{error}</p>}

        <div className={styles.modalActions}>
          <button type="button" className={styles.modalCancel} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={styles.modalConfirm} disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Portfolio({ className, cards, description, config, isAdmin = false }: any) {
  const { cfg, cfgRef, persist } = useSiteConfig(config);
  const deleteTitleId = useId();
  const [items, setItems] = useState<Card[]>(() => applyConfigToCards(cards, config, isAdmin));
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Card | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Re-derive items from the server only when fresh props arrive (refresh/nav).
  useEffect(() => {
    setItems(applyConfigToCards(cards, config, isAdmin));
  }, [cards, config, isAdmin]);

  function toggleHide(id: string) {
    const current = cardFlags(cfgRef.current, id);
    persist({
      ...cfgRef.current,
      portfolioCards: { ...cfgRef.current.portfolioCards, [id]: { hidden: !current.hidden } }
    });
  }

  async function saveCard(data: CardForm) {
    const target = editing;
    if (!target) return;
    const result = await updatePortfolioCard(target.id, data);
    if ("error" in result) {
      throw new Error(result.error);
    }
    setItems((prev) => prev.map((c) => (c.id === target.id ? { ...c, ...data } : c)));
    setEditing(null);
  }

  async function confirmDelete() {
    const card = pendingDelete;
    if (!card) return;

    setDeleting(true);
    setDeleteError("");

    const result = await deletePortfolioCard(card.id);
    if ("error" in result) {
      setDeleting(false);
      setDeleteError(result.error);
      return;
    }

    setItems((prev) => prev.filter((c) => c.id !== card.id));

    // Drop the card from siteConfig too (order + flags) so nothing dangles.
    const nextCards = { ...cfgRef.current.portfolioCards };
    delete nextCards[card.id];
    persist({
      ...cfgRef.current,
      portfolioCardOrder: cfgRef.current.portfolioCardOrder.filter((x) => x !== card.id),
      portfolioCards: nextCards
    });

    setDeleting(false);
    setPendingDelete(null);
  }

  async function createCard(data: CardForm) {
    const result = await createPortfolioCard(data);
    if ("error" in result) {
      throw new Error(result.error);
    }
    const nextItems = [...items, result.card];
    setItems(nextItems);
    await persist({ ...cfgRef.current, portfolioCardOrder: nextItems.map((c) => c.id) });
    setShowCreate(false);
  }

  const drag = useDragReorder<Card>({
    items,
    setItems,
    getKey: (c) => c.id,
    onCommit: (ids) => persist({ ...cfgRef.current, portfolioCardOrder: ids })
  });

  const draggingCard = drag.draggingKey ? items.find((c) => c.id === drag.draggingKey) : null;

  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>
        <EditableText model="Description" id={description.id} field="header" value={description.header} editable={isAdmin}>
          {description.header}
        </EditableText>
      </h2>
      <p className={styles.sectionDescription}>
        <EditableText model="Description" id={description.id} field="description" value={description.description} editable={isAdmin} multiline>
          {description.description}
        </EditableText>
      </p>

      {isAdmin && (
        <div className="srOnly" role="status" aria-live="polite">{drag.announcement}</div>
      )}

      <div className={styles.quickLinks}>
        {items.map((card, index) =>
          card.id === drag.draggingKey ? (
            <div
              key={card.id}
              className={styles.placeholder}
              style={{ width: drag.size.w, height: drag.size.h }}
            />
          ) : (
            <CardView
              key={card.id}
              card={card}
              isAdmin={isAdmin}
              hidden={isAdmin && cardFlags(cfg, card.id).hidden}
              innerRef={drag.registerCard(card.id)}
              onHandlePointerDown={
                isAdmin ? (e: React.PointerEvent) => drag.startDrag(index, card.id, e) : undefined
              }
              onHandleKeyDown={isAdmin ? drag.keyboardReorder(card.id) : undefined}
              onEdit={() => setEditing(card)}
              onToggleHide={() => toggleHide(card.id)}
              onDelete={() => { setDeleteError(""); setPendingDelete(card); }}
            />
          )
        )}

        {isAdmin && (
          <button
            type="button"
            className={styles.addCardButton}
            onClick={() => setShowCreate(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add card</span>
          </button>
        )}
      </div>

      {draggingCard && isAdmin && (
        <div className={styles.floatingLayer} style={drag.floatingStyle}>
          <CardView card={draggingCard} isAdmin floating hidden={cardFlags(cfg, draggingCard.id).hidden} />
        </div>
      )}

      {editing && (
        <CardEditor
          initial={cardToForm(editing)}
          heading="Edit card"
          submitLabel="Save"
          onSave={saveCard}
          onClose={() => setEditing(null)}
        />
      )}

      {showCreate && (
        <CardEditor
          initial={BLANK_CARD}
          heading="New card"
          submitLabel="Create"
          onSave={createCard}
          onClose={() => setShowCreate(false)}
        />
      )}

      {pendingDelete && (
        <Modal
          onClose={() => { if (!deleting) setPendingDelete(null); }}
          labelledBy={deleteTitleId}
          overlayClassName={styles.modalOverlay}
          closeOnOverlayClick={!deleting}
        >
          <div className={`${styles.modal} ${styles.confirmModal}`}>
            <h2 className={styles.modalTitle} id={deleteTitleId}>Delete card?</h2>
            <p className={styles.confirmText}>
              This permanently removes{" "}
              <strong>{pendingDelete.title?.trim() || "this card"}</strong> from the CMS.
              This can’t be undone.
            </p>
            {deleteError && <p className={styles.modalError} role="alert">{deleteError}</p>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDanger}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
