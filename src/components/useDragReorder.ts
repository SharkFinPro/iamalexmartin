"use client";

import { useEffect, useRef, useState } from "react";

// Pointer-based "card in hand" drag reordering, shared by the projects grid and
// the homepage featured section. The dragged card becomes a floating clone that
// follows the cursor; the list reorders live as it passes over other cards, and
// the page auto-scrolls near the viewport edges.

type Options<T> = {
  items: T[];
  setItems: (next: T[]) => void;
  getKey: (item: T) => string;
  onCommit: (orderedKeys: string[]) => void;
};

export function useDragReorder<T>({ items, setItems, getKey, onCommit }: Options<T>) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Screen-reader announcement for keyboard reordering. Consumers render this in
  // an aria-live region so each move is spoken (e.g. "Moved to position 2 of 5").
  const [announcement, setAnnouncement] = useState("");

  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const dragIndexRef = useRef<number | null>(null);
  const draggingKeyRef = useRef<string | null>(null);
  const itemsRef = useRef(items);
  const pointerRef = useRef({ x: 0, y: 0 });
  const autoScrollRef = useRef<number | null>(null);

  useEffect(() => { itemsRef.current = items; }, [items]);

  function registerCard(key: string) {
    return (el: HTMLElement | null) => {
      if (el) {
        cardRefs.current.set(key, el);
      } else {
        cardRefs.current.delete(key);
      }
    };
  }

  function reorderAt(x: number, y: number) {
    const from = dragIndexRef.current;
    if (from === null) {
      return;
    }
    const list = itemsRef.current;
    for (let i = 0; i < list.length; i++) {
      if (getKey(list[i]) === draggingKeyRef.current) {
        continue;
      }
      const el = cardRefs.current.get(getKey(list[i]));
      if (!el) {
        continue;
      }
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        if (i !== from) {
          const next = [...list];
          const [moved] = next.splice(from, 1);
          next.splice(i, 0, moved);
          itemsRef.current = next;
          setItems(next);
          dragIndexRef.current = i;
        }
        break;
      }
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (draggingKeyRef.current === null) {
      return;
    }
    pointerRef.current = { x: e.clientX, y: e.clientY };
    setPointer({ x: e.clientX, y: e.clientY });
    reorderAt(e.clientX, e.clientY);
  }

  function startAutoScroll() {
    const EDGE = 90;
    const MAX_SPEED = 18;

    function step() {
      const { x, y } = pointerRef.current;
      const h = window.innerHeight;
      let dy = 0;

      if (y < EDGE) {
        dy = -MAX_SPEED * ((EDGE - y) / EDGE);
      } else if (y > h - EDGE) {
        dy = MAX_SPEED * ((y - (h - EDGE)) / EDGE);
      }

      if (dy !== 0) {
        window.scrollBy(0, dy);
        reorderAt(x, y);
      }

      autoScrollRef.current = requestAnimationFrame(step);
    }

    autoScrollRef.current = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (autoScrollRef.current !== null) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }

  function handlePointerUp() {
    if (draggingKeyRef.current === null) {
      return;
    }
    stopAutoScroll();
    draggingKeyRef.current = null;
    dragIndexRef.current = null;
    setDraggingKey(null);
    onCommit(itemsRef.current.map(getKey));
  }

  useEffect(() => {
    if (!draggingKey) {
      return;
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      stopAutoScroll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingKey]);

  // --- Keyboard reordering -------------------------------------------------
  // A focusable drag handle also accepts arrow keys (and Home/End) to move its
  // item one step at a time, with each change committed and announced. Because
  // cards are keyed, the handle's DOM node is preserved across the reorder, so
  // keyboard focus naturally rides along with the moving item.
  function moveTo(key: string, to: number) {
    const list = itemsRef.current;
    const from = list.findIndex((it) => getKey(it) === key);
    if (from === -1) return;

    const clamped = Math.max(0, Math.min(list.length - 1, to));
    if (clamped === from) {
      setAnnouncement(
        to < from ? "Already at the start of the list." : "Already at the end of the list."
      );
      return;
    }

    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(clamped, 0, moved);
    itemsRef.current = next;
    setItems(next);
    onCommit(next.map(getKey));
    setAnnouncement(`Moved to position ${clamped + 1} of ${next.length}.`);
  }

  function keyboardReorder(key: string) {
    return (e: React.KeyboardEvent) => {
      const list = itemsRef.current;
      const from = list.findIndex((it) => getKey(it) === key);
      if (from === -1) return;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          moveTo(key, from - 1);
          break;
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          moveTo(key, from + 1);
          break;
        case "Home":
          e.preventDefault();
          moveTo(key, 0);
          break;
        case "End":
          e.preventDefault();
          moveTo(key, list.length - 1);
          break;
      }
    };
  }

  function startDrag(index: number, key: string, e: React.PointerEvent) {
    if (e.button !== 0) {
      return;
    }
    e.preventDefault();

    const el = cardRefs.current.get(key);
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();

    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setSize({ w: rect.width, h: rect.height });
    setPointer({ x: e.clientX, y: e.clientY });
    pointerRef.current = { x: e.clientX, y: e.clientY };

    dragIndexRef.current = index;
    draggingKeyRef.current = key;
    setDraggingKey(key);
    startAutoScroll();
  }

  return {
    draggingKey,
    registerCard,
    startDrag,
    keyboardReorder,
    announcement,
    size,
    floatingStyle: {
      left: pointer.x - offset.x,
      top: pointer.y - offset.y,
      width: size.w
    }
  };
}
