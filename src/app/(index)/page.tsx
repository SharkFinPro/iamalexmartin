import styles from "./index.module.scss";
import Landing from "./Landing";
import Portfolio from "./Portfolio";

export default function Page() {
  return <>
    <Landing className={`${styles.wrapper} ${styles.homepage}`} />

    <Portfolio className={`${styles.wrapper} ${styles.welcome}`} />
  </>
}