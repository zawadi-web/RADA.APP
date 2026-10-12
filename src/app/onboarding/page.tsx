"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRada } from "@/lib/rada-context";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { IntentType } from "@/lib/types";
import { KENYAN_COUNTIES, getAreasForCounty, normalizeCounty } from "@/lib/kenya-locations";

// ── Constants ──────────────────────────────────────────────────────────────────
const INTENTIONS: { id: IntentType; emoji: string; label: string; desc: string }[] = [
  { id: "MARRIAGE", emoji: "💍", label: "Marriage & Family", desc: "Clear path toward marriage" },
  { id: "LONG_TERM", emoji: "🌱", label: "Long-term Partner", desc: "Deep committed relationship" },
  { id: "SERIOUS_RELATIONSHIP", emoji: "❤️", label: "Serious Relationship", desc: "Meaningful & exclusive" },
  { id: "INTENTIONAL_DATING", emoji: "🎯", label: "Intentional Dating", desc: "Dating with purpose" },
];

const GENDERS = [
  { id: "MAN", emoji: "👨", label: "Man" },
  { id: "WOMAN", emoji: "👩", label: "Woman" },
  { id: "NON_BINARY", emoji: "🌈", label: "Non-binary" },
];

const INTERESTED_IN = [
  { id: "WOMAN", emoji: "👩", label: "Women" },
  { id: "MAN", emoji: "👨", label: "Men" },
  { id: "BOTH", emoji: "💫", label: "Everyone" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const markOnboarded = () => {
  try { localStorage.setItem("rada_onboarded", "1"); } catch { /* ignore */ }
};

const goToDiscover = () => {
  markOnboarded();
  window.location.replace("/discover");
};

export default function OnboardingPage() {
  const { authUser, updateProfile, updateUserIntent, toggleLocation } = useRada();

  const [step, setStep] = useState(authUser ? 1 : 0);
  const [name, setName] = useState(authUser?.name?.split(" ")[0] || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [intention, setIntention] = useState<IntentType | "">("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedCounty, setSelectedCounty] = useState("Tharaka-Nithi");
  const [selectedArea, setSelectedArea] = useState("Chuka");

  React.useEffect(() => {
    if (authUser?.name && !name) {
      setName(authUser.name.split(" ")[0]);
    }
  }, [authUser, name]);

  const totalSteps = 7;
  const currentStep = Math.max(1, step);
  const progress = Math.round((currentStep / totalSteps) * 100);

  // ── Photo handler ────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files).slice(0, 3 - photos.length);
    for (const file of fileArray) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "rada/profiles");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            setPhotos((prev) => [...prev, data.url].slice(0, 3));
            continue;
          }
        }
      } catch (err) {
        console.warn("Cloudinary upload fallback in onboarding:", err);
      }

      // Fallback: canvas downscale
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawUrl = ev.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const maxDim = 800;
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
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL("image/jpeg", 0.75);
            setPhotos((prev) => [...prev, compressed].slice(0, 3));
          } else {
            setPhotos((prev) => [...prev, rawUrl].slice(0, 3));
          }
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Save & finish ────────────────────────────────────────────────────────────
  const handleComplete = async () => {
    const effectiveCounty = normalizeCounty(selectedCounty);
    const updates: Record<string, unknown> = {
      county: effectiveCounty,
      area: selectedArea,
    };
    if (name) updates.fullName = name;
    if (age) updates.age = parseInt(age);
    if (gender) updates.gender = gender;
    
    // Default heterosexual preference if user skips step 4
    const defaultInterest = gender === "WOMAN" ? ["MAN"] : ["WOMAN"];
    const effectiveInterestedIn = (interestedIn && interestedIn.length > 0)
      ? interestedIn
      : defaultInterest;
    updates.interestedIn = effectiveInterestedIn;

    if (photos.length) {
      updates.photos = photos.map((url, i) => ({
        id: `photo-${i}`, url, isPrimary: i === 0, order: i,
      }));
    } else if (authUser?.avatarUrl) {
      updates.photos = [{
        id: "photo-google", url: authUser.avatarUrl, isPrimary: true, order: 0,
      }];
    }
    if (intention) updates.intent = intention;

    // Persist to PostgreSQL backend database immediately
    try {
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: updates.fullName || "Member",
          age: updates.age || 24,
          gender: updates.gender || "MAN",
          interestedIn: effectiveInterestedIn,
          intent: intention || "INTENTIONAL_DATING",
          photos: updates.photos || [],
          bio: "",
          county: effectiveCounty,
          area: selectedArea,
        }),
      });
      const data = await res.json();
      if (data.user?.id) {
        updates.id = data.user.id;
        // Synchronously save to localStorage so /discover immediately loads real identity
        const localState = {
          currentUser: {
            id: data.user.id,
            fullName: data.user.fullName,
            birthDate: data.user.birthDate,
            age: updates.age || 24,
            gender: data.user.gender,
            interestedIn: data.user.interestedInGenders || effectiveInterestedIn,
            intent: data.user.intent,
            bio: data.user.bio || "",
            photos: data.user.photos || updates.photos || [],
            prompts: [],
            county: data.user.county || effectiveCounty,
            area: data.user.area || selectedArea,
            verified: true,
            completionScore: data.user.completionScore || 70,
            isVip: false,
            lastActive: "Just now",
          },
          deck: [],
          matches: [],
          likesReceived: [],
          conversations: {},
          authUser,
          isRealDataMode: true,
          dbUserId: data.user.id,
        };
        try {
          localStorage.setItem("rada_app_real_production_v3", JSON.stringify(localState));
        } catch { /* storage full / private mode */ }
      }
    } catch (err) {
      console.warn("Could not save to remote DB on onboarding finish:", err);
    }

    updateProfile(updates as Parameters<typeof updateProfile>[0]);
    if (intention) updateUserIntent(intention as IntentType);
    goToDiscover();
  };

  // ── Styles ────────────────────────────────────────────────────────────────────
  const page: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 100,
    background: "linear-gradient(160deg, #0D0520 0%, #1A0B2E 60%, #2D0A3E 100%)",
    display: "flex", flexDirection: "column", alignItems: "center",
    overflowY: "auto",
  };
  const inner: React.CSSProperties = {
    width: "100%", maxWidth: "420px",
    padding: "24px 24px 8px",
    display: "flex", flexDirection: "column",
    minHeight: "calc(100vh - 80px)",
  };
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "14px 16px", borderRadius: "14px",
    border: `2px solid ${active ? "#FF6B8A" : "rgba(255,255,255,0.1)"}`,
    background: active ? "rgba(255,107,138,0.12)" : "rgba(255,255,255,0.04)",
    cursor: "pointer", display: "flex", alignItems: "center", gap: "12px",
    transition: "all 0.2s", color: "#FFF8F0", marginBottom: "10px",
    textAlign: "left" as const, width: "100%",
  });
  const title = (t: string, sub: string) => (
    <div style={{ marginBottom: "28px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#FFF8F0", margin: "0 0 8px", lineHeight: 1.2 }}>{t}</h1>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>{sub}</p>
    </div>
  );
  const nextBtn = (label: string, onClick: () => void, disabled = false, id?: string) => (
    <button id={id} onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "16px", borderRadius: "16px", border: "none",
      background: disabled ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #FF6B8A, #FF8C42)",
      color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
      fontSize: "16px", fontWeight: 700, cursor: disabled ? "default" : "pointer",
      marginTop: "auto", transition: "all 0.2s",
      boxShadow: disabled ? "none" : "0 4px 20px rgba(255,107,138,0.35)",
    }}>{label}</button>
  );
  const skip = (onClick: () => void, id?: string) => (
    <button id={id} onClick={onClick} style={{
      background: "none", border: "none", color: "rgba(255,255,255,0.35)",
      fontSize: "13px", cursor: "pointer", marginTop: "12px", textDecoration: "underline",
    }}>Skip for now</button>
  );

  // ── Step renderers ────────────────────────────────────────────────────────────
  const steps = [
    // STEP 0 — Welcome + Google sign-in
    () => (
      <div style={inner}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: "52px", marginBottom: "12px" }}>✦</div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#FFF8F0", margin: "0 0 10px" }}>Welcome to Rada</h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: "0 0 36px" }}>
            Kenya&apos;s intentional dating platform.<br />Know the intention before you catch feelings.
          </p>
          <div style={{ width: "100%" }}>
            <GoogleAuthButton label="Continue with Google" onSuccess={() => setStep(1)} variant="primary" />
          </div>
          <button
            id="onboarding-skip-google"
            onClick={() => setStep(1)}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.45)",
              fontSize: "13px", cursor: "pointer", marginTop: "16px", textDecoration: "underline",
            }}
          >
            Continue without Google →
          </button>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "14px", lineHeight: 1.6 }}>
            Google keeps you signed in automatically — no repeated logins.
          </p>

          <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)", width: "100%" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "#38BCA0", fontWeight: 700, textDecoration: "none" }}>
                Sign In →
              </Link>
            </p>
          </div>
        </div>
      </div>
    ),
    // STEP 1 — Name
    () => (
      <div style={inner}>
        {title("What's your name?", "This is how you'll appear on Rada")}
        <input id="onboarding-name-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoFocus
          style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "14px", color: "#FFF8F0", fontSize: "18px", fontWeight: 500, outline: "none", boxSizing: "border-box" }} />
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "10px" }}>Only your first name is shown publicly.</p>
        <div style={{ flex: 1 }} />
        {nextBtn("Continue →", () => setStep(2), !name.trim(), "onboarding-name-next")}
      </div>
    ),
    // STEP 2 — Age
    () => (
      <div style={inner}>
        {title("How old are you?", "Your age is shown on your profile")}
        <input id="onboarding-age-input" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 27" min="18" max="60" autoFocus
          style={{ width: "100%", padding: "16px", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "14px", color: "#FFF8F0", fontSize: "28px", fontWeight: 700, outline: "none", textAlign: "center", boxSizing: "border-box" }} />
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "10px", textAlign: "center" }}>You must be 18+ to use Rada.</p>
        <div style={{ flex: 1 }} />
        {nextBtn("Continue →", () => setStep(3), !age || parseInt(age) < 18, "onboarding-age-next")}
      </div>
    ),
    // STEP 3 — Gender
    () => (
      <div style={inner}>
        {title("I identify as...", "Helps us show your profile to the right people")}
        {GENDERS.map((g) => (
          <button key={g.id} id={`onboarding-gender-${g.id.toLowerCase()}`} style={pill(gender === g.id)} onClick={() => setGender(g.id)}>
            <span style={{ fontSize: "28px" }}>{g.emoji}</span>
            <span style={{ fontSize: "17px", fontWeight: 600 }}>{g.label}</span>
            {gender === g.id && <span style={{ marginLeft: "auto", color: "#FF6B8A" }}>✓</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {nextBtn("Continue →", () => setStep(4), !gender, "onboarding-gender-next")}
        {skip(() => setStep(4), "onboarding-gender-skip")}
      </div>
    ),
    // STEP 4 — Interested In
    () => (
      <div style={inner}>
        {title("I'm interested in...", "We'll filter your matches accordingly")}
        {INTERESTED_IN.map((g) => {
          const sel = interestedIn.includes(g.id);
          return (
            <button key={g.id} id={`onboarding-interest-${g.id.toLowerCase()}`} style={pill(sel)} onClick={() => setInterestedIn((p) => sel ? p.filter((x) => x !== g.id) : [...p, g.id])}>
              <span style={{ fontSize: "28px" }}>{g.emoji}</span>
              <span style={{ fontSize: "17px", fontWeight: 600 }}>{g.label}</span>
              {sel && <span style={{ marginLeft: "auto", color: "#FF6B8A" }}>✓</span>}
            </button>
          );
        })}
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>You can select more than one.</p>
        <div style={{ flex: 1 }} />
        {nextBtn("Continue →", () => setStep(5), interestedIn.length === 0, "onboarding-interest-next")}
        {skip(() => setStep(5), "onboarding-interest-skip")}
      </div>
    ),
    // STEP 5 — Intention
    () => (
      <div style={inner}>
        {title("Why are you here?", "Be honest — this is how we match you")}
        {INTENTIONS.map((i) => (
          <button key={i.id} id={`onboarding-intent-${i.id.toLowerCase()}`} style={pill(intention === i.id)} onClick={() => setIntention(i.id)}>
            <span style={{ fontSize: "26px" }}>{i.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>{i.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{i.desc}</div>
            </div>
            {intention === i.id && <span style={{ marginLeft: "auto", color: "#FF6B8A" }}>✓</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {nextBtn("Continue →", () => setStep(6), !intention, "onboarding-intent-next")}
      </div>
    ),
    // STEP 6 — Photos
    () => (
      <div style={inner}>
        {title("Add your photos", "Up to 3 photos — first impressions matter")}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
          {[0, 1, 2].map((i) => (
            <label key={i} style={{ aspectRatio: "3/4", borderRadius: "14px", border: `2px dashed ${photos[i] ? "#FF6B8A" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: photos[i] ? "default" : "pointer", overflow: "hidden", position: "relative", background: "rgba(255,255,255,0.03)" }}>
              {photos[i] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photos[i]} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={(e) => { e.preventDefault(); setPhotos((p) => p.filter((_, idx) => idx !== i)); }}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "12px" }}>✕</button>
                </>
              ) : (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
                  <div style={{ fontSize: "24px" }}>+</div>
                  <div style={{ fontSize: "10px", marginTop: "4px" }}>Photo {i + 1}</div>
                </div>
              )}
              {!photos[i] && <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />}
            </label>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{photos.length === 0 ? "Profiles with photos get 8× more matches." : `${photos.length}/3 photo${photos.length > 1 ? "s" : ""} added ✓`}</p>
        <div style={{ flex: 1 }} />
        {nextBtn(photos.length > 0 ? "Continue →" : "Skip for now →", () => setStep(7), false, "onboarding-photos-next")}
      </div>
    ),
    // STEP 7 — Location
    () => (
      <div style={inner}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          <div style={{ fontSize: "52px", marginBottom: "16px" }}>📍</div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#FFF8F0", margin: "0 0 8px" }}>Where are you located?</h1>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: "0 0 20px" }}>Rada is active nationwide across all 47 counties in Kenya</p>

          <button
            id="onboarding-location-enable"
            onClick={() => {
              toggleLocation();
              setTimeout(handleComplete, 800);
            }}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "14px",
              border: "1.5px solid rgba(52,211,153,0.4)",
              background: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(16,185,129,0.18))",
              color: "#34D399",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>🎯</span> Auto-Detect from GPS
          </button>

          <div style={{ width: "100%", textAlign: "left", marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontWeight: 600 }}>
              County (47 Kenyan Counties)
            </label>
            <select
              value={selectedCounty}
              onChange={(e) => {
                setSelectedCounty(e.target.value);
                const firstArea = getAreasForCounty(e.target.value)[0]?.label || "";
                setSelectedArea(firstArea);
              }}
              style={{
                width: "100%",
                padding: "13px 14px",
                background: "#1E1235",
                border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: "12px",
                color: "#FFF8F0",
                fontSize: "14px",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {KENYAN_COUNTIES.map((c) => (
                <option key={c.value} value={c.label} style={{ background: "#1A0B2E", color: "#FFF8F0" }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: "100%", textAlign: "left", marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "6px", fontWeight: 600 }}>
              Town / Sub-County
            </label>
            {getAreasForCounty(selectedCounty).length > 0 ? (
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  background: "#1E1235",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#FFF8F0",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                {getAreasForCounty(selectedCounty).map((a) => (
                  <option key={a.value} value={a.label} style={{ background: "#1A0B2E", color: "#FFF8F0" }}>
                    {a.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. Town name"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 14px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  color: "#FFF8F0",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            )}
          </div>
        </div>

        <button
          id="onboarding-location-complete"
          onClick={handleComplete}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #FF6B8A, #FF8C42)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(255,107,138,0.35)",
            marginBottom: "12px",
          }}
        >
          Enter Rada →
        </button>
      </div>
    ),
  ];

  const renderStep = steps[step] || steps[0];

  return (
    <div style={page}>
      {/* Progress bar */}
      {step > 0 && (
        <div style={{ width: "100%", maxWidth: "420px", padding: "20px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setStep((s) => Math.max(authUser ? 1 : 0, s - 1))} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "20px", padding: 0 }}>←</button>
            <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #FF6B8A, #FF8C42)", borderRadius: "2px", transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{currentStep}/{totalSteps}</span>
          </div>
        </div>
      )}
      {step === 0 && !authUser && (
        <div style={{ padding: "40px 24px 0", textAlign: "center" }}>
          <span style={{ fontSize: "28px", fontWeight: 800, color: "#FFF8F0" }}>✦ Rada</span>
        </div>
      )}
      {renderStep()}
    </div>
  );
}
