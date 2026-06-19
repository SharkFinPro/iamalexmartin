"use client";
import { camelCaseToSentence } from "@/utils/string";
import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTag, faStar, faEye, faEyeSlash, faGripVertical } from "@fortawesome/free-solid-svg-icons";
import EditableText from "@/components/EditableText";
import { saveConfig } from "@/app/admin/contentActions";
import { projectFlags, type SiteConfigData } from "@/lib/siteConfig";

function ProjectCard({ project, priority, isAdmin, flags, onToggle, onHandlePointerDown, innerRef, floating }: any) {
  const hidden = isAdmin && !flags.visible;

  return (
    <div
      ref={innerRef}
      className={`${styles.card} ${hidden ? styles.hiddenCard : ""} ${floating ? styles.floating : ""}`}
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
            {onHandlePointerDown && (
              <span
                className={styles.dragHandle}
                aria-label="Drag to reorder"
                onPointerDown={onHandlePointerDown}
              >
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

  // Drag state: which card is "in hand", where the cursor is, the grab offset
  // within the card, and the lifted card's size (so the placeholder + floating
  // clone match the original).
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragIndexRef = useRef<number | null>(null);
  const draggingSlugRef = useRef<string | null>(null);
  const itemsRef = useRef(items);
  const cfgRef = useRef(cfg);
  const pointerRef = useRef({ x: 0, y: 0 });
  const autoScrollRef = useRef<number | null>(null);

  useEffect(() => setItems(projects.projects), [projects.projects]);
  useEffect(() => setCfg(config), [config]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => { cfgRef.current = cfg; }, [cfg]);

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

  function registerCard(slug: string) {
    return (el: HTMLDivElement | null) => {
      if (el) {
        cardRefs.current.set(slug, el);
      } else {
        cardRefs.current.delete(slug);
      }
    };
  }

  function startDrag(index: number, slug: string, e: React.PointerEvent) {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();

    const el = cardRefs.current.get(slug);
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();

    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSize({ w: rect.width, h: rect.height });
    setPointer({ x: e.clientX, y: e.clientY });

    dragIndexRef.current = index;
    draggingSlugRef.current = slug;
    pointerRef.current = { x: e.clientX, y: e.clientY };
    setDraggingSlug(slug);
    startAutoScroll();
  }

  // Reorder the list so the lifted card moves into whichever slot the cursor is
  // over. Driven by both pointer moves and the auto-scroll loop.
  function reorderAt(x: number, y: number) {
    const from = dragIndexRef.current;
    if (from === null) {
      return;
    }
    const list = itemsRef.current;
    for (let i = 0; i < list.length; i++) {
      if (list[i].slug === draggingSlugRef.current) {
        continue;
      }
      const el = cardRefs.current.get(list[i].slug);
      if (!el) {
        continue;
      }
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        if (i !== from) {
          const next = [...list];
          const [moved] = next.splice(from, 1);
          next.splice(i, 0, moved);
          setItems(next);
          dragIndexRef.current = i;
        }
        break;
      }
    }
  }

  // While the card is in hand: follow the cursor and reorder live.
  function handlePointerMove(e: PointerEvent) {
    if (draggingSlugRef.current === null) {
      return;
    }
    pointerRef.current = { x: e.clientX, y: e.clientY };
    setPointer({ x: e.clientX, y: e.clientY });
    reorderAt(e.clientX, e.clientY);
  }

  // Scroll the page when the dragged card nears the top/bottom edge of the
  // viewport, ramping speed with proximity. Re-checks the drop slot each frame
  // so the order keeps updating while holding still at the edge.
  function startAutoScroll() {
    const EDGE = 90;        // px from edge where scrolling kicks in
    const MAX_SPEED = 18;   // px per frame at the very edge

    function step() {
      const { y, x } = pointerRef.current;
      const h = window.innerHeight;
      let dy = 0;

      if (y < EDGE) {
        dy = -MAX_SPEED * ((EDGE - y) / EDGE);
      } else if (y > h - EDGE) {
        dy = MAX_SPEED * ((y - (h - EDGE)) / EDGE);
      }

      if (dy !== 0) {
        window.scrollBy(0, dy);
        reorderAt(x, y);
      }

      autoScrollRef.current = requestAnimationFrame(step);
    }

    autoScrollRef.current = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }

  function handlePointerUp() {
    if (draggingSlugRef.current === null) {
      return;
    }
    stopAutoScroll();
    draggingSlugRef.current = null;
    dragIndexRef.current = null;
    setDraggingSlug(null);
    persist({ ...cfgRef.current, projectOrder: itemsRef.current.map((p) => p.slug) });
  }

  useEffect(() => {
    if (!draggingSlug) {
      return;
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      stopAutoScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingSlug]);

  const visible = items.filter(
    project => projectType === "all" || project.projectType.includes(projectType)
  );

  const draggingProject = draggingSlug ? items.find((p) => p.slug === draggingSlug) : null;

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
          project.slug === draggingSlug ? (
            // The lifted card leaves a gap here; the real card floats by the cursor.
            <div key={project.slug} className={styles.placeholder} style={{ height: size.h }} />
          ) : (
            <ProjectCard
              project={project}
              key={project.slug}
              innerRef={registerCard(project.slug)}
              priority={index < 3}
              isAdmin={isAdmin}
              flags={projectFlags(cfg, project.slug)}
              onToggle={toggleFlag}
              onHandlePointerDown={
                canReorder ? (e: React.PointerEvent) => startDrag(index, project.slug, e) : undefined
              }
            />
          )
        ))}
      </div>

      {draggingProject && (
        <div
          className={styles.floatingLayer}
          style={{
            left: pointer.x - offset.x,
            top: pointer.y - offset.y,
            width: size.w
          }}
        >
          <ProjectCard
            project={draggingProject}
            isAdmin={isAdmin}
            flags={projectFlags(cfg, draggingProject.slug)}
            onToggle={() => {}}
            floating
          />
        </div>
      )}
    </div>
  );
}
