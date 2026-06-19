import styles from "./featured.module.scss";
import Link from "next/link";
import Image from "next/image";

export default function FeaturedProjects({ className, projects }) {
  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>Featured Projects</h2>
      <p className={styles.sectionDescription}>A selection of work I&apos;m most proud of.</p>

      <div className={styles.cards}>
        {projects.map((project) => (
          <Link key={project.slug} href={`/projects/${project.slug}`} className={styles.card}>
            <div className={styles.thumbnail}>
              {project.image && (
                <Image
                  src={project.image.url}
                  alt={project.title}
                  className={styles.thumbnailImage}
                  width={800}
                  height={400}
                />
              )}
            </div>
            <div className={styles.body}>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
