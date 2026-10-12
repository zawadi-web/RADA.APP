import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        coins: true,
        isVip: true,
        coinTransactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      coins: user.coins,
      isVip: user.isVip,
      transactions: user.coinTransactions,
    });
  } catch (error) {
    console.error("[COINS BALANCE API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch coins" }, { status: 500 });
  }
}
