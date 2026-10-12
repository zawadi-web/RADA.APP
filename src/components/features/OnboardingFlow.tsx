"use client";

import React, { useState } from "react";
import { useRada } from "@/lib/rada-context";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { IntentType } from "@/lib/types";

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

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { authUser, updateProfile, toggleLocation, currentUser } = useRada();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(authUser?.name?.split(" ")[0] || "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [interestedIn, setInterestedIn] = useState<string[]>([]);
  const [intention, setIntention] = useState<IntentType | "">("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [locationAsked, setLocationAsked] = useState(false);

  const totalSteps = authUser ? 7 : 8; // Skip sign-in step if already signed in
  const baseStep = authUser ? -1 : 0; // If signed in, start from step 1

  const currentStep = authUser ? step + 1 : step;

  const progress = Math.round((currentStep / totalSteps) * 100);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 3 - photos.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setPhotos((prev) => [...prev, url].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleComplete = () => {
    // Save collected profile data
    const updates: Record<string, unknown> = {};
    if (name) updates.fullName = name;
    if (age) updates.age = parseInt(age);
    if (gender) updates.gender = gender;
    if (interestedIn.length) updates.interestedIn = interestedIn;
    if (intention) updates.intent = intention;
    if (photos.length) {
      updates.photos = photos.map((url, i) => ({
        id: `photo-${i}`,
        url,
        isPrimary: i === 0,
        order: i,
      }));
    }
    updateProfile(updates as Parameters<typeof updateProfile>[0]);
    onComplete();
  };

  // ── Step Renderer ──────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9000,
    background: "linear-gradient(160deg, #0D0520 0%, #1A0B2E 60%, #2D0A3E 100%)",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "0 0 32px",
    overflowY: "auto",
  };

  const inner: React.CSSProperties = {
    width: "100%", maxWidth: "420px",
    padding: "24px 24px 8px",
    display: "flex", flexDirection: "column", gap: "0",
    flex: 1,
  };

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "14px 16px",
    borderRadius: "14px",
    border: `2px solid ${active ? "#FF6B8A" : "rgba(255,255,255,0.1)"}`,
    background: active ? "rgba(255,107,138,0.12)" : "rgba(255,255,255,0.04)",
    cursor: "pointer",
    display: "flex", alignItems: "center", gap: "12px",
    transition: "all 0.2s",
    color: "#FFF8F0",
    marginBottom: "10px",
    textAlign: "left" as const,
    width: "100%",
  });

  const stepTitle = (t: string, sub: string) => (
    <div style={{ marginBottom: "28px" }}>
      <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#FFF8F0", margin: "0 0 8px", lineHeight: 1.2 }}>{t}</h1>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>{sub}</p>
    </div>
  );

  const nextBtn = (label: string, onClick: () => void, disabled = false) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", padding: "16px", borderRadius: "16px", border: "none",
        background: disabled ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #FF6B8A, #FF8C42)",
        color: disabled ? "rgba(255,255,255,0.3)" : "#fff",
        fontSize: "16px", fontWeight: 700, cursor: disabled ? "default" : "pointer",
        marginTop: "auto", marginBottom: "0",
        transition: "all 0.2s",
        boxShadow: disabled ? "none" : "0 4px 20px rgba(255,107,138,0.35)",
      }}
    >
      {label}
    </button>
  );

  const skipBtn = (onClick: () => void) => (
    <button onClick={onClick} style={{
      background: "none", border: "none", color: "rgba(255,255,255,0.35)",
      fontSize: "13px", cursor: "pointer", marginTop: "12px", textDecoration: "underline",
    }}>
      Skip for now
    </button>
  );

  // ── STEP 0: Google Sign-in (only if not signed in) ─────────────────────────
  const renderStep0 = () => (
    <div style={inner}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "0" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "52px", marginBottom: "12px" }}>✦</div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#FFF8F0", margin: "0 0 10px" }}>Welcome to Rada</h1>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>
            Kenya&apos;s intentional dating platform.<br />Know the intention before you catch feelings.
          </p>
        </div>
        <GoogleAuthButton
          label="Continue with Google"
          onSuccess={() => setStep(1)}
          variant="primary"
        />
        <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: "16px", lineHeight: 1.6 }}>
          Google keeps you signed in automatically. No repeated logins.
        </p>
      </div>
    </div>
  );

  // ── STEP 1: Your Name ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div style={{ ...inner, gap: "0" }}>
      {stepTitle("What's your name?", "This is how you'll appear on Rada")}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your first name"
        autoFocus
        style={{
          width: "100%", padding: "16px 18px",
          background: "rgba(255,255,255,0.06)",
          border: "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: "14px", color: "#FFF8F0",
          fontSize: "18px", fontWeight: 500, outline: "none",
          boxSizing: "border-box",
        }}
      />
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "10px" }}>Only your first name is shown publicly.</p>
      <div style={{ flex: 1 }} />
      {nextBtn("Continue →", () => setStep(2), !name.trim())}
    </div>
  );

  // ── STEP 2: Your Age ───────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div style={{ ...inner, gap: "0" }}>
      {stepTitle("How old are you?", "Your age is shown on your profile")}
      <input
        type="number"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        placeholder="e.g. 27"
        min="18" max="60"
        autoFocus
        style={{
          width: "100%", padding: "16px 18px",
          background: "rgba(255,255,255,0.06)",
          border: "1.5px solid rgba(255,255,255,0.15)",
          borderRadius: "14px", color: "#FFF8F0",
          fontSize: "28px", fontWeight: 700, outline: "none",
          textAlign: "center", boxSizing: "border-box",
        }}
      />
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "10px", textAlign: "center" }}>You must be 18+ to use Rada.</p>
      <div style={{ flex: 1 }} />
      {nextBtn("Continue →", () => setStep(3), !age || parseInt(age) < 18)}
    </div>
  );

  // ── STEP 3: Your Gender ────────────────────────────────────────────────────
  const renderStep3 = () => (
    <div style={{ ...inner, gap: "0" }}>
      {stepTitle("I identify as...", "Helps us show your profile to the right people")}
      <div>
        {GENDERS.map((g) => (
          <button key={g.id} style={pill(gender === g.id)} onClick={() => setGender(g.id)}>
            <span style={{ fontSize: "28px" }}>{g.emoji}</span>
            <span style={{ fontSize: "17px", fontWeight: 600 }}>{g.label}</span>
            {gender === g.id && <span style={{ marginLeft: "auto", color: "#FF6B8A" }}>✓</span>}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {nextBtn("Continue →", () => setStep(4), !gender)}
      {skipBtn(() => setStep(4))}
    </div>
  );

  // ── STEP 4: Interested In ──────────────────────────────────────────────────
  const renderStep4 = () => (
    <div style={{ ...inner, gap: "0" }}>
      {stepTitle("I'm interested in...", "We'll filter your matches accordingly")}
      <div>
        {INTERESTED_IN.map((g) => {
          const selected = interestedIn.includes(g.id);
          return (
            <button
              key={g.id}
              style={pill(selected)}
              onClick={() => {
                setInterestedIn((prev) =>
                  selected ? prev.filter((x) => x !== g.id) : [...prev, g.id]
                );
              }}
            >
              <span style={{ fontSize: "28px" }}>{g.emoji}</span>
              <span style={{ fontSize: "17px", fontWeight: 600 }}>{g.label}</span>
              {selected && <span style={{ marginLeft: "auto", color: "#FF6B8A" }}>✓</span>}
            </button>
          );
        })}
      </div>
      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>You can select more than one.</p>
      <div style={{ flex: 1 }} />
      {nextBtn("Continue →", () => setStep(5), interestedIn.length === 0)}
      {skipBtn(() => setStep(5))}
    </div>
  );

  // ── STEP 5: Intention ──────────────────────────────────────────────────────
  const renderStep5 = () => (
    <div style={{ ...inner, gap: "0" }}>
      {stepTitle("Why are you here?", "Be honest — this is how we match you")}
      <div>
        {INTENTIONS.map((i) => (
          <button key={i.id} style={pill(intention === i.id)} onClick={() => setIntention(i.id)}>
            <span style={{ fontSize: "26px" }}>{i.emoji}</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>{i.label}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{i.desc}</div>
            </div>
            {intention === i.id && <span style={{ marginLeft: "auto", color: "#FF6B8A" }}>✓</span>}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {nextBtn("Continue →", () => setStep(6), !intention)}
    </div>
  );

  // ── STEP 6: Photos ─────────────────────────────────────────────────────────
  const renderStep6 = () => (
    <div style={{ ...inner, gap: "0" }}>
      {stepTitle("Add your photos", "Add up to 3 photos — first impressions matter")}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
        {[0, 1, 2].map((i) => (
          <label key={i} style={{
            aspectRatio: "3/4", borderRadius: "14px",
            border: `2px dashed ${photos[i] ? "#FF6B8A" : "rgba(255,255,255,0.15)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: photos[i] ? "default" : "pointer",
            overflow: "hidden", position: "relative",
            background: photos[i] ? "transparent" : "rgba(255,255,255,0.03)",
          }}>
            {photos[i] ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[i]} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button
                  onClick={(e) => { e.preventDefault(); setPhotos((prev) => prev.filter((_, idx) => idx !== i)); }}
                  style={{
                    position: "absolute", top: "4px", right: "4px",
                    background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
                    borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "12px",
                  }}
                >✕</button>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.35)" }}>
                <div style={{ fontSize: "24px" }}>+</div>
                <div style={{ fontSize: "10px", marginTop: "4px" }}>Photo {i + 1}</div>
              </div>
            )}
            {!photos[i] && (
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
            )}
          </label>
        ))}
      </div>
      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginBottom: "0" }}>
        {photos.length === 0 ? "Profiles with photos get 8× more matches." : `${photos.length}/3 photo${photos.length > 1 ? "s" : ""} added.`}
      </p>
      <div style={{ flex: 1 }} />
      {nextBtn(photos.length > 0 ? "Continue →" : "Skip for now →", () => setStep(7))}
    </div>
  );

  // ── STEP 7: Location ───────────────────────────────────────────────────────
  const renderStep7 = () => (
    <div style={{ ...inner, gap: "0" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "20px" }}>📍</div>
        {stepTitle("Enable location?", "We'll show you people nearby across Kenya")}
        <div style={{
          background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)",
          borderRadius: "14px", padding: "16px", marginBottom: "24px", textAlign: "left",
        }}>
          {[
            "Match with singles in your neighbourhood",
            "Location is only stored at ~1km precision for privacy",
            "You can turn this off anytime in Discover",
          ].map((t) => (
            <div key={t} style={{ display: "flex", gap: "10px", marginBottom: "10px", fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>
              <span style={{ color: "#34D399", flexShrink: 0 }}>✓</span>{t}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => { toggleLocation(); setLocationAsked(true); setTimeout(handleComplete, 500); }}
        style={{
          width: "100%", padding: "16px", borderRadius: "16px", border: "none",
          background: "linear-gradient(135deg, #34D399, #059669)",
          color: "#fff", fontSize: "16px", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(52,211,153,0.35)", marginBottom: "12px",
        }}
      >
        📍 Enable Nearby Matches
      </button>
      <button
        onClick={handleComplete}
        style={{
          width: "100%", padding: "14px", borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)",
          fontSize: "14px", fontWeight: 600, cursor: "pointer",
        }}
      >
        Not now — skip location
      </button>
    </div>
  );

  const steps = authUser
    ? [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7]
    : [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6, renderStep7];

  const renderContent = steps[step] || steps[steps.length - 1];

  return (
    <div style={card}>
      {/* Progress bar */}
      {step > 0 && (
        <div style={{ width: "100%", maxWidth: "420px", padding: "20px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {step > (authUser ? 1 : 1) && (
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "20px", padding: 0 }}
              >
                ←
              </button>
            )}
            <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #FF6B8A, #FF8C42)", borderRadius: "2px", transition: "width 0.4s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>
      )}

      {/* Rada logo on welcome */}
      {step === 0 && !authUser && (
        <div style={{ padding: "40px 24px 0" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "28px", fontWeight: 800, color: "#FFF8F0", letterSpacing: "-0.5px" }}>✦ Rada</span>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
};

export default OnboardingFlow;
