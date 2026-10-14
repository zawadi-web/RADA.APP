"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRada } from "@/lib/rada-context";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";

export default function LoginPage() {
  const router = useRouter();
  const { signInWithEmailPassword, registerWithEmailPassword } = useRada();

  const [activeTab, setActiveTab] = useState<"signin" | "register">("signin");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register Form State
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regGender, setRegGender] = useState<"MAN" | "WOMAN">("MAN");
  const [regIntent, setRegIntent] = useState<"INTENTIONAL_DATING" | "SERIOUS_RELATIONSHIP" | "MARRIAGE">("INTENTIONAL_DATING");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [devDemoCode, setDevDemoCode] = useState<string | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const res = await signInWithEmailPassword(loginEmail, loginPassword);
      if (res.success) {
        setSuccessMessage("Welcome back! Entering your orbit...");
        setTimeout(() => router.push("/discover"), 600);
      } else {
        setErrorMessage(res.error || "Invalid email or password.");
      }
    } catch {
      setErrorMessage("Network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptedTerms) {
      setErrorMessage("Please accept the Terms of Service & Privacy Policy to continue.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithEmailPassword({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        gender: regGender,
        intent: regIntent,
        county: "Tharaka-Nithi",
        area: "Chuka",
      });

      if (res.success) {
        setSuccessMessage("Profile created! Setting up your discovery preferences...");
        setTimeout(() => router.push("/onboarding"), 800);
      } else {
        setErrorMessage(res.error || "Unable to create account.");
      }
    } catch {
      setErrorMessage("Registration failed due to network error.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Step 1: Request OTP
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setForgotLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Failed to send reset code.");
      } else {
        setForgotSuccess(data.message || "Reset code generated.");
        if (data.devCode) {
          setDevDemoCode(data.devCode);
          setResetCode(data.devCode);
        }
        setForgotStep(2);
      }
    } catch {
      setForgotError("Failed to connect to authentication service.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Step 2: Confirm OTP & Set New Password
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          code: resetCode,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setForgotError(data.error || "Unable to reset password.");
      } else {
        setForgotSuccess("Password reset successfully! Redirecting...");
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotStep(1);
          signInWithEmailPassword(forgotEmail, newPassword).then((r) => {
            if (r.success) router.push("/discover");
          });
        }, 1200);
      }
    } catch {
      setForgotError("Password reset failed. Please retry.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--rada-bg)",
      color: "var(--rada-pearl)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px 16px",
      position: "relative",
    }}>
      {/* Brand Header identical to Discover */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginBottom: "24px",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ color: "var(--rada-gold)", fontSize: "24px" }}>✦</span>
          <span style={{
            fontFamily: "var(--font-heading, 'Plus Jakarta Sans')",
            fontSize: "28px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--rada-pearl)",
          }}>
            Rada
          </span>
        </div>
        <p style={{
          fontSize: "13px",
          color: "var(--rada-pearl-muted)",
          margin: 0,
          fontWeight: 400,
        }}>
          Know the intention before you catch feelings.
        </p>
      </div>

      {/* Main Card Container matching Discover Profile Card */}
      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "var(--rada-surface)",
        border: "1px solid var(--rada-border)",
        borderRadius: "24px",
        padding: "28px 22px",
        boxShadow: "var(--rada-shadow-lg)",
      }}>
        {/* Modern Segmented Tab Switcher */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px",
          background: "var(--rada-surface-raised)",
          borderRadius: "14px",
          padding: "4px",
          marginBottom: "22px",
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab("signin"); setErrorMessage(null); }}
            style={{
              padding: "10px",
              borderRadius: "11px",
              fontSize: "13px",
              fontWeight: 700,
              background: activeTab === "signin" ? "var(--rada-surface)" : "transparent",
              color: activeTab === "signin" ? "var(--rada-pearl)" : "var(--rada-pearl-muted)",
              border: activeTab === "signin" ? "1px solid var(--rada-border-teal)" : "1px solid transparent",
              boxShadow: activeTab === "signin" ? "var(--rada-shadow-sm)" : "none",
              transition: "all 0.18s ease",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("register"); setErrorMessage(null); }}
            style={{
              padding: "10px",
              borderRadius: "11px",
              fontSize: "13px",
              fontWeight: 700,
              background: activeTab === "register" ? "var(--rada-surface)" : "transparent",
              color: activeTab === "register" ? "var(--rada-pearl)" : "var(--rada-pearl-muted)",
              border: activeTab === "register" ? "1px solid var(--rada-border-teal)" : "1px solid transparent",
              boxShadow: activeTab === "register" ? "var(--rada-shadow-sm)" : "none",
              transition: "all 0.18s ease",
              cursor: "pointer",
            }}
          >
            Create Account
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "12px",
            marginBottom: "16px",
            background: "rgba(248, 113, 113, 0.12)",
            border: "1px solid rgba(248, 113, 113, 0.35)",
            color: "#EF4444",
            fontSize: "12px",
            lineHeight: 1.4,
          }}>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "12px",
            marginBottom: "16px",
            background: "var(--rada-gold-subtle)",
            border: "1px solid var(--rada-border-teal)",
            color: "var(--rada-gold)",
            fontSize: "12px",
            lineHeight: 1.4,
          }}>
            {successMessage}
          </div>
        )}

        {/* SIGN IN FORM */}
        {activeTab === "signin" && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "6px" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
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
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)" }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotError(null);
                    setForgotSuccess(null);
                    setForgotStep(1);
                    setShowForgotModal(true);
                  }}
                  style={{
                    fontSize: "12px",
                    color: "var(--rada-gold)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                border: "none",
                background: "var(--rada-gold-gradient)",
                color: "#0A0A0C",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px var(--rada-gold-subtle)",
                marginTop: "4px",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
            <div>
              <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                Full Name
              </label>
              <input
                type="text"
                required
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Zawadi Mwangi"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  borderRadius: "12px",
                  background: "var(--rada-surface-raised)",
                  border: "1px solid var(--rada-border)",
                  color: "var(--rada-pearl)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                Email
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  borderRadius: "12px",
                  background: "var(--rada-surface-raised)",
                  border: "1px solid var(--rada-border)",
                  color: "var(--rada-pearl)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••••••"
                style={{
                  width: "100%",
                  padding: "11px 13px",
                  borderRadius: "12px",
                  background: "var(--rada-surface-raised)",
                  border: "1px solid var(--rada-border)",
                  color: "var(--rada-pearl)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                  I am a
                </label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--rada-surface-raised)",
                    border: "1px solid var(--rada-border)",
                    color: "var(--rada-pearl)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="MAN">Man</option>
                  <option value="WOMAN">Woman</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                  Intent
                </label>
                <select
                  value={regIntent}
                  onChange={(e) => setRegIntent(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "10px",
                    background: "var(--rada-surface-raised)",
                    border: "1px solid var(--rada-border)",
                    color: "var(--rada-pearl)",
                    fontSize: "13px",
                    outline: "none",
                  }}
                >
                  <option value="INTENTIONAL_DATING">Intentional Dating</option>
                  <option value="SERIOUS_RELATIONSHIP">Serious Relationship</option>
                  <option value="MARRIAGE">Marriage Minded</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", margin: "2px 0" }}>
              <input
                type="checkbox"
                id="termsCheck"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ marginTop: "3px", accentColor: "var(--rada-gold)" }}
              />
              <label htmlFor="termsCheck" style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", lineHeight: 1.4 }}>
                I agree to the <Link href="/terms" style={{ color: "var(--rada-gold)", textDecoration: "underline" }} target="_blank">Terms of Service &amp; Privacy Policy</Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "12px",
                border: "none",
                background: "var(--rada-gold-gradient)",
                color: "#0A0A0C",
                fontWeight: 800,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px var(--rada-gold-subtle)",
                marginTop: "4px",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--rada-border)" }} />
          <span style={{ fontSize: "11px", color: "var(--rada-pearl-dim)", letterSpacing: "0.05em" }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "var(--rada-border)" }} />
        </div>

        {/* Google OAuth Button */}
        <GoogleAuthButton
          onSuccess={() => {
            router.push("/discover");
          }}
          label="Continue with Google"
        />

        {/* Discreet Legal Footer */}
        <div style={{ marginTop: "20px", textAlign: "center", borderTop: "1px solid var(--rada-border)", paddingTop: "14px" }}>
          <p style={{ fontSize: "11px", color: "var(--rada-pearl-dim)", margin: "0 0 10px" }}>
            By continuing, you agree to Rada&apos;s{" "}
            <Link href="/terms" style={{ color: "var(--rada-gold)", textDecoration: "underline" }}>
              Terms of Service &amp; Privacy Policy
            </Link>.
          </p>
          <p style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", margin: 0 }}>
            New to Rada?{" "}
            <Link href="/onboarding" style={{ color: "var(--rada-gold)", fontWeight: 700, textDecoration: "none" }}>
              Take the Onboarding Tour →
            </Link>
          </p>
        </div>
      </div>

      {/* ── FORGOT PASSWORD MODAL ── */}
      {showForgotModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 10600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }} role="dialog" aria-modal="true">
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowForgotModal(false)}
          />
          <div style={{
            position: "relative",
            zIndex: 10601,
            width: "100%",
            maxWidth: "380px",
            background: "var(--rada-surface-raised)",
            border: "1px solid var(--rada-border)",
            borderRadius: "22px",
            padding: "24px 20px",
            boxShadow: "var(--rada-shadow-lg)",
            color: "var(--rada-pearl)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--rada-gold)", fontWeight: 700, letterSpacing: "0.08em" }}>
                  ✦ PASSWORD RECOVERY
                </span>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "2px 0 0", color: "var(--rada-pearl)" }}>
                  {forgotStep === 1 ? "Reset Password" : "Enter Verification Code"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: "var(--rada-surface)",
                  border: "1px solid var(--rada-border)",
                  color: "var(--rada-pearl-muted)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(248, 113, 113, 0.12)", border: "1px solid rgba(248, 113, 113, 0.35)", color: "#FCA5A5", fontSize: "12px", marginBottom: "12px" }}>
                {forgotError}
              </div>
            )}
            {forgotSuccess && (
              <div style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(197, 155, 39, 0.12)", border: "1px solid rgba(197, 155, 39, 0.35)", color: "var(--rada-gold)", fontSize: "12px", marginBottom: "12px" }}>
                {forgotSuccess}
              </div>
            )}

            {/* Step 1: Input Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestResetCode} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", margin: 0, lineHeight: 1.4 }}>
                  Enter your registered email address. We will send you a 6-digit verification code.
                </p>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "11px",
                      background: "var(--rada-surface)",
                      border: "1px solid var(--rada-border)",
                      color: "var(--rada-pearl)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "11px",
                    border: "none",
                    background: "var(--rada-gold-gradient)",
                    color: "#0A0A0C",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: forgotLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(197, 155, 39, 0.35)",
                    opacity: forgotLoading ? 0.7 : 1,
                  }}
                >
                  {forgotLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </form>
            )}

            {/* Step 2: Code + New Password */}
            {forgotStep === 2 && (
              <form onSubmit={handleConfirmResetPassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {devDemoCode && (
                  <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(197, 155, 39, 0.12)", border: "1px solid rgba(197, 155, 39, 0.25)", color: "var(--rada-gold)", fontSize: "11px", textAlign: "center" }}>
                    Verification Code: <strong>{devDemoCode}</strong>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "11px",
                      background: "var(--rada-surface)",
                      border: "1px solid var(--rada-border)",
                      color: "var(--rada-pearl)",
                      fontSize: "17px",
                      letterSpacing: "0.15em",
                      textAlign: "center",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: "100%",
                      padding: "11px",
                      borderRadius: "11px",
                      background: "var(--rada-surface)",
                      border: "1px solid var(--rada-border)",
                      color: "var(--rada-pearl)",
                      fontSize: "14px",
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "11px",
                    border: "none",
                    background: "var(--rada-gold-gradient)",
                    color: "#0A0A0C",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: forgotLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(197, 155, 39, 0.35)",
                    opacity: forgotLoading ? 0.7 : 1,
                  }}
                >
                  {forgotLoading ? "Verifying..." : "Update Password & Sign In"}
                </button>
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  style={{ background: "none", border: "none", color: "var(--rada-pearl-muted)", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                >
                  ← Back to Email Step
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
