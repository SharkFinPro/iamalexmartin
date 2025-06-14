import styles from "./landing.module.scss";
import Link from "next/link";

export default function Landing({ className, description }) {
  return (
    <div className={className}>
      <div className={styles.container}>
        <h1 className={styles.title}>Alexander Martin</h1>
        <p className={styles.description}>{description}</p>

        <div className={styles.buttons}>
          <Link href={"/projects"} className={`${styles.homepageButton} ${styles.viewProjects}`}>View My Work</Link>
          <Link href={"/contact"} className={`${styles.homepageButton} ${styles.contactMe}`}>Contact Me</Link>
        </div>
      </div>
    </div>
  );
}