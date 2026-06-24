"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of open modals. Only the topmost handles Escape and traps Tab, so a
// dialog opened from within another dialog (e.g. the crop/upload dialog inside
// the asset picker) behaves correctly and the inner one closes first.
const modalStack: symbol[] = [];

// How many modals currently hold the body scroll-lock. Reference-counted so a
// stacked dialog doesn't release the lock when the inner one closes — the page
// only scrolls again once the last modal is gone. `savedOverflow` remembers the
// caller's original `body` overflow so we restore it rather than clobbering it.
let scrollLockCount = 0;
let savedOverflow = "";

function lockBodyScroll() {
  if (scrollLockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

function unlockBodyScroll() {
  scrollLockCount -= 1;
  if (scrollLockCount <= 0) {
    scrollLockCount = 0;
    document.body.style.overflow = savedOverflow;
  }
}

type Props = {
  onClose: () => void;
  /** id of the visible heading that names the dialog (preferred over `label`). */
  labelledBy?: string;
  /** Fallback accessible name when there's no visible heading to reference. */
  label?: string;
  /** Class for the full-screen scrim, which is also the dialog container. */
  overlayClassName: string;
  /** Close when the scrim (not its content) is clicked. Default true. */
  closeOnOverlayClick?: boolean;
  children: ReactNode;
};

/**
 * Accessible modal shell. Renders the scrim as the `role="dialog"` container and
 * adds the behaviors every dialog needs: focus moves inside on open (unless an
 * autoFocus child already claimed it), Tab/Shift+Tab stay trapped within, Escape
 * closes, and focus returns to the previously focused element on close. Visual
 * styling stays with the caller — pass the overlay class and render your own
 * styled box + heading as children.
 */
export default function Modal({
  onClose,
  labelledBy,
  label,
  overlayClassName,
  closeOnOverlayClick = true,
  children
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Render into a portal at <body> so the dialog escapes any ancestor stacking
  // context (scroll-reveal wrappers set `opacity`/`translate`/`will-change`, each
  // of which creates one). Inline, a fixed-position overlay still paints within
  // its block's context, so a later sibling block — e.g. a project's <video> —
  // would cover it regardless of z-index. `mounted` gates the portal so SSR and
  // the first client render match (createPortal needs a real `document`).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Wait for the portal to render so `overlayRef` points at a real node; until
    // then focus can't move inside and the focus trap has nothing to query.
    if (!mounted) return;
    const overlay = overlayRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = Symbol("modal");
    modalStack.push(token);
    lockBodyScroll();
    const isTopmost = () => modalStack[modalStack.length - 1] === token;

    // Move focus inside unless an autoFocus child already claimed it.
    if (overlay && !overlay.contains(document.activeElement)) {
      const focusable = overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      (focusable[0] ?? overlay).focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!isTopmost()) return;
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !overlay) return;

      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !overlay.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !overlay.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
      const i = modalStack.indexOf(token);
      if (i >= 0) modalStack.splice(i, 1);
      // Restore focus to whatever opened the dialog (if it's still in the DOM).
      previouslyFocused?.focus?.();
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={overlayRef}
      // `modalAnimated` (global.scss) fades the scrim and settles the panel; it's
      // appended here so every dialog gets the entrance with no per-caller CSS.
      className={`${overlayClassName} modalAnimated`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      tabIndex={-1}
      onMouseDown={
        closeOnOverlayClick
          ? (e) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
    >
      {children}
    </div>,
    document.body
  );
}
