"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Modal from "@/components/Modal";
import type { GalleryBlock } from "./blocks";
import styles from "./ProjectBlocks.module.scss";

/**
 * Screenshot/diagram gallery with a lightbox. The grid auto-reflows (more columns
 * on wider viewports, one on mobile). The lightbox reuses the shared Modal, so it
 * gets focus-trap, Escape-to-close and focus restoration for free; arrow keys and
 * on-screen controls page between images.
 */
export default function Gallery({ block }: { block: GalleryBlock }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const count = block.images.length;
  const wide = block.layout === "wide";

  function go(delta: number) {
    setOpenIndex((i) => (i === null ? i : (i + delta + count) % count));
  }

  // Page with the arrow keys whenever the lightbox is open, regardless of which
  // element inside the modal currently holds focus.
  useEffect(() => {
    if (openIndex === null || count < 2) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, count]);

  const active = openIndex === null ? null : block.images[openIndex];

  return (
    <section className={`${styles.block} ${styles.wide}`}>
      {block.heading && <h2 className={styles.blockHeading}>{block.heading}</h2>}

      <ul className={`${styles.galleryGrid} ${wide ? styles.galleryWide : ""}`}>
        {block.images.map((img, i) => (
          <li key={i} className={styles.galleryItem}>
            <figure className={styles.galleryFigure}>
              <button
                type="button"
                className={styles.galleryThumbBtn}
                onClick={() => setOpenIndex(i)}
                aria-label={`Open image ${i + 1} of ${count}${img.alt ? `: ${img.alt}` : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt ?? ""}
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                />
              </button>
              {img.caption && (
                <figcaption className={styles.galleryCaption}>{img.caption}</figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>

      {active && (
        <Modal
          onClose={() => setOpenIndex(null)}
          label={active.alt || "Image preview"}
          overlayClassName={styles.lightboxOverlay}
        >
          <div className={styles.lightboxBox}>
            {count > 1 && (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={() => go(-1)}
                aria-label="Previous image"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}

            <figure className={styles.lightboxFigure}>
              <div className={styles.lightboxHeader}>
                <span className={styles.lightboxCounter}>
                  {openIndex! + 1} / {count}
                </span>
                <button
                  type="button"
                  className={styles.lightboxClose}
                  onClick={() => setOpenIndex(null)}
                  aria-label="Close image preview"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.src} alt={active.alt ?? ""} />
              {active.caption && (
                <figcaption className={styles.lightboxCaption}>{active.caption}</figcaption>
              )}
            </figure>

            {count > 1 && (
              <button
                type="button"
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={() => go(1)}
                aria-label="Next image"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
