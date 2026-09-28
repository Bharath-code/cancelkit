"use client";

import { ReactNode, useEffect, useRef } from "react";

// The one shadowed element in the system (docs/design.md § Elevation).
export function Modal({
  open,
  onDismiss,
  children,
  labelledBy,
}: {
  open: boolean;
  onDismiss: () => void;
  children: ReactNode;
  labelledBy?: string;
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
      onClick={onDismiss}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] animate-rise rounded-xl bg-surface p-8 shadow-[var(--shadow-modal)]"
      >
        {children}
      </div>
    </div>
  );
}
