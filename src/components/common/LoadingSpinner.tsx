"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  size = "md",
  label = "Loading…",
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeStyle =
    size === "sm"
      ? { width: 16, height: 16, borderWidth: 2 }
      : size === "lg"
      ? { width: 48, height: 48, borderWidth: 4 }
      : { width: 28, height: 28, borderWidth: 3 };

  const spinner = (
    <div role="status" aria-label={label} className="flex-center" style={{ gap: "var(--space-3)" }}>
      <span className="spinner" style={sizeStyle} aria-hidden="true" />
      <span className="sr-only">{label}</span>
      {size !== "sm" && (
        <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>{label}</span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="flex-center"
        style={{ minHeight: "60vh", flexDirection: "column", gap: "var(--space-4)" }}
      >
        {spinner}
      </div>
    );
  }
  return spinner;
}

export function SkeletonBlock({
  height = 20,
  width = "100%",
  borderRadius = "var(--radius-md)",
}: {
  height?: number | string;
  width?: number | string;
  borderRadius?: string;
}) {
  return <div className="shimmer" style={{ height, width, borderRadius }} />;
}
