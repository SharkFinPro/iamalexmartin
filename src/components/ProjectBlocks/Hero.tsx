import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import type { HeroBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/** Split "Label: Value" into its parts; falls back to the whole string as value. */
function splitFact(fact: string): { label?: string; value: string } {
  const i = fact.indexOf(":");
  if (i === -1) return { value: fact.trim() };
  return { label: fact.slice(0, i).trim(), value: fact.slice(i + 1).trim() };
}

/**
 * Project hero. Renders below the page Banner (which owns the single <h1>), so the
 * headline is an <h2>. Bold display headline + monospace eyebrow + summary (the
 * "intro"), an optional framed lead image, then a "spec strip" of key facts and
 * action buttons (the "details").
 *
 * DOM order is intro → image → details, which is exactly the stacked mobile order
 * (image sits between the summary and the facts/buttons). On wider screens the
 * grid areas pull the image into its own right-hand column spanning both text
 * rows, so the intro and details stack on the left beside it.
 */
export default function Hero({ block }: { block: HeroBlock }) {
  const hasImage = !!block.image?.src;
  const hasFacts = !!block.roleItems && block.roleItems.length > 0;
  const hasActions = !!block.actions && block.actions.length > 0;

  return (
    <section className={`${styles.block} ${styles.hero} ${hasImage ? styles.heroSplit : ""}`}>
      <div className={styles.heroIntro}>
        {block.eyebrow && (
          <p className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowTick} aria-hidden />
            {block.eyebrow}
          </p>
        )}
        <h2 className={styles.heroHeadline}>{block.headline}</h2>
        {block.summary && <p className={styles.heroSummary}>{block.summary}</p>}
      </div>

      {block.image?.src && (
        <div className={styles.heroMedia}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.image.src}
            alt={block.image.alt ?? ""}
            width={block.image.width}
            height={block.image.height}
            loading="eager"
          />
        </div>
      )}

      {(hasFacts || hasActions) && (
        <div className={styles.heroDetails}>
          {hasFacts && (
            <dl className={styles.heroFacts}>
              {block.roleItems!.map((item, i) => {
                const { label, value } = splitFact(item);
                return (
                  <div key={i} className={styles.heroFact}>
                    {label && <dt className={styles.heroFactLabel}>{label}</dt>}
                    <dd className={styles.heroFactValue}>{value}</dd>
                  </div>
                );
              })}
            </dl>
          )}

          {hasActions && (
            <div className={styles.heroActions}>
              {block.actions!.map((action, i) => {
                const external = /^https?:\/\//i.test(action.href);
                const primary = i === 0;
                return (
                  <a
                    key={i}
                    href={action.href}
                    className={primary ? styles.heroActionPrimary : styles.heroActionSecondary}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {action.label}
                    <FontAwesomeIcon
                      icon={external ? faArrowUpRightFromSquare : faArrowRight}
                      className={styles.heroActionIcon}
                      aria-hidden
                    />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
