import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/deck?userId=xxx
 * 
 * Dev-only diagnostic endpoint. Returns detailed discovery eligibility info
 * for a user so you can debug why profiles are/aren't appearing.
 * 
 * Returns: { user, candidateCount, deck, excluded, reciprocalFailures }
 * 
 * NEVER exposed in production — returns a 404 outside development.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, fullName: true, gender: true,
        interestedInGenders: true, intent: true,
        completionScore: true, county: true, area: true,
      },
    });

    if (!me) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // What the user already liked / matched
    const [sentLikes, matches] = await Promise.all([
      prisma.like.findMany({ where: { senderId: userId }, select: { receiverId: true } }),
      prisma.match.findMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        select: { user1Id: true, user2Id: true },
      }),
    ]);

    const excludeIds = new Set<string>([userId]);
    sentLikes.forEach((l) => excludeIds.add(l.receiverId));
    matches.forEach((m) => { excludeIds.add(m.user1Id); excludeIds.add(m.user2Id); });

    // All other users in DB
    const allOthers = await prisma.user.findMany({
      where: { id: { not: userId } },
      select: {
        id: true, fullName: true, gender: true,
        interestedInGenders: true, intent: true,
        completionScore: true, county: true, area: true,
      },
    });

    const reciprocalFailures: object[] = [];
    const excluded: object[] = [];
    const deck: object[] = [];

    for (const candidate of allOthers) {
      if (excludeIds.has(candidate.id)) {
        excluded.push({ id: candidate.id, fullName: candidate.fullName, reason: "already liked/matched/self" });
        continue;
      }
      if (candidate.completionScore < 30) {
        excluded.push({ id: candidate.id, fullName: candidate.fullName, reason: `completionScore ${candidate.completionScore} < 30` });
        continue;
      }

      // Does the requester want to see this candidate's gender?
      const requesterWants = me.interestedInGenders ?? [];
      const iWantThem = requesterWants.length === 0 ||
        requesterWants.includes(candidate.gender) ||
        requesterWants.includes("BOTH");

      // Does the candidate want to see the requester's gender?
      const theyWant = candidate.interestedInGenders ?? [];
      const theyWantMe = theyWant.length === 0 ||
        theyWant.includes(me.gender) ||
        theyWant.includes("BOTH");

      if (!iWantThem) {
        excluded.push({
          id: candidate.id, fullName: candidate.fullName,
          reason: `I want [${requesterWants}] but candidate is ${candidate.gender}`,
        });
        continue;
      }

      if (!theyWantMe) {
        reciprocalFailures.push({
          id: candidate.id, fullName: candidate.fullName,
          candidateInterestedIn: theyWant,
          myGender: me.gender,
          reason: `Candidate wants [${theyWant}] but I am ${me.gender} — reciprocal filter blocks`,
        });
        continue;
      }

      deck.push({ id: candidate.id, fullName: candidate.fullName, gender: candidate.gender, intent: candidate.intent });
    }

    return NextResponse.json({
      requestingUser: me,
      summary: {
        totalCandidates: allOthers.length,
        deckSize: deck.length,
        excluded: excluded.length,
        reciprocalBlocked: reciprocalFailures.length,
      },
      deck,
      excluded,
      reciprocalFailures,
    });
  } catch (error) {
    console.error("[DECK DIAGNOSTIC] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
