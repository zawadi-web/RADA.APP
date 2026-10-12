import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SPEND_RATES: Record<string, { coins: number; label: string }> = {
  CHAT_UNLOCK: { coins: 10, label: "Unlock Unlimited 48h Chat" },
  DIRECT_MESSAGE: { coins: 15, label: "Direct Message Super Spark" },
  BOOST: { coins: 5, label: "Extend Match Time (+48h)" },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, type, action, targetId, description } = body;
    const spendType = type || action;

    if (!userId || !spendType) {
      return NextResponse.json({ error: "userId and type are required" }, { status: 400 });
    }

    const rate = SPEND_RATES[spendType];
    if (!rate) {
      return NextResponse.json({ error: "Invalid coin spend type" }, { status: 400 });
    }

    // Atomic transaction to ensure coins never drop below 0
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, coins: true, isVip: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // VIP users get unlimited chat perks
      if (user.isVip && type === "CHAT_UNLOCK") {
        return { user, newBalance: user.coins, freeVip: true };
      }

      if (user.coins < rate.coins) {
        throw new Error("INSUFFICIENT_COINS");
      }

      const newBalance = user.coins - rate.coins;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: newBalance },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: -rate.coins,
          balanceAfter: newBalance,
          type: spendType,
          description: description || rate.label,
          reference: targetId || undefined,
        },
      });

      return { user: updatedUser, newBalance, freeVip: false };
    });

    return NextResponse.json({
      success: true,
      coins: result.newBalance,
      remainingCoins: result.newBalance,
      balance: result.newBalance,
      spent: rate.coins,
      type: spendType,
      message: result.freeVip ? "Unlocked with VIP perks!" : `Spent ${rate.coins} coins. Remaining balance: ${result.newBalance} coins.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "INSUFFICIENT_COINS") {
      return NextResponse.json(
        { error: "Insufficient coins", code: "INSUFFICIENT_COINS" },
        { status: 402 }
      );
    }
    if (err.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[COINS SPEND API] Error:", err);
    return NextResponse.json({ error: "Failed to process coin spend" }, { status: 500 });
  }
}
