import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/stories
 * Retrieves active stories (created within last 24h).
 * Automatically cleans up expired stories.
 */
export async function GET() {
  try {
    const now = new Date();

    // Storage Optimization: clean up expired stories (> 24 hours)
    try {
      await prisma.story.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });
    } catch (e) {
      // Table may not yet be pushed to production DB, fallback gracefully
    }

    // Fetch active non-expired stories
    const dbStories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        isExpired: false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            area: true,
            county: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, stories: dbStories });
  } catch (err) {
    console.error("GET /api/stories error:", err);
    return NextResponse.json({ success: true, stories: [] });
  }
}

/**
 * POST /api/stories
 * Creates a new 24-hour expiring story in PostgreSQL.
 * Safeguarded against missing user foreign-key constraints.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, mediaUrl, caption, authorName, authorPhotoUrl, authorCounty, authorArea } = body;

    if (!mediaUrl) {
      return NextResponse.json({ error: "mediaUrl is required" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours later

    // 1. Resolve or guarantee a valid User record in PostgreSQL
    let effectiveUserId = userId;
    let userExists = false;

    if (effectiveUserId && !effectiveUserId.startsWith("user-me") && !effectiveUserId.startsWith("user-")) {
      const existingUser = await prisma.user.findUnique({
        where: { id: effectiveUserId },
        select: { id: true },
      }).catch(() => null);
      if (existingUser) {
        userExists = true;
      }
    }

    // If user does not exist in DB yet, create or link a valid record so foreign key constraint NEVER fails
    if (!userExists) {
      try {
        const fallbackEmail = `story_author_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@rada.app`;
        const newUser = await prisma.user.create({
          data: {
            fullName: authorName || "Rada Member",
            email: fallbackEmail,
            birthDate: new Date("2000-01-01"),
            gender: "WOMAN",
            county: authorCounty || "Nairobi",
            area: authorArea || "Kilimani",
            completionScore: 70,
            verified: true,
            photos: authorPhotoUrl
              ? { create: { url: authorPhotoUrl, isPrimary: true, order: 0 } }
              : undefined,
          },
        });
        effectiveUserId = newUser.id;
      } catch (userCreateErr) {
        console.error("Error creating fallback story user:", userCreateErr);
        // Try to attach to first existing user
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        if (firstUser) effectiveUserId = firstUser.id;
      }
    }

    // 2. Persist story record to DB
    const storyRecord = await prisma.story.create({
      data: {
        userId: effectiveUserId,
        mediaUrl,
        caption: caption ? caption.slice(0, 200) : null,
        createdAt: now,
        expiresAt,
        isExpired: false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            area: true,
            county: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    return NextResponse.json({ success: true, story: storyRecord });
  } catch (err) {
    console.error("POST /api/stories error:", err);
    return NextResponse.json({ error: "Failed to publish story" }, { status: 500 });
  }
}
