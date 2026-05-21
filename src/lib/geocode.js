/**
 * Dealer coordinate resolution: manual pin, Google Maps URL, then Nominatim (Kenya-biased).
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "WelshMotorhub/1.0 (https://welshmotorhub.co.ke; dealer-locations)";

export function toNullableCoordinate(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function inValidKenyaRange(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Rough Kenya bounding box (includes coast + borders with slack)
  return lat >= -5.5 && lat <= 5.5 && lng >= 33 && lng <= 42.5;
}

export function inValidRange(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function extractCoordsFromMapsUrl(url) {
  if (!url) return null;
  const normalized = decodeURIComponent(url);
  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /place\/[^/]+\/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;
    const lat = Number(match[1]);
    const lng = Number(match[2]);
    if (inValidRange(lat, lng)) return { lat, lng };
  }

  return null;
}

export async function resolveMapsCoords(rawUrl) {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  const direct = extractCoordsFromMapsUrl(trimmed);
  if (direct) return direct;

  try {
    const response = await fetch(trimmed, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const finalUrl = response?.url;
    if (!finalUrl) return null;
    return extractCoordsFromMapsUrl(finalUrl);
  } catch {
    return null;
  }
}

/**
 * Forward geocode a Kenyan dealer address via Nominatim (OSM).
 * @returns {{ lat: number; lng: number; displayName?: string } | null}
 */
export async function geocodeAddressKenya({ address, location, county } = {}) {
  const parts = [address, location, county, "Kenya"].map((p) => p?.trim()).filter(Boolean);
  if (!parts.length) return null;

  const q = parts.join(", ");
  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    countrycodes: "ke",
    q,
  });

  try {
    const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const rows = await res.json();
    const hit = rows?.[0];
    if (!hit?.lat || !hit?.lon) return null;

    const lat = Number(hit.lat);
    const lng = Number(hit.lon);
    if (!inValidKenyaRange(lat, lng)) return null;

    return {
      lat,
      lng,
      displayName: hit.display_name,
    };
  } catch {
    return null;
  }
}

/**
 * Pick best coordinates for a dealer save.
 * Priority: manual map pin → Google Maps URL → address geocode.
 */
export async function resolveDealerCoordinates({
  lat,
  lng,
  address,
  location,
  county,
  mapsUrl,
} = {}) {
  const manualLat = toNullableCoordinate(lat);
  const manualLng = toNullableCoordinate(lng);
  const manual =
    manualLat != null && manualLng != null && inValidRange(manualLat, manualLng)
      ? { lat: manualLat, lng: manualLng }
      : null;

  if (manual) {
    return { lat: manual.lat, lng: manual.lng, source: "manual" };
  }

  const fromMaps = await resolveMapsCoords(mapsUrl);
  if (fromMaps && inValidKenyaRange(fromMaps.lat, fromMaps.lng)) {
    return { lat: fromMaps.lat, lng: fromMaps.lng, source: "maps_url" };
  }
  if (fromMaps && inValidRange(fromMaps.lat, fromMaps.lng)) {
    return { lat: fromMaps.lat, lng: fromMaps.lng, source: "maps_url" };
  }

  const geocoded = await geocodeAddressKenya({ address, location, county });
  if (geocoded) {
    return { lat: geocoded.lat, lng: geocoded.lng, source: "geocode" };
  }

  return { lat: null, lng: null, source: null };
}
