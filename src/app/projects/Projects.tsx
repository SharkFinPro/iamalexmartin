import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";

import tpImg from "../../public/images/tp.png";
import vkImg from "../../public/images/vk.png";
import ecsImg from "../../public/images/ecs.png";

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
      image: ecsImg
    },
    {
      name: "Vulkan Renderer",
      description: "High-performance real-time 3D renderer with compute and graphics pipelines for optimized particle simulation.",
      tags: ["C++", "Vulkan", "GLSL", "Compute Shaders"],
      image: vkImg
    },
    {
      name: "Conclave Website",
      description: "Official event website built with Gatsby, CSS, and Netlify, serving over 100 attendees with dynamic content.",
      tags: ["Gatsby", "CSS", "Contentful", "MongoDB"],
    },
    {
      name: "Trading Post Web App",
      description: "Full-stack application with Next.js, React, and SQL to streamline order tracking and inventory management.",
      tags: ["Next.js", "React", "SQL", "Admin Dashboard"],
      image: tpImg
    },
    {
      name: "Platformer",
      description: "A 2D Platformer Built with a Custom C++ Entity Framework and SFML",
      tags: ["C++", "SFML", "Platformer"]
    }
  ];

  return (
    <div className={styles.container}>
      {/*<h3>All Projects</h3>*/}
      <h3></h3>

      <div className={styles.cards}>
        {projects.map((project) => (
          <ProjectCard project={project} key={project.name} />
        ))}
      </div>
    </div>
  );
}