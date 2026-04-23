"use client";

import { Metadata } from "next";
import { useState } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { RegistrationStatus } from "@/components/features/voter/RegistrationStatus";
import { useVoterInfo } from "@/hooks/useVoterInfo";
import { useUserContext } from "@/contexts/UserContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Link from "next/link";

export default function VoterPage() {
  const { voterInfo, registrationStatus, isLoading, error, fetchVoterInfo, address, setAddress } =
    useVoterInfo();
  const { updateLocation, updateRegistrationStatus } = useUserContext();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (addr: string) => {
    setAddress(addr);
    setSubmitted(true);
    updateLocation({ fullAddress: addr });
    fetchVoterInfo(addr);
  };

  const status = !submitted
    ? "unknown"
    : registrationStatus?.isRegistered
    ? "registered"
    : "not_registered";

  return (
    <div className="container page-padding">
      <h1 className="section-heading">Voter Registration</h1>
      <p className="section-sub">
        Check your registration status and access your state's registration portal.
      </p>

      {/* Address form */}
      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <AddressForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          label="Your Address"
          placeholder="123 Main St, City, State ZIP"
          submitLabel="Check Registration"
        />
      </div>

      {/* Status */}
      {isLoading && <LoadingSpinner label="Checking registration status…" />}

      {!isLoading && error && (
        <div role="alert" className="status-card not-registered">
          <span>⚠️</span>
          <div>
            <p className="status-title">Could not retrieve information</p>
            <p className="status-body">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && submitted && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <RegistrationStatus status={status} data={registrationStatus ?? undefined} />

          {/* Election info */}
          {voterInfo?.election && (
            <div className="glass-card" style={{ padding: "var(--space-6)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>Upcoming Election</h2>
              <div className="grid-2">
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Election</p>
                  <p style={{ fontWeight: "var(--font-semibold)" }}>{voterInfo.election.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>Election Day</p>
                  <p style={{ fontWeight: "var(--font-semibold)" }}>
                    {new Date(voterInfo.election.electionDay).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* State resources */}
          {voterInfo?.state?.[0]?.electionAdministrationBody && (
            <div className="glass-card" style={{ padding: "var(--space-6)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>Official Resources</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                {Object.entries({
                  "Voter Registration": voterInfo.state[0].electionAdministrationBody.registrationUrl,
                  "Election Information": voterInfo.state[0].electionAdministrationBody.electionInfoUrl,
                  "Find Polling Place": voterInfo.state[0].electionAdministrationBody.votingLocationFinderUrl,
                  "Absentee Voting": voterInfo.state[0].electionAdministrationBody.absenteeVotingInfoUrl,
                  "Ballot Information": voterInfo.state[0].electionAdministrationBody.ballotInfoUrl,
                })
                  .filter(([, url]) => Boolean(url))
                  .map(([label, url]) => (
                    <a key={label} href={url!} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                      {label} ↗
                    </a>
                  ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
            <Link href="/polling-places" className="btn btn-primary">📍 Find My Polling Place</Link>
            <Link href="/timeline" className="btn btn-secondary">📅 View Election Timeline</Link>
          </div>
        </div>
      )}

      {/* No API key message */}
      {!submitted && (
        <div className="glass-card-sm" style={{ padding: "var(--space-4)", marginTop: "var(--space-8)" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            💡 <strong>How it works:</strong> Your address is sent to the{" "}
            <a href="https://developers.google.com/civic-information" target="_blank" rel="noopener noreferrer">
              Google Civic Information API
            </a>{" "}
            to fetch real voter registration data, polling places, and election details for your area.
            No data is stored without your consent.
          </p>
        </div>
      )}
    </div>
  );
}
