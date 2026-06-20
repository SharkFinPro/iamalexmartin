"use client";
import { camelCaseToSentence } from "@/utils/string";
import styles from "./projects.module.scss";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTag,
  faStar,
  faEye,
  faEyeSlash,
  faGripVertical,
  faBoxArchive,
  faRotateLeft,
  faImage,
  faPlus,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import EditableText from "@/components/EditableText";
import Modal from "@/components/Modal";
import AssetPicker from "@/components/RichTextEditor/AssetPicker";
import { useDragReorder } from "@/components/useDragReorder";
import { useTilt } from "@/components/useTilt";
import { useSiteConfig } from "@/components/useSiteConfig";
import {
  updateContentField,
  createProject,
  setProjectImage
} from "@/app/admin/contentActions";
import { projectFlags } from "@/lib/siteConfig";

/**
 * Tag pills for a project. Visitors see the original read-only chip list; admins
 * get the same chips with a per-tag remove (×) plus an inline "add tag" input.
 * Tags stay a plain string array on the Project (no Tag entity) — `onChange`
 * persists the full next array.
 */
function TagEditor({ project, isAdmin, onChange }: any) {
  const [draft, setDraft] = useState("");

  if (!isAdmin) {
    return (
      <ul>
        {project.tags.map((tag: string) => (
          <li key={tag}><FontAwesomeIcon icon={faTag} />{tag}</li>
        ))}
      </ul>
    );
  }

  function addTag() {
    const value = draft.trim();
    setDraft("");
    if (!value || project.tags.includes(value)) return;
    onChange(project, [...project.tags, value]);
  }

  function removeTag(tag: string) {
    onChange(project, project.tags.filter((t: string) => t !== tag));
  }

  return (
    <ul className={styles.tagEditorList}>
      {project.tags.map((tag: string) => (
        <li key={tag}>
          <FontAwesomeIcon icon={faTag} />{tag}
          <button
            type="button"
            className={styles.tagRemove}
            aria-label={`Remove tag ${tag}`}
            onClick={() => removeTag(tag)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </li>
      ))}
      <li className={styles.tagInputChip}>
        <input
          className={styles.tagInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            } else if (e.key === "Backspace" && draft === "" && project.tags.length) {
              removeTag(project.tags[project.tags.length - 1]);
            }
          }}
          onBlur={addTag}
          placeholder="Add tag…"
          aria-label="Add tag"
        />
      </li>
    </ul>
  );
}

function ProjectCard({
  project,
  priority,
  isAdmin,
  flags,
  enumValues,
  onToggle,
  onArchive,
  onEditImage,
  onToggleType,
  onTagsChange,
  onHandlePointerDown,
  innerRef,
  floating
}: any) {
  const hidden = isAdmin && !flags.visible;
  const archived = isAdmin && flags.archived;

  // Pointer tilt for visitors only (admin cards are draggable/editable).
  const tilt = useTilt();
  const tiltProps = isAdmin ? {} : tilt;

  return (
    <div
      ref={innerRef}
      className={`${styles.card} ${hidden ? styles.hiddenCard : ""} ${
        archived ? styles.archivedCard : ""
      } ${floating ? styles.floating : ""}`}
      {...tiltProps}
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
        {/* Decorative title overlay on the thumbnail — the real heading is the
            <h3> in the card body, so this is hidden from assistive tech to avoid
            announcing the title twice. */}
        <span className={styles.thumbTitle} aria-hidden="true">{project.title}</span>

        {isAdmin && (
          <div className={styles.adminOverlay}>
            {onHandlePointerDown && (
              <button
                type="button"
                className={styles.dragHandle}
                aria-label="Drag to reorder"
                onPointerDown={onHandlePointerDown}
              >
                <FontAwesomeIcon icon={faGripVertical} />
              </button>
            )}
            <button
              type="button"
              aria-label="Change image"
              title="Change image"
              onClick={() => onEditImage(project)}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>
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
            <button
              type="button"
              className={archived ? styles.flagActive : ""}
              aria-label={archived ? "Restore project" : "Archive project"}
              title={archived ? "Restore project" : "Archive project"}
              onClick={() => onArchive(project.slug, !archived)}
            >
              <FontAwesomeIcon icon={archived ? faRotateLeft : faBoxArchive} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.cardContainer}>
        <h3>
          <EditableText model="Project" id={project.id} field="title" value={project.title} editable={isAdmin}>
            {project.title}
          </EditableText>
        </h3>
        <p>
          <EditableText model="Project" id={project.id} field="description" value={project.description} editable={isAdmin} multiline>
            {project.description}
          </EditableText>
        </p>

        <TagEditor project={project} isAdmin={isAdmin} onChange={onTagsChange} />

        {isAdmin && (
          <div className={styles.typeChips}>
            {enumValues.map((type: any) => {
              const active = project.projectType.includes(type.name);
              return (
                <button
                  key={type.name}
                  type="button"
                  className={`${styles.typeChip} ${active ? styles.typeChipActive : ""}`}
                  onClick={() => onToggleType(project, type.name)}
                >
                  {camelCaseToSentence(type.name)}
                </button>
              );
            })}
          </div>
        )}

        <Link href={`/projects/${project.slug}`}>View Details</Link>
      </div>
    </div>
  );
}

export default function Projects({ projects, config, isAdmin = false }: any) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const enumValues = projects["__type"].enumValues;

  const [projectType, setProjectType] = useState<string>("all");
  const [items, setItems] = useState<any[]>(projects.projects);
  const { cfg, cfgRef, persist } = useSiteConfig(config);

  // Image picker (project being re-imaged) and the New Project modal.
  const [imageFor, setImageFor] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTypes, setNewTypes] = useState<string[]>([]);
  const [newImage, setNewImage] = useState<{ id: string; url: string } | null>(null);
  const [newImagePicker, setNewImagePicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const newProjectTitleId = useId();

  // Reset and dismiss the New Project dialog (shared by Cancel, Escape, and
  // scrim click so the form never retains stale input on the next open).
  function closeCreate() {
    setShowCreate(false);
    setNewTitle("");
    setNewSlug("");
    setNewTypes([]);
    setNewImage(null);
    setCreateError("");
  }

  useEffect(() => setItems(projects.projects), [projects.projects]);

  useEffect(() => {
    const queriedProjectType = searchParams.get("projectType");

    function isValidProjectType() {
      return queriedProjectType &&
             enumValues.some((enumType: any) => enumType.name === queriedProjectType)
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

  // Reordering is only meaningful (and unambiguous) when viewing all projects.
  const canReorder = isAdmin && projectType === "all";

  function toggleFlag(slug: string, key: "visible" | "featured") {
    const current = projectFlags(cfgRef.current, slug);
    persist({
      ...cfgRef.current,
      projects: { ...cfgRef.current.projects, [slug]: { ...current, [key]: !current[key] } }
    });
  }

  function setArchived(slug: string, archived: boolean) {
    const current = projectFlags(cfgRef.current, slug);
    persist({
      ...cfgRef.current,
      projects: { ...cfgRef.current.projects, [slug]: { ...current, archived } }
    });
  }

  async function toggleType(project: any, typeName: string) {
    const has = project.projectType.includes(typeName);
    const next = has
      ? project.projectType.filter((t: string) => t !== typeName)
      : [...project.projectType, typeName];

    setItems((prev) => prev.map((p) => (p.slug === project.slug ? { ...p, projectType: next } : p)));
    const result = await updateContentField("Project", project.id, "projectType", next);
    if ("error" in result) {
      alert(`Save failed: ${result.error}`);
      router.refresh();
    }
  }

  async function setTags(project: any, next: string[]) {
    setItems((prev) => prev.map((p) => (p.slug === project.slug ? { ...p, tags: next } : p)));
    const result = await updateContentField("Project", project.id, "tags", next);
    if ("error" in result) {
      alert(`Save failed: ${result.error}`);
      router.refresh();
    }
  }

  async function chooseImage(asset: any) {
    const target = imageFor;
    setImageFor(null);
    if (!target) return;

    setItems((prev) => prev.map((p) => (p.id === target.id ? { ...p, image: { url: asset.url } } : p)));
    const result = await setProjectImage(target.id, asset.id);
    if ("error" in result) {
      alert(`Couldn't set image: ${result.error}`);
      router.refresh();
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newImage) {
      setCreateError("Please choose an image.");
      return;
    }
    setCreating(true);
    setCreateError("");
    const result = await createProject(newTitle, newSlug, newTypes, newImage.id);
    if ("error" in result) {
      setCreating(false);
      setCreateError(result.error);
    } else {
      // Track it in the admin's order, then open it for inline fill-in.
      await persist({ ...cfgRef.current, projectOrder: [...cfgRef.current.projectOrder, result.slug] });
      router.push(`/projects/${result.slug}`);
    }
  }

  const drag = useDragReorder({
    items,
    setItems,
    getKey: (p) => p.slug,
    onCommit: (slugs) => persist({ ...cfgRef.current, projectOrder: slugs })
  });

  // Archived projects (admin only) are pulled out into their own section.
  const archivedItems = isAdmin
    ? items.filter((p) => projectFlags(cfg, p.slug).archived)
    : [];
  const activeItems = items.filter((p) => !projectFlags(cfg, p.slug).archived);
  const visible = activeItems.filter(
    project => projectType === "all" || project.projectType.includes(projectType)
  );

  const draggingProject = drag.draggingKey ? items.find((p) => p.slug === drag.draggingKey) : null;

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

      {isAdmin && (
        <div className={styles.adminToolbar}>
          <button type="button" className={styles.newProjectButton} onClick={() => setShowCreate(true)}>
            <FontAwesomeIcon icon={faPlus} /> New Project
          </button>
        </div>
      )}

      <div
        className={styles.cards}
        role="tabpanel"
        id="projects-panel"
        aria-labelledby={`projects-tab-${projectType}`}
      >
        {visible.map((project) => (
          project.slug === drag.draggingKey ? (
            // The lifted card leaves a gap here; the real card floats by the cursor.
            <div key={project.slug} className={styles.placeholder} style={{ height: drag.size.h }} />
          ) : (
            <ProjectCard
              project={project}
              key={project.slug}
              innerRef={drag.registerCard(project.slug)}
              priority={items.indexOf(project) < 3}
              isAdmin={isAdmin}
              flags={projectFlags(cfg, project.slug)}
              enumValues={enumValues}
              onToggle={toggleFlag}
              onArchive={setArchived}
              onEditImage={setImageFor}
              onToggleType={toggleType}
              onTagsChange={setTags}
              onHandlePointerDown={
                canReorder ? (e: React.PointerEvent) => drag.startDrag(items.indexOf(project), project.slug, e) : undefined
              }
            />
          )
        ))}
      </div>

      {isAdmin && archivedItems.length > 0 && (
        <details className={styles.archivedSection}>
          <summary>Archived projects ({archivedItems.length})</summary>
          <div className={styles.cards}>
            {archivedItems.map((project) => (
              <ProjectCard
                project={project}
                key={project.slug}
                isAdmin={isAdmin}
                flags={projectFlags(cfg, project.slug)}
                enumValues={enumValues}
                onToggle={toggleFlag}
                onArchive={setArchived}
                onEditImage={setImageFor}
                onToggleType={toggleType}
                onTagsChange={setTags}
              />
            ))}
          </div>
        </details>
      )}

      {draggingProject && (
        <div className={styles.floatingLayer} style={drag.floatingStyle}>
          <ProjectCard
            project={draggingProject}
            isAdmin={isAdmin}
            flags={projectFlags(cfg, draggingProject.slug)}
            enumValues={enumValues}
            onToggle={() => {}}
            onArchive={() => {}}
            onEditImage={() => {}}
            onToggleType={() => {}}
            onTagsChange={() => {}}
            floating
          />
        </div>
      )}

      {imageFor && (
        <AssetPicker
          title="Set project image"
          onSelect={chooseImage}
          onClose={() => setImageFor(null)}
        />
      )}

      {newImagePicker && (
        <AssetPicker
          title="Choose project image"
          onSelect={(asset) => {
            setNewImage({ id: asset.id, url: asset.url });
            setNewImagePicker(false);
          }}
          onClose={() => setNewImagePicker(false)}
        />
      )}

      {showCreate && (
        <Modal
          onClose={() => { if (!creating) closeCreate(); }}
          labelledBy={newProjectTitleId}
          overlayClassName={styles.modalOverlay}
          closeOnOverlayClick={!creating}
        >
          <form className={styles.modal} onSubmit={submitCreate}>
            <h2 className={styles.modalTitle} id={newProjectTitleId}>New Project</h2>

            <label className={styles.field}>
              <span>Title</span>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
            </label>

            <label className={styles.field}>
              <span>Slug</span>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="my-project"
                required
              />
            </label>

            <fieldset className={styles.field}>
              <span>Type</span>
              <div className={styles.typeChips}>
                {enumValues.map((type: any) => {
                  const active = newTypes.includes(type.name);
                  return (
                    <button
                      key={type.name}
                      type="button"
                      className={`${styles.typeChip} ${active ? styles.typeChipActive : ""}`}
                      onClick={() =>
                        setNewTypes((prev) =>
                          active ? prev.filter((t) => t !== type.name) : [...prev, type.name]
                        )
                      }
                    >
                      {camelCaseToSentence(type.name)}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className={styles.field}>
              <span>Image</span>
              <button
                type="button"
                className={styles.imageChoice}
                onClick={() => setNewImagePicker(true)}
              >
                {newImage ? (
                  <img src={newImage.url} alt="Selected project image" />
                ) : (
                  <span className={styles.imageChoicePlaceholder}>
                    <FontAwesomeIcon icon={faImage} /> Choose image
                  </span>
                )}
              </button>
            </div>

            {createError && <p className={styles.modalError}>{createError}</p>}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancel}
                onClick={closeCreate}
                disabled={creating}
              >
                Cancel
              </button>
              <button type="submit" className={styles.modalConfirm} disabled={creating}>
                {creating ? "Creating…" : "Create & edit"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
