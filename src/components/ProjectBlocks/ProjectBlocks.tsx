import RichTextWidget from "@/components/RichTextWidget";
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
      {blocks.map((block) => {
        switch (block.type) {
          case "hero":
            return <Hero key={block.id} block={block} />;
          case "richText":
            return (
              <section key={block.id} className={`${styles.block} ${styles.measure}`}>
                <RichTextWidget content={block.content} variant="bare" />
              </section>
            );
          case "featureGrid":
            return <FeatureGrid key={block.id} block={block} />;
          case "stats":
            return <Stats key={block.id} block={block} />;
          case "techStack":
            return <TechStack key={block.id} block={block} />;
          case "gallery":
            return <Gallery key={block.id} block={block} />;
          case "video":
            return <Video key={block.id} block={block} />;
          case "callout":
            return <Callout key={block.id} block={block} />;
          case "cta":
            return <Cta key={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
