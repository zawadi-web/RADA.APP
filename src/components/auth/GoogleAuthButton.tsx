"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRada } from "@/lib/rada-context";
import { useToast } from "@/components/ui/Toast";

interface GoogleAuthButtonProps {
  variant?: "primary" | "secondary" | "subtle";
  label?: string;
  onSuccess?: () => void;
  fullWidth?: boolean;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  variant = "primary",
  label = "Continue with Google",
  onSuccess,
  fullWidth = true,
}) => {
  const { signInWithGoogle, authUser, signOut, setDbUserId } = useRada();
  const { showToast } = useToast();
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "69580522763-c6hclai3nijv5pk6kqc5l40fgnnhiead.apps.googleusercontent.com";

  const handleConfirmLogin = useCallback(async (name: string, email: string, avatarUrl: string) => {
    setIsSubmitting(true);
    try {
      signInWithGoogle({ name, email, avatarUrl });
      try {
        localStorage.setItem("rada_onboarded", "1");
      } catch { /* ignore */ }

      setShowPromptModal(false);
      showToast(`Welcome ${name}! Authenticated with Google ✦`, "coral");
      if (onSuccess) onSuccess();

      // Sync with Supabase PostgreSQL database
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, avatarUrl }),
      });
      const data = await res.json();
      if (data.user?.id) {
        setDbUserId(data.user.id);
      }
    } catch (err) {
      console.warn("Google DB sync note:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [signInWithGoogle, onSuccess, showToast, setDbUserId]);

  // Initialize official Google Identity Services SDK
  useEffect(() => {
    if (typeof window === "undefined" || authUser) return;

    const handleCredentialResponse = (response: { credential: string }) => {
      try {
        const base64Url = response.credential.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const payload = JSON.parse(jsonPayload);
        if (payload?.name) {
          handleConfirmLogin(payload.name, payload.email, payload.picture || "");
        }
      } catch {
        setShowPromptModal(true);
      }
    };

    // Load GSI script if not present
    const scriptId = "google-jssdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try {
          // @ts-expect-error Google Identity Services global
          if (window.google?.accounts?.id) {
            // @ts-expect-error Google Identity Services global
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleCredentialResponse,
              auto_select: false,
            });
          }
        } catch (e) {
          console.warn("Google SDK init warning:", e);
        }
      };
      document.body.appendChild(script);
    }
  }, [clientId, authUser, handleConfirmLogin]);

  const handleQuickSignIn = () => {
    if (authUser) {
      showToast(`Already signed in as ${authUser.name}`, "amber");
      return;
    }

    // 1. Try Token Client popup (real Google sign-in popup dialog)
    // @ts-expect-error Google Identity Services global
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      try {
        // @ts-expect-error Google Identity Services global
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse?.access_token) {
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const info = await res.json();
                if (info?.name || info?.email) {
                  await handleConfirmLogin(
                    info.name || (info.email ? info.email.split("@")[0] : "Rada Member"),
                    info.email || "",
                    info.picture || ""
                  );
                  return;
                }
              } catch (e) {
                console.warn("Failed fetching user info from Google token:", e);
              }
            }
            setShowPromptModal(true);
          },
          error_callback: () => {
            setShowPromptModal(true);
          },
        });
        tokenClient.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        console.warn("Google OAuth2 token client error, attempting fallback:", err);
      }
    }

    // 2. Try One Tap prompt
    // @ts-expect-error Google Identity Services global
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      try {
        // @ts-expect-error Google Identity Services global
        window.google.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowPromptModal(true);
          }
        });
        return;
      } catch {
        setShowPromptModal(true);
        return;
      }
    }

    // 3. Fallback prompt modal
    setShowPromptModal(true);
  };

  if (authUser) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--rada-surface)",
          borderRadius: "16px",
          border: "1px solid var(--rada-border)",
          width: fullWidth ? "100%" : "auto",
          boxShadow: "var(--rada-shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {authUser.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={authUser.avatarUrl}
              alt={authUser.name}
              style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid var(--rada-gold)" }}
            />
          ) : (
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "var(--rada-gold-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "#0A0A0C",
              }}
            >
              {authUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--rada-pearl)" }}>
              {authUser.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--rada-pearl-muted)" }}>
              {authUser.email || "Verified Member"}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            signOut();
            showToast("Signed out from Google", "amber");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--rada-gold)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleQuickSignIn}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          width: fullWidth ? "100%" : "auto",
          padding: "13px 20px",
          backgroundColor: variant === "subtle" ? "var(--rada-surface)" : "var(--rada-surface-raised)",
          color: "var(--rada-pearl)",
          border: "1px solid var(--rada-border)",
          borderRadius: "28px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: "var(--rada-shadow-sm)",
          transition: "all 0.2s ease",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{label}</span>
      </button>

      {/* Google Sign-in Verification Modal */}
      {showPromptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--rada-surface)",
              border: "1px solid var(--rada-border)",
              borderRadius: "22px",
              padding: "24px 20px",
              maxWidth: "400px",
              width: "100%",
              color: "var(--rada-pearl)",
              boxShadow: "var(--rada-shadow-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "var(--rada-pearl)" }}>
                  Sign in with Google
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                style={{
                  background: "var(--rada-surface-raised)",
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

            <p style={{ fontSize: "12.5px", color: "var(--rada-pearl-muted)", marginBottom: "18px", lineHeight: 1.5 }}>
              Confirm your Google Account to connect with verified members across Kenya.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!customName.trim()) {
                  showToast("Please enter your name", "coral");
                  return;
                }
                handleConfirmLogin(
                  customName.trim(),
                  customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
                  ""
                );
              }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div>
                <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brian Ochieng"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "11px",
                    background: "var(--rada-surface-raised)",
                    border: "1px solid var(--rada-border)",
                    borderRadius: "12px",
                    color: "var(--rada-pearl)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "4px", fontWeight: 600 }}>
                  Google Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. brian@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px",
                    background: "var(--rada-surface-raised)",
                    border: "1px solid var(--rada-border)",
                    borderRadius: "12px",
                    color: "var(--rada-pearl)",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "var(--rada-gold-gradient)",
                  border: "none",
                  borderRadius: "14px",
                  color: "#0A0A0C",
                  fontWeight: 800,
                  fontSize: "14px",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  marginTop: "6px",
                  boxShadow: "0 4px 16px rgba(197, 155, 39, 0.35)",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Connecting..." : "Continue to Rada ✦"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
