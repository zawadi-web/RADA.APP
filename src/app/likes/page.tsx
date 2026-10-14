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
  const { dbUserId, currentUser, refreshMatches, openVipModal } = useRada();
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
        showToast?.(`🎉 You matched with ${like.sender.fullName.split(" ")[0]}!`, "success");
        await refreshMatches();
        router.push(`/matches`);
      } else {
        showToast?.("Like sent!", "success");
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
    <main style={{ minHeight: "100vh", background: "var(--rada-bg)", paddingBottom: "80px", color: "var(--rada-pearl)" }}>
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
            color: "var(--rada-pearl)",
            margin: 0,
            letterSpacing: "-0.5px",
          }}>Who Liked You</h1>
          <p style={{
            fontSize: "13px",
            color: "var(--rada-pearl-muted)",
            margin: "4px 0 0",
          }}>
            {isLoading ? "Loading…" : `${displayLikes.length} ${displayLikes.length === 1 ? "admirer" : "admirers"} on your radar`}
          </p>
        </div>

        <button onClick={fetchLikes} disabled={isLoading} style={{
          background: "var(--rada-gold-subtle)",
          border: "1px solid var(--rada-border-teal)",
          color: "var(--rada-gold)",
          borderRadius: "20px",
          padding: "6px 14px",
          fontSize: "12px",
          fontWeight: 700,
          cursor: "pointer",
        }}>
          {isLoading ? "…" : "Refresh"}
        </button>
      </header>

      {/* VIP upsell — only shown for free users with pending likes */}
      {!isVip && displayLikes.length > 0 && (
        <div style={{
          margin: "16px 20px",
          background: "var(--rada-gold-subtle)",
          border: "1px solid var(--rada-border-teal)",
          borderRadius: "14px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--rada-pearl)" }}>
              ✦ See all {displayLikes.length} people directly
            </div>
            <div style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", marginTop: "2px" }}>
              Unblur profiles, skip the queue &amp; connect instantly.
            </div>
          </div>
          <button
            onClick={openVipModal}
            style={{
              flexShrink: 0,
              background: "var(--rada-gold-gradient)",
              border: "none",
              borderRadius: "20px",
              padding: "8px 14px",
              color: "#0A0A0C",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 4px 14px var(--rada-gold-subtle)",
            }}
          >
            Upgrade VIP
          </button>
        </div>
      )}

      {/* Grid of likes */}
      {displayLikes.length === 0 ? (
        <div style={{ padding: "40px 20px" }}>
          <EmptyState
            title="No new likes yet"
            description="Your profile is rotating in active Nairobi orbits. Keep discovering to spark fresh connections!"
            actionLabel="Explore Discover"
            onAction={() => router.push("/discover")}
          />
        </div>
      ) : (
        <div style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
        }}>
          {displayLikes.map((like) => {
            const sender = like.sender;
            const primaryPhoto = sender.photos?.find((p) => p.isPrimary) || sender.photos?.[0];
            const photoUrl = primaryPhoto?.url;
            const isActing = liking.has(like.id);

            return (
              <div
                key={like.id}
                style={{
                  background: "var(--rada-surface)",
                  borderRadius: "18px",
                  border: "1px solid var(--rada-border)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  boxShadow: "var(--rada-shadow-sm)",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                }}
              >
                {/* Photo container */}
                <div style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3 / 4",
                  background: "#0A0A0C",
                  overflow: "hidden",
                  cursor: !isVip ? "pointer" : "default",
                }}
                onClick={!isVip ? openVipModal : undefined}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={isVip ? sender.fullName : "Blurred profile"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        filter: !isVip ? "blur(18px)" : "none",
                        transform: !isVip ? "scale(1.1)" : "none",
                        transition: "filter 0.3s ease",
                      }}
                    />
                  ) : (
                    <div style={{
                      width: "100%", height: "100%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "var(--rada-gold)", fontSize: "28px", fontWeight: 700,
                    }}>
                      ✦
                    </div>
                  )}
                  {/* Intent badge */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", zIndex: 10 }}>
                    <IntentBadge intent={like.sender.intent as "MARRIAGE" | "LONG_TERM" | "INTENTIONAL_DATING" | "SERIOUS_RELATIONSHIP" | "EXPLORING"} size="small" />
                  </div>
                  {/* Super Spark badge */}
                  {like.likeType === "SUPER_SPARK" && (
                    <div style={{
                      position: "absolute", top: "8px", right: "8px",
                      background: "var(--rada-gold-gradient)",
                      borderRadius: "10px", padding: "3px 8px",
                      fontSize: "10px", fontWeight: 800, color: "#0A0A0C",
                      zIndex: 10,
                    }}>✦ SPARK</div>
                  )}
                  {/* Lock overlay for free users */}
                  {!isVip && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "6px",
                      background: "rgba(0, 0, 0, 0.45)",
                      zIndex: 8,
                    }}>
                      <span style={{ fontSize: "24px" }}>🔒</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFFFFF" }}>Tap to reveal</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{
                    fontWeight: 700, fontSize: "13px", color: "var(--rada-pearl)",
                    marginBottom: "2px",
                  }}>
                    {isVip ? `${sender.fullName.split(" ")[0]}, ${sender.age}` : `Admirer in ${sender.area || "Nairobi"}`}
                  </div>
                  <LocationBadge area={sender.area} county={sender.county} />

                  {like.comment && (
                    <div style={{
                      marginTop: "8px",
                      background: "var(--rada-gold-subtle)",
                      borderLeft: "2px solid var(--rada-gold)",
                      borderRadius: "0 6px 6px 0",
                      padding: "6px 8px",
                      fontSize: "11px",
                      color: "var(--rada-pearl-muted)",
                      fontStyle: "italic",
                    }}>
                      &ldquo;{like.comment}&rdquo;
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "auto", paddingTop: "10px" }}>
                    <button
                      onClick={() => handlePass(like.id)}
                      style={{
                        flex: "0 0 36px", height: "36px", borderRadius: "50%",
                        background: "var(--rada-surface-raised)",
                        border: "1px solid var(--rada-border)",
                        color: "var(--rada-pearl-muted)",
                        fontSize: "14px", cursor: "pointer",
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
                          ? "var(--rada-gold-gradient)"
                          : "var(--rada-surface-raised)",
                        border: isVip ? "none" : "1px solid var(--rada-border)",
                        color: isVip ? "#0A0A0C" : "var(--rada-pearl-muted)",
                        fontWeight: 800, fontSize: "12px",
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
