"use client";

import React from "react";

interface LiveRegionProps {
  message: string;
  politeness?: "polite" | "assertive";
}

/** Accessible live region for dynamic status updates (screen readers). */
export function LiveRegion({ message, politeness = "polite" }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/** Skip-to-main-content link (WCAG 2.4.1). */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  );
}

/** Progress bar with ARIA support. */
export function ProgressBar({
  value,
  max = 100,
  label,
}: {
  value: number;
  max?: number;
  label?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      {label && (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
          {label} — {pct}%
        </p>
      )}
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
