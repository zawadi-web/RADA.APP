"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TermsAndPrivacyPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07020D",
        color: "#FFF8F0",
        padding: "24px 20px 100px",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
        lineHeight: 1.6,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "28px",
          paddingBottom: "16px",
          borderBottom: "1px solid rgba(212,175,55,0.2)",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#FFF8F0",
            padding: "8px 14px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: "#D4AF37", fontSize: "16px" }}>✦</span>
          <span style={{ fontWeight: 800, letterSpacing: "1px", fontSize: "16px", color: "#FFF8F0" }}>RADA LEGAL</span>
        </div>
        <div style={{ width: "60px" }} />
      </header>

      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(255,75,110,0.06))",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "28px",
          }}
        >
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "0 0 8px", color: "#D4AF37" }}>
            Terms of Service & Privacy Agreement
          </h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
            Governed under the Laws of Kenya, the Kenya Data Protection Act 2019, and the Computer Misuse and Cybercrimes Act. Last Updated: October 2026.
          </p>
        </div>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FF4B6E", marginBottom: "8px" }}>
            1. Acceptance of Terms & Confidentiality
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            By creating an account or accessing Rada, you explicitly confirm that you are at least 18 years of age and legally competent to enter into this binding agreement. Because members share personal details including photos, relationship intentions, and general county locations, all confidential and sensitive information is protected in accordance with the Kenya Data Protection Act. You agree never to scrape, screenshot, republish, or misuse member data outside the platform.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FF4B6E", marginBottom: "8px" }}>
            2. Strict Code of Conduct & Safety
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            Rada is exclusively for intentional, authentic romantic connection. You strictly agree NOT to:
          </p>
          <ul style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)", paddingLeft: "20px", margin: "8px 0" }}>
            <li>Impersonate another individual, upload photos that are not your own, or misrepresent your identity (zero tolerance for catfishing).</li>
            <li>Solicit commercial services, financial assistance, prostitution, or advertise commercial goods.</li>
            <li>Harass, stalk, intimidate, extort, or send unsolicited non-consensual explicit content.</li>
            <li>Engage in fraudulent schemes, money transfers, or deceptive requests.</li>
          </ul>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            Violation results in immediate permanent blacklisting without notice, and potential referral to the National Computer and Cybercrimes Coordination Committee (NC4) and law enforcement authorities.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FF4B6E", marginBottom: "8px" }}>
            3. Disclaimer of Liability & Offline Inconveniences
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            <strong>NO LIABILITY FOR MEMBER CONDUCT:</strong> Rada operates solely as a discovery and communication portal. Rada does not conduct criminal background checks or guarantee the character, health, or intentions of any user.
          </p>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            You are exclusively responsible for your interactions and decisions to communicate or meet other users in person. In no event shall Rada, its directors, employees, or partners be liable for any direct, indirect, emotional, physical, financial, or reputational damage, inconvenience, injury, or loss arising from your use of the platform or meetings arranged through it.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FF4B6E", marginBottom: "8px" }}>
            4. Rada Coins & Virtual Currency Policy
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            Rada Coins and VIP Subscriptions are licensed virtual goods created exclusively for unlocking conversations, super sparks, and platform features. Coins hold no monetary or real-world cash value, cannot be redeemed for legal tender, cannot be transferred between accounts, and are strictly non-refundable upon purchase via M-Pesa or card.
          </p>
        </section>

        <section style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#FF4B6E", marginBottom: "8px" }}>
            5. Location & Geolocation Privacy
          </h2>
          <p style={{ fontSize: "13px", color: "rgba(255,248,240,0.8)" }}>
            To safeguard member privacy and safety, Rada never displays exact GPS street addresses or live tracking to other members. All location displays are generalized to county and town centroids with distance fuzzing. You can disable location tracking or adjust your county manually anytime from your Profile.
          </p>
        </section>

        <div
          style={{
            textAlign: "center",
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Link
            href="/discover"
            style={{
              display: "inline-block",
              padding: "14px 32px",
              background: "linear-gradient(135deg, #D4AF37, #FF4B6E)",
              color: "#07020D",
              fontWeight: 800,
              fontSize: "14px",
              borderRadius: "14px",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
            }}
          >
            I Understand & Agree ✦
          </Link>
        </div>
      </div>
    </main>
  );
}
