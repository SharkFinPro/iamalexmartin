import styles from "./portfolio.module.scss";
import Link from "next/link";

export default function Portfolio({ className }) {
  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>Welcome to My Portfolio</h2>
      <p className={styles.sectionDescription}>Explore my work and skills</p>

      <div className={styles.quickLinks}>
        <div className={styles.quickLinkCard}>
          <div className={styles.quickLinkIcon}>🌌️</div>
          <h3>Graphics Programming</h3>
          <p>Check out my work in high-performance graphics using C++, Vulkan, and GLSL to create stunning visual experiences.</p>

          <Link href={"/projects"}>View Projects</Link>
        </div>

        <div className={styles.quickLinkCard}>
          <div className={styles.quickLinkIcon}>💻</div>
          <h3>Web Development</h3>
          <p>Browse my web development projects built with React, Next.js, and other modern frameworks for dynamic, interactive web apps.</p>

          <Link href={"/projects"}>View Projects</Link>
        </div>

        <div className={styles.quickLinkCard}>
          <div className={styles.quickLinkIcon}>📝</div>
          <h3>Technical Blog</h3>
          <p>Read articles where I share insights, experiments, and lessons learned across various computer science topics.</p>

          <Link href={"/blog"}>View Projects</Link>
        </div>
      </div>
    </div>
  );
}