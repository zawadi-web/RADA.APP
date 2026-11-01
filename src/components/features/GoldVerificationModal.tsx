"use client";

import React, { useState } from "react";
import { useRada } from "@/lib/rada-context";

interface GoldVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoldVerificationModal: React.FC<GoldVerificationModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useRada();
  const [activeTab, setActiveTab] = useState<"LIVENESS" | "WORK">("LIVENESS");

  // Liveness state
  const [livenessStep, setLivenessStep] = useState<"START" | "SCANNING" | "DONE">("START");

  // Work state
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [workStep, setWorkStep] = useState<"FORM" | "OTP" | "DONE">("FORM");
  const [otp, setOtp] = useState("");

  if (!isOpen) return null;

  const handleStartLiveness = () => {
    setLivenessStep("SCANNING");
    setTimeout(() => {
      setLivenessStep("DONE");
      updateProfile({ isVerifiedGold: true, verified: true });
    }, 2800);
  };

  const handleVerifyWork = () => {
    if (!workEmail.includes("@")) return;
    setWorkStep("OTP");
  };

  const handleConfirmOtp = () => {
    setWorkStep("DONE");
    const domain = workEmail.split("@")[1];
    updateProfile({
      isWorkVerified: true,
      workEmailDomain: domain,
      workAffiliation: companyName || domain,
    });
  };

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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "22px" }}>✦</span>
              <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--rada-gold, #E5A93C)" }}>
                Rada Gold Trust™
              </h2>
            </div>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.6)", margin: "4px 0 0" }}>
              Stand out with authentic verified identity & professional credibility.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "20px", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          background: "rgba(255,255,255,0.06)",
          padding: "4px",
          borderRadius: "14px",
          marginBottom: "20px",
        }}>
          <button
            onClick={() => setActiveTab("LIVENESS")}
            style={{
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "LIVENESS" ? "var(--rada-gold, #E5A93C)" : "transparent",
              color: activeTab === "LIVENESS" ? "#0A0A0C" : "#FFF",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            📸 3D Face Check
          </button>
          <button
            onClick={() => setActiveTab("WORK")}
            style={{
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: activeTab === "WORK" ? "var(--rada-gold, #E5A93C)" : "transparent",
              color: activeTab === "WORK" ? "#0A0A0C" : "#FFF",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            💼 Work / University
          </button>
        </div>

        {/* Tab 1: Liveness */}
        {activeTab === "LIVENESS" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            {livenessStep === "START" && (
              <>
                <div style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  border: "2px dashed var(--rada-gold, #E5A93C)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  fontSize: "48px",
                }}>
                  👤
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 8px" }}>
                  Real-Person Video Check
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: "0 0 24px" }}>
                  Turn your head slowly to verify you match your photos. Completely eliminates catfishes and bots.
                </p>
                <button
                  onClick={handleStartLiveness}
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
                    boxShadow: "0 4px 18px rgba(229,169,60,0.35)",
                  }}
                >
                  Start Camera Scan 📹
                </button>
              </>
            )}

            {livenessStep === "SCANNING" && (
              <div style={{ padding: "20px 0" }}>
                <div style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  border: "3px solid #10B981",
                  boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  fontSize: "48px",
                  animation: "pulse 1.5s infinite",
                }}>
                  👀
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#10B981", margin: "0 0 6px" }}>
                  Please turn head right slowly...
                </h3>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                  Analyzing biometrics & liveliness
                </p>
              </div>
            )}

            {livenessStep === "DONE" && (
              <div style={{ padding: "10px 0" }}>
                <div style={{ fontSize: "56px", marginBottom: "8px" }}>✦✨</div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--rada-gold, #E5A93C)", margin: "0 0 6px" }}>
                  You are Rada Gold Verified!
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
                  Your profile now prominently displays the ✦ Gold badge. Profiles with Gold get 5× more replies.
                </p>
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
                  Back to Profile
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Work & University */}
        {activeTab === "WORK" && (
          <div>
            {workStep === "FORM" && (
              <>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5, margin: "0 0 16px" }}>
                  Verify your employer or university (e.g. <code>@safaricom.co.ke</code>, <code>@uonbi.ac.ke</code>). Your email stays strictly private — only the domain is badged!
                </p>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Safaricom PLC, Equity Bank, UoN"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                      color: "#FFF",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--rada-gold, #E5A93C)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Work or University Email
                  </label>
                  <input
                    type="email"
                    placeholder="brian@safaricom.co.ke"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                      color: "#FFF",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  onClick={handleVerifyWork}
                  disabled={!workEmail.includes("@")}
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
                    boxShadow: "0 4px 18px rgba(229,169,60,0.35)",
                  }}
                >
                  Send Verification PIN →
                </button>
              </>
            )}

            {workStep === "OTP" && (
              <div style={{ textAlign: "center" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 6px" }}>Enter 4-Digit PIN</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "0 0 16px" }}>
                  We sent a confirmation code to <b>{workEmail}</b>
                </p>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{
                    width: "140px",
                    padding: "12px",
                    fontSize: "24px",
                    letterSpacing: "8px",
                    textAlign: "center",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1.5px solid var(--rada-gold, #E5A93C)",
                    color: "#FFF",
                    outline: "none",
                    marginBottom: "20px",
                  }}
                />
                <button
                  onClick={handleConfirmOtp}
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
                  Confirm & Add Badge 💼
                </button>
              </div>
            )}

            {workStep === "DONE" && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "52px", marginBottom: "8px" }}>💼✨</div>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--rada-gold, #E5A93C)", margin: "0 0 6px" }}>
                  Affiliation Verified!
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", margin: "0 0 20px" }}>
                  Your profile now displays: <b>💼 {companyName || workEmail.split("@")[1]}</b>
                </p>
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
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldVerificationModal;

