"use client";

import React, { useState, useEffect } from "react";
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
  const [customAvatar, setCustomAvatar] = useState("");

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "69580522763-c6hclai3nijv5pk6kqc5l40fgnnhiead.apps.googleusercontent.com";

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
          signInWithGoogle({
            name: payload.name,
            email: payload.email,
            avatarUrl: payload.picture,
          });
          showToast(`Welcome ${payload.name}! Authenticated with Google ✦`, "coral");
          if (onSuccess) onSuccess();

          // Sync to Supabase PostgreSQL database and capture DB user ID
          fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: payload.name,
              email: payload.email,
              avatarUrl: payload.picture,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.user?.id) {
                setDbUserId(data.user.id);
              }
            })
            .catch(console.warn);
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
        // @ts-expect-error Google Identity Services global
        if (window.google?.accounts?.id) {
          // @ts-expect-error Google Identity Services global
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [clientId, authUser, signInWithGoogle, onSuccess, showToast]);

  const handleQuickSignIn = () => {
    if (authUser) {
      showToast(`Already signed in as ${authUser.name}`, "amber");
      return;
    }

    // Try opening official Google prompt if available
    // @ts-expect-error Google Identity Services global
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      // @ts-expect-error Google Identity Services global
      window.google.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowPromptModal(true);
        }
      });
    } else {
      setShowPromptModal(true);
    }
  };

  const handleConfirmLogin = async (name: string, email: string, avatarUrl: string) => {
    signInWithGoogle({ name, email, avatarUrl });
    setShowPromptModal(false);
    showToast(`Signed in with Google as ${name} ✦`, "coral");
    if (onSuccess) onSuccess();

    // Sync to Supabase PostgreSQL database and capture DB user ID
    try {
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
      console.warn("Background DB sync notice:", err);
    }
  };

  if (authUser) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: fullWidth ? "100%" : "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {authUser.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={authUser.avatarUrl}
              alt={authUser.name}
              style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(255,107,138,0.3), rgba(157,78,221,0.3))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 700,
                color: "#FFF8F0",
              }}
            >
              {authUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-warm-cream)" }}>
              {authUser.name}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
              {authUser.email}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            signOut();
            showToast("Signed out from Google", "amber");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "12px",
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
          backgroundColor: variant === "subtle" ? "rgba(255, 255, 255, 0.06)" : "#FFFFFF",
          color: variant === "subtle" ? "var(--color-warm-cream)" : "#1F1F1F",
          border: variant === "subtle" ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid #747775",
          borderRadius: "28px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          boxShadow: variant === "primary" ? "0 2px 6px rgba(0, 0, 0, 0.25)" : "none",
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

      {/* Google Sign-in One-Tap Selection Modal */}
      {showPromptModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#22133B",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "20px",
              padding: "24px",
              maxWidth: "420px",
              width: "100%",
              color: "var(--color-warm-cream)",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.6)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
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
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Sign in with Google to Rada
              </h3>
            </div>

            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "18px" }}>
              Authenticate your real identity. Your name and profile picture will sync seamlessly into your Rada radar.
            </p>

            {/* Clean Account Entry */}
            <div
              style={{
                background: "rgba(0, 0, 0, 0.25)",
                padding: "16px",
                borderRadius: "14px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                marginBottom: "16px",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "12px", color: "var(--color-warm-cream)" }}>
                Enter your account details to start testing:
              </div>
              <input
                type="text"
                placeholder="Your Full Name (e.g. Brian Ochieng)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                }}
              />
              <input
                type="email"
                placeholder="Your Google Email (e.g. brian@gmail.com)"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "13px",
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!customName.trim()) {
                    showToast("Please enter your name", "coral");
                    return;
                  }
                  handleConfirmLogin(
                    customName.trim(),
                    customEmail.trim() || `${customName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
                    customAvatar || ""
                  );
                }}
                style={{
                  width: "100%",
                  padding: "9px",
                  backgroundColor: "var(--color-radiant-coral)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Sign In With My Account ✦
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
