import styles from "./index.module.css";

export default function Page() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.headerWrapper}>
        <div className={styles.headerContainer}>
          <h1>Alex Martin</h1>
        </div>
      </div>
      <div>
        <h2>Hello, World!</h2>
      </div>

      <div className={styles.navOverlayWrapper}>
        <div className={styles.navOverlayContainer}>
          <a href="">navigation</a>
        </div>
      </div>
    </div>
  );
}