"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { SaveGuide } from "@/components/features/drive/SaveGuide";
import { VoterInfo, ApiResult } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const DEMO_ADDRESS = "1234 Maple Street, Los Angeles, CA 90210";

export default function GuidePage() {
  const [voterInfo, setVoterInfo] = useState<VoterInfo | null>(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  const fetchGuide = async (addr: string) => {
    setIsLoading(true);
    setError(null);
    setAddress(addr);
    setIsDemo(addr === DEMO_ADDRESS);

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

  // Auto-load demo data on mount
  useEffect(() => {
    fetchGuide(DEMO_ADDRESS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container page-padding">
      <h1 className="section-heading">My Voter Guide</h1>
      <p className="section-sub">
        See what's on your specific ballot — candidates, measures, and official resources.
      </p>

      {/* Demo banner */}
      {isDemo && (
        <div style={{
          background: "linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.1))",
          border: "1px solid rgba(255,193,7,0.4)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-3) var(--space-5)",
          marginBottom: "var(--space-5)",
          display: "flex", alignItems: "center", gap: "var(--space-3)",
          fontSize: "var(--text-sm)",
        }}>
          <span style={{ fontSize: "1.1rem" }}>📌</span>
          <span>
            <strong>Demo Mode</strong> — Showing a sample ballot for <em>Springfield, CA (District 28)</em>.{" "}
            Enter your real address to see your actual ballot.
          </span>
        </div>
      )}

      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <AddressForm
          onSubmit={fetchGuide}
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
            <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-2)" }}>💾 Save Your Guide</h2>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
              Save a copy of this voter guide to Google Drive or download it.
            </p>
            <SaveGuide voterInfo={voterInfo} address={address} />
          </div>

          {/* Election summary */}
          {voterInfo.election && (
            <div className="glass-card" style={{ padding: "var(--space-6)", background: "linear-gradient(135deg, rgba(61,142,240,0.1), rgba(131,56,236,0.08))" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-3)" }}>
                🗳️ {voterInfo.election.name}
              </h2>
              <div style={{ display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 2 }}>Election Day</p>
                  <p style={{ fontWeight: "var(--font-bold)", fontSize: "var(--text-lg)" }}>
                    {new Date(voterInfo.election.electionDay).toLocaleDateString("en-US", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: 2 }}>State</p>
                  <p style={{ fontWeight: "var(--font-semibold)" }}>{voterInfo.state?.[0]?.name ?? "California"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contests */}
          {voterInfo.contests?.length ? (
            <section aria-labelledby="contests-heading">
              <h2 id="contests-heading" style={{ fontSize: "var(--text-2xl)", marginBottom: "var(--space-6)" }}>
                🗳️ Your Ballot
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {voterInfo.contests.map((contest, i) => (
                  <div key={i} className="glass-card" style={{ padding: "var(--space-6)" }}>
                    <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-4)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-3)" }}>
                      {contest.office}
                    </h3>

                    {contest.candidates?.length ? (
                      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {contest.candidates.map((c, ci) => (
                          <li key={ci} style={{
                            display: "flex", alignItems: "center", gap: "var(--space-4)",
                            padding: "var(--space-3) var(--space-4)",
                            background: "var(--color-bg-overlay)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid var(--color-border)",
                          }}>
                            <span style={{ fontSize: "1.5rem" }} aria-hidden="true">👤</span>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-base)" }}>{c.name}</p>
                              {c.party && (
                                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                                  {c.party}
                                </p>
                              )}
                            </div>
                            {c.candidateUrl && (
                              <a href={c.candidateUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                                Website ↗
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : contest.referendumTitle ? (
                      <div style={{ padding: "var(--space-4)", background: "var(--color-bg-overlay)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                        <p style={{ fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>
                          📋 {contest.referendumTitle}
                        </p>
                        {contest.referendumSubtitle && (
                          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
                            {contest.referendumSubtitle}
                          </p>
                        )}
                        {contest.referendumUrl && (
                          <a href={contest.referendumUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
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
              <p style={{ fontSize: "2rem", marginBottom: "var(--space-3)" }}>🗳️</p>
              <p style={{ color: "var(--color-text-muted)" }}>
                No ballot contests found for this address.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
