"use client";

import React, { useState, useRef, FormEvent } from "react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { useGeolocation } from "@/hooks/useGeolocation";

interface AddressFormProps {
  onSubmit: (address: string) => void;
  isLoading?: boolean;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  defaultValue?: string;
}

export function AddressForm({
  onSubmit,
  isLoading,
  label = "Your Address",
  placeholder = "123 Main St, City, State, ZIP",
  submitLabel = "Search",
  defaultValue = "",
}: AddressFormProps) {
  const [address, setAddress] = useState(defaultValue);
  const [error, setError] = useState("");
  const { requestLocation, isLoading: geoLoading, error: geoError } = useGeolocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // When geolocation returns, fill the address
  const handleGeoClick = async () => {
    setError("");
    requestLocation();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError("Please enter your address.");
      inputRef.current?.focus();
      return;
    }
    if (address.trim().length < 5) {
      setError("Please enter a complete address.");
      return;
    }
    setError("");
    onSubmit(address.trim());
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Address lookup form">
      <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Input
            ref={inputRef}
            label={label}
            id="address-input"
            type="text"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setError(""); }}
            placeholder={placeholder}
            error={error || geoError || undefined}
            autoComplete="street-address"
            required
            leftIcon="📍"
            rightIcon={
              <button
                type="button"
                onClick={handleGeoClick}
                disabled={geoLoading}
                aria-label="Use my current location"
                title="Use current location"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-accent-primary)", fontSize: "1rem" }}
              >
                {geoLoading ? "⏳" : "🎯"}
              </button>
            }
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading || geoLoading}
          style={{ marginBottom: error ? "calc(var(--text-xs) + var(--space-2) + 4px)" : 0 }}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
