import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface LikeBody {
  senderId: string;
  receiverId: string;
  likeType?: "STANDARD" | "SUPER_SPARK";
  comment?: string;
}

/**
 * POST /api/likes
 * Records a like/super-spark from one user to another.
 * If the receiver had already liked the sender → mutual match is created.
 * Returns { liked: true, matched: boolean, matchId?: string, conversationId?: string }
 */
export async function POST(req: Request) {
  try {
    const body: LikeBody = await req.json();
    const { senderId, receiverId, likeType = "STANDARD", comment } = body;

    if (!senderId || !receiverId) {
      return NextResponse.json({ error: "senderId and receiverId are required" }, { status: 400 });
    }

    // Check if a like already exists (idempotent)
    const existingLike = await prisma.like.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (!existingLike) {
      await prisma.like.create({
        data: { senderId, receiverId, likeType, comment },
      });
    }

    // Check for mutual like (receiver liked sender back)
    const mutualLike = await prisma.like.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });

    if (!mutualLike) {
      return NextResponse.json({ liked: true, matched: false });
    }

    // ── Mutual Match: create match record and initial system message ───────
    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: senderId, user2Id: receiverId },
          { user1Id: receiverId, user2Id: senderId },
        ],
      },
    });

    if (existingMatch) {
      return NextResponse.json({
        liked: true,
        matched: true,
        matchId: existingMatch.id,
        conversationId: existingMatch.id, // match.id IS the conversation ID
      });
    }

    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const newMatch = await prisma.match.create({
      data: {
        user1Id: senderId,
        user2Id: receiverId,
        expiresAt,
        messages: {
          create: {
            senderId,
            content: `✨ Radar aligned! You both connected intentionally. You have 48 hours to start the momentum!`,
            isSystem: true,
            isRead: false,
          },
        },
      },
    });

    return NextResponse.json({
      liked: true,
      matched: true,
      matchId: newMatch.id,
      conversationId: newMatch.id, // match.id IS the conversation ID
    });
  } catch (error) {
    console.error("[LIKES API] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * GET /api/likes?userId=xxx
 * Returns likes received by a user (for the Likes tab)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const likes = await prisma.like.findMany({
      where: { receiverId: userId },
      include: {
        sender: {
          include: {
            photos: { orderBy: { order: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = likes.map((like) => ({
      id: like.id,
      senderId: like.senderId,
      likeType: like.likeType,
      comment: like.comment,
      createdAt: like.createdAt.toISOString(),
      sender: {
        id: like.sender.id,
        fullName: like.sender.fullName,
        age: Math.floor(
          (Date.now() - like.sender.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        ),
        county: like.sender.county,
        area: like.sender.area,
        occupation: like.sender.occupation || "",
        intent: like.sender.intent,
        verified: like.sender.verified,
        isVip: like.sender.isVip,
        photos: like.sender.photos.map((p) => ({
          id: p.id,
          url: p.url,
          isPrimary: p.isPrimary,
          order: p.order,
        })),
      },
    }));

    return NextResponse.json({ likes: formatted, count: formatted.length });
  } catch (error) {
    console.error("[LIKES GET] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
