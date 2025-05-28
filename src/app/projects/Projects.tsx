"use client";
import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from 'next/navigation'

function ProjectCard({ project }) {
  return (
    <div className={styles.card}>
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
        <h3>{project.title}</h3>
      </div>

      <div className={styles.cardContainer}>
        <h3>{project.title}</h3>
        <p>{project.description}</p>

        <ul>
          {project.tags.map(tag => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <Link href={`/projects/${project.slug}`}>View Details</Link>
      </div>
    </div>
  );
}

export default function Projects({ projects }) {
  const validProjectTypes = ["all", "graphics", "web"];

  const searchParams = useSearchParams();

  const queriedProjectType = searchParams.get("projectType");

  const [projectType, setProjectType] = useState<string>(queriedProjectType !== null &&
                                                         validProjectTypes.includes(queriedProjectType) ?
                                                         queriedProjectType : "all");

  return (
    <div className={styles.container}>
      <div className={styles.projectTypeSelector}>
        <button className={projectType === "all" ? styles.selectedProjectType : ""}
                onClick={()=>setProjectType("all")}>
          All Projects
        </button>
        <button className={projectType === "graphics" ? styles.selectedProjectType : ""}
                onClick={()=>setProjectType("graphics")}>
          Graphics
        </button>
        <button className={projectType === "web" ? styles.selectedProjectType : ""}
                onClick={()=>setProjectType("web")}>
          Web Development
        </button>
      </div>

      <div className={styles.cards}>
        {projects
          .filter(project => projectType === "all" || projectType === project.type)
          .map((project) => (
            <ProjectCard project={project} key={project.title}/>
          ))}
      </div>
    </div>
  );
}