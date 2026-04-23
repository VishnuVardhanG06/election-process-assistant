"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserPreferences, SupportedLocale } from "@/types";

const DEFAULT_PREFS: UserPreferences = {
  hasConsent: false,
  dataRetention: "session",
  analyticsOptIn: false,
  language: "en",
  highContrast: false,
  reducedMotion: false,
};

interface PreferencesContextValue {
  preferences: UserPreferences;
  grantConsent: (retention: UserPreferences["dataRetention"]) => void;
  setLanguage: (lang: SupportedLocale) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setAnalyticsOptIn: (val: boolean) => void;
}

const PreferencesCtx = createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFS);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("epa_prefs");
      if (stored) {
        const parsed = JSON.parse(stored) as UserPreferences;
        setPreferences(parsed);
      }
    } catch {}

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setPreferences((p) => ({ ...p, reducedMotion: true }));
    }
  }, []);

  // Persist when preferences change (only if consent given)
  useEffect(() => {
    if (preferences.hasConsent) {
      try {
        localStorage.setItem("epa_prefs", JSON.stringify(preferences));
      } catch {}
    }
  }, [preferences]);

  const grantConsent = (retention: UserPreferences["dataRetention"]) => {
    setPreferences((p) => ({ ...p, hasConsent: true, dataRetention: retention }));
  };

  const setLanguage = (lang: SupportedLocale) => {
    setPreferences((p) => ({ ...p, language: lang }));
  };

  const toggleHighContrast = () => {
    setPreferences((p) => ({ ...p, highContrast: !p.highContrast }));
  };

  const toggleReducedMotion = () => {
    setPreferences((p) => ({ ...p, reducedMotion: !p.reducedMotion }));
  };

  const setAnalyticsOptIn = (val: boolean) => {
    setPreferences((p) => ({ ...p, analyticsOptIn: val }));
  };

  return (
    <PreferencesCtx.Provider
      value={{
        preferences,
        grantConsent,
        setLanguage,
        toggleHighContrast,
        toggleReducedMotion,
        setAnalyticsOptIn,
      }}
    >
      {children}
    </PreferencesCtx.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesCtx);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
