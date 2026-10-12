import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth-passwords";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limitCheck = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000); // 5 per hour
    if (!limitCheck.success) {
      return NextResponse.json(
        { error: `Too many sign-up attempts. Please try again in ${limitCheck.retryAfterSec} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { fullName, email, password, gender = "WOMAN", interestedIn = ["MAN"], intent = "INTENTIONAL_DATING", county = "Tharaka-Nithi", area = "Chuka" } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const passCheck = validatePasswordStrength(password);
    if (!passCheck.valid) {
      return NextResponse.json({ error: passCheck.error }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Default birthdate (24 years old)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 24);

    // Create user with 20 welcome coins
    const newUser = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: normalizedEmail,
        passwordHash,
        gender: ["MAN", "WOMAN", "NON_BINARY"].includes(gender) ? gender : "WOMAN",
        interestedInGenders: Array.isArray(interestedIn) ? interestedIn : ["MAN"],
        intent: ["MARRIAGE", "LONG_TERM", "INTENTIONAL_DATING", "SERIOUS_RELATIONSHIP", "EXPLORING"].includes(intent) ? intent : "INTENTIONAL_DATING",
        county,
        area,
        latitude: -0.3344,
        longitude: 37.6528,
        birthDate,
        coins: 20,
        completionScore: 60,
        coinTransactions: {
          create: {
            amount: 20,
            balanceAfter: 20,
            type: "WELCOME_BONUS",
            description: "🎉 20 Welcome Spark Coins to begin chatting",
          },
        },
      },
      include: {
        photos: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully with 20 Welcome Coins!",
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        gender: newUser.gender,
        county: newUser.county,
        area: newUser.area,
        coins: newUser.coins,
        intent: newUser.intent,
      },
    });
  } catch (error) {
    console.error("[REGISTER API] Error:", error);
    return NextResponse.json(
      { error: "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
