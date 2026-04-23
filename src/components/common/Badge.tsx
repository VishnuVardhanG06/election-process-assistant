"use client";

import React from "react";

type BadgeVariant = "blue" | "gold" | "success" | "warning" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: string;
  dot?: boolean;
}

export function Badge({ variant = "blue", children, icon, dot }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && (
        <span
          aria-hidden="true"
          style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "currentColor", flexShrink: 0,
          }}
        />
      )}
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

export function UrgencyBadge({ daysLeft }: { daysLeft: number }) {
  if (daysLeft <= 0) return <Badge variant="error">Today</Badge>;
  if (daysLeft <= 3) return <Badge variant="error" dot>{daysLeft}d left</Badge>;
  if (daysLeft <= 7) return <Badge variant="warning" dot>{daysLeft}d left</Badge>;
  if (daysLeft <= 14) return <Badge variant="gold">{daysLeft}d left</Badge>;
  return <Badge variant="blue">{daysLeft}d left</Badge>;
}
