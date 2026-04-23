"use client";

import React from "react";
import { ElectionDeadline } from "@/types";
import { UrgencyBadge } from "@/components/common/Badge";

interface TimelineItemProps {
  deadline: ElectionDeadline;
  index: number;
  onAddToCalendar?: (deadline: ElectionDeadline) => void;
}

function getDeadlineIcon(type: ElectionDeadline["type"]): string {
  const icons: Record<ElectionDeadline["type"], string> = {
    registration: "📝",
    early_voting: "⏰",
    election_day: "🗳️",
    absentee: "✉️",
    runoff: "🔄",
  };
  return icons[type] ?? "📅";
}

function TimelineItemComponent({ deadline, index, onAddToCalendar }: TimelineItemProps) {
  const isPast = deadline.daysUntil < 0;
  const isToday = deadline.daysUntil === 0;
  const dotClass = isPast ? "past" : isToday || deadline.urgent ? "urgent" : deadline.daysUntil < 30 ? "active" : "";

  const formattedDate = new Date(deadline.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <li className="timeline-item" style={{ animationDelay: `${index * 0.08}s` }}>
      <div className={`timeline-dot ${dotClass}`} aria-hidden="true">
        {getDeadlineIcon(deadline.type)}
      </div>
      <article aria-labelledby={`deadline-${deadline.id}-title`} className="timeline-content">
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
          <h3 id={`deadline-${deadline.id}-title`} className="timeline-title" style={{ margin: 0, flex: 1 }}>
            {deadline.title}
          </h3>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            {isPast ? (
              <span className="badge badge-success">✓ Past</span>
            ) : isToday ? (
              <span className="badge badge-error">Today!</span>
            ) : (
              <UrgencyBadge daysLeft={deadline.daysUntil} />
            )}
          </div>
        </div>
        <time
          dateTime={deadline.date}
          className="timeline-date"
        >
          📅 {formattedDate}
        </time>
        <p className="timeline-desc">{deadline.description}</p>
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-3)", flexWrap: "wrap" }}>
          {!isPast && onAddToCalendar && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onAddToCalendar(deadline)}
              aria-label={`Add ${deadline.title} to calendar`}
            >
              🗓️ Add to Calendar
            </button>
          )}
          {deadline.url && (
            <a
              href={deadline.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              aria-label={`${deadline.title} — official information (opens in new tab)`}
            >
              Learn More ↗
            </a>
          )}
        </div>
      </article>
    </li>
  );
}

interface ElectionTimelineProps {
  deadlines: ElectionDeadline[];
  onAddToCalendar?: (deadline: ElectionDeadline) => void;
  onDownloadICS?: () => void;
  hideHeading?: boolean;
}

export function ElectionTimeline({ deadlines, onAddToCalendar, onDownloadICS, hideHeading = false }: ElectionTimelineProps) {
  if (!deadlines.length) {
    return (
      <div className="glass-card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", marginBottom: "var(--space-4)" }}>📅</p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Enter your address on the Registration page to load your election timeline.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Election Timeline">
      {!hideHeading && (
        <div className="flex-between" style={{ marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)" }}>
          <h2 className="section-heading" style={{ margin: 0 }}>Election Timeline</h2>
          {onDownloadICS && (
            <button className="btn btn-ghost btn-sm" onClick={onDownloadICS}>
              ⬇️ Download .ics
            </button>
          )}
        </div>
      )}
      {hideHeading && onDownloadICS && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-4)" }}>
          <button className="btn btn-ghost btn-sm" onClick={onDownloadICS}>
            ⬇️ Download .ics
          </button>
        </div>
      )}
      <nav aria-label="Election process timeline">
        <ol className="timeline-list" role="list">
          {deadlines.map((deadline, i) => (
            <TimelineItemComponent
              key={deadline.id}
              deadline={deadline}
              index={i}
              onAddToCalendar={onAddToCalendar}
            />
          ))}
        </ol>
      </nav>
    </section>
  );
}

// ─── Demo deadlines for when no API data is available ────────────────────────
export function getDemoDeadlines(): ElectionDeadline[] {
  const now = new Date();
  const addDays = (d: number) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString();
  };

  return [
    {
      id: "reg",
      title: "Voter Registration Deadline",
      description: "Last day to register to vote or update your registration before the election.",
      date: addDays(14),
      type: "registration",
      daysUntil: 14,
      urgent: false,
      url: "https://vote.gov",
    },
    {
      id: "absentee",
      title: "Absentee Ballot Request Deadline",
      description: "Last day to request a mail-in absentee ballot.",
      date: addDays(21),
      type: "absentee",
      daysUntil: 21,
      urgent: false,
    },
    {
      id: "early",
      title: "Early Voting Opens",
      description: "Early in-person voting begins at select locations. No excuse required.",
      date: addDays(25),
      type: "early_voting",
      daysUntil: 25,
      urgent: false,
    },
    {
      id: "early-end",
      title: "Early Voting Closes",
      description: "Last day for early in-person voting. Election Day polling places not open yet.",
      date: addDays(30),
      type: "early_voting",
      daysUntil: 30,
      urgent: false,
    },
    {
      id: "election",
      title: "Election Day 🗳️",
      description: "General Election. Polls open from 7:00 AM to 8:00 PM. If you're in line before closing, you have the right to vote.",
      date: addDays(33),
      type: "election_day",
      daysUntil: 33,
      urgent: false,
      url: "https://vote.gov",
    },
  ];
}
