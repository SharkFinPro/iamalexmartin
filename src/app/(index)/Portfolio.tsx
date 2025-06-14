"use client";
import styles from "./portfolio.module.scss";
import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect } from "react";

library.add(fas);

export default function Portfolio({ className, cards, description }) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen width is less than 500px
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 500);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Clean up event listener
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>{description.header}</h2>
      <p className={styles.sectionDescription}>{description.description}</p>

      <div className={styles.quickLinks}>
        {cards.map(({ fontAwesomeIcon, title, description, shortDescription, link, linkText}) => (
          <div key={title} className={styles.quickLinkCard}>
            <div className={styles.quickLinkIcon}>
              <FontAwesomeIcon icon={['fas', fontAwesomeIcon]} />
            </div>
            <h3>{title}</h3>
            <p>{isMobile ? shortDescription : description}</p>

            <Link href={link}>{linkText}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}