import RichTextWidget from "@/components/RichTextWidget";
import Reveal from "@/components/Reveal";
import type { Block } from "./blocks";
import Hero from "./Hero";
import FeatureGrid from "./FeatureGrid";
import Stats from "./Stats";
import TechStack from "./TechStack";
import Gallery from "./Gallery";
import Video from "./Video";
import Callout from "./Callout";
import Cta from "./Cta";
import styles from "./ProjectBlocks.module.scss";

/**
 * Visitor-facing renderer for a project's case-study blocks. Maps each block's
 * `type` to its presentational component; the rich-text block reuses the existing
 * RichTextWidget so prose looks identical to before. Server-rendered (the gallery
 * lightbox is the only client island). Callers pass an already-sanitized list.
 */
export default function ProjectBlocks({
  blocks,
  /**
   * Render the hero image at its natural aspect ratio instead of the default
   * 2:1 landscape crop. Used by the About page (a square headshot today, possibly
   * portrait later); project heroes keep the landscape banner crop.
   */
  naturalHeroImage = false
}: {
  blocks: Block[];
  naturalHeroImage?: boolean;
}) {
  return (
    <div className={`${styles.blocks} ${naturalHeroImage ? styles.naturalHeroImage : ""}`}>
      {blocks.map((block, index) => {
        const content = renderBlock(block);
        if (!content) return null;
        // Each block reveals as it scrolls into view. Stagger is capped so blocks
        // that share the first screen cascade subtly without long waits.
        return (
          <Reveal key={block.id} index={index % 3}>
            {content}
          </Reveal>
        );
      })}
    </div>
  );
}

function renderBlock(block: Block) {
  switch (block.type) {
    case "hero":
      return <Hero block={block} />;
    case "richText":
      return (
        <section className={`${styles.block} ${styles.measure}`}>
          <RichTextWidget content={block.content} variant="bare" />
        </section>
      );
    case "featureGrid":
      return <FeatureGrid block={block} />;
    case "stats":
      return <Stats block={block} />;
    case "techStack":
      return <TechStack block={block} />;
    case "gallery":
      return <Gallery block={block} />;
    case "video":
      return <Video block={block} />;
    case "callout":
      return <Callout block={block} />;
    case "cta":
      return <Cta block={block} />;
    default:
      return null;
  }
}
