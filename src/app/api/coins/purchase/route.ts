import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COIN_PACKAGES: Record<string, { coins: number; amountKes: number; label: string; bonus: string }> = {
  SPARK_50: {
    coins: 50,
    amountKes: 150,
    label: "Spark Pack",
    bonus: "Starter",
  },
  CUPID_200: {
    coins: 200,
    amountKes: 450,
    label: "Cupid Pack",
    bonus: "+25% Bonus • Most Popular",
  },
  ROYAL_500: {
    coins: 500,
    amountKes: 950,
    label: "Royal Rada Pack",
    bonus: "+40% Bonus • Best Value",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, packId, reference = `COIN-${Date.now()}` } = body;

    if (!userId || !packId) {
      return NextResponse.json({ error: "userId and packId are required" }, { status: 400 });
    }

    const pack = COIN_PACKAGES[packId];
    if (!pack) {
      return NextResponse.json({ error: "Invalid coin package selected" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, coins: true },
      });

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const newBalance = user.coins + pack.coins;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { coins: newBalance },
      });

      await tx.coinTransaction.create({
        data: {
          userId,
          amount: pack.coins,
          balanceAfter: newBalance,
          type: "PURCHASE",
          description: `Purchased ${pack.label} (${pack.coins} Coins for KES ${pack.amountKes})`,
          reference,
        },
      });

      return { user: updatedUser, newBalance };
    });

    return NextResponse.json({
      success: true,
      coins: result.newBalance,
      balance: result.newBalance,
      added: pack.coins,
      pack: pack.label,
      message: `🎉 Successfully added ${pack.coins} Coins to your account! New balance: ${result.newBalance} Coins.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[COINS PURCHASE API] Error:", err);
    return NextResponse.json({ error: "Failed to process coin purchase" }, { status: 500 });
  }
}
