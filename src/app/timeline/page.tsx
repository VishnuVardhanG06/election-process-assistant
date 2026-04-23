"use client";

import { useState, useEffect } from "react";
import { ElectionTimeline, getDemoDeadlines } from "@/components/features/timeline/ElectionTimeline";
import { AddToCalendar } from "@/components/features/calendar/AddToCalendar";
import { ElectionDeadline } from "@/types";
import { Modal } from "@/components/common/Modal";
import Link from "next/link";

export default function TimelinePage() {
  const [deadlines, setDeadlines] = useState<ElectionDeadline[]>([]);
  const [selectedDeadline, setSelectedDeadline] = useState<ElectionDeadline | null>(null);

  // Generate deadlines client-side to avoid SSR/hydration date mismatch
  useEffect(() => {
    setDeadlines(getDemoDeadlines());
  }, []);

  const handleDownloadAll = async () => {
    try {
      const res = await fetch("/api/calendar/ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadlines }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "election-deadlines.ics";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  };

  return (
    <div className="container page-padding">
      <div className="flex-between" style={{ flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div>
          <h1 className="section-heading" style={{ marginBottom: "var(--space-2)" }}>Election Timeline</h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Key deadlines for the upcoming election · Enter your address on the{" "}
            <Link href="/voter" style={{ color: "var(--color-accent-primary)" }}>Registration page</Link>{" "}
            for your specific dates.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleDownloadAll}>
          ⬇️ Download All as .ics
        </button>
      </div>

      <ElectionTimeline
        deadlines={deadlines}
        onAddToCalendar={(d) => setSelectedDeadline(d)}
        onDownloadICS={handleDownloadAll}
        hideHeading
      />

      {/* Calendar modal */}
      {selectedDeadline && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDeadline(null)}
          title="Add to Calendar"
          size="sm"
        >
          <AddToCalendar deadline={selectedDeadline} deadlines={deadlines} />
        </Modal>
      )}

      {/* Notice */}
      <div className="glass-card-sm" style={{ padding: "var(--space-4)", marginTop: "var(--space-8)" }}>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
          💡 Dates shown are sample data. Enter your address on the{" "}
          <Link href="/voter">Registration page</Link> to load real deadlines from the Google Civic API.
        </p>
      </div>
    </div>
  );
}
