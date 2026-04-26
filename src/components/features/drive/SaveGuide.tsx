"use client";

import React, { useState } from "react";
import { VoterInfo } from "@/types";
import { Button } from "@/components/common/Button";
import { LiveRegion } from "@/components/common/Accessibility";

interface SaveGuideProps {
  voterInfo: VoterInfo;
  address: string;
}

export function SaveGuide({ voterInfo, address }: SaveGuideProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; link?: string; error?: string; demo?: boolean } | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const handleSaveToDrive = async () => {
    setIsLoading(true);
    setStatusMsg("Saving voter guide to Google Drive…");
    setResult(null);

    try {
      const res = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: buildContent(),
          fileName: `Voter Guide — ${new Date().toLocaleDateString("en-US")}.txt`,
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setResult({ success: true, link: data.data.webViewLink, demo: data.demo });
        setStatusMsg(data.demo ? "Demo: guide saved (not real)" : "Voter guide saved to Google Drive successfully");
      } else {
        setResult({ success: false, error: data.error });
        setStatusMsg("Failed to save to Google Drive");
      }
    } catch {
      setResult({ success: false, error: "Network error. Please try again." });
      setStatusMsg("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const buildContent = (): string => {
    const lines = [`VOTER GUIDE — ${address}`, `Generated: ${new Date().toLocaleString()}`, ""];
    if (voterInfo.election) {
      lines.push(`Election: ${voterInfo.election.name}`, `Date: ${voterInfo.election.electionDay}`, "");
    }
    if (voterInfo.pollingLocations?.length) {
      const pl = voterInfo.pollingLocations[0];
      lines.push(`Polling Place: ${pl.name}`, `Address: ${pl.address}, ${pl.city}`, "");
    }
    voterInfo.contests?.forEach((c) => {
      lines.push(`${c.office}`);
      c.candidates?.forEach((cand) => lines.push(`  - ${cand.name}${cand.party ? ` (${cand.party})` : ""}`));
      lines.push("");
    });
    return lines.join("\n");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <LiveRegion message={statusMsg} />

      {result?.success && (
        <div className="status-card registered">
          <span>✅</span>
          <div>
            <p style={{ fontWeight: "var(--font-semibold)" }}>
              {result.demo ? "Saved! (Demo Mode — not actually saved to Drive)" : "Saved to Google Drive!"}
            </p>
            {result.demo ? (
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                Add your Google OAuth keys in .env.local to save real files to Drive.
              </p>
            ) : (
              result.link && (
                <a href={result.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--text-sm)" }}>
                  Open in Drive ↗
                </a>
              )
            )}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="status-card not-registered">
          <span>⚠️</span>
          <p style={{ fontSize: "var(--text-sm)" }}>{result.error}</p>
        </div>
      )}

      <Button variant="gold" onClick={handleSaveToDrive} isLoading={isLoading} leftIcon="💾">
        Save to Google Drive
      </Button>
    </div>
  );
}
