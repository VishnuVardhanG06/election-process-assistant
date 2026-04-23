"use client";

import React from "react";
import Link from "next/link";
import { QuickAction } from "@/types";
import { Badge } from "@/components/common/Badge";

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: "registration",
    icon: "📝",
    title: "Check Registration",
    description: "Verify your voter registration status",
    href: "/voter",
  },
  {
    id: "polling",
    icon: "📍",
    title: "Find Polling Place",
    description: "Get directions to your voting location",
    href: "/polling-places",
  },
  {
    id: "ballot",
    icon: "🗳️",
    title: "View My Ballot",
    description: "See candidates and measures on your ballot",
    href: "/guide",
  },
  {
    id: "dates",
    icon: "📅",
    title: "Important Dates",
    description: "Key deadlines and election timeline",
    href: "/timeline",
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
  daysUntilDeadline?: number | null;
}

export function QuickActions({ actions = DEFAULT_ACTIONS, daysUntilDeadline }: QuickActionsProps) {
  const enriched = actions.map((a) => ({
    ...a,
    badge:
      a.id === "registration" && daysUntilDeadline !== null && daysUntilDeadline !== undefined
        ? `${daysUntilDeadline}d left`
        : a.badge,
    urgent:
      a.id === "registration" && daysUntilDeadline !== null && daysUntilDeadline !== undefined
        ? daysUntilDeadline <= 7
        : false,
  }));

  return (
    <section aria-labelledby="quick-actions-heading">
      <h2
        id="quick-actions-heading"
        style={{
          fontSize: "var(--text-xl)",
          fontWeight: "var(--font-bold)",
          marginBottom: "var(--space-6)",
        }}
      >
        Quick Actions
      </h2>
      <div className="quick-actions-grid">
        {enriched.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            id={`quick-action-${action.id}`}
            className={`quick-action-card glass-card${action.urgent ? " urgent" : ""}`}
            aria-label={`${action.title}${action.badge ? ` — ${action.badge}` : ""}`}
          >
            <div className="quick-action-icon" aria-hidden="true">
              {action.icon}
            </div>
            <div>
              <p className="quick-action-title">{action.title}</p>
              <p className="quick-action-desc">{action.description}</p>
              {action.badge && (
                <div style={{ marginTop: "var(--space-2)" }}>
                  <Badge variant={action.urgent ? "warning" : "blue"}>{action.badge}</Badge>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
