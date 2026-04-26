"use client";

import { useState, useEffect, useCallback } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";

// Import all message files statically so they bundle correctly
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import zh from "@/i18n/messages/zh.json";
import vi from "@/i18n/messages/vi.json";
import ko from "@/i18n/messages/ko.json";
import fr from "@/i18n/messages/fr.json";

const messages: Record<string, typeof en> = { en, es, zh, vi, ko, fr };

type Messages = typeof en;
type DeepKeys<T> = T extends object
  ? { [K in keyof T]: K extends string ? `${K}` | `${K}.${DeepKeys<T[K]>}` : never }[keyof T]
  : never;
type TranslationKey = DeepKeys<Messages>;

/**
 * Returns a translation function `t(key)` for the currently selected language.
 * Keys use dot notation, e.g. t("nav.home"), t("common.loading").
 */
export function useTranslation() {
  const { preferences } = usePreferences();
  const lang = preferences.language ?? "en";
  const dict = messages[lang] ?? messages.en;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let value: any = dict;
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) break;
      }
      if (typeof value !== "string") {
        // Fallback to English
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fallback: any = messages.en;
        for (const part of parts) {
          fallback = fallback?.[part];
          if (fallback === undefined) break;
        }
        value = typeof fallback === "string" ? fallback : key;
      }
      // Replace {var} placeholders
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value as string;
    },
    [dict]
  );

  return { t, lang };
}
