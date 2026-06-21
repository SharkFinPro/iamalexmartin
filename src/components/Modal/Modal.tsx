"use client";

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Stack of open modals. Only the topmost handles Escape and traps Tab, so a
// dialog opened from within another dialog (e.g. the crop/upload dialog inside
// the asset picker) behaves correctly and the inner one closes first.
const modalStack: symbol[] = [];

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

  useEffect(() => {
    const overlay = overlayRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const token = Symbol("modal");
    modalStack.push(token);
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
      const i = modalStack.indexOf(token);
      if (i >= 0) modalStack.splice(i, 1);
      // Restore focus to whatever opened the dialog (if it's still in the DOM).
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
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
    </div>
  );
}
