"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRada } from "@/lib/rada-context";
import { IntentBadge } from "@/components/ui/IntentBadge";
import { LocationBadge } from "@/components/ui/LocationBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import styles from "./page.module.css";

interface IncomingLike {
  id: string;
  senderId: string;
  likeType: "STANDARD" | "SUPER_SPARK";
  comment?: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    age: number;
    county: string;
    area: string;
    occupation: string;
    intent: string;
    verified: boolean;
    isVip: boolean;
    photos: { id: string; url: string; isPrimary: boolean; order: number }[];
  };
}

export default function LikesPage() {
  const { dbUserId, currentUser, matches, setConversations, refreshMatches } = useRada();
  const { showToast } = useToast();
  const router = useRouter();

  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [liking, setLiking] = useState<Set<string>>(new Set());
  const [passed, setPassed] = useState<Set<string>>(new Set());

  const fetchLikes = useCallback(async () => {
    if (!dbUserId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/likes?userId=${dbUserId}`);
      const data = await res.json();
      if (data.likes && Array.isArray(data.likes)) {
        setLikes(data.likes as IncomingLike[]);
      }
    } catch (err) {
      console.error("[LikesPage] fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dbUserId]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const handleLikeBack = async (like: IncomingLike) => {
    if (!dbUserId || liking.has(like.id)) return;
    setLiking((s) => new Set(s).add(like.id));

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: dbUserId,
          receiverId: like.senderId,
          likeType: "STANDARD",
        }),
      });
      const data = await res.json();

      if (data.matched) {
        const convId = data.conversationId || data.matchId;
        showToast?.(`🎉 You matched with ${like.sender.fullName.split(" ")[0]}!`, "success");
        // Refresh matches so the chat appears
        await refreshMatches();
        // Navigate straight to the conversation
        router.push(`/matches`);
      } else {
        showToast?.("Like sent!", "success");
        // Remove from the list since it's no longer an unactioned like
        setLikes((prev) => prev.filter((l) => l.id !== like.id));
      }
    } catch {
      showToast?.("Failed to send like. Try again.", "danger");
    } finally {
      setLiking((s) => {
        const n = new Set(s);
        n.delete(like.id);
        return n;
      });
    }
  };

  const handlePass = (likeId: string) => {
    setPassed((s) => new Set(s).add(likeId));
    setTimeout(() => {
      setLikes((prev) => prev.filter((l) => l.id !== likeId));
    }, 300);
  };

  const isVip = currentUser.isVip;
  const displayLikes = likes.filter((l) => !passed.has(l.id));

  return (
    <main style={{ minHeight: "100vh", background: "#080D14", paddingBottom: "80px" }}>
      {/* Header */}
      <header style={{
        padding: "20px 20px 0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        <div>
          <h1 style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "#E8F4F0",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>Who Liked You</h1>
          <p style={{
            fontSize: "13px",
            color: "rgba(232,244,240,0.5)",
            margin: "4px 0 0",
          }}>
            {isLoading ? "Loading…" : `${displayLikes.length} ${displayLikes.length === 1 ? "person" : "people"} on your radar`}
          </p>
        </div>

        <button onClick={fetchLikes} disabled={isLoading} style={{
          background: "rgba(56,188,160,0.12)",
          border: "1px solid rgba(56,188,160,0.3)",
          color: "#38BCA0",
          borderRadius: "20px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
        }}>
          {isLoading ? "…" : "Refresh"}
        </button>
      </header>

      {/* VIP upsell — only shown for free users with pending likes */}
      {!isVip && displayLikes.length > 0 && (
        <div style={{
          margin: "16px 20px",
          background: "linear-gradient(135deg, rgba(56,188,160,0.12), rgba(120,234,180,0.06))",
          border: "1px solid rgba(56,188,160,0.25)",
          borderRadius: "14px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{ fontSize: "22px" }}>✦</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#E8F4F0" }}>See who's ready for you</div>
            <div style={{ fontSize: "12px", color: "rgba(232,244,240,0.5)", marginTop: "2px" }}>Reveal photos and match instantly · KES 250/wk via M-Pesa</div>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "20px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              borderRadius: "16px",
              background: "rgba(255,255,255,0.04)",
              height: "220px",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          ))}
        </div>
      ) : displayLikes.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <EmptyState
            icon="✦"
            title="Your radar is quiet"
            description="When people like your profile on Rada, they'll appear here. Keep your profile complete to attract intentional matches."
          />
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          padding: "20px",
        }}>
          {displayLikes.map((like) => {
            const sender = like.sender;
            const isActing = liking.has(like.id);
            return (
              <div key={like.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(56,188,160,0.12)",
                borderRadius: "16px",
                overflow: "hidden",
                transition: "opacity 0.3s",
                opacity: passed.has(like.id) ? 0 : 1,
              }}>
                {/* Photo */}
                <div style={{ position: "relative", aspectRatio: "3/4" }}>
                  {sender.photos[0]?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={sender.photos[0].url}
                      alt={isVip ? sender.fullName : "Admirer"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: isVip ? "none" : "blur(18px) brightness(0.6)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "radial-gradient(circle, #2D1445 0%, #0D0520 100%)",
                        fontSize: "36px",
                        fontWeight: 800,
                        color: "#FFF8F0",
                      }}
                    >
                      {sender.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Intent badge */}
                  <div style={{ position: "absolute", top: "8px", left: "8px" }}>
                    <IntentBadge intent={like.sender.intent as "MARRIAGE" | "LONG_TERM" | "INTENTIONAL_DATING" | "SERIOUS_RELATIONSHIP" | "EXPLORING"} size="small" />
                  </div>
                  {/* Super Spark badge */}
                  {like.likeType === "SUPER_SPARK" && (
                    <div style={{
                      position: "absolute", top: "8px", right: "8px",
                      background: "linear-gradient(135deg,#38BCA0,#78EAB4)",
                      borderRadius: "10px", padding: "3px 8px",
                      fontSize: "10px", fontWeight: 700, color: "#080D14",
                    }}>✦ SPARK</div>
                  )}
                  {/* Lock overlay for free users */}
                  {!isVip && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "6px",
                    }}>
                      <span style={{ fontSize: "24px" }}>🔒</span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#E8F4F0" }}>Tap to reveal</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={{
                    fontWeight: 700, fontSize: "13px", color: "#E8F4F0",
                    marginBottom: "2px",
                  }}>
                    {isVip ? `${sender.fullName.split(" ")[0]}, ${sender.age}` : `Admirer in ${sender.area}`}
                  </div>
                  <LocationBadge area={sender.area} county={sender.county} />

                  {like.comment && (
                    <div style={{
                      marginTop: "8px",
                      background: "rgba(56,188,160,0.08)",
                      borderRadius: "8px",
                      padding: "6px 8px",
                      fontSize: "11px",
                      color: "rgba(232,244,240,0.7)",
                      fontStyle: "italic",
                    }}>
                      "{like.comment}"
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button
                      onClick={() => handlePass(like.id)}
                      style={{
                        flex: "0 0 36px", height: "36px", borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "16px", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                      aria-label="Pass"
                    >✕</button>

                    <button
                      onClick={() => handleLikeBack(like)}
                      disabled={isActing || !isVip}
                      style={{
                        flex: 1, height: "36px", borderRadius: "10px",
                        background: isVip
                          ? "linear-gradient(135deg,#38BCA0,#2A9D8F)"
                          : "rgba(255,255,255,0.06)",
                        border: isVip ? "none" : "1px solid rgba(255,255,255,0.1)",
                        color: isVip ? "#080D14" : "rgba(255,255,255,0.5)",
                        fontWeight: 700, fontSize: "12px",
                        cursor: (isActing || !isVip) ? "default" : "pointer",
                        opacity: isActing ? 0.7 : 1,
                      }}
                    >
                      {isActing ? "Connecting…" : isVip ? "Connect 🤍" : "Unlock ✦"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
