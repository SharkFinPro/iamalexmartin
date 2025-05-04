import styles from "./index.module.scss";
import Link from "next/link";

export default function Page() {
  return (
    <div className={styles.root}>
      <div className={`${styles.wrapper} ${styles.homepage}`}>
        <div className={styles.container}>
          <h1 className={styles.title}>Alexander Martin</h1>
          <p className={styles.description}>Computer Science Student specializing in high-performance graphics programming, game engine development, and computational optimization.</p>

          <div className={styles.buttons}>
            <button className={`${styles.homepageButton} ${styles.viewProjects}`}>View My Work</button>
            <button className={`${styles.homepageButton} ${styles.contactMe}`}>Contact Me</button>
          </div>
        </div>
      </div>

      <div className={`${styles.wrapper} ${styles.welcome}`}>
        <h2>Welcome to My Portfolio</h2>
        <p>Explore my work and skills</p>

        <div className={styles.quickLinks}>
          <div className={styles.quickLinkCard}>
            <div className={styles.quickLinkIcon}>🌌️</div>
            <h3>Graphics Programming</h3>
            <p>Check out my work in high-performance graphics using C++, Vulkan, and OpenGL to create stunning visual experiences.</p>

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
    </div>
  );
}