import styles from "./landing.module.scss";
import Link from "next/link";

export default function Landing({ className }) {
  return (
    <div className={className}>
      <div className={styles.container}>
        <h1 className={styles.title}>Alexander Martin</h1>
        <p className={styles.description}>Full-stack developer specializing in interactive graphics and modern web systems, focusing on performance, accuracy, and clean, maintainable architecture.</p>

        <div className={styles.buttons}>
          <Link href={"/projects"} className={`${styles.homepageButton} ${styles.viewProjects}`}>View My Work</Link>
          <Link href={"/contact"} className={`${styles.homepageButton} ${styles.contactMe}`}>Contact Me</Link>
        </div>
      </div>
    </div>
  );
}