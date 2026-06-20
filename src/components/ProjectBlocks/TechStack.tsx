import type { TechStackBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/**
 * Technologies used, laid out as a spec table: each group is a row with its label
 * on the left and wrapping chips on the right (hairline-separated). This keeps
 * uneven groups tidy — a one-item group and a ten-item group sit on their own rows
 * instead of leaving a column gap. The label column is a <dt>, the chips a <ul>,
 * so the structure is announced. Rows stack (label above chips) on mobile.
 */
export default function TechStack({ block }: { block: TechStackBlock }) {
  return (
    <section className={`${styles.block} ${styles.wide}`}>
      {block.heading && <h2 className={styles.blockHeading}>{block.heading}</h2>}
      <dl className={styles.techTable}>
        {block.groups.map((group, i) => (
          <div key={i} className={styles.techRow}>
            <dt className={styles.techRowLabel}>{group.label}</dt>
            <dd className={styles.techRowItems}>
              <ul className={styles.techChips}>
                {group.items.map((item, j) => (
                  <li key={j} className={styles.techChip}>
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
