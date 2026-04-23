/**
 * Google Maps service — client-side only.
 * Loads Maps JS API lazily, manages map instances, markers, directions, clustering.
 */

import { Loader } from "@googlemaps/js-api-loader";
import { PollingPlace } from "@/types";

let loaderInstance: Loader | null = null;
let mapsLoaded = false;

/**
 * Get or create the Google Maps loader singleton.
 */
function getLoader(): Loader {
  if (!loaderInstance) {
    loaderInstance = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      version: "weekly",
      libraries: ["places", "marker"],
    });
  }
  return loaderInstance;
}

/**
 * Load the Google Maps JavaScript API. Safe to call multiple times.
 */
export async function loadGoogleMaps(): Promise<typeof google> {
  if (mapsLoaded && typeof google !== "undefined") return google;
  await getLoader().load();
  mapsLoaded = true;
  return google;
}

/**
 * Initialize a map in a container element.
 */
export function initMap(
  container: HTMLElement,
  center: { lat: number; lng: number },
  zoom = 13
): google.maps.Map {
  return new google.maps.Map(container, {
    center,
    zoom,
    mapId: "election-assistant-map",
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#0d1525" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#a8b8d8" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#070b14" }] },
      { featureType: "road", elementType: "geometry", stylers: [{ color: "#162340" }] },
      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0d1525" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#070b14" }] },
      { featureType: "poi", elementType: "geometry", stylers: [{ color: "#111d35" }] },
      { featureType: "transit", elementType: "geometry", stylers: [{ color: "#111d35" }] },
    ],
  });
}

/**
 * Create an AdvancedMarkerElement for a polling place.
 */
export function createPollingMarker(
  map: google.maps.Map,
  place: PollingPlace,
  onClick?: (place: PollingPlace) => void
): google.maps.marker.AdvancedMarkerElement | null {
  if (!place.coordinates) return null;

  const pinEl = document.createElement("div");
  pinEl.className = "map-marker-pin";
  pinEl.innerHTML = place.isDropBox ? "📬" : place.isEarlyVoting ? "⏰" : "🗳️";
  pinEl.style.cssText = `
    font-size: 1.5rem;
    width: 44px; height: 44px;
    display: flex; align-items: center; justify-content: center;
    background: rgba(13,21,37,0.9);
    border: 2px solid #3d8ef0;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(61,142,240,0.4);
    transition: transform 0.2s ease;
  `;

  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: place.coordinates,
    title: place.name,
    content: pinEl,
  });

  if (onClick) {
    marker.addListener("click", () => onClick(place));
  }

  return marker;
}

/**
 * Add multiple location markers and zoom to fit all of them.
 */
export function addMarkersAndFit(
  map: google.maps.Map,
  places: PollingPlace[],
  onClick?: (place: PollingPlace) => void
): void {
  const bounds = new google.maps.LatLngBounds();
  const markers: (google.maps.marker.AdvancedMarkerElement | null)[] = [];

  for (const place of places) {
    const marker = createPollingMarker(map, place, onClick);
    markers.push(marker);
    if (place.coordinates) bounds.extend(place.coordinates);
  }

  if (markers.filter(Boolean).length > 0) {
    map.fitBounds(bounds, { padding: 60 });
    if (markers.length === 1 && places[0].coordinates) {
      map.setCenter(places[0].coordinates);
      map.setZoom(15);
    }
  }
}

/**
 * Get and render directions between two points on a map.
 */
export async function renderDirections(
  map: google.maps.Map,
  from: string,
  to: PollingPlace
): Promise<google.maps.DirectionsResult | null> {
  const destination = to.coordinates
    ? to.coordinates
    : `${to.address}, ${to.city}, ${to.state} ${to.zip}`;

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: false,
    polylineOptions: { strokeColor: "#3d8ef0", strokeWeight: 4, strokeOpacity: 0.8 },
  });
  directionsRenderer.setMap(map);

  try {
    const result = await directionsService.route({
      origin: from,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
    });
    directionsRenderer.setDirections(result);
    return result;
  } catch {
    return null;
  }
}

/**
 * Geocode an address string to coordinates.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const geocoder = new google.maps.Geocoder();
  try {
    const { results } = await geocoder.geocode({ address });
    if (results[0]) {
      return {
        lat: results[0].geometry.location.lat(),
        lng: results[0].geometry.location.lng(),
      };
    }
  } catch {}
  return null;
}
