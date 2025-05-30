import styles from "./Footer.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.social}>
          <p>Alexander Martin</p>
          <div className={styles.icons}>
            <Link href="https://github.com/SharkFinPro"><FontAwesomeIcon icon={faGithub} /></Link>
            <Link href="https://www.linkedin.com/in/iamalexmartin/"><FontAwesomeIcon icon={faLinkedin} /></Link>
          </div>
        </div>
        <div className={styles.navigate}>
          <h3>Navigate</h3>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/projects">Projects</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className={styles.projects}>
          <h3>Projects</h3>
          <ul>
            <li><Link href="/projects?projectType=graphics">Graphics</Link></li>
            <li><Link href="/projects?projectType=web">Web</Link></li>
          </ul>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>&copy; 2025 <span>Alexander Martin</span>.</p>
      </div>
    </footer>
  );
};