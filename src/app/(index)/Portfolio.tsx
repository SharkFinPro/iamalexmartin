"use client";
import styles from "./portfolio.module.scss";
import Link from "next/link";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faDesktop, faFileCode } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";

export default function Portfolio({ className }) {
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

  const cards = [
    {
      icon: <FontAwesomeIcon icon={faCube} />,
      header: "Graphics Programming",
      description: "Check out my work in high-performance graphics using C++, Vulkan, and GLSL to create stunning visual experiences.",
      shortDescription: "Real-time rendering engines and visual simulations",
      link: "/projects?projectType=graphics",
      linkText: "View Projects"
    },
    {
      icon: <FontAwesomeIcon icon={faDesktop} />,
      header: "Web Development",
      description: "Browse my web development projects built with React, Next.js, and other modern frameworks for dynamic, interactive web apps",
      shortDescription: "Interactive websites and full-stack web apps",
      link: "/projects?projectType=web",
      linkText: "View Projects"
    },
    {
      icon: <FontAwesomeIcon icon={faFileCode} />,
      header: "Technical Blog",
      description: "Read articles where I share insights, experiments, and lessons learned across various computer science topics.",
      shortDescription: "Insights on graphics, systems, and development",
      link: "/blog",
      linkText: "Read Articles"
    }
  ];

  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>Welcome to My Portfolio</h2>
      <p className={styles.sectionDescription}>Explore my work and skills</p>

      <div className={styles.quickLinks}>
        {cards.map(({ icon, header, description, shortDescription, link, linkText}) => (
          <div key={header} className={styles.quickLinkCard}>
            <div className={styles.quickLinkIcon}>{icon}</div>
            <h3>{header}</h3>
            <p>{isMobile ? shortDescription : description}</p>

            <Link href={link}>{linkText}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}