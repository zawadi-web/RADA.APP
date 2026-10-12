import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/matches?userId=xxx
 * Returns all active matches for a user with last message & momentum timer
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const now = new Date();

    // Auto-expire matches whose timer has run out
    await prisma.match.updateMany({
      where: {
        isExpired: false,
        expiresAt: { lt: now },
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      data: { isExpired: true },
    });

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        isExpired: false,
      },
      include: {
        user1: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
        user2: { include: { photos: { orderBy: { order: "asc" }, take: 1 } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastActivity: "desc" },
    });

    const formatted = matches.map((match) => {
      const partner = match.user1Id === userId ? match.user2 : match.user1;
      const hoursRemaining = Math.max(
        0,
        Math.floor((match.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
      );
      const lastMsg = match.messages[0];

      // Count unread messages not sent by current user
      // (For efficiency, approximate with a subquery or batch later)
      return {
        id: match.id,
        conversationId: match.id, // match.id is the conversation ID
        matchedAt: match.createdAt.toISOString(),
        lastActivity: match.lastActivity.toISOString(),
        expiresAt: match.expiresAt.toISOString(),
        momentumHoursRemaining: hoursRemaining,
        isExpired: match.isExpired,
        unreadCount: 0, // updated below if needed
        matchedWith: {
          id: partner.id,
          fullName: partner.fullName,
          age: Math.floor(
            (Date.now() - partner.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
          ),
          county: partner.county,
          area: partner.area,
          occupation: partner.occupation || "",
          intent: partner.intent,
          verified: partner.verified,
          isVip: partner.isVip,
          photos: partner.photos.map((p) => ({
            id: p.id,
            url: p.url,
            isPrimary: p.isPrimary,
            order: p.order,
          })),
          bio: partner.bio || "",
          gender: partner.gender,
          prompts: [],
        },
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: match.id,
              senderId: lastMsg.senderId,
              content: lastMsg.content,
              isRead: lastMsg.isRead,
              createdAt: lastMsg.createdAt.toISOString(),
              isSystem: lastMsg.isSystem,
            }
          : undefined,
      };
    });

    return NextResponse.json({ matches: formatted, total: formatted.length });
  } catch (error) {
    console.error("[MATCHES GET] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
