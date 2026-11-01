"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRada } from "@/lib/rada-context";
import { Gender, IntentType } from "@/lib/types";

interface RadaOnAirModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AudioMatch {
  alias: string;
  age: number;
  county: string;
  area: string;
  intent: IntentType;
  prompt: string;
  voiceNoteTitle: string;
  avatarPlaceholder: string;
}

const TOPIC_PROMPTS = [
  "What's your most controversial Nairobi dating opinion?",
  "What is your absolute non-negotiable green flag in a relationship?",
  "Sunday morning in Karura or Swahili biryani in Mombasa?",
  "What does being 'intentional' mean to you in 2026?",
  "How do you usually handle conflict when you disagree with someone?",
];

const SAMPLE_MATCHES: AudioMatch[] = [
  {
    alias: "Nairobi Creative",
    age: 26,
    county: "Nairobi",
    area: "Kilimani",
    intent: "LONG_TERM",
    prompt: TOPIC_PROMPTS[0],
    voiceNoteTitle: "Art, good coffee, and quiet weekends",
    avatarPlaceholder: "🎨",
  },
  {
    alias: "Tech & Venture",
    age: 28,
    county: "Nairobi",
    area: "Westlands",
    intent: "MARRIAGE",
    prompt: TOPIC_PROMPTS[1],
    voiceNoteTitle: "Looking for an ambitious, grounded partner",
    avatarPlaceholder: "🚀",
  },
  {
    alias: "Karen Explorer",
    age: 27,
    county: "Nairobi",
    area: "Karen",
    intent: "INTENTIONAL_DATING",
    prompt: TOPIC_PROMPTS[2],
    voiceNoteTitle: "Sunset walks, live music, and deep conversations",
    avatarPlaceholder: "🌿",
  },
];

export const RadaOnAirModal: React.FC<RadaOnAirModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, likeCurrentCard, refreshMatches } = useRada();
  const [phase, setPhase] = useState<"CONNECTING" | "LIVE" | "DECISION" | "MATCHED">("CONNECTING");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<AudioMatch>(SAMPLE_MATCHES[0]);
  const [hasVotedYes, setHasVotedYes] = useState<boolean | null>(null);

  // Audio wave animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPhase("CONNECTING");
      setSecondsLeft(60);
      setHasVotedYes(null);
      return;
    }

    // Pick random candidate and prompt
    const randomMatch = SAMPLE_MATCHES[Math.floor(Math.random() * SAMPLE_MATCHES.length)];
    const randomPrompt = TOPIC_PROMPTS[Math.floor(Math.random() * TOPIC_PROMPTS.length)];
    setCurrentMatch({ ...randomMatch, prompt: randomPrompt });

    // Step 1: Connecting phase (2 seconds)
    const connectTimer = setTimeout(() => {
      setPhase("LIVE");
      setSecondsLeft(60);
    }, 2200);

    return () => clearTimeout(connectTimer);
  }, [isOpen]);

  // Timer loop during LIVE phase
  useEffect(() => {
    if (phase !== "LIVE") return;

    if (secondsLeft <= 0) {
      setPhase("DECISION");
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, secondsLeft]);

  // Waveform canvas animation
  useEffect(() => {
    if (phase !== "LIVE" && phase !== "CONNECTING") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let step = 0;
    const render = () => {
      step += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const bars = 32;
      const barWidth = width / bars - 3;

      for (let i = 0; i < bars; i++) {
        // Sine wave modulation
        const amp = Math.sin(step + i * 0.3) * 0.5 + 0.5;
        const barHeight = Math.max(6, amp * (height * 0.75));
        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#E5A93C");
        gradient.addColorStop(1, "#946F1E");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [phase]);

  const handleDecision = (connect: boolean) => {
    setHasVotedYes(connect);
    if (connect) {
      setTimeout(() => {
        setPhase("MATCHED");
        try {
          likeCurrentCard?.("✦ Connected via Rada On Air Speed Dating");
        } catch { /* ignore */ }
      }, 900);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "radial-gradient(circle at 50% 20%, #1c1409 0%, #0a0a0c 80%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "24px 20px 36px",
      color: "var(--rada-pearl, #FFF8F0)",
      fontFamily: "inherit",
    }}>
      {/* Top Header */}
      <div style={{ width: "100%", maxWidth: "440px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: "#EF4444",
            boxShadow: "0 0 10px #EF4444",
            display: "inline-block",
            animation: "pulse 1.5s infinite",
          }} />
          <span style={{ fontSize: "13px", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "#E5A93C" }}>
            RADA ON AIR • 8:00–9:30 PM
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            color: "#FFF",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            fontSize: "16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      {/* Center Content */}
      <div style={{ width: "100%", maxWidth: "440px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {phase === "CONNECTING" && (
          <div style={{ padding: "40px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px", filter: "drop-shadow(0 0 20px #E5A93C)" }}>🎙️</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Tuning In...</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", maxWidth: "300px", margin: "0 auto 24px" }}>
              Matching you with someone active right now who shares your intention.
            </p>
            <div style={{ width: "160px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", margin: "0 auto", overflow: "hidden" }}>
              <div style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, #E5A93C, #F3C766)",
                animation: "pulse 1s infinite alternate",
              }} />
            </div>
          </div>
        )}

        {phase === "LIVE" && (
          <>
            {/* Blind Avatar & Timer */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <div style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(229,169,60,0.2), rgba(0,0,0,0.5))",
                border: "2px solid #E5A93C",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "44px",
                boxShadow: "0 0 35px rgba(229,169,60,0.35)",
              }}>
                {currentMatch.avatarPlaceholder}
              </div>
              <div style={{
                position: "absolute",
                bottom: "-8px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#0A0A0C",
                border: "1.5px solid #E5A93C",
                padding: "3px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 800,
                color: "#E5A93C",
              }}>
                0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
              </div>
            </div>

            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "12px 0 4px" }}>
              {currentMatch.alias}, {currentMatch.age}
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>
              📍 {currentMatch.area}, {currentMatch.county} • Seeking {currentMatch.intent.replace("_", " ")}
            </p>

            {/* Conversation Topic Card */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(229,169,60,0.3)",
              borderRadius: "18px",
              padding: "16px 20px",
              marginBottom: "20px",
              width: "100%",
              boxSizing: "border-box",
            }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#E5A93C", textTransform: "uppercase", marginBottom: "6px" }}>
                🎙️ Blind Icebreaker Topic
              </div>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "#FFF8F0", lineHeight: 1.4, margin: 0 }}>
                &ldquo;{currentMatch.prompt}&rdquo;
              </p>
            </div>

            {/* Animated Waveform Canvas */}
            <canvas
              ref={canvasRef}
              width={360}
              height={55}
              style={{ width: "100%", height: "55px", marginBottom: "16px" }}
            />
          </>
        )}

        {phase === "DECISION" && (
          <div style={{ padding: "20px 0" }}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>⏱️</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Time&apos;s Up!</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "320px", margin: "0 auto 28px" }}>
              Did you feel the chemistry with <b>{currentMatch.alias}</b>? If both of you vote Connect, your photos and profiles will be revealed!
            </p>
            <div style={{ display: "flex", gap: "14px", width: "100%", maxWidth: "340px", margin: "0 auto" }}>
              <button
                onClick={() => handleDecision(false)}
                style={{
                  flex: 1,
                  padding: "16px",
                  borderRadius: "16px",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                }}
              >
                Pass 👋
              </button>
              <button
                onClick={() => handleDecision(true)}
                style={{
                  flex: 1.4,
                  padding: "16px",
                  borderRadius: "16px",
                  background: "linear-gradient(135deg, #E5A93C, #C59B27)",
                  border: "none",
                  color: "#0A0A0C",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(229,169,60,0.4)",
                }}
              >
                ✦ Reveal & Connect
              </button>
            </div>
          </div>
        )}

        {phase === "MATCHED" && (
          <div style={{ padding: "30px 0" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "#E5A93C", margin: "0 0 8px" }}>
              It&apos;s a Live Connection!
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.8)", maxWidth: "320px", margin: "0 auto 24px" }}>
              Both of you chose to reveal! <b>{currentMatch.alias}</b> is now added to your matches.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "16px 36px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, #E5A93C, #C59B27)",
                border: "none",
                color: "#0A0A0C",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(229,169,60,0.4)",
              }}
            >
              Open Match & Say Hi 💬
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {phase === "LIVE" && (
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            onClick={() => setIsMicMuted(!isMicMuted)}
            style={{
              padding: "12px 20px",
              borderRadius: "30px",
              background: isMicMuted ? "#EF4444" : "rgba(255,255,255,0.12)",
              border: "none",
              color: "#FFF",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isMicMuted ? "🔇 Mic Muted" : "🎙️ Mic Active"}
          </button>
          <button
            onClick={() => setPhase("DECISION")}
            style={{
              padding: "12px 20px",
              borderRadius: "30px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Skip Match
          </button>
        </div>
      )}

      {phase !== "LIVE" && <div style={{ height: "40px" }} />}
    </div>
  );
};

export default RadaOnAirModal;

