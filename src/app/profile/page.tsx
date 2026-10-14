"use client";

import React, { useState, useRef } from "react";
import { useRada } from "@/lib/rada-context";
import { useTheme } from "@/lib/theme-context";
import { IntentType } from "@/lib/types";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useToast } from "@/components/ui/Toast";
import { KENYAN_COUNTIES, getAreasForCounty, normalizeCounty } from "@/lib/kenya-locations";
import { reverseGeocodeKenya, geolocateByIP } from "@/lib/kenya-geocoding";
import { compressImage } from "@/lib/image-utils";

// ── Intent labels ─────────────────────────────────────────────────────────────
const INTENT_MAP: Record<string, { emoji: string; label: string }> = {
  MARRIAGE: { emoji: "💍", label: "Marriage & Family" },
  LONG_TERM: { emoji: "🌱", label: "Long-term Partner" },
  SERIOUS_RELATIONSHIP: { emoji: "❤️", label: "Serious Relationship" },
  INTENTIONAL_DATING: { emoji: "🎯", label: "Intentional Dating" },
  EXPLORING: { emoji: "✨", label: "Exploring" },
};

const GENDER_LABEL: Record<string, string> = {
  MAN: "Man", WOMAN: "Woman", NON_BINARY: "Non-binary",
};

const INTENTIONS: { id: IntentType; emoji: string; label: string }[] = [
  { id: "MARRIAGE", emoji: "💍", label: "Marriage & Family" },
  { id: "LONG_TERM", emoji: "🌱", label: "Long-term Partner" },
  { id: "SERIOUS_RELATIONSHIP", emoji: "❤️", label: "Serious Relationship" },
  { id: "INTENTIONAL_DATING", emoji: "🎯", label: "Intentional Dating" },
];

const GENDERS = [
  { id: "MAN", emoji: "👨", label: "Man" },
  { id: "WOMAN", emoji: "👩", label: "Woman" },
  { id: "NON_BINARY", emoji: "🌈", label: "Non-binary" },
];

const INTERESTED_IN_OPTIONS = [
  { id: "WOMAN", emoji: "👩", label: "Women" },
  { id: "MAN", emoji: "👨", label: "Men" },
  { id: "BOTH", emoji: "💫", label: "Everyone" },
];

// ── Tiny bottom sheet modal ────────────────────────────────────────────────────
const Sheet = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 5000, display: "flex", flexDirection: "column" }}>
    <div style={{ flex: 1, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }} onClick={onClose} />
    <div style={{
      background: "var(--rada-surface-raised)",
      borderRadius: "24px 24px 0 0",
      border: "1px solid var(--rada-border-teal)",
      borderBottom: "none",
      padding: "24px 20px 40px",
      maxHeight: "80vh", overflowY: "auto",
      color: "var(--rada-pearl)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--rada-pearl)" }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--rada-pearl-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ── Editable row ──────────────────────────────────────────────────────────────
const EditRow = ({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) => (
  <button
    onClick={onEdit}
    style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 0", background: "none", border: "none",
      borderBottom: "1px solid var(--rada-border)", cursor: "pointer",
      textAlign: "left",
    }}
  >
    <span style={{ fontSize: "13px", color: "var(--rada-pearl-muted)" }}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--rada-pearl)" }}>{value || "Add"}</span>
      <span style={{ fontSize: "12px", color: "var(--rada-pearl-dim)" }}>›</span>
    </div>
  </button>
);

export default function ProfilePage() {
  const {
    currentUser, authUser, updateProfile, updateUserIntent,
    openVipModal, signOut, toggleLocation, useLocation,
    switchToProfile, savedTestProfiles, createTestProfile,
  } = useRada();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [activePhoto, setActivePhoto] = useState(0);
  const [editSheet, setEditSheet] = useState<string | null>(null);

  // Edit state
  const [editName, setEditName] = useState(currentUser.fullName || "");
  const [editAge, setEditAge] = useState(String(currentUser.age || ""));
  const [editBio, setEditBio] = useState(currentUser.bio || "");
  const [editGender, setEditGender] = useState(currentUser.gender || "");
  const [editInterestedIn, setEditInterestedIn] = useState<string[]>(currentUser.interestedIn || []);
  const [editIntention, setEditIntention] = useState<IntentType>(currentUser.intent || "INTENTIONAL_DATING");
  const [editCounty, setEditCounty] = useState(currentUser.county || "Tharaka-Nithi");
  const [editArea, setEditArea] = useState(currentUser.area || "");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [targetSlot, setTargetSlot] = useState<number | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const photos = currentUser.photos || [];
  const intent = INTENT_MAP[currentUser.intent] || INTENT_MAP["INTENTIONAL_DATING"];

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    showToast("Uploading photos to CDN…", "neutral");

    const uploadedUrls: string[] = [];
    for (const file of fileArray) {
      try {
        // First try fast Cloudinary upload via /api/upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "rada/profiles");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            uploadedUrls.push(data.url);
            continue;
          }
        }
        // Fallback: lightweight compressed client-side canvas
        const compressed = await compressImage(file, 800, 0.75);
        if (compressed) uploadedUrls.push(compressed);
      } catch (err) {
        console.warn("Upload fallback triggered:", err);
        const compressed = await compressImage(file, 800, 0.75).catch(() => null);
        if (compressed) uploadedUrls.push(compressed);
      }
    }

    if (uploadedUrls.length === 0) {
      showToast("Could not process selected image(s)", "danger");
      return;
    }

    let nextPhotos = [...photos];

    // If user clicked a specific slot to replace
    if (targetSlot !== null && targetSlot >= 0 && targetSlot < 3) {
      const newPhotoObj = {
        id: `p-${Date.now()}-${targetSlot}`,
        url: uploadedUrls[0],
        isPrimary: targetSlot === 0,
        order: targetSlot,
      };

      if (targetSlot < nextPhotos.length) {
        nextPhotos[targetSlot] = newPhotoObj;
      } else {
        nextPhotos.push(newPhotoObj);
      }

      // If additional files were selected, fill remaining empty slots
      const remaining = uploadedUrls.slice(1);
      for (const extraUrl of remaining) {
        if (nextPhotos.length < 3) {
          nextPhotos.push({
            id: `p-${Date.now()}-${nextPhotos.length}`,
            url: extraUrl,
            isPrimary: false,
            order: nextPhotos.length,
          });
        }
      }
    } else {
      // Append up to 3 total
      for (const url of uploadedUrls) {
        if (nextPhotos.length < 3) {
          nextPhotos.push({
            id: `p-${Date.now()}-${nextPhotos.length}`,
            url,
            isPrimary: nextPhotos.length === 0,
            order: nextPhotos.length,
          });
        }
      }
    }

    // Normalize order and isPrimary
    nextPhotos = nextPhotos.slice(0, 3).map((p, idx) => ({
      ...p,
      isPrimary: idx === 0,
      order: idx,
    }));

    updateProfile({ photos: nextPhotos });
    setActivePhoto(targetSlot !== null ? targetSlot : 0);
    setTargetSlot(null);
    e.target.value = "";
    showToast(`📸 ${uploadedUrls.length} photo(s) saved ✓`, "success");
  };

  const handleDeletePhoto = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPhotos = photos
      .filter((_, idx) => idx !== indexToDelete)
      .map((p, idx) => ({
        ...p,
        isPrimary: idx === 0,
        order: idx,
      }));
    updateProfile({ photos: nextPhotos });
    setActivePhoto(0);
    showToast("Photo removed", "neutral");
  };

  const saveName = () => {
    updateProfile({ fullName: editName });
    setEditSheet(null);
    showToast("Name updated ✓", "success");
  };

  const saveAge = () => {
    updateProfile({ age: parseInt(editAge) });
    setEditSheet(null);
    showToast("Age updated ✓", "success");
  };

  const saveBio = () => {
    updateProfile({ bio: editBio });
    setEditSheet(null);
    showToast("Bio updated ✓", "success");
  };

  const saveGender = (g: string) => {
    updateProfile({ gender: g as "MAN" | "WOMAN" | "NON_BINARY" });
    setEditSheet(null);
    showToast("Gender updated ✓", "success");
  };

  const saveInterestedIn = () => {
    updateProfile({ interestedIn: editInterestedIn as import("@/lib/types").Gender[] });
    setEditSheet(null);
    showToast("Preferences updated ✓", "success");
  };

  const saveIntention = (i: IntentType) => {
    updateUserIntent(i);
    setEditSheet(null);
    showToast("Intention updated ✓", "success");
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);

    const fallbackToIP = async () => {
      try {
        const ipGeo = await geolocateByIP();
        setEditCounty(ipGeo.county);
        setEditArea(ipGeo.area);
        updateProfile({ county: ipGeo.county, area: ipGeo.area });
        showToast(`📍 Location detected: ${ipGeo.area ? `${ipGeo.area}, ` : ""}${ipGeo.county}`, "success");
        setEditSheet(null);
      } catch {
        showToast("Select your county from the list below", "neutral");
      } finally {
        setIsDetectingLocation(false);
      }
    };

    if (!navigator.geolocation) {
      fallbackToIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const geo = await reverseGeocodeKenya(lat, lng);
          setEditCounty(geo.county);
          setEditArea(geo.area);
          updateProfile({
            county: geo.county,
            area: geo.area,
            latitude: lat,
            longitude: lng,
          });
          showToast(`📍 Location detected: ${geo.area ? `${geo.area}, ` : ""}${geo.county}`, "success");
          setEditSheet(null);
        } catch {
          await fallbackToIP();
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        // Fast, silent fallback to IP location if GPS times out or is denied
        fallbackToIP();
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  const saveLocation = () => {
    const finalCounty = normalizeCounty(editCounty);
    updateProfile({ county: finalCounty, area: editArea });
    setEditSheet(null);
    showToast(`Location set to ${editArea ? `${editArea}, ` : ""}${finalCounty} ✓`, "success");
  };

  // ── Reset onboarding (for testing) ────────────────────────────────────────
  const resetOnboarding = () => {
    localStorage.removeItem("rada_onboarded");
    window.location.reload();
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    container: {
      minHeight: "100vh",
      background: "var(--rada-bg)",
      color: "var(--rada-pearl)",
      paddingBottom: "80px",
    } as React.CSSProperties,

    pillBtn: (active: boolean): React.CSSProperties => ({
      width: "100%", padding: "14px 16px", borderRadius: "12px",
      border: `2px solid ${active ? "var(--rada-gold)" : "var(--rada-border)"}`,
      background: active ? "var(--rada-gold-subtle)" : "var(--rada-surface-raised)",
      cursor: "pointer", color: "var(--rada-pearl)",
      display: "flex", alignItems: "center", gap: "12px",
      marginBottom: "10px", fontSize: "15px", fontWeight: 600,
      textAlign: "left" as const,
    }),
  };

  return (
    <main style={s.container}>
      {/* ── Photos Section ──────────────────────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "4/5", maxHeight: "420px", background: "#0A0A0C" }}>
        {photos.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[activePhoto]?.url || photos[0]?.url}
              alt="Profile"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* Photo dots */}
            {photos.length > 1 && (
              <div style={{ position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" }}>
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    style={{
                      width: i === activePhoto ? "24px" : "6px", height: "6px",
                      borderRadius: "3px", border: "none", cursor: "pointer",
                      background: i === activePhoto ? "#fff" : "rgba(255,255,255,0.4)",
                      transition: "all 0.2s",
                    }}
                  />
                ))}
              </div>
            )}
            {/* Tap zones for swiping */}
            <div style={{ position: "absolute", inset: 0, display: "flex" }}>
              <div style={{ flex: 1 }} onClick={() => setActivePhoto((p) => Math.max(0, p - 1))} />
              <div style={{ flex: 1 }} onClick={() => setActivePhoto((p) => Math.min(photos.length - 1, p + 1))} />
            </div>
            {/* Dark gradient overlay at bottom */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(transparent, #0D0520)" }} />
          </>
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <div style={{ fontSize: "48px" }}>📸</div>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: 0 }}>No photos yet</p>
          </div>
        )}

        {/* Name / age over photo */}
        <div style={{ position: "absolute", bottom: "16px", left: "20px", right: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 2px", color: "#FFF8F0", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            {currentUser.fullName?.split(" ")[0] || "Your Name"}{currentUser.age ? `, ${currentUser.age}` : ""}
          </h1>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", background: "rgba(255,107,138,0.25)", border: "1px solid rgba(255,107,138,0.4)", borderRadius: "20px", padding: "3px 10px", color: "#FFF8F0" }}>
              {intent.emoji} {intent.label}
            </span>
            {currentUser.gender && (
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                {GENDER_LABEL[currentUser.gender] || currentUser.gender}
              </span>
            )}
            {currentUser.verified && (
              <span style={{ fontSize: "12px", color: "#34D399" }}>✓ Verified</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Photo Thumbnails & Add Button ──────────────────────────────── */}
      <div style={{ padding: "16px 20px 0", display: "flex", gap: "10px", alignItems: "center" }}>
        {[0, 1, 2].map((i) => {
          const hasPhoto = Boolean(photos[i]?.url);
          return (
            <div
              key={i}
              onClick={() => {
                if (hasPhoto) {
                  setActivePhoto(i);
                } else {
                  setTargetSlot(i);
                  fileRef.current?.click();
                }
              }}
              style={{
                width: "80px",
                height: "105px",
                borderRadius: "14px",
                border: `2px solid ${hasPhoto ? (activePhoto === i ? "var(--rada-gold)" : "var(--rada-border)") : "var(--rada-border)"}`,
                background: hasPhoto ? "var(--rada-surface-raised)" : "var(--rada-surface)",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {hasPhoto ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[i].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {/* Delete button */}
                  <button
                    type="button"
                    title="Remove photo"
                    onClick={(e) => handleDeletePhoto(i, e)}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.75)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#fff",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                      zIndex: 2,
                    }}
                  >
                    ✕
                  </button>
                  {/* Replace button on thumbnail */}
                  <button
                    type="button"
                    title="Replace this photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetSlot(i);
                      fileRef.current?.click();
                    }}
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "2px 7px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      fontSize: "9px",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      zIndex: 2,
                    }}
                  >
                    Change
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>
                  <div style={{ fontSize: "22px", lineHeight: 1 }}>+</div>
                  <div style={{ fontSize: "10px", marginTop: "4px" }}>Slot {i + 1}</div>
                </div>
              )}
            </div>
          );
        })}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
        <div style={{ marginLeft: "4px" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "0 0 2px", fontWeight: 600 }}>
            {photos.length}/3 Photos
          </p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.3 }}>
            Tap + to add or Change to replace.
          </p>
        </div>
      </div>

      {/* ── Google Sign-in ─────────────────────────────────────────────── */}
      {!authUser && (
        <div style={{ margin: "20px 20px 0", padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", margin: "0 0 12px" }}>
            🔐 Sign in to save your profile & access real matches
          </p>
          <GoogleAuthButton variant="subtle" label="Sign in with Google" />
        </div>
      )}

      {authUser && (
        <div style={{ margin: "16px 20px 0", padding: "12px 16px", background: "rgba(52,211,153,0.08)", borderRadius: "12px", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={authUser.avatarUrl || ""} alt="" style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFF8F0" }}>{authUser.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{authUser.email}</div>
          </div>
          <button onClick={() => { signOut(); showToast("Signed out", "amber"); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      )}

      {/* ── Profile Info (Editable) ─────────────────────────────────────── */}
      <div style={{ margin: "20px 20px 0", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)", padding: "0 16px" }}>
        <EditRow label="Name" value={currentUser.fullName?.split(" ")[0] || ""} onEdit={() => { setEditName(currentUser.fullName || ""); setEditSheet("name"); }} />
        <EditRow label="Age" value={currentUser.age ? `${currentUser.age} years` : ""} onEdit={() => { setEditAge(String(currentUser.age || "")); setEditSheet("age"); }} />
        <EditRow
          label="Location"
          value={currentUser.area ? `${currentUser.area}, ${currentUser.county}` : currentUser.county || "Set Location"}
          onEdit={() => {
            setEditCounty(currentUser.county || "Tharaka-Nithi");
            setEditArea(currentUser.area || "");
            setEditSheet("location");
          }}
        />
        <EditRow label="Gender" value={GENDER_LABEL[currentUser.gender || ""] || ""} onEdit={() => setEditSheet("gender")} />
        <EditRow label="Interested in" value={
          (currentUser.interestedIn || []).length > 0
            ? (currentUser.interestedIn || []).map((x: string) => x === "BOTH" ? "Everyone" : x === "MAN" ? "Men" : "Women").join(" & ")
            : ""
        } onEdit={() => { setEditInterestedIn(currentUser.interestedIn || []); setEditSheet("interestedIn"); }} />
        <EditRow label="My intention" value={INTENT_MAP[currentUser.intent]?.label || ""} onEdit={() => setEditSheet("intention")} />
        <EditRow label="Bio" value={currentUser.bio ? currentUser.bio.slice(0, 32) + (currentUser.bio.length > 32 ? "…" : "") : ""} onEdit={() => { setEditBio(currentUser.bio || ""); setEditSheet("bio"); }} />
      </div>

      {/* ── Location Toggle ─────────────────────────────────────────────── */}
      <div style={{ margin: "16px 20px 0", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFF8F0" }}>📍 Nearby Matches</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>
              {useLocation && (currentUser.area || currentUser.county)
                ? `Prioritizing ${currentUser.area ? `${currentUser.area}, ` : ""}${currentUser.county} & nearby singles`
                : "Prioritize matches closer to you anywhere in Kenya"}
            </div>
          </div>
          <button
            onClick={toggleLocation}
            style={{
              width: "48px", height: "26px", borderRadius: "13px", border: "none",
              background: useLocation ? "#34D399" : "rgba(255,255,255,0.15)",
              cursor: "pointer", position: "relative", transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: "3px",
              left: useLocation ? "25px" : "3px",
              width: "20px", height: "20px", borderRadius: "50%",
              background: "#fff", transition: "left 0.2s",
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }} />
          </button>
        </div>
      </div>

      {/* ── Appearance / Dark Mode Toggle ─────────────────────────────── */}
      <div style={{ margin: "16px 20px 0", padding: "16px", background: "var(--rada-surface)", borderRadius: "16px", border: "1px solid var(--rada-border)", boxShadow: "var(--rada-shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--rada-pearl)" }}>
              {theme === "dark" ? "🌙 Dark Mode (Noir & Gold)" : "☀️ Light Mode (White & Gold)"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", marginTop: "3px" }}>
              {theme === "dark" ? "Deep obsidian noir with luminous champagne gold" : "Crisp high-fashion white with warm champagne gold"}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              padding: "7px 14px", borderRadius: "20px", border: "1px solid var(--rada-border-teal)",
              background: "var(--rada-gold-subtle)", color: "var(--rada-gold)",
              fontWeight: 800, fontSize: "12px", cursor: "pointer",
            }}
          >
            {theme === "dark" ? "Switch to Light ☀️" : "Switch to Dark 🌙"}
          </button>
        </div>
      </div>

      {/* ── VIP Upgrade ─────────────────────────────────────────────────── */}
      {!currentUser.isVip && (
        <div style={{ margin: "16px 20px 0" }}>
          <button
            onClick={openVipModal}
            style={{
              width: "100%", padding: "16px", borderRadius: "16px", border: "none",
              background: "var(--rada-gold-gradient)",
              color: "#0A0A0C", fontSize: "15px", fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 20px var(--rada-gold-subtle)",
            }}
          >
            ✦ Upgrade to VIP — from KES 250/wk
          </button>
        </div>
      )}

      {/* ── Danger Zone ─────────────────────────────────────────────────── */}
      <div style={{ margin: "24px 20px 0", display: "flex", gap: "10px" }}>
        <button
          onClick={resetOnboarding}
          style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--rada-border)", background: "var(--rada-surface-raised)", color: "var(--rada-pearl-muted)", fontSize: "12px", cursor: "pointer" }}
        >
          Restart Setup
        </button>
      </div>

      {/* ── Edit Sheets ─────────────────────────────────────────────────── */}
      {editSheet === "name" && (
        <Sheet title="Your Name" onClose={() => setEditSheet(null)}>
          <input
            type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
            placeholder="First name" autoFocus
            style={{ width: "100%", padding: "14px", background: "var(--rada-surface)", border: "1.5px solid var(--rada-border)", borderRadius: "12px", color: "var(--rada-pearl)", fontSize: "17px", outline: "none", boxSizing: "border-box" }}
          />
          <button onClick={saveName} style={{ width: "100%", padding: "14px", marginTop: "16px", borderRadius: "12px", border: "none", background: "var(--rada-gold-gradient)", color: "#0A0A0C", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px var(--rada-gold-subtle)" }}>Save</button>
        </Sheet>
      )}

      {editSheet === "age" && (
        <Sheet title="Your Age" onClose={() => setEditSheet(null)}>
          <input
            type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)}
            placeholder="e.g. 27" min="18" max="60" autoFocus
            style={{ width: "100%", padding: "14px", background: "var(--rada-surface)", border: "1.5px solid var(--rada-border)", borderRadius: "12px", color: "var(--rada-pearl)", fontSize: "28px", fontWeight: 700, outline: "none", textAlign: "center", boxSizing: "border-box" }}
          />
          <button onClick={saveAge} disabled={!editAge || parseInt(editAge) < 18} style={{ width: "100%", padding: "14px", marginTop: "16px", borderRadius: "12px", border: "none", background: "var(--rada-gold-gradient)", color: "#0A0A0C", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px var(--rada-gold-subtle)" }}>Save</button>
        </Sheet>
      )}

      {editSheet === "bio" && (
        <Sheet title="About You" onClose={() => setEditSheet(null)}>
          <textarea
            value={editBio} onChange={(e) => setEditBio(e.target.value)}
            placeholder="Say something real about yourself — what you're like, what you value…" autoFocus
            maxLength={200}
            style={{ width: "100%", padding: "14px", background: "var(--rada-surface)", border: "1.5px solid var(--rada-border)", borderRadius: "12px", color: "var(--rada-pearl)", fontSize: "14px", outline: "none", minHeight: "120px", resize: "none", boxSizing: "border-box", lineHeight: 1.6 }}
          />
          <p style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", marginTop: "6px" }}>{editBio.length}/200</p>
          <button onClick={saveBio} style={{ width: "100%", padding: "14px", marginTop: "8px", borderRadius: "12px", border: "none", background: "var(--rada-gold-gradient)", color: "#0A0A0C", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px var(--rada-gold-subtle)" }}>Save</button>
        </Sheet>
      )}

      {editSheet === "gender" && (
        <Sheet title="I identify as..." onClose={() => setEditSheet(null)}>
          {GENDERS.map((g) => (
            <button key={g.id} style={s.pillBtn(editGender === g.id)} onClick={() => { setEditGender(g.id as "MAN" | "WOMAN" | "NON_BINARY"); saveGender(g.id); }}>
              <span style={{ fontSize: "26px" }}>{g.emoji}</span>
              <span>{g.label}</span>
              {editGender === g.id && <span style={{ marginLeft: "auto", color: "var(--rada-gold)" }}>✓</span>}
            </button>
          ))}
        </Sheet>
      )}

      {editSheet === "interestedIn" && (
        <Sheet title="I'm interested in..." onClose={() => setEditSheet(null)}>
          {INTERESTED_IN_OPTIONS.map((g) => {
            const sel = editInterestedIn.includes(g.id);
            return (
              <button key={g.id} style={s.pillBtn(sel)} onClick={() => setEditInterestedIn((prev) => sel ? prev.filter((x) => x !== g.id) : [...prev, g.id])}>
                <span style={{ fontSize: "26px" }}>{g.emoji}</span>
                <span>{g.label}</span>
                {sel && <span style={{ marginLeft: "auto", color: "var(--rada-gold)" }}>✓</span>}
              </button>
            );
          })}
          <button onClick={saveInterestedIn} style={{ width: "100%", padding: "14px", marginTop: "8px", borderRadius: "12px", border: "none", background: "var(--rada-gold-gradient)", color: "#0A0A0C", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px var(--rada-gold-subtle)" }}>Save Preferences</button>
        </Sheet>
      )}

      {editSheet === "intention" && (
        <Sheet title="Why are you here?" onClose={() => setEditSheet(null)}>
          {INTENTIONS.map((i) => (
            <button key={i.id} style={s.pillBtn(editIntention === i.id)} onClick={() => { setEditIntention(i.id); saveIntention(i.id); }}>
              <span style={{ fontSize: "26px" }}>{i.emoji}</span>
              <span>{i.label}</span>
              {editIntention === i.id && <span style={{ marginLeft: "auto", color: "var(--rada-gold)" }}>✓</span>}
            </button>
          ))}
        </Sheet>
      )}

      {/* ── Location Sheet (47 Counties of Kenya) ────────────────────── */}
      {editSheet === "location" && (
        <Sheet title="Set Your Location in Kenya" onClose={() => setEditSheet(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* GPS Detection Button */}
            <button
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1.5px solid var(--rada-border-teal)",
                background: "var(--rada-gold-subtle)",
                color: "var(--rada-gold)",
                fontSize: "14px",
                fontWeight: 700,
                cursor: isDetectingLocation ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "18px" }}>🎯</span>
              <span>{isDetectingLocation ? "Detecting GPS location…" : "Auto-Detect My Location via GPS"}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--rada-border)" }} />
              <span style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>or select manually</span>
              <div style={{ flex: 1, height: "1px", background: "var(--rada-border)" }} />
            </div>

            {/* County Dropdown */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--rada-pearl-muted)", marginBottom: "6px", fontWeight: 600 }}>
                County (47 Counties)
              </label>
              <select
                value={editCounty}
                onChange={(e) => {
                  setEditCounty(e.target.value);
                  const firstArea = getAreasForCounty(e.target.value)[0]?.label || "";
                  setEditArea(firstArea);
                }}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "var(--rada-surface)",
                  border: "1.5px solid var(--rada-border)",
                  borderRadius: "12px",
                  color: "var(--rada-pearl)",
                  fontSize: "15px",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c.value} value={c.label} style={{ background: "var(--rada-surface-raised)", color: "var(--rada-pearl)" }}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / Sub-county Dropdown or Input */}
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--rada-pearl-muted)", marginBottom: "6px", fontWeight: 600 }}>
                Sub-County / Area / Town
              </label>
              {getAreasForCounty(editCounty).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <select
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "var(--rada-surface)",
                      border: "1.5px solid var(--rada-border)",
                      borderRadius: "12px",
                      color: "var(--rada-pearl)",
                      fontSize: "15px",
                      outline: "none",
                      cursor: "pointer",
                      boxSizing: "border-box",
                    }}
                  >
                    {getAreasForCounty(editCounty).map((a) => (
                      <option key={a.value} value={a.label} style={{ background: "var(--rada-surface-raised)", color: "var(--rada-pearl)" }}>
                        {a.label}
                      </option>
                    ))}
                    <option value="_custom_" style={{ background: "var(--rada-surface-raised)", color: "var(--rada-gold)" }}>
                      + Other town / area
                    </option>
                  </select>
                  {(!getAreasForCounty(editCounty).some((a) => a.label === editArea) || editArea === "_custom_") && (
                    <input
                      type="text"
                      placeholder="Type your area / town name"
                      value={editArea === "_custom_" ? "" : editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px 14px",
                        background: "var(--rada-surface)",
                        border: "1.5px solid var(--rada-border)",
                        borderRadius: "12px",
                        color: "var(--rada-pearl)",
                        fontSize: "14px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Town / Sub-county"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: "var(--rada-surface)",
                    border: "1.5px solid var(--rada-border)",
                    borderRadius: "12px",
                    color: "var(--rada-pearl)",
                    fontSize: "15px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            <button
              onClick={saveLocation}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "10px",
                borderRadius: "14px",
                border: "none",
                background: "var(--rada-gold-gradient)",
                color: "#0A0A0C",
                fontSize: "15px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 16px var(--rada-gold-subtle)",
              }}
            >
              Save Location ✓
            </button>
          </div>
        </Sheet>
      )}
    </main>
  );
}
