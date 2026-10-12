import { NextResponse } from "next/server";

interface InitializeBody {
  email?: string;
  amount: number; // in KES
  plan: "WEEKLY" | "MONTHLY";
  userId?: string;
}

export async function POST(req: Request) {
  try {
    const body: InitializeBody = await req.json();
    const { email = "member@rada.ke", amount, plan, userId = "user-me" } = body;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const isMock = !secretKey || secretKey.includes("placeholder");

    if (isMock) {
      // Mock / Sandbox response for instant dev preview
      const reference = "pstk_" + Math.random().toString(36).substring(2, 10);
      return NextResponse.json({
        status: true,
        message: "Authorization URL created (Mock Mode)",
        data: {
          authorization_url: `https://checkout.paystack.com/${reference}`,
          access_code: `acc_${reference}`,
          reference,
          amount: amount * 100,
          currency: "KES",
          isMock: true,
        },
      });
    }

    // Real Paystack API call
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects lowest currency unit (cents)
        currency: "KES",
        metadata: {
          plan,
          userId,
          service: "RADA_VIP",
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/profile?payment=success`,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { status: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}
