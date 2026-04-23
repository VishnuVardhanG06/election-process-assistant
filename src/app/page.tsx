import type { Metadata } from "next";
import Link from "next/link";
import { QuickActions } from "@/components/features/voter/QuickActions";

export const metadata: Metadata = {
  title: "Home — Your Smart Election Guide",
  description:
    "Get personalized, step-by-step guidance for every stage of the election process — voter registration, polling places, deadlines, and more.",
};

export default function HomePage() {
  return (
    <div className="container page-padding">
      {/* Hero */}
      <section aria-labelledby="hero-heading" className="hero animate-fade-in">
        <div className="hero-eyebrow">
          🗳️ Non-Partisan · Accurate · Free
        </div>
        <h1 id="hero-heading" className="gradient-text">
          Your Smart Election Guide
        </h1>
        <p>
          Get personalized, step-by-step guidance for every stage of the
          election process — registration, polling places, deadlines, and more.
        </p>
        <div style={{ display: "flex", gap: "var(--space-4)", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/chat" className="btn btn-primary btn-lg">
            💬 Ask the Assistant
          </Link>
          <Link href="/voter" className="btn btn-secondary btn-lg">
            📝 Check Registration
          </Link>
        </div>
      </section>

      <div className="divider" />

      {/* Quick Actions */}
      <section style={{ marginBottom: "var(--space-16)" }}>
        <QuickActions />
      </section>

      {/* Chat Preview — links to the full chat page */}
      <section aria-labelledby="chat-preview-heading" style={{ marginBottom: "var(--space-16)" }}>
        <h2 id="chat-preview-heading" className="section-heading">Ask Anything</h2>
        <p className="section-sub">
          Have a question? Our AI assistant knows the complete election process.
        </p>
        <div className="glass-card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <p style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }} aria-hidden="true">💬</p>
          <p style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>
            Election Assistant is ready to help
          </p>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-6)" }}>
            Ask about registration, polling places, deadlines, ID requirements, absentee voting, and more.
          </p>
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              "How do I register to vote?",
              "Where do I vote?",
              "What ID do I need?",
              "How do I vote by mail?",
            ].map((q) => (
              <Link
                key={q}
                href={`/chat?q=${encodeURIComponent(q)}`}
                className="btn btn-secondary btn-sm"
              >
                {q}
              </Link>
            ))}
          </div>
          <div style={{ marginTop: "var(--space-6)" }}>
            <Link href="/chat" className="btn btn-primary">
              Open Election Assistant →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section aria-labelledby="features-heading" style={{ marginBottom: "var(--space-16)" }}>
        <h2 id="features-heading" className="section-heading">Everything You Need</h2>
        <p className="section-sub">Powered by Google Civic Information API and real-time data.</p>
        <div className="grid-3" style={{ gap: "var(--space-6)" }}>
          {[
            { icon: "📋", title: "Voter Registration", desc: "Check status and register via official state portals. Never miss a deadline.", href: "/voter" },
            { icon: "🗺️", title: "Polling Place Map", desc: "Find your polling place with Google Maps integration and get directions.", href: "/polling-places" },
            { icon: "📅", title: "Election Timeline", desc: "All key dates synced to your Google Calendar with smart reminders.", href: "/timeline" },
            { icon: "🏛️", title: "Your Representatives", desc: "See who represents you at all levels of government with contact info.", href: "/representatives" },
            { icon: "📋", title: "Voter Guide", desc: "Your personalized ballot guide. Save to Google Drive for easy access.", href: "/guide" },
            { icon: "🌐", title: "Multi-Language", desc: "Available in 6 languages: EN, ES, 中文, Tiếng Việt, 한국어, Français.", href: "#" },
          ].map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="glass-card"
              style={{ padding: "var(--space-6)", display: "block", textDecoration: "none" }}
            >
              <p style={{ fontSize: "2rem", marginBottom: "var(--space-3)" }} aria-hidden="true">{f.icon}</p>
              <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-2)" }}>{f.title}</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <footer style={{ textAlign: "center", padding: "var(--space-8) 0", borderTop: "1px solid var(--color-border)" }}>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          ⚖️ Non-partisan. Information provided for general guidance only. Always verify with your local election authority. ·{" "}
          <a href="https://vote.gov" target="_blank" rel="noopener noreferrer">vote.gov</a> ·{" "}
          <a href="https://www.vote.org" target="_blank" rel="noopener noreferrer">vote.org</a>
        </p>
      </footer>
    </div>
  );
}
