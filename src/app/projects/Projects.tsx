"use client";
import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from 'next/navigation'

import tpImg from "../../public/images/tp.png";
import vkImg from "../../public/images/vk.png";
import ecsImg from "../../public/images/ecs.png";
import platformerImg from "../../public/images/platformer.png";
import alaskaclaveImg from "../../public/images/alaskaclave.png";

function ProjectCard({ project }) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        {project.image && (
          <Image
            src={project.image}
            alt={project.title}
            className={styles.thumbnailImage}
          />
        )}
        <h3>{project.name}</h3>
      </div>

      <div className={styles.cardContainer}>
        <h3>{project.name}</h3>
        <p>{project.description}</p>

        <ul>
          {project.tags.map(tag => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>

        <Link href={`/projects/${project.name}`}>View Details</Link>
      </div>
    </div>
  );
}

export default function Projects() {
  const projects = [
    {
      name: "ECS3D",
      description: "A modular 3D game engine with an Entity Component System architecture, physics simulation, and Vulkan rendering.",
      tags: ["C++", "Vulkan", "ECS", "Physics"],
      image: ecsImg,
      type: "graphics"
    },
    {
      name: "Vulkan Renderer",
      description: "High-performance real-time 3D renderer with compute and graphics pipelines for optimized particle simulation.",
      tags: ["C++", "Vulkan", "GLSL", "Compute Shaders"],
      image: vkImg,
      type: "graphics"
    },
    {
      name: "Conclave Website",
      description: "Official event website built with Gatsby, CSS, and Netlify, serving over 100 attendees with dynamic content.",
      tags: ["Gatsby", "CSS", "Contentful", "MongoDB"],
      image: alaskaclaveImg,
      type: "web"
    },
    {
      name: "Trading Post Web App",
      description: "Full-stack application with Next.js, React, and SQL to streamline order tracking and inventory management.",
      tags: ["Next.js", "React", "SQL", "Admin Dashboard"],
      image: tpImg,
      type: "web"
    },
    {
      name: "Platformer",
      description: "A 2D Platformer Built with a Custom C++ Entity Framework and SFML",
      tags: ["C++", "SFML", "Platformer"],
      image: platformerImg,
      type: "graphics"
    }
  ];

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
            <ProjectCard project={project} key={project.name}/>
          ))}
      </div>
    </div>
  );
}