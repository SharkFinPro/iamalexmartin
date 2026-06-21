"use client";
import { camelCaseToSentence } from "@/utils/string";
import styles from "./projects.module.scss";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProjectsBody from "./ProjectsBody";

/**
 * Skeleton card grid shown by the Suspense fallback while the streamed projects
 * list resolves. Only the cards animate — the banner and filter above are
 * already on screen. Reuses the real `.cards`/`.card` box metrics so the live
 * cards swap in without shifting the layout.
 */
function CardsSkeleton() {
  return (
    <div className={styles.cards} role="status" aria-label="Loading projects">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.skeletonCard} aria-hidden>
          <div className={styles.skeletonThumb} />
          <div className={styles.skeletonBody}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineTitle}`} />
            <div className={styles.skeletonLine} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            <div className={styles.skeletonButton} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Page shell for /projects. Renders the type filter immediately (it only needs
 * the fast `enumValues` meta), then streams the heavier card grid in beneath it
 * via a Suspense boundary around `ProjectsBody`.
 */
export default function Projects({
  projectsPromise,
  enumValues,
  config,
  isAdmin = false,
  initialProjectType = "all"
}: any) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Seeded from the server-resolved query param so the right tab is active on
  // first paint; the effect below keeps it in sync with client-side navigation.
  const [projectType, setProjectType] = useState<string>(initialProjectType);

  useEffect(() => {
    const queriedProjectType = searchParams.get("projectType");

    function isValidProjectType() {
      return queriedProjectType &&
             enumValues.some((enumType: any) => enumType.name === queriedProjectType);
    }

    setProjectType(isValidProjectType() ? queriedProjectType! : "all");
  }, [searchParams, enumValues]);

  function changeProjectType(type: string) {
    const url = type === "all" ? "/projects" : `?projectType=${type}`;
    router.push(url, { scroll: false });

    setProjectType(type);
  }

  // Sliding indicator for the type filter: measure the active button's box and
  // expose it as CSS vars on the track so the thumb can transition between them.
  const selectorRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const track = selectorRef.current;
    if (!track) return;

    function measure() {
      const trackEl = selectorRef.current;
      if (!trackEl) return;
      const active = trackEl.querySelector<HTMLButtonElement>("[data-active='true']");
      if (!active) return;
      setIndicator({ left: active.offsetLeft, width: active.offsetWidth });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [projectType, enumValues]);

  // Ordered list of filter values for roving keyboard navigation.
  const typeValues: string[] = ["all", ...enumValues.map((t: any) => t.name)];

  function onSelectorKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const current = typeValues.indexOf(projectType);
    let next = current;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (current + 1) % typeValues.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (current - 1 + typeValues.length) % typeValues.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = typeValues.length - 1;

    const value = typeValues[next];
    changeProjectType(value);
    selectorRef.current
      ?.querySelector<HTMLButtonElement>(`[data-value='${value}']`)
      ?.focus();
  }

  return (
    <main className={styles.container} id="main-content" tabIndex={-1}>
      <div
        ref={selectorRef}
        className={styles.projectTypeSelector}
        role="tablist"
        aria-label="Filter projects by type"
        onKeyDown={onSelectorKeyDown}
        style={indicator ? {
          ["--indicator-left" as any]: `${indicator.left}px`,
          ["--indicator-width" as any]: `${indicator.width}px`
        } : undefined}
      >
        {indicator && <span className={styles.indicator} aria-hidden="true" />}
        <button
          role="tab"
          id="projects-tab-all"
          aria-controls="projects-panel"
          data-value="all"
          data-active={projectType === "all"}
          aria-selected={projectType === "all"}
          tabIndex={projectType === "all" ? 0 : -1}
          className={projectType === "all" ? styles.selectedProjectType : ""}
          onClick={() => changeProjectType("all")}>
          All Projects
        </button>
        {enumValues
          .map((type : any) => (
            <button key={type.name}
              role="tab"
              id={`projects-tab-${type.name}`}
              aria-controls="projects-panel"
              data-value={type.name}
              data-active={projectType === type.name}
              aria-selected={projectType === type.name}
              tabIndex={projectType === type.name ? 0 : -1}
              className={projectType === type.name ? styles.selectedProjectType : ""}
              onClick={()=> changeProjectType(type.name)}>
              {camelCaseToSentence(type.name)}
            </button>
          ))}
      </div>

      <Suspense fallback={<CardsSkeleton />}>
        <ProjectsBody
          projectsPromise={projectsPromise}
          projectType={projectType}
          enumValues={enumValues}
          config={config}
          isAdmin={isAdmin}
        />
      </Suspense>
    </main>
  );
}
