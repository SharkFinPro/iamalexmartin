// Shared block model for project case-study pages. The whole ordered list lives
// in the Project.projectPage JSON field (nullable — null means "no blocks yet").
//
// This module is dependency-free and safe to import on both the server (the
// updateProjectPage action validates with `sanitizeProjectPage`) and the client
// (the editor builds new blocks with the `create*` helpers). The frontend owns
// all layout — blocks carry content only, never columns/breakpoints.

import { isSafeUrl, sanitizeRichTextAst } from "@/components/RichTextEditor/richTextAst";
import type { MediaAsset } from "@/lib/getAssets";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BlockType =
  | "hero"
  | "richText"
  | "featureGrid"
  | "stats"
  | "techStack"
  | "gallery"
  | "video"
  | "callout"
  | "cta";

/** A self-contained image reference mirroring the fields Hygraph assets expose. */
export type ImageRef = {
  src: string;
  handle?: string;
  width?: number;
  height?: number;
  alt?: string;
};

export type HeroBlock = {
  id: string;
  type: "hero";
  eyebrow?: string;
  headline: string;
  summary?: string;
  /** Free-form "Label: Value" facts (Role, Timeline, Team…). Rendered as chips. */
  roleItems?: string[];
  image?: ImageRef;
  /** Up to 2 call-to-action links. hrefs are validated with isSafeUrl. */
  actions?: { label: string; href: string }[];
};

export type RichTextBlock = {
  id: string;
  type: "richText";
  /** Hygraph rich-text AST ({ children }) — the existing editor's payload. */
  content: { children: any[] };
};

export type FeatureItem = { title: string; description?: string };
export type FeatureGridBlock = {
  id: string;
  type: "featureGrid";
  heading?: string;
  /** Items render as compact tiles when none have a description, larger cards
   *  when any do — the frontend decides; the author just supplies content. */
  items: FeatureItem[];
};

export type StatItem = { value: string; label: string; caption?: string };
export type StatsBlock = {
  id: string;
  type: "stats";
  heading?: string;
  items: StatItem[]; // 2–6
};

export type TechGroup = { label: string; items: string[] };
export type TechStackBlock = {
  id: string;
  type: "techStack";
  heading?: string;
  groups: TechGroup[];
};

export type GalleryImage = ImageRef & { caption?: string };
export type GalleryBlock = {
  id: string;
  type: "gallery";
  heading?: string;
  images: GalleryImage[]; // 1+
  /** Layout hint the frontend interprets — never pixel layout. */
  layout?: "auto" | "wide";
};

export type VideoBlock = {
  id: string;
  type: "video";
  src: string;
  mimeType?: string;
  /** Optional still shown before playback. */
  poster?: ImageRef;
  caption?: string;
};

export type CalloutVariant = "quote" | "info" | "success" | "warning";
export type CalloutBlock = {
  id: string;
  type: "callout";
  variant: CalloutVariant;
  text: string;
  attribution?: string;
};

export type CtaBlock = {
  id: string;
  type: "cta";
  heading?: string;
  text?: string;
  label: string;
  href: string;
};

export type Block =
  | HeroBlock
  | RichTextBlock
  | FeatureGridBlock
  | StatsBlock
  | TechStackBlock
  | GalleryBlock
  | VideoBlock
  | CalloutBlock
  | CtaBlock;

// Per-block authoring constraints, shared by the editor (guardrails) and the
// server validator (defense in depth).
export const STATS_MIN = 2;
export const STATS_MAX = 6;
export const HERO_MAX_ACTIONS = 2;
export const CALLOUT_VARIANTS: CalloutVariant[] = ["quote", "info", "success", "warning"];

export const BLOCK_LABELS: Record<BlockType, string> = {
  hero: "Hero",
  richText: "Rich text",
  featureGrid: "Feature grid",
  stats: "Stats",
  techStack: "Tech stack",
  gallery: "Gallery",
  video: "Video",
  callout: "Callout",
  cta: "Call to action"
};

// A short, author-facing description shown in the "Add block" palette.
export const BLOCK_DESCRIPTIONS: Record<BlockType, string> = {
  hero: "Project header with summary, key facts and a lead image.",
  richText: "Formatted prose — headings, lists, links and inline images.",
  featureGrid: "Features or capabilities as a responsive card grid.",
  stats: "Impact metrics shown as a responsive number grid.",
  techStack: "Technologies used, grouped into labelled chips.",
  gallery: "Screenshots or diagrams with captions and a lightbox.",
  video: "An embedded video clip with an optional caption.",
  callout: "A pull quote or highlighted note to break up the page.",
  cta: "A closing prompt with a button link (e.g. View on GitHub)."
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Stable id for React keys + reordering. */
export function newBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const EMPTY_RICH_TEXT = { children: [{ type: "paragraph", children: [{ text: "" }] }] };

/** Convert a media-library asset to the block ImageRef shape. */
export function assetToImageRef(asset: MediaAsset): ImageRef {
  const ref: ImageRef = { src: asset.url };
  if (asset.handle) ref.handle = asset.handle;
  if (asset.width != null) ref.width = asset.width;
  if (asset.height != null) ref.height = asset.height;
  const name = asset.title?.trim() || asset.fileName;
  if (name) ref.alt = name;
  return ref;
}

/** Pull the src + mimeType from a media-library asset for a video block. */
export function assetToVideoRef(asset: MediaAsset): { src: string; mimeType?: string } {
  return asset.mimeType ? { src: asset.url, mimeType: asset.mimeType } : { src: asset.url };
}

/** Build a fresh block of `type` with sensible defaults. `projectTitle` seeds the hero. */
export function createBlock(type: BlockType, projectTitle = ""): Block {
  const id = newBlockId();
  switch (type) {
    case "hero":
      return { id, type, headline: projectTitle || "Project title", roleItems: [] };
    case "richText":
      return { id, type, content: { children: EMPTY_RICH_TEXT.children.map((c) => ({ ...c })) } };
    case "featureGrid":
      return { id, type, items: [{ title: "" }, { title: "" }, { title: "" }] };
    case "stats":
      return {
        id,
        type,
        items: [
          { value: "", label: "" },
          { value: "", label: "" },
          { value: "", label: "" }
        ]
      };
    case "techStack":
      return { id, type, groups: [{ label: "", items: [] }] };
    case "gallery":
      return { id, type, images: [], layout: "auto" };
    case "video":
      return { id, type, src: "" };
    case "callout":
      return { id, type, variant: "info", text: "" };
    case "cta":
      return { id, type, label: "", href: "" };
  }
}

// ---------------------------------------------------------------------------
// Validation / sanitization
// ---------------------------------------------------------------------------

function str(v: any): string {
  return typeof v === "string" ? v : "";
}
function trimmed(v: any): string {
  return str(v).trim();
}
function optStr(v: any): string | undefined {
  const t = trimmed(v);
  return t ? t : undefined;
}
function num(v: any): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function cleanImageRef(v: any): ImageRef | undefined {
  const src = trimmed(v?.src);
  if (!src || !isSafeUrl(src)) return undefined;
  const ref: ImageRef = { src };
  const handle = optStr(v?.handle);
  if (handle) ref.handle = handle;
  const w = num(v?.width);
  if (w != null) ref.width = w;
  const h = num(v?.height);
  if (h != null) ref.height = h;
  const alt = optStr(v?.alt);
  if (alt) ref.alt = alt;
  return ref;
}

function cleanHero(b: any, id: string): HeroBlock | null {
  const headline = trimmed(b.headline);
  if (!headline) return null; // headline is required
  const out: HeroBlock = { id, type: "hero", headline };
  const eyebrow = optStr(b.eyebrow);
  if (eyebrow) out.eyebrow = eyebrow;
  const summary = optStr(b.summary);
  if (summary) out.summary = summary;
  if (Array.isArray(b.roleItems)) {
    const items = b.roleItems.map(trimmed).filter(Boolean);
    if (items.length) out.roleItems = items;
  }
  const image = cleanImageRef(b.image);
  if (image) out.image = image;
  if (Array.isArray(b.actions)) {
    const actions = b.actions
      .map((a: any) => ({ label: trimmed(a?.label), href: trimmed(a?.href) }))
      .filter((a: any) => a.label && a.href && isSafeUrl(a.href))
      .slice(0, HERO_MAX_ACTIONS);
    if (actions.length) out.actions = actions;
  }
  return out;
}

function cleanRichText(b: any, id: string): RichTextBlock | null {
  const content = b?.content;
  if (!content || !Array.isArray(content.children)) return null;
  return { id, type: "richText", content: sanitizeRichTextAst(content) };
}

function cleanFeatureGrid(b: any, id: string): FeatureGridBlock | null {
  if (!Array.isArray(b.items)) return null;
  const items = b.items
    .map((it: any) => {
      const title = trimmed(it?.title);
      if (!title) return null;
      const item: FeatureItem = { title };
      const description = optStr(it?.description);
      if (description) item.description = description;
      return item;
    })
    .filter(Boolean) as FeatureItem[];
  if (items.length === 0) return null;
  const out: FeatureGridBlock = { id, type: "featureGrid", items };
  const heading = optStr(b.heading);
  if (heading) out.heading = heading;
  return out;
}

function cleanStats(b: any, id: string): StatsBlock | null {
  if (!Array.isArray(b.items)) return null;
  const items = b.items
    .map((it: any) => {
      const value = trimmed(it?.value);
      const label = trimmed(it?.label);
      if (!value || !label) return null;
      const item: StatItem = { value, label };
      const caption = optStr(it?.caption);
      if (caption) item.caption = caption;
      return item;
    })
    .filter(Boolean)
    .slice(0, STATS_MAX) as StatItem[];
  if (items.length < STATS_MIN) return null; // not enough valid stats to render
  const out: StatsBlock = { id, type: "stats", items };
  const heading = optStr(b.heading);
  if (heading) out.heading = heading;
  return out;
}

function cleanTechStack(b: any, id: string): TechStackBlock | null {
  if (!Array.isArray(b.groups)) return null;
  const groups = b.groups
    .map((g: any) => {
      const label = trimmed(g?.label);
      const items = Array.isArray(g?.items) ? g.items.map(trimmed).filter(Boolean) : [];
      if (!label || items.length === 0) return null;
      return { label, items } as TechGroup;
    })
    .filter(Boolean) as TechGroup[];
  if (groups.length === 0) return null;
  const out: TechStackBlock = { id, type: "techStack", groups };
  const heading = optStr(b.heading);
  if (heading) out.heading = heading;
  return out;
}

function cleanGallery(b: any, id: string): GalleryBlock | null {
  if (!Array.isArray(b.images)) return null;
  const images = b.images
    .map((img: any) => {
      const ref = cleanImageRef(img);
      if (!ref) return null;
      const caption = optStr(img?.caption);
      return (caption ? { ...ref, caption } : ref) as GalleryImage;
    })
    .filter(Boolean) as GalleryImage[];
  if (images.length === 0) return null;
  const out: GalleryBlock = { id, type: "gallery", images };
  out.layout = b.layout === "wide" ? "wide" : "auto";
  const heading = optStr(b.heading);
  if (heading) out.heading = heading;
  return out;
}

function cleanVideo(b: any, id: string): VideoBlock | null {
  const src = trimmed(b.src);
  if (!src || !isSafeUrl(src)) return null;
  const out: VideoBlock = { id, type: "video", src };
  const mimeType = optStr(b.mimeType);
  if (mimeType) out.mimeType = mimeType;
  const poster = cleanImageRef(b.poster);
  if (poster) out.poster = poster;
  const caption = optStr(b.caption);
  if (caption) out.caption = caption;
  return out;
}

function cleanCallout(b: any, id: string): CalloutBlock | null {
  const text = trimmed(b.text);
  if (!text) return null;
  const variant: CalloutVariant = CALLOUT_VARIANTS.includes(b.variant) ? b.variant : "info";
  const out: CalloutBlock = { id, type: "callout", variant, text };
  const attribution = optStr(b.attribution);
  if (attribution) out.attribution = attribution;
  return out;
}

function cleanCta(b: any, id: string): CtaBlock | null {
  const label = trimmed(b.label);
  const href = trimmed(b.href);
  if (!label || !href || !isSafeUrl(href)) return null;
  const out: CtaBlock = { id, type: "cta", label, href };
  const heading = optStr(b.heading);
  if (heading) out.heading = heading;
  const text = optStr(b.text);
  if (text) out.text = text;
  return out;
}

/**
 * Validate + sanitize an arbitrary value into a clean Block[]. Used server-side
 * before persisting and (defensively) when reading. Unknown/invalid blocks are
 * dropped rather than throwing, so one bad block can never break the page.
 * Returns [] for null/undefined/non-arrays (a project with no blocks yet).
 */
export function sanitizeProjectPage(raw: any): Block[] {
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  let heroSeen = false;

  for (const b of raw) {
    if (!b || typeof b !== "object") continue;
    const id = trimmed(b.id) || newBlockId();
    let cleaned: Block | null = null;

    switch (b.type) {
      case "hero":
        if (heroSeen) continue; // at most one hero per page
        cleaned = cleanHero(b, id);
        if (cleaned) heroSeen = true;
        break;
      case "richText":
        cleaned = cleanRichText(b, id);
        break;
      case "featureGrid":
        cleaned = cleanFeatureGrid(b, id);
        break;
      case "stats":
        cleaned = cleanStats(b, id);
        break;
      case "techStack":
        cleaned = cleanTechStack(b, id);
        break;
      case "gallery":
        cleaned = cleanGallery(b, id);
        break;
      case "video":
        cleaned = cleanVideo(b, id);
        break;
      case "callout":
        cleaned = cleanCallout(b, id);
        break;
      case "cta":
        cleaned = cleanCta(b, id);
        break;
      default:
        continue;
    }

    if (cleaned) out.push(cleaned);
  }

  return out;
}
