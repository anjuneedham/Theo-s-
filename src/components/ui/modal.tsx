"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Accessible modal built on the native <dialog> element (focus trap, Esc to
 * close, inert background). Renders as a bottom sheet on phones.
 */
export function Modal({ open, onClose, title, children, footer, className, wide }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode; className?: string; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-cream-50 p-0 text-night-900 shadow-[var(--shadow-lift)] backdrop:bg-night-950/60 backdrop:backdrop-blur-sm open:animate-sheet-up",
        "sm:m-auto sm:max-h-[88vh] sm:rounded-3xl sm:open:animate-fade-up",
        wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col sm:max-h-[88vh]">
          {title !== undefined && (
            <div className="flex items-center justify-between gap-4 border-b border-cream-200 px-5 py-4">
              <h2 className="text-xl">{title}</h2>
              <button onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-cream-200" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && <div className="border-t border-cream-200 bg-cream-50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
