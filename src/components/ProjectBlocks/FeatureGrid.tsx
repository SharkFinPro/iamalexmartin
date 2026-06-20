import type { FeatureGridBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/**
 * Features / capabilities as a responsive card grid — the styled alternative to a
 * plain bullet list, so short lists fill horizontal space instead of stacking into
 * a thin sliver. Hierarchy comes from a top accent hairline and type weight rather
 * than icons or index numerals. When no item has a description the grid uses compact
 * tiles (more columns); when any do, it uses larger cards. Semantic <ol> + <h3> per
 * item keeps it readable to assistive tech.
 */
export default function FeatureGrid({ block }: { block: FeatureGridBlock }) {
  const hasDescriptions = block.items.some((i) => i.description);

  return (
    <section className={`${styles.block} ${styles.wide}`}>
      {block.heading && <h2 className={styles.blockHeading}>{block.heading}</h2>}
      <ol className={`${styles.featureGrid} ${hasDescriptions ? styles.featureCards : styles.featureTiles}`}>
        {block.items.map((item, i) => (
          <li key={i} className={styles.featureItem}>
            <span className={styles.featureAccent} aria-hidden />
            <div className={styles.featureBody}>
              <h3 className={styles.featureTitle}>{item.title}</h3>
              {item.description && <p className={styles.featureDesc}>{item.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
