import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth-passwords";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit per IP and per email account to prevent credential stuffing / brute force
    const ipLimit = rateLimit(`login:ip:${ip}`, 7, 15 * 60 * 1000);
    const emailLimit = rateLimit(`login:email:${normalizedEmail}`, 5, 15 * 60 * 1000);

    if (!ipLimit.success || !emailLimit.success) {
      const waitTime = Math.max(ipLimit.retryAfterSec, emailLimit.retryAfterSec);
      return NextResponse.json(
        { error: `Too many failed login attempts. Account protected against brute-force. Please try again in ${waitTime} seconds.` },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        photos: { orderBy: { order: "asc" } },
        prompts: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // If user registered with Google and hasn't set a password
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "This account was created via Google. Please sign in with Google or use 'Forgot Password' to set a password." },
        { status: 400 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Successful login - return full user
    return NextResponse.json({
      success: true,
      message: "Welcome back to Rada!",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        birthDate: user.birthDate.toISOString().split("T")[0],
        age: Math.floor((Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
        gender: user.gender,
        interestedIn: user.interestedInGenders,
        intent: user.intent,
        county: user.county,
        area: user.area,
        bio: user.bio || "",
        verified: user.verified,
        isVip: user.isVip,
        coins: user.coins,
        completionScore: user.completionScore,
        photos: user.photos.map((p) => ({
          id: p.id,
          url: p.url,
          isPrimary: p.isPrimary,
          order: p.order,
        })),
        prompts: user.prompts.map((pr) => ({
          id: pr.id,
          promptId: pr.promptId,
          question: pr.question,
          answer: pr.answer,
        })),
      },
    });
  } catch (error) {
    console.error("[LOGIN API] Error:", error);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
