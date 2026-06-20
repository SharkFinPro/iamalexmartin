import type { StatsBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/**
 * Impact metrics as a "spec band": oversized display numerals, each with an accent
 * tick above and a monospace label below. Rendered as a <dl> so each value is tied
 * to its label for screen readers. The band auto-fits and reflows to fewer columns.
 */
export default function Stats({ block }: { block: StatsBlock }) {
  return (
    <section className={`${styles.block} ${styles.wide}`}>
      {block.heading && <h2 className={styles.blockHeading}>{block.heading}</h2>}
      <dl className={styles.statsRow}>
        {block.items.map((item, i) => (
          <div key={i} className={styles.statItem}>
            <dt className={styles.statValue}>{item.value}</dt>
            <dd className={styles.statLabel}>
              <span className={styles.statLabelText}>{item.label}</span>
              {item.caption && <span className={styles.statCaption}>{item.caption}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
