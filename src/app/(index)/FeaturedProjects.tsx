"use client";

import styles from "./featured.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import EditableText from "@/components/EditableText";
import { useDragReorder } from "@/components/useDragReorder";
import { saveConfig } from "@/app/admin/contentActions";
import { projectFlags, type SiteConfigData } from "@/lib/siteConfig";

function FeaturedCard({ project, isAdmin, innerRef, onHandlePointerDown, onUnfeature, floating }: any) {
  const thumbnail = (
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
      {isAdmin && (
        <div className={styles.adminOverlay}>
          {onHandlePointerDown && (
            <span className={styles.dragHandle} aria-label="Drag to reorder" onPointerDown={onHandlePointerDown}>
              <FontAwesomeIcon icon={faGripVertical} />
            </span>
          )}
          <button type="button" className={styles.flagActive} aria-label="Remove from featured" onClick={onUnfeature}>
            <FontAwesomeIcon icon={faStar} />
          </button>
        </div>
      )}
    </div>
  );

  // In admin mode the card is a div (so inline edit controls don't trigger
  // navigation); a "View Details" link is added instead.
  if (isAdmin) {
    return (
      <div ref={innerRef} className={`${styles.card} ${floating ? styles.floating : ""}`}>
        {thumbnail}
        <div className={styles.body}>
          <h3>
            <EditableText slug={project.slug} field="title" value={project.title} editable>
              {project.title}
            </EditableText>
          </h3>
          <p>
            <EditableText slug={project.slug} field="description" value={project.description} editable multiline>
              {project.description}
            </EditableText>
          </p>
          <Link href={`/projects/${project.slug}`} className={styles.viewLink}>View Details</Link>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/projects/${project.slug}`} className={styles.card}>
      {thumbnail}
      <div className={styles.body}>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <span className={styles.viewLink}>View Details</span>
      </div>
    </Link>
  );
}

export default function FeaturedProjects({ className, projects, config, isAdmin = false }: any) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>(projects);
  const [cfg, setCfg] = useState<SiteConfigData>(config);
  const cfgRef = useRef(cfg);

  useEffect(() => setItems(projects), [projects]);
  useEffect(() => setCfg(config), [config]);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

  async function persist(next: SiteConfigData) {
    setCfg(next);
    const result = await saveConfig(next);
    if ("error" in result) {
      alert(`Save failed: ${result.error}`);
      router.refresh();
    }
  }

  function unfeature(slug: string) {
    const current = projectFlags(cfgRef.current, slug);
    setItems((prev) => prev.filter((p) => p.slug !== slug));
    persist({
      ...cfgRef.current,
      projects: { ...cfgRef.current.projects, [slug]: { ...current, featured: false } }
    });
  }

  const drag = useDragReorder({
    items,
    setItems,
    getKey: (p) => p.slug,
    onCommit: (slugs) => persist({ ...cfgRef.current, featuredOrder: slugs })
  });

  const draggingProject = drag.draggingKey ? items.find((p) => p.slug === drag.draggingKey) : null;

  return (
    <div className={className}>
      <h2 className={styles.sectionHeader}>Featured Projects</h2>
      <p className={styles.sectionDescription}>A selection of work I&apos;m most proud of.</p>

      <div className={styles.cards}>
        {items.map((project, index) => (
          project.slug === drag.draggingKey ? (
            <div
              key={project.slug}
              className={styles.placeholder}
              style={{ width: drag.size.w, height: drag.size.h }}
            />
          ) : (
            <FeaturedCard
              key={project.slug}
              project={project}
              isAdmin={isAdmin}
              innerRef={drag.registerCard(project.slug)}
              onHandlePointerDown={
                isAdmin ? (e: React.PointerEvent) => drag.startDrag(index, project.slug, e) : undefined
              }
              onUnfeature={() => unfeature(project.slug)}
            />
          )
        ))}
      </div>

      {draggingProject && isAdmin && (
        <div className={styles.floatingLayer} style={drag.floatingStyle}>
          <FeaturedCard project={draggingProject} isAdmin floating onUnfeature={() => {}} />
        </div>
      )}
    </div>
  );
}
