import type { Metadata } from "next";
import "./globals.css";
import { UserContextProvider } from "@/contexts/UserContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { Sidebar, BottomNav, Header } from "@/components/layouts/Navigation";
import { SkipLink } from "@/components/common/Accessibility";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Election Process Assistant",
    template: "%s | Election Process Assistant",
  },
  description:
    "A smart, AI-powered guide to help you navigate voter registration, find your polling place, track election deadlines, and understand the complete election process.",
  keywords: ["election", "voter registration", "polling place", "voting", "election assistant"],
  openGraph: {
    title: "Election Process Assistant",
    description: "Your smart guide to the election process",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#070b14" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <Providers>
          <PreferencesProvider>
            <UserContextProvider>
              <div className="app-bg" aria-hidden="true" />
              <SkipLink />
              <div className="app-shell">
                <Sidebar />
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <Header />
                  <main
                    id="main-content"
                    className="main-content"
                    tabIndex={-1}
                    aria-label="Main content"
                  >
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </main>
                </div>
              </div>
              <BottomNav />
            </UserContextProvider>
          </PreferencesProvider>
        </Providers>
      </body>
    </html>
  );
}
