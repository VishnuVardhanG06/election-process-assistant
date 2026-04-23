"use client";

import React, { useEffect, useRef, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  // Focus trap and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement;
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      // Basic focus trap
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = size === "sm" ? 380 : size === "lg" ? 720 : 520;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className="modal-panel glass-card"
        style={{ maxWidth }}
        tabIndex={-1}
      >
        <div className="flex-between" style={{ marginBottom: "var(--space-6)" }}>
          <h2 id={titleId} style={{ fontSize: "var(--text-xl)", margin: 0 }}>
            {title}
          </h2>
          <button
            className="btn btn-ghost btn-icon modal-close"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ position: "static" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
