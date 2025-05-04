import styles from "./NavBar.module.scss";
import Link from "next/link";

export default function NavBar() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Alex<span>Martin</span></div>
      <nav className={styles.nav}>
        <Link href={""} className={`${styles.nav_item} ${styles.active}`}><p>Home</p></Link>
        <Link href={""} className={styles.nav_item}><p>Projects</p></Link>
        <Link href={""} className={styles.nav_item}><p>Skills</p></Link>
        <Link href={""} className={styles.nav_item}><p>Experience</p></Link>
        <Link href={""} className={styles.nav_item}><p>Contact</p></Link>
      </nav>
    </header>
  );
}