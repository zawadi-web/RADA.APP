"use client";

import React from "react";
import { useRada } from "@/lib/rada-context";

interface GhostBusterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GhostBusterModal: React.FC<GhostBusterModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useRada();

  if (!isOpen) return null;

  const score = currentUser.responsivenessScore ?? 96;
  const badge = currentUser.responsivenessBadge ?? "FAST_RESPONDER";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "inherit",
    }}>
      <div style={{
        background: "var(--rada-bg, #0A0A0C)",
        border: "1.5px solid rgba(229, 169, 60, 0.4)",
        borderRadius: "24px",
        width: "100%",
        maxWidth: "440px",
        padding: "24px 22px",
        color: "var(--rada-pearl, #FFF8F0)",
        boxShadow: "0 10px 40px rgba(229, 169, 60, 0.2)",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "22px" }}>👻⚡</span>
              <h2 style={{ fontSize: "19px", fontWeight: 800, margin: 0, color: "var(--rada-pearl, #FFF8F0)" }}>
                &ldquo;Rada Gani?&rdquo; Intent Score
              </h2>
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
              Rada rewards responsive daters and eliminates ghosting.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "20px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Score Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(229, 169, 60, 0.15), rgba(0,0,0,0.4))",
          border: "1.5px solid var(--rada-gold, #E5A93C)",
          borderRadius: "18px",
          padding: "20px",
          textAlign: "center",
          marginBottom: "20px",
        }}>
          <div style={{ fontSize: "44px", fontWeight: 900, color: "var(--rada-gold, #E5A93C)", lineHeight: 1 }}>
            {score}<span style={{ fontSize: "20px", color: "rgba(255,255,255,0.6)" }}>/100</span>
          </div>
          <div style={{
            display: "inline-block",
            background: "rgba(229, 169, 60, 0.2)",
            color: "var(--rada-gold, #E5A93C)",
            padding: "4px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 800,
            marginTop: "8px",
          }}>
            ⚡ Fast Responder Status
          </div>
          <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.75)", marginTop: "10px", lineHeight: 1.4 }}>
            You reply within 2 hours of a match. Your profile is boosted to the top of the discovery deck across Kenya!
          </p>
        </div>

        {/* Rules */}
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          <div style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "12.5px",
          }}>
            <b style={{ color: "#34D399" }}>+ Boost:</b> Daters with score 90+ get 3× more profile impressions and priority in &ldquo;Rada On Air&rdquo;.
          </div>
          <div style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "12.5px",
          }}>
            <b style={{ color: "#F87171" }}>- Penalty:</b> Users who let 5+ matches expire consecutively get deprioritized in the deck for 7 days.
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #E5A93C, #C59B27)",
            border: "none",
            color: "#0A0A0C",
            fontWeight: 800,
            fontSize: "15px",
            cursor: "pointer",
          }}
        >
          Got it! Keep It High 👍
        </button>
      </div>
    </div>
  );
};

export default GhostBusterModal;

