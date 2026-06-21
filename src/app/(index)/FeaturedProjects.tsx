"use client";

import styles from "./featured.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import EditableText from "@/components/EditableText";
import { useDragReorder } from "@/components/useDragReorder";
import { useReveal } from "@/components/useReveal";
import { useTilt } from "@/components/useTilt";
import { useSiteConfig } from "@/components/useSiteConfig";
import { projectFlags } from "@/lib/siteConfig";

function FeaturedCard({ project, isAdmin, innerRef, onHandlePointerDown, onHandleKeyDown, onUnfeature, floating, revealIndex }: any) {
  const tilt = useTilt();
  // Each visitor card observes itself, so it reveals exactly as it scrolls into
  // view (a single container observer would leave on-screen cards hidden until
  // the whole grid crossed the threshold). The full index drives a first-to-last
  // cascade when the grid enters the viewport together.
  const reveal = useReveal<HTMLDivElement>();
  const thumbnail = (
    <div className={styles.thumbnail}>
      {project.image && (
        <Image
          src={project.image.url}
          // Decorative: the project title is announced by the adjacent <h3>, so
          // an empty alt avoids a duplicate reading. WCAG 1.1.1.
          alt=""
          className={styles.thumbnailImage}
          width={800}
          height={400}
        />
      )}
      {isAdmin && (
        <div className={styles.adminOverlay}>
          {onHandlePointerDown && (
            <button
              type="button"
              className={styles.dragHandle}
              aria-label="Reorder project. Press arrow keys to move, or drag."
              onPointerDown={onHandlePointerDown}
              onKeyDown={onHandleKeyDown}
            >
              <FontAwesomeIcon icon={faGripVertical} />
            </button>
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
            <EditableText model="Project" id={project.id} field="title" value={project.title} editable>
              {project.title}
            </EditableText>
          </h3>
          <p>
            <EditableText model="Project" id={project.id} field="description" value={project.description} editable multiline>
              {project.description}
            </EditableText>
          </p>
          <Link href={`/projects/${project.slug}`} className={styles.viewLink}>View Details</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={reveal.ref}
      className={`reveal ${reveal.isVisible ? "is-visible" : ""} ${styles.card}`}
      style={{ ["--reveal-index" as any]: revealIndex ?? 0 }}
      {...tilt}
    >
      {thumbnail}
      <div className={styles.body}>
        <h3>{project.title}</h3>
        <p>{project.description}</p>
        <Link href={`/projects/${project.slug}`} className={styles.viewLink}>View Details</Link>
      </div>
    </div>
  );
}

export default function FeaturedProjects({ className, projects, description, config, isAdmin = false }: any) {
  const [items, setItems] = useState<any[]>(projects);
  const { cfg, cfgRef, persist } = useSiteConfig(config);

  // Header reveals on its own viewport entry; each card self-reveals (see
  // FeaturedCard). Admin views render statically so editing never re-hides them.
  const headerReveal = useReveal<HTMLHeadingElement>();
  const headerVisible = isAdmin || headerReveal.isVisible;

  useEffect(() => setItems(projects), [projects]);

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
      <h2
        ref={headerReveal.ref}
        className={`reveal ${headerVisible ? "is-visible" : ""} ${styles.sectionHeader}`}
      >
        <EditableText model="Description" id={description.id} field="header" value={description.header} editable={isAdmin}>
          {description.header}
        </EditableText>
      </h2>
      <p
        className={`reveal ${headerVisible ? "is-visible" : ""} ${styles.sectionDescription}`}
        style={{ ["--reveal-index" as any]: 1 }}
      >
        <EditableText model="Description" id={description.id} field="description" value={description.description} editable={isAdmin} multiline>
          {description.description}
        </EditableText>
      </p>

      {isAdmin && (
        <div className="srOnly" role="status" aria-live="polite">{drag.announcement}</div>
      )}

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
              revealIndex={index}
              innerRef={drag.registerCard(project.slug)}
              onHandlePointerDown={
                isAdmin ? (e: React.PointerEvent) => drag.startDrag(index, project.slug, e) : undefined
              }
              onHandleKeyDown={isAdmin ? drag.keyboardReorder(project.slug) : undefined}
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
