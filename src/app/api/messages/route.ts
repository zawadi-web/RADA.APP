import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/messages?matchId=xxx&userId=xxx
 * Fetches all messages in a match conversation, marks unread as read
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");
  const userId = searchParams.get("userId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: "asc" },
    });

    // Mark as read (all messages not sent by current user)
    if (userId) {
      await prisma.message.updateMany({
        where: {
          matchId,
          senderId: { not: userId },
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    const formatted = messages.map((msg) => {
      // Parse call log metadata if present: [CALL:voice:completed:134] Voice call (2:14)
      const callMatch = msg.content.match(/^\[CALL:(voice|video):(missed|completed|declined|cancelled)(?::(\d+))?\]\s*(.*)$/);
      if (callMatch) {
        return {
          id: msg.id,
          conversationId: msg.matchId,
          senderId: msg.senderId,
          content: callMatch[4] || msg.content,
          isRead: msg.isRead,
          createdAt: msg.createdAt.toISOString(),
          isSystem: false,
          type: "call" as const,
          callType: callMatch[1] as "voice" | "video",
          callStatus: callMatch[2] as "missed" | "completed" | "declined" | "cancelled",
          durationSec: callMatch[3] ? parseInt(callMatch[3], 10) : 0,
        };
      }

      return {
        id: msg.id,
        conversationId: msg.matchId,
        senderId: msg.senderId,
        content: msg.content,
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
        isSystem: msg.isSystem,
      };
    });

    return NextResponse.json({ messages: formatted });
  } catch (error) {
    console.error("[MESSAGES GET] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/messages
 * Sends a new message in a match conversation
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, senderId, content } = body;

    if (!matchId || !senderId || !content?.trim()) {
      return NextResponse.json({ error: "matchId, senderId, and content required" }, { status: 400 });
    }

    // Verify match exists and is not expired
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.isExpired || match.expiresAt < new Date()) {
      return NextResponse.json({ error: "Match has expired" }, { status: 410 });
    }

    // Verify sender is part of this match
    if (match.user1Id !== senderId && match.user2Id !== senderId) {
      return NextResponse.json({ error: "Not authorized for this match" }, { status: 403 });
    }

    // Create message and update match lastActivity atomically
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          matchId,
          senderId,
          content: content.trim(),
          isRead: false,
          isSystem: false,
        },
      }),
      prisma.match.update({
        where: { id: matchId },
        data: { lastActivity: new Date() },
      }),
    ]);

    const callMatch = newMessage.content.match(/^\[CALL:(voice|video):(missed|completed|declined|cancelled)(?::(\d+))?\]\s*(.*)$/);
    if (callMatch) {
      return NextResponse.json({
        id: newMessage.id,
        conversationId: newMessage.matchId,
        senderId: newMessage.senderId,
        content: callMatch[4] || newMessage.content,
        isRead: newMessage.isRead,
        createdAt: newMessage.createdAt.toISOString(),
        isSystem: false,
        type: "call",
        callType: callMatch[1],
        callStatus: callMatch[2],
        durationSec: callMatch[3] ? parseInt(callMatch[3], 10) : 0,
      });
    }

    return NextResponse.json({
      id: newMessage.id,
      conversationId: newMessage.matchId,
      senderId: newMessage.senderId,
      content: newMessage.content,
      isRead: newMessage.isRead,
      createdAt: newMessage.createdAt.toISOString(),
      isSystem: newMessage.isSystem,
    });
  } catch (error) {
    console.error("[MESSAGES POST] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * DELETE /api/messages?messageId=xxx&mode=everyone|me
 * Handles message deletion
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const mode = searchParams.get("mode") || "me";

    if (!messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }

    // For ephemeral client-side messages
    if (messageId.startsWith("msg-")) {
      return NextResponse.json({ success: true });
    }

    if (mode === "everyone") {
      await prisma.message.updateMany({
        where: { id: messageId },
        data: { content: "🚫 This message was deleted" },
      });
    } else {
      await prisma.message.deleteMany({
        where: { id: messageId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MESSAGES DELETE] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
