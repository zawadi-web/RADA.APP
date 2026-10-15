import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/sync
 * Called immediately after Google sign-in to upsert the user in the DB.
 * Does NOT overwrite gender / interestedInGenders if the user already exists —
 * those are set during onboarding or via /api/profile/save.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl } = body;

    if (!email && !name) {
      return NextResponse.json({ error: "Email or name is required" }, { status: 400 });
    }

    const safeEmail = email || `user_${Date.now()}@rada.app`;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: safeEmail },
      include: { photos: { orderBy: { order: "asc" }, take: 1 } },
    }).catch(() => null);

    if (existing) {
      // Only update non-destructive fields — preserve gender, interestedInGenders, intent, etc.
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: name || existing.fullName,
          verified: true,
          // Add Google avatar as first photo if user has none
          ...(avatarUrl && existing.photos.length === 0
            ? {
                photos: {
                  create: { url: avatarUrl, isPrimary: true, order: 0 },
                },
              }
            : {}),
        },
        include: { photos: true },
      });
      const hasCompletedProfile = Boolean(existing.completionScore >= 60 && existing.photos.length > 0);
      return NextResponse.json({ success: true, user: updated, isNew: false, hasCompletedProfile });
    }

    // New user — create with safe defaults; onboarding completes the profile
    const created = await prisma.user.create({
      data: {
        email:              safeEmail,
        fullName:           name || "New Member",
        birthDate:          new Date("2000-01-01"),
        county:             "Nairobi",
        area:               "Kilimani",
        verified:           true,
        completionScore:    10, // Must complete onboarding (gte: 30) before appearing in discover decks
        photos: avatarUrl
          ? { create: { url: avatarUrl, isPrimary: true, order: 0 } }
          : undefined,
      },
      include: { photos: true },
    });

    return NextResponse.json({ success: true, user: created, isNew: true, hasCompletedProfile: false });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user with database" },
      { status: 500 }
    );
  }
}
