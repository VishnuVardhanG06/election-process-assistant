"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { PollingPlaceMap } from "@/components/features/map/PollingPlaceMap";
import { PollingPlace, ApiResult } from "@/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

const DEMO_ADDRESS = "1234 Maple Street, Los Angeles, CA 90210";

function DemoBanner({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.1))",
      border: "1px solid rgba(255,193,7,0.4)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-3) var(--space-5)",
      marginBottom: "var(--space-5)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      fontSize: "var(--text-sm)",
    }}>
      <span style={{ fontSize: "1.1rem" }}>📌</span>
      <span>
        <strong>Demo Mode</strong> — Showing 4 sample locations near <em>Springfield, CA</em>.{" "}
        Enter your real address to find your actual polling places.
      </span>
    </div>
  );
}

export default function PollingPlacesPage() {
  const [places, setPlaces] = useState<PollingPlace[]>([]);
  const [submittedAddress, setSubmittedAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  const fetchPlaces = async (address: string) => {
    setIsLoading(true);
    setError(null);
    setSubmittedAddress(address);
    setIsDemo(address === DEMO_ADDRESS);

    try {
      const res = await fetch("/api/polling-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await res.json()) as ApiResult<PollingPlace[]>;

      if (data.ok) {
        setPlaces(data.data);
        if (!data.data.length) setError("No polling locations found for this address. Try a different address.");
      } else {
        setError(data.error ?? "Unable to find polling places.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load demo data on mount
  useEffect(() => {
    fetchPlaces(DEMO_ADDRESS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container page-padding">
      <h1 className="section-heading">Find Your Polling Place</h1>
      <p className="section-sub">
        Locate polling places, early voting sites, and drop boxes near you.
      </p>

      <DemoBanner isDemo={isDemo} />

      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <AddressForm
          onSubmit={fetchPlaces}
          isLoading={isLoading}
          label="Your Registered Address"
          placeholder="123 Main St, City, State ZIP"
          submitLabel="Find Polling Places"
        />
      </div>

      {isLoading && <LoadingSpinner label="Finding polling locations…" fullPage />}

      {!isLoading && error && (
        <div role="alert" className="status-card not-registered">
          <span>⚠️</span>
          <div>
            <p className="status-title">Could not find polling places</p>
            <p className="status-body">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <PollingPlaceMap places={places} userAddress={submittedAddress} />
      )}

      {places.length > 0 && (
        <div className="glass-card-sm" style={{ padding: "var(--space-4)", marginTop: "var(--space-6)", display: "flex", gap: "var(--space-6)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            🗳️ Polling Place &nbsp; ⏰ Early Voting &nbsp; 📬 Drop Box
          </span>
        </div>
      )}
    </div>
  );
}
