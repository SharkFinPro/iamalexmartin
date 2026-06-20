import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuoteLeft,
  faCircleInfo,
  faCircleCheck,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { CalloutBlock, CalloutVariant } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

// Each variant pairs an icon with a visible label so the meaning is never
// conveyed by colour alone (WCAG 1.4.1).
const VARIANTS: Record<CalloutVariant, { icon: IconDefinition; label: string; cls: string }> = {
  quote: { icon: faQuoteLeft, label: "Quote", cls: styles.calloutQuote },
  info: { icon: faCircleInfo, label: "Note", cls: styles.calloutInfo },
  success: { icon: faCircleCheck, label: "Success", cls: styles.calloutSuccess },
  warning: { icon: faTriangleExclamation, label: "Warning", cls: styles.calloutWarning }
};

/**
 * A pull quote or highlighted note. Quotes render as a semantic
 * <blockquote><cite>; status variants get an icon + visible label.
 */
export default function Callout({ block }: { block: CalloutBlock }) {
  const variant = VARIANTS[block.variant] ?? VARIANTS.info;

  if (block.variant === "quote") {
    return (
      <section className={`${styles.block} ${styles.measure}`}>
        <blockquote className={variant.cls}>
          <span className={styles.quoteMark} aria-hidden>
            &ldquo;
          </span>
          <p className={styles.calloutText}>{block.text}</p>
          {block.attribution && <cite className={styles.calloutCite}>{block.attribution}</cite>}
        </blockquote>
      </section>
    );
  }

  return (
    <section className={`${styles.block} ${styles.measure}`}>
      <div className={`${styles.callout} ${variant.cls}`} role="note">
        <FontAwesomeIcon icon={variant.icon} className={styles.calloutIcon} aria-hidden />
        <div>
          <p className={styles.calloutLabel}>{variant.label}</p>
          <p className={styles.calloutText}>{block.text}</p>
        </div>
      </div>
    </section>
  );
}
