import styles from "./portfolio.module.scss";
import Link from "next/link";
import EditableText from "@/components/EditableText";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

library.add(fas);

export default function Portfolio({ className, cards, description, isAdmin = false }) {
  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>
        <EditableText model="Description" id={description.id} field="header" value={description.header} editable={isAdmin}>
          {description.header}
        </EditableText>
      </h2>
      <p className={styles.sectionDescription}>
        <EditableText model="Description" id={description.id} field="description" value={description.description} editable={isAdmin} multiline>
          {description.description}
        </EditableText>
      </p>

      <div className={styles.quickLinks}>
        {cards.map((card) => (
          <div key={card.id} className={styles.quickLinkCard}>
            <div className={styles.quickLinkIcon}>
              <FontAwesomeIcon icon={['fas', card.fontAwesomeIcon]} />
            </div>
            <h3>
              <EditableText model="PortfolioCard" id={card.id} field="title" value={card.title} editable={isAdmin}>
                {card.title}
              </EditableText>
            </h3>
            <p className={styles.description}>
              <EditableText model="PortfolioCard" id={card.id} field="description" value={card.description} editable={isAdmin} multiline>
                {card.description}
              </EditableText>
            </p>
            <p className={styles.shortDescription}>
              <EditableText model="PortfolioCard" id={card.id} field="shortDescription" value={card.shortDescription} editable={isAdmin} multiline>
                {card.shortDescription}
              </EditableText>
            </p>

            <Link href={card.link}>
              <EditableText model="PortfolioCard" id={card.id} field="linkText" value={card.linkText} editable={isAdmin}>
                {card.linkText}
              </EditableText>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}