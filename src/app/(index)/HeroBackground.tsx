"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./heroBackground.module.scss";

const ADMIN_PREF_KEY = "heroBackdrop";

/**
 * Hero backdrop: an interactive constellation field (drifting nodes linked by
 * proximity, reactive to the pointer). Falls back to the static CSS grid when a
 * 2D canvas context isn't available. Admins get a small toggle to force the CSS
 * grid for dev purposes (persisted to localStorage).
 */
export default function HeroBackground({ isAdmin = false }: { isAdmin?: boolean }) {
  const [fallback, setFallback] = useState(false);
  const [forceGrid, setForceGrid] = useState(false);

  // Restore the admin's saved choice on mount (client-only).
  useEffect(() => {
    if (isAdmin && localStorage.getItem(ADMIN_PREF_KEY) === "grid") {
      setForceGrid(true);
    }
  }, [isAdmin]);

  function toggle() {
    setForceGrid((prev) => {
      const next = !prev;
      localStorage.setItem(ADMIN_PREF_KEY, next ? "grid" : "constellation");
      return next;
    });
  }

  const showGrid = fallback || forceGrid;

  return (
    <>
      {showGrid ? (
        <>
          <div className={styles.grid} aria-hidden="true" />
          <div className={styles.wash} aria-hidden="true" />
        </>
      ) : (
        <Constellation onUnsupported={() => setFallback(true)} />
      )}

      {isAdmin && (
        <button type="button" className={styles.adminToggle} onClick={toggle}>
          {forceGrid ? "Backdrop: CSS Grid" : "Backdrop: Constellation"}
        </button>
      )}
    </>
  );
}

/* --- helpers -------------------------------------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  return {
    bg: hexToRgb(cs.getPropertyValue("--bg-primary")),
    c1: hexToRgb(cs.getPropertyValue("--accent")),
    c2: hexToRgb(cs.getPropertyValue("--accent-secondary"))
  };
}
function rgb([r, g, b]: [number, number, number], a: number) {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

type Theme = "light" | "dark";

function readTheme(): Theme {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Per-theme backdrop tuning. On the light background the accent lines need more
// opacity to read and the glow has to come down (a heavy glow turns muddy on
// light); on the dark background the glow can shine and lines stay subtler.
const TUNING: Record<Theme, { link: number; pointer: number; node: number; glow: number; glowA: number }> = {
  light: { link: 0.55, pointer: 0.7, node: 1.0, glow: 3, glowA: 0.35 },
  dark: { link: 0.42, pointer: 0.6, node: 0.85, glow: 9, glowA: 0.6 }
};

/* --- constellation -------------------------------------------------------- */

// `ang`/`spd` are the node's own perpetual drift (steered slowly over time so
// the field keeps moving by itself); `pvx`/`pvy` is the transient pointer-push
// velocity that decays back to zero.
type Node = { x: number; y: number; ang: number; spd: number; pvx: number; pvy: number; r: number; ph: number };

function Constellation({ onUnsupported }: { onUnsupported: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onUnsupported();
      return;
    }

    let palette = readPalette();
    let tune = TUNING[readTheme()];
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      tune = TUNING[readTheme()];
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];

    function seed() {
      // Denser field that scales with available screen area.
      const count = Math.min(170, Math.max(44, Math.round((w * h) / 9000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        ang: Math.random() * Math.PI * 2,
        spd: 5 + Math.random() * 7,
        pvx: 0,
        pvy: 0,
        r: 1.1 + Math.random() * 1.9,
        ph: Math.random() * Math.PI * 2
      }));
    }
    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Pointer tracking (canvas itself stays pointer-events:none so the hero copy
    // and buttons keep working — we read the global pointer and map it in).
    const pointer = { x: 0, y: 0, active: false };
    function onMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      pointer.x = px;
      pointer.y = py;
      pointer.active = px >= 0 && px <= w && py >= 0 && py <= h;
    }
    function onLeave() { pointer.active = false; }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const linkDist = () => Math.min(220, Math.min(w, h) * 0.22);
    const pointerR = 170; // pointer influence radius
    const start = performance.now();
    let last = start;
    let raf = 0;

    function step(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const ld = linkDist();

      ctx.clearRect(0, 0, w, h);

      // Update.
      for (const p of nodes) {
        // Slowly steer each node's heading so the whole field keeps meandering
        // by itself rather than settling into straight lines.
        p.ang += Math.sin(t * 0.25 + p.ph) * 0.6 * dt;

        // Transient pointer push (decays back toward the natural drift).
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < pointerR) {
            // Stronger, smoother falloff so nodes are pushed away more
            // consistently across the whole influence radius.
            const fall = 1 - dist / pointerR;
            const force = fall * fall * 120;
            p.pvx += (dx / dist) * force * dt;
            p.pvy += (dy / dist) * force * dt;
          }
        }
        // Slower decay holds the push longer for a steadier repulsion.
        p.pvx *= 0.94;
        p.pvy *= 0.94;

        const vx = Math.cos(p.ang) * p.spd + p.pvx;
        const vy = Math.sin(p.ang) * p.spd + p.pvy;
        p.x += vx * dt;
        p.y += vy * dt;

        // Reflect off edges by flipping the relevant heading component.
        if (p.x < 0 || p.x > w) { p.ang = Math.PI - p.ang; p.pvx *= -1; p.x = Math.max(0, Math.min(w, p.x)); }
        if (p.y < 0 || p.y > h) { p.ang = -p.ang; p.pvy *= -1; p.y = Math.max(0, Math.min(h, p.y)); }
      }

      // Node-to-node links.
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < ld) {
            ctx.strokeStyle = rgb(palette.c1, (1 - dist / ld) * tune.link);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Pointer links — brighter, in the secondary accent, for a reactive hub.
      if (pointer.active) {
        for (const p of nodes) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < pointerR) {
            ctx.strokeStyle = rgb(palette.c2, (1 - dist / pointerR) * tune.pointer);
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Nodes with a soft glow + gentle twinkle (glow tuned per theme).
      ctx.shadowBlur = tune.glow;
      ctx.shadowColor = rgb(palette.c1, tune.glowA);
      for (const p of nodes) {
        const tw = 0.7 + 0.3 * Math.sin(t * 1.6 + p.ph);
        ctx.fillStyle = rgb(palette.c1, tune.node * tw);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      if (!reduce) raf = requestAnimationFrame(step);
    }

    if (reduce) step(start);
    else raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [onUnsupported]);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
