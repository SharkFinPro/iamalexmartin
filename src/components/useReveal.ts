"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Viewport-triggered reveal. Returns a `ref` to attach to the element to watch
 * and an `isVisible` flag that flips to `true` the first time the element enters
 * the viewport — then stays true (the observer disconnects, so the reveal never
 * replays while scrolling).
 *
 * Pair with the global `.reveal` / `.is-visible` classes (see global.scss):
 * apply `.reveal` always and add `.is-visible` when `isVisible` is true. For a
 * staggered group, attach the ref to the container and set `--reveal-index` per
 * child so they cascade in once the group scrolls into view.
 *
 * Reduced-motion or environments without IntersectionObserver start visible
 * immediately, so the content is never gated behind motion.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(options?: {
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // No motion wanted, or no observer support: show the final state at once.
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target); // one-time: never replay
          }
        }
      },
      {
        threshold: options?.threshold ?? 0.15,
        // Fire slightly before the element is fully in view.
        rootMargin: options?.rootMargin ?? "0px 0px -10% 0px"
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return { ref, isVisible };
}
