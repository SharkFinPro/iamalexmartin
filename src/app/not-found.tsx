import Link from "next/link";
import type { Metadata } from "next";
import Banner from "@/components/Banner";
import styles from "./errorPage.module.scss";

export const metadata: Metadata = {
  title: "Page Not Found"
};

export default function NotFound() {
  return (
    <>
      <Banner
        title="404 — Page Not Found"
        description="This page doesn't exist, or it may have moved."
      />
      <main className={styles.container} id="main-content" tabIndex={-1}>
        <p className={styles.message}>
          The link may be outdated, or the address may have a typo.
          Everything worth seeing is still a click away.
        </p>
        <div className={styles.actions}>
          <Link href="/projects" className={`${styles.button} ${styles.primary}`}>
            Browse Projects
          </Link>
          <Link href="/" className={`${styles.button} ${styles.secondary}`}>
            Go Home
          </Link>
        </div>
      </main>
    </>
  );
}
