"use client";

import React, { useEffect, useRef, useState } from "react";
import { PollingPlace } from "@/types";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import {
  initMap,
  addMarkersAndFit,
  renderDirections,
} from "@/services/google-maps";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/common/Button";

interface PollingPlaceMapProps {
  places: PollingPlace[];
  userAddress?: string;
}

function LocationCard({
  place,
  isSelected,
  onClick,
}: {
  place: PollingPlace;
  isSelected: boolean;
  onClick: () => void;
}) {
  const icon = place.isDropBox ? "📬" : place.isEarlyVoting ? "⏰" : "🗳️";
  const type = place.isDropBox ? "Drop Box" : place.isEarlyVoting ? "Early Voting" : "Polling Place";

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={0}
      className={`location-item${isSelected ? " selected" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
    >
      <span className="location-pin" aria-hidden="true">{icon}</span>
      <div style={{ flex: 1 }}>
        <p className="location-name">{place.name}</p>
        <p className="location-address">{place.address}, {place.city}, {place.state} {place.zip}</p>
        <span className="badge badge-blue" style={{ marginTop: "var(--space-1)" }}>{type}</span>
        {place.hours && (
          <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
            🕐 {place.hours}
          </p>
        )}
      </div>
    </div>
  );
}

export function PollingPlaceMap({ places, userAddress }: PollingPlaceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [directionsShown, setDirectionsShown] = useState(false);
  const [directionsLoading, setDirectionsLoading] = useState(false);

  const { isLoaded, isLoading: mapsLoading, error: mapsError, ensureLoaded } = useGoogleMaps();
  useKeyboardNav(listRef, "[role='option']", setSelectedIdx);

  const apiKeyMissing = !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Load map on mount
  useEffect(() => {
    if (!apiKeyMissing) ensureLoaded();
  }, [ensureLoaded, apiKeyMissing]);

  // Initialize map once API is loaded
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !places.length) return;

    const center = places[0].coordinates ?? { lat: 39.8283, lng: -98.5795 };
    mapRef.current = initMap(mapContainerRef.current, center);
    addMarkersAndFit(mapRef.current, places, (place) => {
      const idx = places.findIndex((p) => p.id === place.id);
      if (idx !== -1) setSelectedIdx(idx);
    });
  }, [isLoaded, places]);

  const handleGetDirections = async () => {
    if (!mapRef.current || !userAddress || !places[selectedIdx]) return;
    setDirectionsLoading(true);
    await renderDirections(mapRef.current, userAddress, places[selectedIdx]);
    setDirectionsShown(true);
    setDirectionsLoading(false);
  };

  if (!places.length) {
    return (
      <div className="glass-card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <p style={{ fontSize: "2rem", marginBottom: "var(--space-4)" }}>📍</p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Enter your address on the Registration page to find your polling place.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="map-heading" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <h2 id="map-heading" className="sr-only">Polling Locations Map</h2>

      {/* Map */}
      <div className="map-container" aria-label="Map showing polling place locations">
        {apiKeyMissing && (
          <div className="flex-center" style={{ height: "100%", flexDirection: "column", gap: "var(--space-3)", color: "var(--color-text-muted)" }}>
            <p style={{ fontSize: "2rem" }}>🗺️</p>
            <p style={{ fontSize: "var(--text-sm)" }}>Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the map.</p>
            <p style={{ fontSize: "var(--text-xs)" }}>Locations are still listed below.</p>
          </div>
        )}
        {mapsLoading && !apiKeyMissing && <LoadingSpinner label="Loading map…" fullPage />}
        {mapsError && (
          <div className="flex-center" style={{ height: "100%", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
            {mapsError}
          </div>
        )}
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%", display: isLoaded ? "block" : "none" }}
          aria-hidden="true"
        />
      </div>

      {/* Directions button */}
      {userAddress && places[selectedIdx] && (
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <Button
            variant="primary"
            onClick={handleGetDirections}
            isLoading={directionsLoading}
            leftIcon="🗺️"
          >
            Get Directions to {places[selectedIdx].name}
          </Button>
          {directionsShown && (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(places[selectedIdx].address + " " + places[selectedIdx].city)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Open in Google Maps ↗
            </a>
          )}
        </div>
      )}

      {/* Location list */}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Polling locations"
        aria-activedescendant={`loc-${places[selectedIdx]?.id}`}
        className="location-list"
      >
        {places.map((place, idx) => (
          <LocationCard
            key={place.id}
            place={place}
            isSelected={idx === selectedIdx}
            onClick={() => setSelectedIdx(idx)}
          />
        ))}
      </div>
    </section>
  );
}
