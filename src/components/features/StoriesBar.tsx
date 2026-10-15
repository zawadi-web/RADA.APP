"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRada } from "@/lib/rada-context";
import { useToast } from "@/components/ui/Toast";

export interface StoryItem {
  id: string;
  userId: string;
  mediaUrl: string;
  caption?: string | null;
  createdAt: string;
  expiresAt: string;
  user: {
    id: string;
    fullName: string;
    area: string;
    county: string;
    photos?: { url: string }[];
  };
}

export function StoriesBar() {
  const { currentUser, dbUserId } = useRada();
  const { showToast } = useToast();

  const [stories, setStories] = useState<StoryItem[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch stories on mount
  useEffect(() => {
    fetch("/api/stories")
      .then((res) => res.json())
      .then((data) => {
        if (data.stories && Array.isArray(data.stories)) {
          setStories(data.stories);
        }
      })
      .catch((err) => console.warn("Stories fetch fallback:", err));
  }, []);

  // Story Viewer Timer (5 seconds per slide)
  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setStoryProgress(0);
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setStoryProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        // Advance to next story or close if last
        if (activeStoryIndex < stories.length - 1) {
          setActiveStoryIndex((prev) => (prev !== null ? prev + 1 : null));
        } else {
          setActiveStoryIndex(null);
        }
      }
    }, 50);

    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [activeStoryIndex, stories.length]);

  // Handle Photo Selection with client-side compression
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawUrl = ev.target?.result as string;
      // Client-side compression using Canvas (~100KB for zero storage waste)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 900;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL("image/jpeg", 0.82);
          setNewImagePreview(compressed);
          setIsCreatorOpen(true);
        }
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  // Submit Story
  const handlePublishStory = async () => {
    if (!newImagePreview) return;
    setIsPosting(true);
    try {
      const currentUserId = dbUserId || currentUser?.id || "user-me";
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          mediaUrl: newImagePreview,
          caption: newCaption.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.story) {
        setStories((prev) => [data.story, ...prev]);
        showToast("Story shared! Active for 24 hours ✦", "coral");
      }
      setIsCreatorOpen(false);
      setNewImagePreview(null);
      setNewCaption("");
    } catch (err) {
      showToast("Unable to post story. Please retry.", "neutral");
    } finally {
      setIsPosting(false);
    }
  };

  const activeStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <div style={{ marginBottom: "16px", padding: "0 4px" }}>
      {/* Hidden file input for camera/photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: "none" }}
        onChange={handlePhotoSelect}
      />

      {/* Stories Horizontal Tray */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          overflowX: "auto",
          padding: "8px 2px",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* 1. Add Story Bubble */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
            padding: 0,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "58px",
              height: "58px",
              borderRadius: "50%",
              padding: "2px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1.5px dashed rgba(245, 207, 104, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentUser?.photos?.[0]?.url ? (
              <img
                src={currentUser.photos[0].url}
                alt="My Story"
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "#1E1E26",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--rada-gold)",
                  fontWeight: 800,
                  fontSize: "18px",
                }}
              >
                {currentUser?.fullName?.charAt(0) || "✦"}
              </div>
            )}
            {/* Gold Plus Badge */}
            <div
              style={{
                position: "absolute",
                bottom: "-2px",
                right: "-2px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFF6D6, #F5CF68 40%, #D4AF37 75%, #9B700F 100%)",
                color: "#0A0A0E",
                fontSize: "14px",
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                border: "2px solid #09090B",
              }}
            >
              +
            </div>
          </div>
          <span style={{ fontSize: "11px", color: "var(--rada-pearl)", fontWeight: 600 }}>
            Your Story
          </span>
        </button>

        {/* 2. Active Member Stories */}
        {stories.map((story, idx) => {
          const avatarUrl = story.user?.photos?.[0]?.url || story.mediaUrl;
          const firstName = story.user?.fullName?.split(" ")[0] || "Member";

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => setActiveStoryIndex(idx)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "50%",
                  padding: "2.5px",
                  background: "linear-gradient(135deg, #FFF6D6 0%, #F5CF68 35%, #D4AF37 70%, #9B700F 100%)",
                  boxShadow: "0 2px 10px rgba(245, 207, 104, 0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "2px solid #09090B",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={firstName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--rada-pearl-muted)",
                  fontWeight: 600,
                  maxWidth: "60px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {firstName}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── STORY CREATOR MODAL ──────────────────────────────────────────────── */}
      {isCreatorOpen && newImagePreview && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(14px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#121217",
              border: "1px solid rgba(245, 207, 104, 0.35)",
              borderRadius: "24px",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.9)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              color: "var(--rada-pearl)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>📸</span>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800 }}>New 24h Story</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatorOpen(false);
                  setNewImagePreview(null);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "var(--rada-pearl-muted)",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Photo Preview */}
            <div
              style={{
                width: "100%",
                height: "280px",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                position: "relative",
              }}
            >
              <img
                src={newImagePreview}
                alt="Story Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  background: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(6px)",
                  color: "var(--rada-gold)",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(245, 207, 104, 0.3)",
                }}
              >
                ⏳ Expires in 24 Hours
              </span>
            </div>

            {/* Caption Input */}
            <input
              type="text"
              placeholder="Add a vibe or caption... (e.g. Nairobi sunset 🌅)"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "var(--rada-surface-raised)",
                border: "1px solid var(--rada-border)",
                color: "var(--rada-pearl)",
                fontSize: "14px",
                outline: "none",
              }}
            />

            {/* Post Button */}
            <button
              type="button"
              disabled={isPosting}
              onClick={handlePublishStory}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FFF6D6 0%, #F5CF68 35%, #D4AF37 70%, #9B700F 100%)",
                color: "#0A0A0E",
                fontSize: "15px",
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(245, 207, 104, 0.45)",
              }}
            >
              {isPosting ? "Publishing Story..." : "Share to Stories (24h) ✦"}
            </button>
          </div>
        </div>
      )}

      {/* ── FULL-SCREEN INSTAGRAM-STYLE STORY VIEWER ────────────────────────── */}
      {activeStory && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10002,
            background: "#000000",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Top Progress Segment */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              left: "14px",
              right: "14px",
              zIndex: 10,
              display: "flex",
              gap: "4px",
            }}
          >
            {stories.map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: "3px",
                  borderRadius: "2px",
                  background: "rgba(255, 255, 255, 0.25)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width:
                      i < (activeStoryIndex || 0)
                        ? "100%"
                        : i === activeStoryIndex
                        ? `${storyProgress}%`
                        : "0%",
                    background: "linear-gradient(90deg, #FFF6D6, #F5CF68)",
                    transition: i === activeStoryIndex ? "width 0.05s linear" : "none",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top User Info Bar */}
          <div
            style={{
              position: "absolute",
              top: "26px",
              left: "16px",
              right: "16px",
              zIndex: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={activeStory.user?.photos?.[0]?.url || activeStory.mediaUrl}
                alt={activeStory.user.fullName}
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--rada-gold)",
                }}
              />
              <div>
                <strong style={{ fontSize: "14px", color: "#FFFFFF", display: "block" }}>
                  {activeStory.user.fullName}
                </strong>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)" }}>
                  {activeStory.user.area} • 24h Story
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveStoryIndex(null)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Center Media with Left/Right Tap Navigation */}
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={activeStory.mediaUrl}
              alt={activeStory.caption || "Story"}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />

            {/* Tap Left (Previous) */}
            <div
              onClick={() => {
                if (activeStoryIndex !== null && activeStoryIndex > 0) {
                  setActiveStoryIndex((prev) => (prev !== null ? prev - 1 : null));
                }
              }}
              style={{
                position: "absolute",
                top: "70px",
                bottom: "100px",
                left: 0,
                width: "40%",
                cursor: "pointer",
              }}
            />

            {/* Tap Right (Next) */}
            <div
              onClick={() => {
                if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
                  setActiveStoryIndex((prev) => (prev !== null ? prev + 1 : null));
                } else {
                  setActiveStoryIndex(null);
                }
              }}
              style={{
                position: "absolute",
                top: "70px",
                bottom: "100px",
                right: 0,
                width: "60%",
                cursor: "pointer",
              }}
            />

            {/* Caption Overlay */}
            {activeStory.caption && (
              <div
                style={{
                  position: "absolute",
                  bottom: "90px",
                  left: "20px",
                  right: "20px",
                  padding: "10px 16px",
                  background: "rgba(0, 0, 0, 0.65)",
                  backdropFilter: "blur(10px)",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {activeStory.caption}
              </div>
            )}
          </div>

          {/* Bottom Quick Reaction Row */}
          <div
            style={{
              padding: "16px 20px 24px",
              background: "linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.95))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "18px",
              zIndex: 10,
            }}
          >
            {["🔥", "💖", "🥂", "😍", "✨"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  showToast(`Sent ${emoji} reaction to ${activeStory.user.fullName.split(" ")[0]}!`, "coral");
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "transform 0.15s ease",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StoriesBar;
