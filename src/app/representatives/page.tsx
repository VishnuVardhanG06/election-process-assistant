"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { Representative, ApiResult } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const DEMO_ADDRESS = "1234 Maple Street, Los Angeles, CA 90210";

const PARTY_COLORS: Record<string, string> = {
  Democratic: "rgba(33, 150, 243, 0.2)",
  Republican: "rgba(244, 67, 54, 0.2)",
  Green: "rgba(76, 175, 80, 0.2)",
  "Non-Partisan": "rgba(158, 158, 158, 0.2)",
};

const PARTY_BORDER: Record<string, string> = {
  Democratic: "rgba(33, 150, 243, 0.5)",
  Republican: "rgba(244, 67, 54, 0.5)",
  Green: "rgba(76, 175, 80, 0.5)",
  "Non-Partisan": "rgba(158, 158, 158, 0.4)",
};

function RepCard({ rep }: { rep: Representative }) {
  const partyBg = PARTY_COLORS[rep.party ?? ""] ?? "rgba(100,100,255,0.1)";
  const partyBorder = PARTY_BORDER[rep.party ?? ""] ?? "rgba(100,100,255,0.3)";

  return (
    <article
      className="glass-card"
      aria-labelledby={`rep-${rep.name.replace(/\s+/g, "-")}`}
      style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}
    >
      <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "flex-start" }}>
        {rep.photoUrl ? (
          <img src={rep.photoUrl} alt={`Photo of ${rep.name}`}
            style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${partyBorder}` }} />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: partyBg, border: `2px solid ${partyBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", flexShrink: 0 }} aria-hidden="true">
            🏛️
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 id={`rep-${rep.name.replace(/\s+/g, "-")}`}
            style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginBottom: "var(--space-1)", lineHeight: 1.3 }}>
            {rep.name}
          </h3>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
            {rep.office}
          </p>
          {rep.party && (
            <span style={{
              display: "inline-block",
              fontSize: "var(--text-xs)",
              padding: "2px 8px",
              borderRadius: 999,
              background: partyBg,
              border: `1px solid ${partyBorder}`,
              color: "var(--color-text-primary)",
            }}>
              {rep.party}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        {rep.phones?.map((p) => (
          <a key={p} href={`tel:${p.replace(/\D/g, "")}`} className="btn btn-ghost btn-sm" aria-label={`Call ${rep.name}: ${p}`}>
            📞 {p}
          </a>
        ))}
        {rep.emails?.map((e) => (
          <a key={e} href={`mailto:${e}`} className="btn btn-ghost btn-sm" aria-label={`Email ${rep.name}`}>
            ✉️ Email
          </a>
        ))}
        {rep.urls?.slice(0, 1).map((u) => (
          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            🌐 Website
          </a>
        ))}
        {rep.channels?.map((c) => (
          <a key={c.id}
            href={c.type === "Twitter" ? `https://twitter.com/${c.id}` : c.type === "Facebook" ? `https://facebook.com/${c.id}` : `https://youtube.com/${c.id}`}
            target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            {c.type === "Twitter" ? "🐦" : c.type === "Facebook" ? "👤" : "▶️"} {c.type}
          </a>
        ))}
      </div>
    </article>
  );
}

export default function RepresentativesPage() {
  const [reps, setReps] = useState<Representative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  const fetchReps = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setIsDemo(address === DEMO_ADDRESS);

    try {
      const res = await fetch("/api/representatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await res.json()) as ApiResult<Representative[]>;

      if (data.ok) {
        setReps(data.data);
        if (!data.data.length) setError("No representatives found for this address.");
      } else {
        setError(data.error ?? "Unable to find representatives.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load demo data on mount
  useEffect(() => {
    fetchReps(DEMO_ADDRESS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group reps by level
  const federal = reps.filter(r => r.division?.includes("country:us") && !r.division?.includes("state:"));
  const state = reps.filter(r => r.division?.includes("state:ca") && !r.division?.includes("cd:") && !r.division?.includes("sldl:"));
  const district = reps.filter(r => r.division?.includes("cd:") || r.division?.includes("sldl:") || r.division?.includes("place:"));

  return (
    <div className="container page-padding">
      <h1 className="section-heading">My Representatives</h1>
      <p className="section-sub">Find your elected officials at every level of government.</p>

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
            <strong>Demo Mode</strong> — Showing sample representatives for <em>Los Angeles, CA (District 28)</em>.{" "}
            Enter your real address to find your actual elected officials.
          </span>
        </div>
      )}

      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <AddressForm
          onSubmit={fetchReps}
          isLoading={isLoading}
          label="Your Address"
          placeholder="123 Main St, City, State ZIP"
          submitLabel="Find My Representatives"
        />
      </div>

      {isLoading && <LoadingSpinner label="Finding your representatives…" fullPage />}

      {!isLoading && error && (
        <div role="alert" className="status-card not-registered">
          <span>⚠️</span>
          <div>
            <p className="status-title">Could not load representatives</p>
            <p className="status-body">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && reps.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
          {federal.length > 0 && (
            <section>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "var(--text-xs)" }}>
                🇺🇸 Federal
              </h2>
              <div className="reps-grid">{federal.map((r, i) => <RepCard key={i} rep={r} />)}</div>
            </section>
          )}
          {state.length > 0 && (
            <section>
              <h2 style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-4)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🏛️ State
              </h2>
              <div className="reps-grid">{state.map((r, i) => <RepCard key={i} rep={r} />)}</div>
            </section>
          )}
          {district.length > 0 && (
            <section>
              <h2 style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-4)", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📍 Local & District
              </h2>
              <div className="reps-grid">{district.map((r, i) => <RepCard key={i} rep={r} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
