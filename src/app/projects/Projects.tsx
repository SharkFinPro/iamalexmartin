"use client";
import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from 'next/navigation'

function camelCaseToSentence(str : string) {
  return str
    // Insert space before uppercase letters (but not at the start)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Insert space before numbers that follow letters
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    // Insert space before letters that follow numbers
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Capitalize the first letter
    .replace(/^./, match => match.toUpperCase());
}

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

  const searchParams = useSearchParams();

  const queriedProjectType = searchParams.get("projectType");

  function isValidProjectType() {
    return queriedProjectType !== null &&
           projects["__type"].enumValues.some((enumType: any) => enumType.name === queriedProjectType)
  }

  const [projectType, setProjectType] = useState<string>(isValidProjectType() ? queriedProjectType : "all");

  return (
    <div className={styles.container}>
      <div className={styles.projectTypeSelector}>
        <button className={projectType === "all" ? styles.selectedProjectType : ""}
                onClick={()=>setProjectType("all")}>
          All Projects
        </button>
        {projects["__type"].enumValues
          .map((type : any) => (
            <button key={type.name} className={projectType === type.name ? styles.selectedProjectType : ""}
              onClick={()=> setProjectType(type.name)}>
              {camelCaseToSentence(type.name)}
            </button>
          ))}
      </div>

      <div className={styles.cards}>
        {projects.projects
          .filter(project => projectType === "all" || project.projectType.includes(projectType))
          .map((project) => (
            <ProjectCard project={project} key={project.title}/>
          ))}
      </div>
    </div>
  );
}