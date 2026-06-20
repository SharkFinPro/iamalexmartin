"use client";

import type { PointerEvent } from "react";

const MAX_DEG = 3;

/**
 * Pointer-reactive 3D tilt for cards. Returns handlers to spread onto an
 * element; it writes `--rx`/`--ry` CSS variables (consumed by the card's
 * transform) based on the cursor's position within the element, and resets them
 * on leave. No ref needed — it operates on `currentTarget`, so it composes with
 * a card's existing refs. Reduced-motion users get no tilt.
 */
export function useTilt(max = MAX_DEG) {
  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--ry", `${px * max * 2}deg`);
    el.style.setProperty("--rx", `${-py * max * 2}deg`);
  }

  function onPointerLeave(e: PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return { onPointerMove, onPointerLeave };
}
