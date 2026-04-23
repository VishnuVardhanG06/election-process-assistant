"use client";

import { useState, useCallback } from "react";

interface UseGeolocationReturn {
  address: string | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode using Nominatim (free, no key required)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const { house_number, road, city, town, village, state, postcode, country } =
            data.address ?? {};

          const street = [house_number, road].filter(Boolean).join(" ");
          const locality = city ?? town ?? village ?? "";
          const formatted = [street, locality, state, postcode, country]
            .filter(Boolean)
            .join(", ");

          setAddress(formatted);
        } catch {
          setError("Could not determine your address. Please enter it manually.");
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied. Please enter your address manually.");
        } else {
          setError("Could not get your location. Please enter your address manually.");
        }
      },
      { timeout: 10_000, maximumAge: 60_000 }
    );
  }, []);

  return { address, isLoading, error, requestLocation };
}
