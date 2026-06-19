import Banner from "@/components/Banner";
import styles from "./media.module.scss";

// Shown while the server component fetches assets (force-dynamic => no cache).
export default function Loading() {
  return (
    <>
      <Banner
        title="Media Library"
        description="All images stored in the CMS. Viewing only for now."
      />
      <div className={styles.container}>
        <div className={styles.grid} aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      </div>
    </>
  );
}
