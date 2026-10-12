import { findNearestKenyanCounty, normalizeCounty, KENYAN_COUNTIES } from "./kenya-locations";

export interface KenyaLocationResult {
  county: string;
  area: string;
  distanceKm?: number;
}

/**
 * Reverse geocodes GPS coordinates (lat, lng) to a Kenyan County and Area / Town.
 * Uses OpenStreetMap / BigDataCloud with timeout, falling back gracefully to
 * offline nearest-centroid matching of Kenya's 47 counties.
 */
export async function reverseGeocodeKenya(
  latitude: number,
  longitude: number
): Promise<KenyaLocationResult> {
  // Safe bounds check for Kenya (approx lat: -4.8 to 5.5, lng: 33.8 to 42.0)
  const isWithinKenya =
    latitude >= -5.0 &&
    latitude <= 5.5 &&
    longitude >= 33.5 &&
    longitude <= 42.5;

  if (!isWithinKenya) {
    // Fall back to nearest Kenya county
    const nearest = findNearestKenyanCounty(latitude, longitude);
    return { county: nearest.county, area: nearest.area, distanceKm: nearest.distanceKm };
  }

  // Attempt online reverse geocoding via OpenStreetMap Nominatim with 2.5s timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "RadaApp-KenyaDating/1.0",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Candidate county names from Nominatim response
      const rawCounty =
        addr.county ||
        addr.state ||
        addr.state_district ||
        addr.region ||
        "";

      // Town / Area from address
      const rawArea =
        addr.town ||
        addr.city ||
        addr.suburb ||
        addr.village ||
        addr.municipality ||
        addr.neighbourhood ||
        addr.city_district ||
        "";

      if (rawCounty) {
        const normalizedCounty = normalizeCounty(rawCounty);
        // Find if this is a known Kenyan county
        const matchedCounty = KENYAN_COUNTIES.find(
          (c) => c.label.toLowerCase() === normalizedCounty.toLowerCase()
        );

        if (matchedCounty) {
          // Find matching area if possible or use rawArea
          const matchedArea = matchedCounty.areas.find(
            (a) =>
              rawArea &&
              (a.label.toLowerCase() === rawArea.toLowerCase() ||
                a.value.toLowerCase() === rawArea.toLowerCase())
          );

          return {
            county: matchedCounty.label,
            area: matchedArea?.label || rawArea || matchedCounty.areas[0]?.label || matchedCounty.label,
          };
        }
      }
    }
  } catch {
    // Network failed or timed out — fall through to offline centroid match
  }

  // Guaranteed fallback: nearest Kenyan County
  const nearest = findNearestKenyanCounty(latitude, longitude);
  return {
    county: nearest.county,
    area: nearest.area,
    distanceKm: nearest.distanceKm,
  };
}

/**
 * Resolves location using IP address when browser GPS is unavailable, denied, or times out.
 * Calls our local /api/location/ip route to avoid browser CORS issues.
 */
export async function geolocateByIP(): Promise<KenyaLocationResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch("/api/location/ip", { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data.county) {
        return {
          county: data.county,
          area: data.area || data.county,
          distanceKm: 0,
        };
      }
    }
  } catch {
    // fallback
  }

  // Fallback default (Tharaka-Nithi, Chuka)
  return { county: "Tharaka-Nithi", area: "Chuka" };
}

