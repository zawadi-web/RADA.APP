import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashCode, hashPassword, validatePasswordStrength } from "@/lib/auth-passwords";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, 6-digit code, and new password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedCode = String(code).trim();

    // Rate limit: max 5 code verification attempts per 15 minutes per IP
    const limit = rateLimit(`reset:${normalizedEmail}:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { error: `Too many attempts. Protected against code brute-forcing. Please try again in ${limit.retryAfterSec} seconds.` },
        { status: 429 }
      );
    }

    // Validate new password strength
    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.valid) {
      return NextResponse.json({ error: passCheck.error }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.resetCode || !user.resetCodeExpires) {
      return NextResponse.json(
        { error: "Invalid or expired reset code. Please request a new code." },
        { status: 400 }
      );
    }

    // Check code expiration
    if (new Date() > user.resetCodeExpires) {
      return NextResponse.json(
        { error: "This 6-digit code has expired. Please request a new reset code." },
        { status: 400 }
      );
    }

    // Compare code hashes
    const hashedInput = hashCode(normalizedCode);
    if (hashedInput !== user.resetCode) {
      return NextResponse.json(
        { error: "Incorrect 6-digit code. Please verify the code sent to your email." },
        { status: 400 }
      );
    }

    // Hash new password securely
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and clear reset code
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You can now log in with your new password.",
    });
  } catch (error) {
    console.error("[RESET PASSWORD API] Error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
