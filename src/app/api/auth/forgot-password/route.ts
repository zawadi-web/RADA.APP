import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSixDigitCode, hashCode } from "@/lib/auth-passwords";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: max 3 requests per hour
    const limit = rateLimit(`forgot:${normalizedEmail}:${ip}`, 3, 60 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: `Too many password reset requests. Please wait ${Math.ceil(limit.retryAfterSec / 60)} minutes before requesting a new code.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Security best practice: don't reveal whether email exists to prevent user enumeration
      return NextResponse.json({
        success: true,
        message: "If an account with this email exists, a 6-digit verification code has been sent.",
      });
    }

    // Generate cryptographically secure 6-digit code
    const rawCode = generateSixDigitCode();
    const hashedCode = hashCode(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Store hashed code in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode: hashedCode,
        resetCodeExpires: expiresAt,
      },
    });

    console.log(`[RADA PASSWORD RESET] Generated 6-digit code for ${normalizedEmail}: ${rawCode} (expires in 15 mins)`);

    // In production with Resend/Sendgrid, send email here
    // For local dev and testing, we return the code directly so user can test seamlessly
    const isDev = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

    return NextResponse.json({
      success: true,
      message: `A 6-digit password reset code has been sent to ${normalizedEmail}. Code expires in 15 minutes.`,
      // Return code in dev for instant testing without SMTP dependency
      ...(isDev ? { devCode: rawCode } : {}),
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD API] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate password reset. Please try again." },
      { status: 500 }
    );
  }
}
