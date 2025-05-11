import styles from "./portfolio.module.scss";
import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faDesktop, faFileCode } from "@fortawesome/free-solid-svg-icons";

export default function Portfolio({ className }) {
  const cards = [
    {
      icon: <FontAwesomeIcon icon={faCube} />,
      header: "Graphics Programming",
      description: "Check out my work in high-performance graphics using C++, Vulkan, and GLSL to create stunning visual experiences.",
      link: "/projects",
      linkText: "View Projects"
    },
    {
      icon: <FontAwesomeIcon icon={faDesktop} />,
      header: "Web Development",
      description: "Browse my web development projects built with React, Next.js, and other modern frameworks for dynamic, interactive web apps",
      link: "/projects",
      linkText: "View Projects"
    },
    {
      icon: <FontAwesomeIcon icon={faFileCode} />,
      header: "Technical Blog",
      description: "Read articles where I share insights, experiments, and lessons learned across various computer science topics.",
      link: "/blog",
      linkText: "Read Articles"
    }
  ];

  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>Welcome to My Portfolio</h2>
      <p className={styles.sectionDescription}>Explore my work and skills</p>

      <div className={styles.quickLinks}>
        {cards.map(({ icon, header, description, link, linkText}) => (
          <div key={header} className={styles.quickLinkCard}>
            <div className={styles.quickLinkIcon}>{icon}</div>
            <h3>{header}</h3>
            <p>{description}</p>

            <Link href={link}>{linkText}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}