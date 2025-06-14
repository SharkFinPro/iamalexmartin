import styles from "./portfolio.module.scss";
import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

library.add(fas);

export default function Portfolio({ className, cards, description }) {
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
            <p className={styles.description}>{description}</p>
            <p className={styles.shortDescription}>{shortDescription}</p>

            <Link href={link}>{linkText}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}