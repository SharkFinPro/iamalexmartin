import styles from "./index.module.css";

export default function Page() {
  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <header className={styles.headerWrapper}>
        <div className={styles.headerContainer}>
          <h1>Alex Martin</h1>
        </div>
      </header>

      {/* About */}
      <div className={styles.aboutWrapper}>
        <div className={styles.aboutContainer}>
          <h2>About</h2>
        </div>
      </div>

      {/* Projects */}
      <div className={styles.projectsWrapper}>
        <div className={styles.projectsContainer}>
          <h2>Projects</h2>
        </div>
      </div>

      {/* Navigation Overlay */}
      <nav className={styles.navOverlayWrapper}>
        <div className={styles.navOverlayContainer}>
          <a href="">navigation</a>
        </div>
      </nav>
    </div>
  );
}