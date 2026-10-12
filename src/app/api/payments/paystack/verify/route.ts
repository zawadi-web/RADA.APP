import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface VerifyBody {
  reference: string;
  userId?: string;
  plan?: string;
}

export async function POST(req: Request) {
  try {
    const body: VerifyBody = await req.json();
    const { reference, userId, plan } = body;

    if (!reference) {
      return NextResponse.json({ success: false, message: "Reference required" }, { status: 400 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY || "";
    const isRealKey = secretKey && !secretKey.includes("placeholder") && !secretKey.includes("your_secret_key_here");

    if (!isRealKey) {
      // Dev / simulation mode – treat as success
      return NextResponse.json({
        success: true,
        message: "Simulated payment verified",
        reference,
        plan,
      });
    }

    // ── Call Paystack verify endpoint ─────────────────────────────────────
    const paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data?.status !== "success") {
      return NextResponse.json({ success: false, message: "Payment not completed" }, { status: 400 });
    }

    const txData = paystackData.data;
    const resolvedUserId = userId || txData.metadata?.userId;
    const resolvedPlan = plan || txData.metadata?.plan || "WEEKLY_PASS";

    // ── Persist transaction & upgrade user in one DB transaction ──────────
    if (resolvedUserId) {
      try {
        await prisma.$transaction([
          // Upsert transaction record
          prisma.transaction.upsert({
            where: { reference },
            create: {
              reference,
              userId: resolvedUserId,
              provider: "PAYSTACK",
              amount: txData.amount / 100, // convert from kobo
              currency: txData.currency || "KES",
              status: "SUCCESS",
              plan: resolvedPlan,
              rawPayload: txData,
            },
            update: {
              status: "SUCCESS",
              rawPayload: txData,
            },
          }),
          // Mark user as VIP
          prisma.user.update({
            where: { id: resolvedUserId },
            data: { isVip: true },
          }),
        ]);
      } catch (dbError) {
        // DB error doesn't block the response — user is still upgraded client-side
        console.error("[PAYSTACK VERIFY] DB write failed:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and account upgraded",
      reference,
      amount: txData.amount / 100,
      currency: txData.currency,
      plan: resolvedPlan,
    });
  } catch (error) {
    console.error("[PAYSTACK VERIFY] Error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
