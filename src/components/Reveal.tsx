"use client";

import { type ReactNode } from "react";
import { useReveal } from "./useReveal";

/**
 * Wraps server-rendered content in a self-observing scroll-reveal container, so
 * sections settle in as they enter the viewport. Accepts Server Components as
 * `children` (rendered on the server, passed through untouched). Pairs with the
 * global `.reveal` / `.is-visible` classes; `index` drives the stagger delay.
 */
export default function Reveal({
  children,
  index = 0,
  className = ""
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "is-visible" : ""} ${className}`}
      style={{ ["--reveal-index" as any]: index }}
    >
      {children}
    </div>
  );
}
