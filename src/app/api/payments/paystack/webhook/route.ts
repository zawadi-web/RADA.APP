import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY || "";
    const signature = req.headers.get("x-paystack-signature");
    const bodyText = await req.text();

    // Verify Paystack Webhook Signature
    if (secretKey && !secretKey.includes("placeholder") && !secretKey.includes("your_secret_key_here")) {
      const hash = crypto.createHmac("sha512", secretKey).update(bodyText).digest("hex");
      if (hash !== signature) {
        console.warn("[PAYSTACK WEBHOOK] Invalid signature — rejected");
        return NextResponse.json({ message: "Invalid Paystack signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(bodyText);
    console.log(`[PAYSTACK WEBHOOK] Event received: ${event.event}`);

    if (event.event === "charge.success") {
      const data = event.data;
      const metadata = data.metadata;
      const userId: string | undefined = metadata?.userId;
      const plan: string = metadata?.plan || "WEEKLY_PASS";
      const reference: string = data.reference;
      const amount: number = data.amount / 100;

      console.log(`[PAYSTACK WEBHOOK] ✅ Payment success — user: ${userId}, plan: ${plan}, KES ${amount}, ref: ${reference}`);

      if (userId) {
        try {
          await prisma.$transaction([
            prisma.transaction.upsert({
              where: { reference },
              create: {
                reference,
                userId,
                provider: "PAYSTACK",
                amount,
                currency: data.currency || "KES",
                status: "SUCCESS",
                plan,
                rawPayload: data,
              },
              update: {
                status: "SUCCESS",
                rawPayload: data,
              },
            }),
            prisma.user.update({
              where: { id: userId },
              data: { isVip: true },
            }),
          ]);
          console.log(`[PAYSTACK WEBHOOK] DB updated — user ${userId} is now VIP`);
        } catch (dbErr) {
          console.error("[PAYSTACK WEBHOOK] DB update failed:", dbErr);
        }
      }
    }

    if (event.event === "charge.failed") {
      const data = event.data;
      const reference: string = data.reference;
      const userId: string | undefined = data.metadata?.userId;
      console.log(`[PAYSTACK WEBHOOK] ⚠️ Payment failed — user: ${userId}, ref: ${reference}`);

      if (userId && reference) {
        try {
          await prisma.transaction.upsert({
            where: { reference },
            create: {
              reference,
              userId,
              provider: "PAYSTACK",
              amount: data.amount / 100,
              currency: data.currency || "KES",
              status: "FAILED",
              plan: data.metadata?.plan || "WEEKLY_PASS",
              rawPayload: data,
            },
            update: { status: "FAILED" },
          });
        } catch (dbErr) {
          console.error("[PAYSTACK WEBHOOK] Failed tx DB write error:", dbErr);
        }
      }
    }

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[PAYSTACK WEBHOOK] Unhandled error:", error);
    return NextResponse.json({ message: (error as Error).message }, { status: 500 });
  }
}
