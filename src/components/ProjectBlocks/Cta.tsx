import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import type { CtaBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/**
 * Closing call-to-action: a short prompt and a styled button, in a tinted panel
 * so it reads as a deliberate end-cap rather than an orphaned link. Stacks on
 * mobile. External links open in a new tab and get the appropriate icon.
 */
export default function Cta({ block }: { block: CtaBlock }) {
  const external = /^https?:\/\//i.test(block.href);

  return (
    <section className={`${styles.block} ${styles.wide}`}>
      <div className={styles.cta}>
        {(block.heading || block.text) && (
          <div className={styles.ctaBody}>
            {block.heading && <p className={styles.ctaHeading}>{block.heading}</p>}
            {block.text && <p className={styles.ctaText}>{block.text}</p>}
          </div>
        )}
        <a
          href={block.href}
          className={styles.ctaButton}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {block.label}
          <FontAwesomeIcon
            icon={external ? faArrowUpRightFromSquare : faArrowRight}
            className={styles.ctaButtonIcon}
            aria-hidden
          />
        </a>
      </div>
    </section>
  );
}
