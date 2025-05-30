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
          <span>Home</span>
          <span>Projects</span>
          <span>Blog</span>
          <span>Contact</span>
        </div>
        <div className={styles.projects}>
          <h3>Projects</h3>
          <span>Graphics</span>
          <span>Web</span>
        </div>
      </div>
    </footer>
  );
};