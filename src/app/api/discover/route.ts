import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateDistanceKm, normalizeCounty } from "@/lib/kenya-locations";

/**
 * GET /api/discover
 *
 * Returns a discovery deck for the requesting user.
 *
 * MATCHING RULES (both must be true for profile A to appear in user B's deck):
 *   1. B's interestedIn preferences include A's gender.
 *   2. A's interestedInGenders preferences include B's gender  ← RECIPROCITY CHECK
 *      (was missing — this was the root cause of the asymmetrical discovery bug)
 *   3. A is not the requesting user.
 *   4. B has not already liked or matched with A.
 *   5. A's completionScore >= 30 (basic profile completeness).
 *   6. Location filter applied when useLocation=true.
 *
 * Intent ranking: MARRIAGE > LONG_TERM > SERIOUS_RELATIONSHIP > INTENTIONAL_DATING > EXPLORING
 */
function normalizeTargetGender(raw: string): "MAN" | "WOMAN" | "NON_BINARY" | null {
  const s = raw.trim().toUpperCase();
  if (s === "WOMAN" || s === "WOMEN" || s === "FEMALE" || s === "FEMALES" || s === "LADY" || s === "LADIES") return "WOMAN";
  if (s === "MAN" || s === "MEN" || s === "MALE" || s === "MALES" || s === "GUY" || s === "GUYS") return "MAN";
  if (s === "NON_BINARY" || s === "NONBINARY" || s === "NON-BINARY") return "NON_BINARY";
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId     = searchParams.get("userId") || "";
  const county     = searchParams.get("county");
  const area       = searchParams.get("area");
  const interestedIn = searchParams.get("interestedIn") ?? ""; // what the requester wants to see
  const userIntent   = searchParams.get("userIntent") ?? "";
  const useLocation  = searchParams.get("useLocation") === "true";
  const limit        = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  // ── Dev diagnostic header (safe — no secrets) ──────────────────────────────
  const diagHeaders: Record<string, string> = {};
  if (process.env.NODE_ENV === "development") {
    diagHeaders["X-Rada-Debug-UserId"]      = userId || "(none)";
    diagHeaders["X-Rada-Debug-InterestedIn"] = interestedIn || "(none)";
    diagHeaders["X-Rada-Debug-UseLocation"] = useLocation.toString();
  }

  try {
    // ── Step 1: Resolve requesting user info ─────────────────────────────────
    let requestingUserGender: "MAN" | "WOMAN" | "NON_BINARY" | null = null;
    let myCounty: string | null = county || null;
    let myArea: string | null = area || null;
    let myLat: number | null = null;
    let myLng: number | null = null;
    let me: { id: string; fullName: string; email: string | null; gender: "MAN" | "WOMAN" | "NON_BINARY"; interestedInGenders: string[]; county: string; area: string; latitude: number | null; longitude: number | null } | null = null;

    if (userId) {
      me = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          email: true,
          gender: true,
          interestedInGenders: true,
          county: true,
          area: true,
          latitude: true,
          longitude: true,
        },
      }).catch(() => null);

      if (me) {
        requestingUserGender = me.gender;
        myCounty = myCounty || me.county;
        myArea = myArea || me.area;
        myLat = me.latitude ?? null;
        myLng = me.longitude ?? null;
      }
    }

    // ── Step 2: Build exclusion set ──────────────────────────────────────────
    const excludeIds = new Set<string>();
    if (userId) {
      excludeIds.add(userId);

      const [sentLikes, existingMatches] = await Promise.all([
        prisma.like.findMany({
          where: { senderId: userId },
          select: { receiverId: true },
        }).catch(() => [] as { receiverId: string }[]),
        prisma.match.findMany({
          where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
          select: { user1Id: true, user2Id: true },
        }).catch(() => [] as { user1Id: string; user2Id: string }[]),
      ]);

      sentLikes.forEach((l) => excludeIds.add(l.receiverId));
      existingMatches.forEach((m) => {
        excludeIds.add(m.user1Id);
        excludeIds.add(m.user2Id);
      });
    }

    // ── Step 3: Determine strict gender filter ───────────────────────────────
    let targetGenders: ("MAN" | "WOMAN" | "NON_BINARY")[] = [];

    if (interestedIn && interestedIn !== "all" && !interestedIn.toUpperCase().includes("BOTH")) {
      targetGenders = interestedIn
        .split(",")
        .map(normalizeTargetGender)
        .filter((g): g is "MAN" | "WOMAN" | "NON_BINARY" => g !== null);
    } else if (me?.interestedInGenders && me.interestedInGenders.length > 0 && !me.interestedInGenders.some((g) => g.toUpperCase() === "BOTH" || g.toUpperCase() === "ALL")) {
      targetGenders = me.interestedInGenders
        .map(normalizeTargetGender)
        .filter((g): g is "MAN" | "WOMAN" | "NON_BINARY" => g !== null);
    }

    // Default heterosexual fallback if preferences are unstated
    if (targetGenders.length === 0 && !interestedIn.toUpperCase().includes("BOTH")) {
      if (requestingUserGender === "MAN") targetGenders = ["WOMAN"];
      else if (requestingUserGender === "WOMAN") targetGenders = ["MAN"];
    }

    let genderFilter: object = {};
    if (targetGenders.length > 0) {
      genderFilter = { gender: { in: targetGenders } };
    }

    // ── Step 4 & 5: Fetch candidates across Kenya ────────────────────────────
    const users = await prisma.user.findMany({
      where: {
        id:              { notIn: Array.from(excludeIds) },
        completionScore: { gte: 30 },
        ...genderFilter,
      },
      include: {
        photos:     { orderBy: { order: "asc" } },
        prompts:    true,
        voiceNotes: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [
        { isVip:     "desc" },
        { updatedAt: "desc" },
      ],
      take: Math.min(limit * 2, 40),
    });

    // ── Step 6: RECIPROCAL & GENDER SAFEGUARD ────────────────────────────────
    const eligible = users.filter((u) => {
      // 1. HARD SAFETY: never show user to themselves (by id, email, or full name)
      if (userId && u.id === userId) return false;
      if (me?.email && u.email && u.email.toLowerCase() === me.email.toLowerCase()) return false;
      if (me?.fullName && u.fullName.trim().toLowerCase() === me.fullName.trim().toLowerCase()) return false;

      // 2. HARD SAFETY: if requester wants specific gender(s), candidate MUST match!
      if (targetGenders.length > 0 && !targetGenders.includes(u.gender as any)) {
        return false;
      }

      // 3. RECIPROCITY: Candidate must be open to requester's gender
      if (!requestingUserGender) return true;
      const theyWant = (u.interestedInGenders ?? [])
        .map(normalizeTargetGender)
        .filter((g): g is "MAN" | "WOMAN" | "NON_BINARY" => g !== null);

      const isBoth = (u.interestedInGenders ?? []).some((g) => g.toUpperCase() === "BOTH" || g.toUpperCase() === "ALL");

      return (
        theyWant.includes(requestingUserGender) ||
        isBoth ||
        theyWant.length === 0
      );
    });

    // ── Step 7: Proximity & Intent ranking ───────────────────────────────────
    const INTENT_SCORE: Record<string, number> = {
      MARRIAGE:             5,
      LONG_TERM:            4,
      SERIOUS_RELATIONSHIP: 3,
      INTENTIONAL_DATING:   2,
      EXPLORING:            1,
    };

    const normMyCounty = myCounty ? normalizeCounty(myCounty).toLowerCase() : "";

    const ranked = eligible
      .map((user) => {
        let proximityScore = 0;
        let distanceKm: number | undefined = undefined;

        if (useLocation) {
          // GPS coordinate distance if available
          if (myLat !== null && myLng !== null && user.latitude !== null && user.longitude !== null) {
            distanceKm = calculateDistanceKm(myLat, myLng, user.latitude, user.longitude);
            if (distanceKm < 30) proximityScore += 30;
            else if (distanceKm < 75) proximityScore += 20;
            else if (distanceKm < 150) proximityScore += 12;
            else if (distanceKm < 300) proximityScore += 5;
          }

          // County & Area match boost
          if (normMyCounty && user.county) {
            const normTheirCounty = normalizeCounty(user.county).toLowerCase();
            if (normMyCounty === normTheirCounty) {
              proximityScore += 25;
              if (myArea && user.area && myArea.toLowerCase() === user.area.toLowerCase()) {
                proximityScore += 15;
              }
            }
          }
        }

        const score =
          (INTENT_SCORE[user.intent] ?? 1) +
          (userIntent && user.intent === userIntent ? 8 : 0) +
          (user.isVip ? 3 : 0) +
          proximityScore;

        return {
          ...user,
          _matchScore: score,
          _distanceKm: distanceKm,
        };
      })
      .sort((a, b) => b._matchScore - a._matchScore)
      .slice(0, limit);

    // ── Step 8: Shape for front-end ──────────────────────────────────────────
    const deck = ranked.map((user) => ({
      id:             user.id,
      fullName:       user.fullName,
      birthDate:      user.birthDate.toISOString().split("T")[0],
      age:            Math.floor((Date.now() - user.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      gender:         user.gender,
      interestedIn:   user.interestedInGenders,
      county:         user.county,
      area:           user.area,
      occupation:     user.occupation ?? "",
      intent:         user.intent,
      bio:            user.bio ?? "",
      photos:         user.photos.map((p) => ({
        id:        p.id,
        url:       p.url,
        isPrimary: p.isPrimary,
        order:     p.order,
        caption:   p.caption ?? undefined,
      })),
      prompts:        user.prompts.map((pr) => ({
        id:        pr.id,
        promptId:  pr.promptId,
        question:  pr.question,
        answer:    pr.answer,
      })),
      voiceNote:      user.voiceNotes[0]
        ? {
            id:           user.voiceNotes[0].id,
            promptTitle:  user.voiceNotes[0].promptTitle,
            durationSec:  user.voiceNotes[0].durationSec,
            audioUrl:     user.voiceNotes[0].audioUrl,
          }
        : undefined,
      verified:       user.verified,
      completionScore: user.completionScore,
      isVip:          user.isVip,
      distanceKm:     user._distanceKm,
    }));

    if (process.env.NODE_ENV === "development") {
      diagHeaders["X-Rada-Debug-CandidatesBeforeReciprocal"] = users.length.toString();
      diagHeaders["X-Rada-Debug-CandidatesAfterReciprocal"]  = eligible.length.toString();
      diagHeaders["X-Rada-Debug-DeckReturned"]               = deck.length.toString();
    }

    return NextResponse.json(
      { deck, total: deck.length },
      { headers: diagHeaders }
    );
  } catch (error) {
    console.error("[DISCOVER API] Error:", error);
    return NextResponse.json({ deck: [], total: 0 }, { headers: diagHeaders });
  }
}
