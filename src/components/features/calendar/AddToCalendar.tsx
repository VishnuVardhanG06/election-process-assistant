"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { ElectionDeadline } from "@/types";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { LiveRegion } from "@/components/common/Accessibility";

interface AddToCalendarProps {
  deadline: ElectionDeadline;
  deadlines?: ElectionDeadline[]; // For bulk download
}

export function AddToCalendar({ deadline, deadlines }: AddToCalendarProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [result, setResult] = useState<{ success: boolean; link?: string; error?: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const addToGoogleCalendar = async () => {
    setIsLoading(true);
    setStatusMsg("Adding to Google Calendar…");
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ success: true, link: data.data.htmlLink });
        setStatusMsg("Added to Google Calendar successfully");
      } else {
        setResult({ success: false, error: data.error });
        setStatusMsg("Failed to add to calendar");
      }
    } catch {
      setResult({ success: false, error: "Network error" });
      setStatusMsg("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadICS = async () => {
    setIsLoading(true);
    setStatusMsg("Generating calendar file…");
    try {
      const toDownload = deadlines ?? [deadline];
      const res = await fetch("/api/calendar/ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadlines: toDownload }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "election-deadlines.ics";
        a.click();
        URL.revokeObjectURL(url);
        setStatusMsg("Calendar file downloaded");
      }
    } catch {
      setStatusMsg("Download failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <LiveRegion message={statusMsg} />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        leftIcon="🗓️"
        aria-label={`Add ${deadline.title} to calendar`}
      >
        Add to Calendar
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setResult(null); }}
        title={`Add to Calendar: ${deadline.title}`}
        size="sm"
      >
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-6)", fontSize: "var(--text-sm)" }}>
          📅 {new Date(deadline.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>

        {result?.success && (
          <div className="status-card registered" style={{ marginBottom: "var(--space-4)" }}>
            <span>✅</span>
            <div>
              <p style={{ fontWeight: "var(--font-semibold)" }}>Added to Google Calendar!</p>
              {result.link && <a href={result.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-sm)" }}>View Event ↗</a>}
            </div>
          </div>
        )}

        {result?.error && (
          <div className="status-card not-registered" style={{ marginBottom: "var(--space-4)" }}>
            <span>⚠️</span>
            <p style={{ fontSize: "var(--text-sm)" }}>{result.error}</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {session ? (
            <Button
              variant="primary"
              onClick={addToGoogleCalendar}
              isLoading={isLoading}
              leftIcon="📆"
            >
              Add to My Google Calendar
            </Button>
          ) : (
            <Button variant="primary" onClick={() => signIn("google")} leftIcon="🔑">
              Sign in with Google to Add Event
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={downloadICS}
            isLoading={isLoading}
            leftIcon="⬇️"
            aria-label={deadlines ? "Download all deadlines as ICS" : "Download this deadline as ICS"}
          >
            {deadlines ? "Download All as .ics" : "Download .ics File"}
          </Button>

          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center" }}>
            .ics works with Apple Calendar, Outlook, and most calendar apps
          </p>
        </div>
      </Modal>
    </>
  );
}
