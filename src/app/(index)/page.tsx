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

      {/**/}
      <div>
        <h2>Hello, World!</h2>
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