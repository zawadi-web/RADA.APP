import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Delete sent likes by this user so they can rediscover real profiles
    await prisma.like.deleteMany({
      where: { senderId: userId },
    });

    return NextResponse.json({ success: true, message: "Swipes reset successfully" });
  } catch (error) {
    console.error("[RESET LIKES API] Error:", error);
    return NextResponse.json({ error: "Failed to reset swipes" }, { status: 500 });
  }
}
