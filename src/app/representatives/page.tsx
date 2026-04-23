"use client";

import { useState } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { Representative, ApiResult } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

function RepCard({ rep }: { rep: Representative }) {
  return (
    <article className="rep-card glass-card" aria-labelledby={`rep-${rep.name.replace(/\s+/g,"-")}`}>
      {rep.photoUrl ? (
        <img src={rep.photoUrl} alt={`Photo of ${rep.name}`} className="rep-photo" />
      ) : (
        <div className="rep-photo flex-center" style={{ fontSize: "2rem", background: "var(--color-bg-overlay)" }} aria-hidden="true">
          🏛️
        </div>
      )}
      <h3 id={`rep-${rep.name.replace(/\s+/g,"-")}`} className="rep-name">{rep.name}</h3>
      <p className="rep-office">{rep.office}</p>
      {rep.party && <p className="rep-party">{rep.party}</p>}
      <div className="rep-contact">
        {rep.phones?.map((p) => (
          <a key={p} href={`tel:${p.replace(/\D/g,"")}`} className="btn btn-ghost btn-sm" aria-label={`Call ${rep.name}: ${p}`}>
            📞 {p}
          </a>
        ))}
        {rep.emails?.map((e) => (
          <a key={e} href={`mailto:${e}`} className="btn btn-ghost btn-sm" aria-label={`Email ${rep.name}`}>
            ✉️ Email
          </a>
        ))}
        {rep.urls?.map((u) => (
          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            🌐 Website
          </a>
        ))}
        {rep.channels?.map((c) => (
          <a key={c.id} href={`https://${c.type.toLowerCase()}.com/${c.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
            {c.type === "Twitter" ? "🐦" : c.type === "Facebook" ? "👤" : "📲"} {c.type}
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
  const [searched, setSearched] = useState(false);

  const handleSearch = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setSearched(true);

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

  return (
    <div className="container page-padding">
      <h1 className="section-heading">My Representatives</h1>
      <p className="section-sub">Find your elected officials at every level of government.</p>

      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <AddressForm
          onSubmit={handleSearch}
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

      {!isLoading && searched && reps.length > 0 && (
        <section aria-labelledby="reps-list-heading">
          <h2 id="reps-list-heading" style={{ visuallyHidden: true } as any} className="sr-only">
            Representatives list
          </h2>
          <div className="reps-grid">
            {reps.map((rep, i) => (
              <RepCard key={`${rep.name}-${i}`} rep={rep} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
