import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/likes/reset
 * Fully resets a user's swipes and test matches so they can rediscover
 * and re-match with other profiles cleanly.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // 1. Delete all likes sent and received by this user
    await prisma.like.deleteMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    }).catch(() => {});

    // 2. Delete all matches involving this user
    await prisma.match.deleteMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Discovery radar and matches reset successfully. All profiles are now rediscoverable.",
    });
  } catch (error) {
    console.error("[RESET LIKES API] Error:", error);
    return NextResponse.json({ error: "Failed to reset swipes" }, { status: 500 });
  }
}
