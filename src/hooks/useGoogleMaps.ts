"use client";

import { useState, useCallback } from "react";
import { loadGoogleMaps } from "@/services/google-maps";

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  ensureLoaded: () => Promise<void>;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureLoaded = useCallback(async () => {
    if (isLoaded) return;
    setIsLoading(true);
    setError(null);
    try {
      await loadGoogleMaps();
      setIsLoaded(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to load Google Maps. Check your API key.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded]);

  return { isLoaded, isLoading, error, ensureLoaded };
}
