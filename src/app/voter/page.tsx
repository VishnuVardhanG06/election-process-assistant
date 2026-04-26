"use client";

import { useState, useEffect } from "react";
import { AddressForm } from "@/components/features/voter/AddressForm";
import { RegistrationStatus } from "@/components/features/voter/RegistrationStatus";
import { useVoterInfo } from "@/hooks/useVoterInfo";
import { useUserContext } from "@/contexts/UserContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

const DEMO_ADDRESS = "1234 Maple Street, Los Angeles, CA 90210";

const LOCALE_MAP: Record<string, string> = {
  en: "en-US", es: "es-ES", zh: "zh-CN", vi: "vi-VN", ko: "ko-KR", fr: "fr-FR",
};

export default function VoterPage() {
  const { t, lang } = useTranslation();
  const { voterInfo, registrationStatus, isLoading, error, fetchVoterInfo, setAddress } = useVoterInfo();
  const { updateLocation } = useUserContext();
  const [submitted, setSubmitted] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  // Auto-load demo data on mount
  useEffect(() => {
    setAddress(DEMO_ADDRESS);
    setSubmitted(true);
    fetchVoterInfo(DEMO_ADDRESS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (addr: string) => {
    setAddress(addr);
    setSubmitted(true);
    setIsDemo(addr === DEMO_ADDRESS);
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
      <h1 className="section-heading">{t("registration.title")}</h1>
      <p className="section-sub">{t("registration.unknown")}</p>

      {/* Demo banner */}
      {isDemo && (
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
            <strong>Demo Mode</strong> — Showing sample data for <em>Springfield, CA</em>.{" "}
            Enter your real address below to see your actual election information.
          </span>
        </div>
      )}

      {/* Address form */}
      <div className="glass-card" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <AddressForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          label={t("registration.addressLabel")}
          placeholder={t("registration.addressPlaceholder")}
          submitLabel={t("registration.checkStatus")}
        />
      </div>

      {isLoading && <LoadingSpinner label={t("registration.checking")} />}

      {!isLoading && error && (
        <div role="alert" className="status-card not-registered">
          <span>⚠️</span>
          <div>
            <p className="status-title">{t("errors.apiUnavailable")}</p>
            <p className="status-body">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && submitted && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <RegistrationStatus status={status} data={registrationStatus ?? undefined} />

          {voterInfo?.election && (
            <div className="glass-card" style={{ padding: "var(--space-6)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
                {lang === "es" ? "Próxima Elección" : lang === "zh" ? "即将到来的选举" : lang === "vi" ? "Cuộc bầu cử sắp tới" : lang === "ko" ? "다가오는 선거" : lang === "fr" ? "Prochaine élection" : "Upcoming Election"}
              </h2>
              <div className="grid-2">
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                    {lang === "es" ? "Elección" : lang === "zh" ? "选举" : lang === "fr" ? "Élection" : "Election"}
                  </p>
                  <p style={{ fontWeight: "var(--font-semibold)" }}>{voterInfo.election.name}</p>
                </div>
                <div>
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                    {lang === "es" ? "Día de Elección" : lang === "zh" ? "选举日" : lang === "fr" ? "Jour d'élection" : "Election Day"}
                  </p>
                  <p style={{ fontWeight: "var(--font-semibold)" }}>
                    {new Date(voterInfo.election.electionDay).toLocaleDateString(
                      LOCALE_MAP[lang] ?? "en-US",
                      { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {voterInfo?.state?.[0]?.electionAdministrationBody && (
            <div className="glass-card" style={{ padding: "var(--space-6)" }}>
              <h2 style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-4)" }}>
                {lang === "es" ? "Recursos Oficiales" : lang === "zh" ? "官方资源" : lang === "fr" ? "Ressources officielles" : "Official Resources"}
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                {Object.entries({
                  [t("registration.registerNow")]: voterInfo.state[0].electionAdministrationBody.registrationUrl,
                  [lang === "es" ? "Info Electoral" : lang === "zh" ? "选举信息" : "Election Info"]: voterInfo.state[0].electionAdministrationBody.electionInfoUrl,
                  [t("map.yourPollingPlace")]: voterInfo.state[0].electionAdministrationBody.votingLocationFinderUrl,
                  [lang === "es" ? "Voto en Ausencia" : lang === "zh" ? "缺席投票" : "Absentee Voting"]: voterInfo.state[0].electionAdministrationBody.absenteeVotingInfoUrl,
                  [lang === "es" ? "Info Boleta" : lang === "zh" ? "选票信息" : "Ballot Info"]: voterInfo.state[0].electionAdministrationBody.ballotInfoUrl,
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
            <Link href="/polling-places" className="btn btn-primary">📍 {t("nav.pollingPlaces")}</Link>
            <Link href="/timeline" className="btn btn-secondary">📅 {t("nav.timeline")}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
