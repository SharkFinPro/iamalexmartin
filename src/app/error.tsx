"use client";

import Link from "next/link";
import Banner from "@/components/Banner";
import styles from "./errorPage.module.scss";

/**
 * Root error boundary: keeps unexpected failures (CMS outages, render bugs)
 * looking like part of the site instead of the framework's unstyled screen.
 * The root layout (nav + footer) stays mounted around it.
 */
export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Banner
        title="Something went wrong"
        description="An unexpected error occurred while loading this page."
      />
      <main className={styles.container} id="main-content" tabIndex={-1}>
        <p className={styles.message}>
          This is usually temporary — trying again often fixes it.
          {error?.digest && (
            <> If it keeps happening, mention error reference <code>{error.digest}</code>.</>
          )}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={reset}
            className={`${styles.button} ${styles.primary}`}
          >
            Try Again
          </button>
          <Link href="/" className={`${styles.button} ${styles.secondary}`}>
            Go Home
          </Link>
        </div>
      </main>
    </>
  );
}
