import type { VideoBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/**
 * Embedded video clip. Native <video controls> so it works without extra client
 * JS and stays keyboard-operable; never autoplays (respects users who don't want
 * motion). `preload="metadata"` keeps the page light until the user hits play.
 */
export default function Video({ block }: { block: VideoBlock }) {
  return (
    <section className={`${styles.block} ${styles.measure}`}>
      <figure className={styles.videoFigure}>
        <video
          className={styles.video}
          controls
          preload="metadata"
          playsInline
          poster={block.poster?.src}
          aria-label={block.caption || "Project video"}
        >
          <source src={block.src} type={block.mimeType || "video/mp4"} />
          Your browser doesn&rsquo;t support embedded video.{" "}
          <a href={block.src}>Download the video</a> instead.
        </video>
        {block.caption && <figcaption className={styles.videoCaption}>{block.caption}</figcaption>}
      </figure>
    </section>
  );
}
