"use client";

import { useState } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { SaveGuide } from "@/components/features/drive/SaveGuide";
import { VoterInfo, ApiResult } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function GuidePage() {
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (addr: string) => {
    setIsLoading(true);
    setError(null);
    setAddress(addr);

    try {
      const res = await fetch("/api/voter-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });
      const data = (await res.json()) as ApiResult<VoterInfo>;

      if (data.ok) setVoterInfo(data.data);
      else setError(data.error ?? "Unable to load ballot information.");
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container page-padding">
      <h1 className="section-heading">My Voter Guide</h1>
      <p className="section-sub">
        See what's on your specific ballot based on your address — candidates, measures, and more.
      </p>

      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <AddressForm
          onSubmit={handleSearch}
          isLoading={isLoading}
          label="Your Registered Address"
          placeholder="123 Main St, City, State ZIP"
          submitLabel="Load My Ballot"
        />
      </div>

      {isLoading && <LoadingSpinner label="Loading your ballot…" fullPage />}

      {!isLoading && error && (
        <div role="alert" className="status-card not-registered">
          <span>⚠️</span>
          <div>
            <p className="status-title">Could not load ballot</p>
            <p className="status-body">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && voterInfo && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Save to Drive */}
          <div className="glass-card" style={{ padding: "var(--space-6)" }}>
            <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>Save Your Guide</h2>
            <SaveGuide voterInfo={voterInfo} address={address} />
          </div>

          {/* Election */}
          {voterInfo.election && (
            <div className="glass-card" style={{ padding: "var(--space-6)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
                🗳️ {voterInfo.election.name}
              </h2>
              <p style={{ color: "var(--color-text-secondary)" }}>
                Election Day: <strong>{voterInfo.election.electionDay}</strong>
              </p>
            </div>
          )}

          {/* Contests */}
          {voterInfo.contests?.length ? (
            <section aria-labelledby="contests-heading">
              <h2 id="contests-heading" style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)" }}>
                Your Ballot
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {voterInfo.contests.map((contest, i) => (
                  <div key={i} className="glass-card" style={{ padding: "var(--space-6)" }}>
                    <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>
                      {contest.office}
                    </h3>
                    {contest.candidates?.length ? (
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {contest.candidates.map((c, ci) => (
                          <li key={ci} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                            <span style={{ fontSize: "1.2rem" }}>👤</span>
                            <div>
                              <p style={{ fontWeight: "var(--font-semibold)" }}>{c.name}</p>
                              {c.party && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{c.party}</p>}
                              <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)", flexWrap: "wrap" }}>
                                {c.candidateUrl && <a href={c.candidateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">Website ↗</a>}
                                {c.email && <a href={`mailto:${c.email}`} className="btn btn-ghost btn-sm">Email</a>}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : contest.referendumTitle ? (
                      <div>
                        <p style={{ fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>
                          Measure: {contest.referendumTitle}
                        </p>
                        {contest.referendumSubtitle && (
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            {contest.referendumSubtitle}
                          </p>
                        )}
                        {contest.referendumUrl && (
                          <a href={contest.referendumUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: "var(--space-3)" }}>
                            Full Text ↗
                          </a>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="glass-card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
              <p style={{ color: "var(--color-text-muted)" }}>
                No ballot contests found for this address. This may be because there are no upcoming elections in your area, or the Civic API doesn't have data for this address yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
