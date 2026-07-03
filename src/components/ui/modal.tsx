"use client";

import { ReactNode, useEffect, useRef } from "react";

// The one shadowed element in the system (docs/design.md § Elevation).
export function Modal({
  open,
  onDismiss,
  children,
}: {
  open: boolean;
  onDismiss: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
      if (e.key === "Tab" && ref.current) {
        // focus trap
        const focusable = ref.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("button, [href], input")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4"
      onClick={onDismiss}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded-lg bg-surface p-8 shadow-[0_8px_30px_rgba(22,24,29,0.12)]"
      >
        {children}
      </div>
    </div>
  );
}
