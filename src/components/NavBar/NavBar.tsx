"use client";
import styles from "./NavBar.module.scss";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Projects", path: "/projects" },
    { label: "Blog", path: "/blog" },
    { label: "Contact", path: "/contact" }
  ];

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Alex<span>Martin</span>
      </Link>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.path}
            className={`${styles.nav_item} ${pathname === item.path ? styles.active : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <nav className={styles.navSmall}>
        <FontAwesomeIcon icon={faBars} className={styles.navSmallBars} />
      </nav>
    </header>
  );
}