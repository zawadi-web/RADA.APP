import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        photos: { orderBy: { order: "asc" } },
        prompts: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        birthDate: user.birthDate.toISOString().split("T")[0],
        age: Math.floor(
          (Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        ),
        gender: user.gender,
        interestedIn: user.interestedInGenders,
        intent: user.intent,
        county: user.county,
        area: user.area,
        latitude: user.latitude,
        longitude: user.longitude,
        occupation: user.occupation || "",
        bio: user.bio || "",
        verified: user.verified,
        isVip: user.isVip,
        coins: user.coins,
        email: user.email,
        completionScore: user.completionScore,
        photos: user.photos.map((p) => ({
          id: p.id,
          url: p.url,
          isPrimary: p.isPrimary,
          order: p.order,
          caption: p.caption || undefined,
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
    console.error("[PROFILE ME API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
