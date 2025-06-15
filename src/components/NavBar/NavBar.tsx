import styles from "./NavBar.module.scss";
import Link from "next/link";
import Navigation from "./Navigation";

export default function NavBar() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Alex<span>Martin</span>
      </Link>
      <Navigation />
    </header>
  );
}