"use client";
import { camelCaseToSentence } from "@/utils/string";
import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faStar, faEye, faEyeSlash, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import EditableText from "@/components/EditableText";
import { saveConfig } from "@/app/admin/contentActions";
import { projectFlags, type SiteConfigData } from "@/lib/siteConfig";

function ProjectCard({ project, priority, isAdmin, flags, onToggle, dragHandlers }) {
  const hidden = isAdmin && !flags.visible;

  return (
    <div
      className={`${styles.card} ${hidden ? styles.hiddenCard : ""}`}
      draggable={isAdmin && !!dragHandlers}
      {...(dragHandlers || {})}
    >
      <div className={styles.thumbnail}>
        {project.image && (
          <Image
            src={project.image.url}
            alt={project.title}
            className={styles.thumbnailImage}
            width={800}
            height={400}
            priority={priority}
          />
        )}
        <h2>{project.title}</h2>

        {isAdmin && (
          <div className={styles.adminOverlay}>
            {dragHandlers && (
              <span className={styles.dragHandle} aria-label="Drag to reorder">
                <FontAwesomeIcon icon={faGripVertical} />
              </span>
            )}
            <button
              type="button"
              className={flags.featured ? styles.flagActive : ""}
              aria-label="Toggle featured"
              onClick={() => onToggle(project.slug, "featured")}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
            <button
              type="button"
              className={flags.visible ? styles.flagActive : ""}
              aria-label="Toggle visibility"
              onClick={() => onToggle(project.slug, "visible")}
            >
              <FontAwesomeIcon icon={flags.visible ? faEye : faEyeSlash} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.cardContainer}>
        <h3>
          <EditableText slug={project.slug} field="title" value={project.title} editable={isAdmin}>
            {project.title}
          </EditableText>
        </h3>
        <p>
          <EditableText slug={project.slug} field="description" value={project.description} editable={isAdmin} multiline>
            {project.description}
          </EditableText>
        </p>

        <ul>
          {project.tags.map(tag => (
            <li key={tag}><FontAwesomeIcon icon={faTag} />{tag}</li>
          ))}
        </ul>

        <Link href={`/projects/${project.slug}`}>View Details</Link>
      </div>
    </div>
  );
}

export default function Projects({ projects, config, isAdmin = false }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [projectType, setProjectType] = useState<string>("all");
  const [items, setItems] = useState<any[]>(projects.projects);
  const [cfg, setCfg] = useState<SiteConfigData>(config);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => setItems(projects.projects), [projects.projects]);
  useEffect(() => setCfg(config), [config]);

  useEffect(() => {
    const queriedProjectType = searchParams.get("projectType");

    function isValidProjectType() {
      return queriedProjectType &&
             projects["__type"].enumValues.some((enumType: any) => enumType.name === queriedProjectType)
    }

    setProjectType(isValidProjectType() ? queriedProjectType : "all");
  }, [searchParams, projects]);

  function changeProjectType(type: string) {
    const url = type === "all" ? "/projects" : `?projectType=${type}`;
    router.push(url, { scroll: false });

    setProjectType(type);
  }

  // Reordering is only meaningful (and unambiguous) when viewing all projects.
  const canReorder = isAdmin && projectType === "all";

  async function persist(next: SiteConfigData) {
    setCfg(next);
    const result = await saveConfig(next);
    if ("error" in result) {
      alert(`Save failed: ${result.error}`);
      router.refresh();
    }
  }

  function toggleFlag(slug: string, key: "visible" | "featured") {
    const current = projectFlags(cfg, slug);
    persist({
      ...cfg,
      projects: { ...cfg.projects, [slug]: { ...current, [key]: !current[key] } }
    });
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setItems(reordered);
    setDragIndex(null);
    persist({ ...cfg, projectOrder: reordered.map((p) => p.slug) });
  }

  const visible = items.filter(
    project => projectType === "all" || project.projectType.includes(projectType)
  );

  return (
    <div className={styles.container}>
      <div className={styles.projectTypeSelector}>
        <button className={projectType === "all" ? styles.selectedProjectType : ""}
                onClick={() => changeProjectType("all")}>
          All Projects
        </button>
        {projects["__type"].enumValues
          .map((type : any) => (
            <button key={type.name} className={projectType === type.name ? styles.selectedProjectType : ""}
              onClick={()=> changeProjectType(type.name)}>
              {camelCaseToSentence(type.name)}
            </button>
          ))}
      </div>

      <div className={styles.cards}>
        {visible.map((project, index) => (
          <ProjectCard
            project={project}
            key={project.slug}
            priority={index < 3}
            isAdmin={isAdmin}
            flags={projectFlags(cfg, project.slug)}
            onToggle={toggleFlag}
            dragHandlers={canReorder ? {
              onDragStart: () => setDragIndex(index),
              onDragOver: (e: React.DragEvent) => e.preventDefault(),
              onDrop: () => handleDrop(index)
            } : null}
          />
        ))}
      </div>
    </div>
  );
}
