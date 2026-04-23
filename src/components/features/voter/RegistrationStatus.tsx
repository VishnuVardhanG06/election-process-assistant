"use client";

import React from "react";
import Link from "next/link";
import { RegistrationStatus as RegistrationStatusType } from "@/types";
import { Button } from "@/components/common/Button";

interface Props {
  status: "registered" | "not_registered" | "unknown";
  data?: RegistrationStatusType;
  isLoading?: boolean;
}

export function RegistrationStatus({ status, data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="status-card unknown" role="status" aria-live="polite" aria-busy="true">
        <span style={{ fontSize: "2rem" }}>⏳</span>
        <div>
          <p className="status-title">Checking registration status…</p>
          <p className="status-body">Looking up your voter registration.</p>
        </div>
      </div>
    );
  }

  if (status === "registered") {
    return (
      <div className="status-card registered" role="status" aria-live="polite">
        <span className="status-icon">✅</span>
        <div>
          <h3 className="status-title">You're registered to vote!</h3>
          <p className="status-body">Your voter registration is active{data?.state ? ` in ${data.state}` : ""}.</p>
          {data?.checkUrl && (
            <Button as="a" href={data.checkUrl} variant="secondary" size="sm" style={{ marginTop: "var(--space-4)" }}>
              View Registration Details ↗
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (status === "not_registered") {
    return (
      <div className="status-card not-registered" role="alert" aria-live="assertive">
        <span className="status-icon">⚠️</span>
        <div>
          <h3 className="status-title">You're not currently registered</h3>
          <p className="status-body">
            Register now to make sure your voice is counted.
            {data?.deadline ? ` Deadline: ${data.deadline}.` : ""}
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)", flexWrap: "wrap" }}>
            {data?.registrationUrl ? (
              <Button as="a" href={data.registrationUrl} variant="primary" size="sm">
                Register Now ↗
              </Button>
            ) : (
              <Button as="a" href="https://vote.gov" variant="primary" size="sm">
                Register at vote.gov ↗
              </Button>
            )}
            <Link href="/timeline">
              <Button variant="secondary" size="sm">View Deadlines</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // unknown
  return (
    <div className="status-card unknown" role="status" aria-live="polite">
      <span className="status-icon">📋</span>
      <div>
        <h3 className="status-title">Enter your address to check</h3>
        <p className="status-body">We'll look up your registration status using the Google Civic API.</p>
      </div>
    </div>
  );
}
