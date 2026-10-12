import { NextResponse } from "next/server";
import { normalizeCounty, KENYAN_COUNTIES } from "@/lib/kenya-locations";

export async function GET(req: Request) {
  try {
    // Check client IP from headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "";

    // Query IP geolocation from server side (no CORS limitations)
    const url = ip && ip !== "127.0.0.1" && !ip.startsWith("192.168.") && ip !== "::1"
      ? `https://ipapi.co/${ip}/json/`
      : "https://ipapi.co/json/";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, { signal: controller.signal }).catch(() => null);
    clearTimeout(timeout);

    if (res && res.ok) {
      const data = await res.json();
      const countyCandidate = data.region || data.city || "";
      const normalized = normalizeCounty(countyCandidate);
      const isKnown = KENYAN_COUNTIES.some(
        (c) => c.label.toLowerCase() === normalized.toLowerCase()
      );

      if (isKnown) {
        return NextResponse.json({
          county: normalized,
          area: data.city || normalized,
          latitude: Number(data.latitude) || -0.33,
          longitude: Number(data.longitude) || 37.65,
        });
      }
    }
  } catch (e) {
    console.warn("[IP Location API] fallback triggered:", e);
  }

  // Graceful default for Kenyan users when GPS / IP lookup is inconclusive
  return NextResponse.json({
    county: "Tharaka-Nithi",
    area: "Chuka",
    latitude: -0.33,
    longitude: 37.65,
  });
}
