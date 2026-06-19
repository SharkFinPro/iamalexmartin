"use client";

import styles from "./portfolio.module.scss";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EditableText from "@/components/EditableText";
import { useDragReorder } from "@/components/useDragReorder";
import {
  saveConfig,
  createPortfolioCard,
  type PortfolioCard as Card
} from "@/app/admin/contentActions";
import { applyConfigToCards, cardFlags, type SiteConfigData } from "@/lib/siteConfig";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGripVertical,
  faEye,
  faEyeSlash,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

library.add(fas);

function CardView({
  card,
  isAdmin,
  hidden,
  innerRef,
  onHandlePointerDown,
  onToggleHide,
  floating
}: any) {
  // A bad icon name renders nothing (FontAwesome warns); fall back so the slot
  // never collapses while the admin is typing a new name.
  const iconName = card.fontAwesomeIcon || "star";

  const body = (
    <>
      {isAdmin && (
        <div className={styles.adminOverlay}>
          {onHandlePointerDown && (
            <button
              type="button"
              className={styles.dragHandle}
              aria-label="Drag to reorder"
              onPointerDown={onHandlePointerDown}
            >
              <FontAwesomeIcon icon={faGripVertical} />
            </button>
          )}
          <button
            type="button"
            className={hidden ? "" : styles.flagActive}
            aria-label={hidden ? "Show card" : "Hide card"}
            onClick={onToggleHide}
          >
            <FontAwesomeIcon icon={hidden ? faEyeSlash : faEye} />
          </button>
        </div>
      )}

      <div className={styles.quickLinkIcon}>
        <FontAwesomeIcon icon={["fas", iconName]} />
      </div>
      {isAdmin && (
        <p className={styles.adminFieldHint}>
          Icon:{" "}
          <EditableText model="PortfolioCard" id={card.id} field="fontAwesomeIcon" value={card.fontAwesomeIcon} editable>
            {card.fontAwesomeIcon}
          </EditableText>
        </p>
      )}

      <h3>
        <EditableText model="PortfolioCard" id={card.id} field="title" value={card.title} editable={isAdmin}>
          {card.title}
        </EditableText>
      </h3>
      <p className={styles.description}>
        <EditableText model="PortfolioCard" id={card.id} field="description" value={card.description} editable={isAdmin} multiline>
          {card.description}
        </EditableText>
      </p>
      <p className={styles.shortDescription}>
        <EditableText model="PortfolioCard" id={card.id} field="shortDescription" value={card.shortDescription} editable={isAdmin} multiline>
          {card.shortDescription}
        </EditableText>
      </p>

      {isAdmin ? (
        <div className={styles.adminLinkBlock}>
          <span className={styles.linkPreview}>
            <EditableText model="PortfolioCard" id={card.id} field="linkText" value={card.linkText} editable>
              {card.linkText}
            </EditableText>
          </span>
          <p className={styles.adminFieldHint}>
            Links to:{" "}
            <EditableText model="PortfolioCard" id={card.id} field="link" value={card.link} editable>
              {card.link}
            </EditableText>
          </p>
        </div>
      ) : (
        <Link href={card.link}>{card.linkText}</Link>
      )}
    </>
  );

  return (
    <div
      ref={innerRef}
      className={`${styles.quickLinkCard} ${isAdmin ? styles.adminCard : ""} ${
        hidden ? styles.hiddenCard : ""
      } ${floating ? styles.floating : ""}`}
    >
      {body}
    </div>
  );
}

export default function Portfolio({ className, cards, description, config, isAdmin = false }: any) {
  const router = useRouter();
  const [cfg, setCfg] = useState<SiteConfigData>(config);
  const [items, setItems] = useState<Card[]>(() => applyConfigToCards(cards, config, isAdmin));
  const [creating, setCreating] = useState(false);
  const cfgRef = useRef(cfg);

  useEffect(() => { cfgRef.current = cfg; }, [cfg]);
  // Re-derive from the server only when fresh props arrive (refresh/navigation).
  useEffect(() => {
    setCfg(config);
    setItems(applyConfigToCards(cards, config, isAdmin));
  }, [cards, config, isAdmin]);

  async function persist(next: SiteConfigData) {
    setCfg(next);
    const result = await saveConfig(next);
    if ("error" in result) {
      alert(`Save failed: ${result.error}`);
      router.refresh();
    }
  }

  function toggleHide(id: string) {
    const current = cardFlags(cfgRef.current, id);
    persist({
      ...cfgRef.current,
      portfolioCards: { ...cfgRef.current.portfolioCards, [id]: { hidden: !current.hidden } }
    });
  }

  async function addCard() {
    setCreating(true);
    const result = await createPortfolioCard();
    setCreating(false);
    if ("error" in result) {
      alert(`Couldn't add card: ${result.error}`);
    } else {
      const nextItems = [...items, result.card];
      setItems(nextItems);
      persist({ ...cfgRef.current, portfolioCardOrder: nextItems.map((c) => c.id) });
    }
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
              onToggleHide={() => toggleHide(card.id)}
            />
          )
        )}

        {isAdmin && (
          <button
            type="button"
            className={styles.addCardButton}
            onClick={addCard}
            disabled={creating}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>{creating ? "Adding…" : "Add card"}</span>
          </button>
        )}
      </div>

      {draggingCard && isAdmin && (
        <div className={styles.floatingLayer} style={drag.floatingStyle}>
          <CardView card={draggingCard} isAdmin floating hidden={cardFlags(cfg, draggingCard.id).hidden} />
        </div>
      )}
    </div>
  );
}
