"use client";

import { usePreferences } from "@/contexts/PreferencesContext";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { SUPPORTED_LOCALES } from "@/constants/config";
import { SupportedLocale } from "@/types";
import { useEffect } from "react";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
  vi: "Tiếng Việt",
  ko: "한국어",
  fr: "Français",
};

function useNavLinks() {
  const { t } = useTranslation();
  return [
    { href: "/", label: t("nav.home"), icon: "🏠" },
    { href: "/chat", label: t("nav.chat"), icon: "💬" },
    { href: "/voter", label: t("nav.voter"), icon: "📝" },
    { href: "/polling-places", label: t("nav.pollingPlaces"), icon: "📍" },
    { href: "/timeline", label: t("nav.timeline"), icon: "📅" },
    { href: "/representatives", label: t("nav.representatives"), icon: "🏛️" },
    { href: "/guide", label: t("nav.guide"), icon: "📋" },
  ];
}

/** Syncs <html lang="..."> with the selected language */
function HtmlLangSync() {
  const { preferences } = usePreferences();
  useEffect(() => {
    document.documentElement.lang = preferences.language ?? "en";
  }, [preferences.language]);
  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { preferences, setLanguage } = usePreferences();
  const { t } = useTranslation();
  const navLinks = useNavLinks();

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <HtmlLangSync />

      {/* Logo */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "1.75rem" }}>🗳️</span>
            <div>
              <p style={{ fontWeight: "var(--font-bold)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                Election
              </p>
              <p style={{ fontWeight: "var(--font-bold)", fontSize: "var(--text-sm)", color: "var(--color-accent-primary)", lineHeight: 1.2 }}>
                Assistant
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <ul role="list" style={{ flex: 1, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
        {navLinks.map((link) => {
          const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">{link.icon}</span>
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Language selector */}
      <div style={{ marginTop: "var(--space-6)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-6)" }}>
        <label htmlFor="lang-select" className="input-label" style={{ marginBottom: "var(--space-2)", display: "block" }}>
          🌐 {t("common.language") || "Language"}
        </label>
        <select
          id="lang-select"
          className="lang-select"
          value={preferences.language}
          onChange={(e) => setLanguage(e.target.value as SupportedLocale)}
          aria-label="Select language"
          style={{ width: "100%" }}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
          ))}
        </select>
      </div>

      {/* Auth */}
      <div style={{ marginTop: "var(--space-4)" }}>
        {session ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {t("auth.signedInAs") || "Signed in as"} {session.user?.name}
            </p>
            <button className="btn btn-ghost btn-sm" onClick={() => signOut()} style={{ width: "100%" }}>
              {t("auth.signOut")}
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => signIn("google")} style={{ width: "100%" }}>
            🔑 {t("auth.signIn")}
          </button>
        )}
      </div>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const navLinks = useNavLinks();
  const BOTTOM_LINKS = navLinks.slice(0, 5);

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {BOTTOM_LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`bottom-nav-link${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={link.label}
          >
            <span className="nav-icon" aria-hidden="true">{link.icon}</span>
            <span>{link.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="header">
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <span aria-hidden="true" style={{ fontSize: "1.3rem" }}>🗳️</span>
        <span style={{ fontWeight: "var(--font-bold)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
          {t("common.appName")}
        </span>
      </Link>
    </header>
  );
}
