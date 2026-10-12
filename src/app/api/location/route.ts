import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { reverseGeocodeKenya } from "@/lib/kenya-geocoding";
import { normalizeCounty } from "@/lib/kenya-locations";

/**
 * POST /api/location
 * Saves user's approximate GPS coordinates for proximity matching AND
 * resolves/updates their actual Kenyan county & area/town.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, latitude, longitude, county: inputCounty, area: inputArea } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let lat: number | null = null;
    let lng: number | null = null;
    let resolvedCounty = inputCounty ? normalizeCounty(inputCounty) : undefined;
    let resolvedArea = inputArea;

    if (latitude !== undefined && longitude !== undefined) {
      lat = Math.round(Number(latitude) * 100) / 100;
      lng = Math.round(Number(longitude) * 100) / 100;

      // If county/area was not provided, reverse-geocode from GPS
      if (!resolvedCounty || !resolvedArea) {
        const geo = await reverseGeocodeKenya(lat, lng);
        resolvedCounty = resolvedCounty || geo.county;
        resolvedArea = resolvedArea || geo.area;
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(lat !== null ? { latitude: lat } : {}),
        ...(lng !== null ? { longitude: lng } : {}),
        ...(lat !== null ? { locationUpdatedAt: new Date() } : {}),
        ...(resolvedCounty ? { county: resolvedCounty } : {}),
        ...(resolvedArea ? { area: resolvedArea } : {}),
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        county: true,
        area: true,
      },
    });

    return NextResponse.json({
      success: true,
      latitude: updated.latitude,
      longitude: updated.longitude,
      county: updated.county,
      area: updated.area,
    });
  } catch (error) {
    console.error("[LOCATION API] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * DELETE /api/location
 * Clears the user's stored location data (disable location feature)
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        latitude: null,
        longitude: null,
        locationUpdatedAt: null,
      },
    });

    return NextResponse.json({ success: true, message: "Location coordinates cleared" });
  } catch (error) {
    console.error("[LOCATION DELETE] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
