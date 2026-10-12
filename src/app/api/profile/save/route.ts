import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeCounty } from "@/lib/kenya-locations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      fullName,
      email,
      age = 24,
      gender = "MAN",
      interestedIn = ["WOMAN"],
      intent = "INTENTIONAL_DATING",
      photos = [],
      bio = "",
      county,
      area,
    } = body;

    const normalizedCounty = county ? normalizeCounty(county) : undefined;

    if (!fullName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Calculate birthDate from age
    const birthYear = new Date().getFullYear() - (age || 24);
    const birthDate = new Date(`${birthYear}-01-01`);

    // Clean gender mapping to Prisma Enum (MAN, WOMAN, NON_BINARY)
    const validGender = ["MAN", "WOMAN", "NON_BINARY"].includes(gender) ? gender : "MAN";

    // Clean intent mapping to Prisma Enum
    const validIntent = ["MARRIAGE", "LONG_TERM", "INTENTIONAL_DATING", "SERIOUS_RELATIONSHIP", "EXPLORING"].includes(intent)
      ? intent
      : "INTENTIONAL_DATING";

    // Clean interestedIn array
    const interestedInGenders = Array.isArray(interestedIn) && interestedIn.length > 0
      ? interestedIn.filter((g: string) => ["MAN", "WOMAN", "NON_BINARY", "BOTH"].includes(g))
      : ["WOMAN"];

    // Find existing user by ID or unique email, or create new
    let user;
    if (id && !id.startsWith("user-me")) {
      user = await prisma.user.findUnique({ where: { id } }).catch(() => null);
    }

    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    }

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName,
          birthDate,
          gender: validGender,
          intent: validIntent,
          interestedInGenders,
          bio,
          county: normalizedCounty !== undefined ? normalizedCounty : user.county,
          area: area !== undefined ? area : user.area,
          completionScore: Math.min(60 + (photos.length * 15) + (bio ? 10 : 0), 100),
        },
      });

      // Update photos if provided
      if (Array.isArray(photos) && photos.length > 0) {
        // Delete old photos and re-create to keep in sync
        await prisma.photo.deleteMany({ where: { userId: user.id } }).catch(() => {});
        for (let i = 0; i < photos.length; i++) {
          const p = photos[i];
          const url = typeof p === "string" ? p : p.url;
          if (url) {
            await prisma.photo.create({
              data: {
                userId: user.id,
                url,
                isPrimary: i === 0,
                order: i,
              },
            });
          }
        }
      }
    } else {
      // Create new user in database
      const userEmail = email || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@rada.app`;
      user = await prisma.user.create({
        data: {
          fullName,
          email: userEmail,
          birthDate,
          gender: validGender,
          intent: validIntent,
          interestedInGenders,
          bio,
          county: normalizedCounty || "Nairobi",
          area: area || "",
          completionScore: Math.min(60 + (photos.length * 15) + (bio ? 10 : 0), 100),
          verified: true,
          photos: {
            create: Array.isArray(photos) && photos.length > 0
              ? photos.map((p, i) => ({
                  url: typeof p === "string" ? p : p.url,
                  isPrimary: i === 0,
                  order: i,
                })).filter((p) => Boolean(p.url))
              : [],
          },
        },
        include: {
          photos: true,
        },
      });
    }

    // Fetch user with latest photos
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { photos: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, user: fullUser });
  } catch (error) {
    console.error("[PROFILE SAVE API] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to save profile" },
      { status: 500 }
    );
  }
}
