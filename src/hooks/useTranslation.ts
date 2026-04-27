"use client";

import { useCallback } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";

// Import all message files statically so they bundle correctly
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import zh from "@/i18n/messages/zh.json";
import vi from "@/i18n/messages/vi.json";
import ko from "@/i18n/messages/ko.json";
import fr from "@/i18n/messages/fr.json";

/** Union of all bundled message dictionaries. */
type Messages = typeof en;

/** Recursive type for traversing nested message objects. */
type MessageValue = string | { [key: string]: MessageValue };

const messages: Record<string, Messages> = { en, es, zh, vi, ko, fr };

/**
 * Traverse a nested message object by dot-separated key path.
 * Returns the string value or undefined if not found.
 */
function getNestedValue(obj: Record<string, MessageValue>, key: string): string | undefined {
  const parts = key.split(".");
  let current: MessageValue = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, MessageValue>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

/**
 * Returns a translation function `t(key)` for the currently selected language.
 * Keys use dot notation, e.g. t("nav.home"), t("common.loading").
 * Falls back to English if the key is not found in the active language.
 */
export function useTranslation() {
  const { preferences } = usePreferences();
  const lang = preferences.language ?? "en";
  const dict = (messages[lang] ?? messages.en) as Record<string, MessageValue>;
  const fallback = messages.en as Record<string, MessageValue>;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let value = getNestedValue(dict, key) ?? getNestedValue(fallback, key) ?? key;

      // Replace {var} placeholders
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    },
    [dict, fallback]
  );

  return { t, lang };
}
