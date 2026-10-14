"use client";

/**
 * AppClientShell — FULLY SELF-CONTAINED
 *
 * CRITICAL: This file imports ZERO external client components.
 * Every component rendered here is defined inline in this file.
 *
 * Solution: inline everything so there is no cross-module lazy resolution.
 * Only context providers (RadaProvider, ToastProvider, ThemeProvider) are imported
 * because they are pure JS with no JSX rendering issues.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RadaProvider, useRada } from "@/lib/rada-context";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { HmrErrorBoundary } from "./HmrErrorBoundary";

// ── FLOATING THEME TOGGLE ────────────────────────────────────────────────────
function FloatingThemeToggle() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        position: "fixed",
        top: "14px",
        right: "16px",
        zIndex: 950,
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "var(--rada-surface-glass)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid var(--rada-border-teal)",
        color: "var(--rada-gold)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "var(--rada-shadow-md)",
        cursor: "pointer",
        transition: "all 0.25s ease",
      }}
    >
      {theme === "dark" ? (
        /* Sun icon when in dark mode */
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        /* Moon icon when in light mode */
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ── 1. BOTTOM NAV (inline) ───────────────────────────────────────────────────
function BottomNavInner() {
  const pathname = usePathname();
  if (pathname === "/onboarding" || pathname === "/login" || pathname === "/terms") return null;
  const { unreadMessagesCount, newLikesCount } = useRada();

  const nav = [
    {
      label: "Discover", href: "/discover",
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      label: "Radar & Chats", href: "/matches",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      label: "Likes", href: "/likes",
      badge: newLikesCount > 0 ? newLikesCount : undefined,
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Profile", href: "/profile",
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav aria-label="Main Navigation" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
      display: "flex", justifyContent: "center",
      background: "var(--rada-surface-glass)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderTop: "1px solid var(--rada-border)",
      transition: "background 0.25s ease, border-color 0.25s ease",
    }}>
      <div style={{
        width: "100%", maxWidth: "480px",
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        padding: "8px 12px 14px",
      }}>
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: "4px",
                color: isActive ? "var(--rada-gold)" : "var(--rada-pearl-muted)",
                textDecoration: "none",
                fontSize: "0.6875rem", fontWeight: 600,
                minHeight: "44px", padding: "4px 0",
                transition: "color 0.2s",
                position: "relative",
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transform: isActive ? "translateY(-2px)" : "none", transition: "transform 0.2s" }}>
                {item.icon(isActive)}
                {item.badge && item.badge > 0 && (
                  <span aria-label={`${item.badge} notifications`} style={{
                    position: "absolute", top: "-4px", right: "-8px",
                    background: "var(--rada-gold)", color: "#0A0A0C",
                    fontSize: "0.625rem", fontWeight: 800,
                    minWidth: "16px", height: "16px",
                    borderRadius: "8px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    padding: "0 4px", boxShadow: "0 2px 8px var(--rada-gold-subtle)",
                  }}>{item.badge}</span>
                )}
              </div>
              <span style={{ lineHeight: 1.1 }}>{item.label}</span>
              {isActive && (
                <span aria-hidden="true" style={{
                  width: "18px", height: "2px", borderRadius: "1px",
                  background: "var(--rada-gold)", position: "absolute", bottom: 0,
                  boxShadow: "0 0 8px var(--rada-gold-subtle)",
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── 2. MATCH CELEBRATION MODAL (inline) ──────────────────────────────────────
function MatchCelebrationInner() {
  const { matchedUserModal, closeMatchModal, currentUser, matches, sendMessage } = useRada();
  const router = useRouter();

  if (!matchedUserModal) return null;

  const match = matches.find((m) => m.matchedWith.id === matchedUserModal.id);
  const firstName = matchedUserModal.fullName.split(" ")[0];

  const handleGoToChat = () => {
    if (match) {
      sendMessage(match.conversationId, `Hello ${firstName}! 👋`);
    }
    closeMatchModal();
    router.push("/matches");
  };

  const s = {
    overlay: { position: "fixed" as const, inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", animation: "fadeIn 0.25s ease-out" },
    backdrop: { position: "absolute" as const, inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" },
    card: {
      position: "relative" as const, zIndex: 1001, width: "100%", maxWidth: "360px",
      background: "var(--rada-surface-raised)", border: "1px solid var(--rada-border-teal)",
      borderRadius: "24px", padding: "28px 20px", textAlign: "center" as const,
      boxShadow: "var(--rada-shadow-lg)",
    },
    avatarRing: { width: "80px", height: "80px", borderRadius: "50%", border: "3px solid var(--rada-gold)", overflow: "hidden" as const, boxShadow: "0 0 20px var(--rada-gold-subtle)" },
  };

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.backdrop} onClick={closeMatchModal} />
      <div style={s.card}>
        <div style={{ display: "inline-block", padding: "4px 12px", background: "var(--rada-gold-subtle)", border: "1px solid var(--rada-border-teal)", color: "var(--rada-gold)", borderRadius: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>
          ✦ RADAR ALIGNED
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--rada-pearl)", margin: "0 0 6px" }}>You&apos;re on each other&apos;s orbit!</h2>
        <p style={{ fontSize: "14px", color: "var(--rada-pearl-muted)", marginBottom: "24px" }}>
          You and <span style={{ color: "var(--rada-gold)", fontWeight: 700 }}>{firstName}</span> both chose intentionally.
        </p>

        {/* Avatars */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={s.avatarRing}>
              {currentUser.photos[0]
                ? <img src={currentUser.photos[0].url} alt={currentUser.fullName} width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: 80, height: 80, background: "var(--rada-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#0A0A0C" }}>{currentUser.fullName[0]}</div>
              }
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--rada-pearl-muted)" }}>You</span>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--rada-gold-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "#0A0A0C", boxShadow: "0 4px 16px var(--rada-gold-subtle)" }}>✦</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={s.avatarRing}>
              {matchedUserModal.photos[0]
                ? <img src={matchedUserModal.photos[0].url} alt={firstName} width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: 80, height: 80, background: "var(--rada-gold)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#0A0A0C" }}>{firstName[0]}</div>
              }
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--rada-pearl-muted)" }}>{firstName}</span>
          </div>
        </div>

        {/* Momentum timer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "var(--rada-gold-subtle)", border: "1px solid var(--rada-border-teal)", borderRadius: "10px", padding: "10px 12px", fontSize: "12px", color: "var(--rada-gold)", marginBottom: "20px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span>48 hours to start the conversation before orbit decays.</span>
        </div>

        {/* Greeting preview */}
        <div style={{ background: "rgba(128,128,128,0.06)", border: "1px solid var(--rada-border)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "var(--rada-pearl-muted)", marginBottom: "14px", textAlign: "left" }}>
          <span style={{ fontSize: "11px", color: "var(--rada-pearl-dim)", display: "block", marginBottom: "4px" }}>Opening message:</span>
          <span style={{ fontStyle: "italic", color: "var(--rada-pearl)" }}>&ldquo;Hello {firstName}! 👋&rdquo;</span>
        </div>

        <button onClick={handleGoToChat} style={{
          width: "100%", padding: "13px", borderRadius: "12px", border: "none",
          background: "var(--rada-gold-gradient)", color: "#0A0A0C",
          fontWeight: 800, fontSize: "14px", cursor: "pointer",
          boxShadow: "0 4px 20px var(--rada-gold-subtle)", marginBottom: "10px",
        }}>
          Start Chatting with {firstName} 💬
        </button>
        <button onClick={closeMatchModal} style={{ background: "none", border: "none", color: "var(--rada-pearl-muted)", fontSize: "13px", cursor: "pointer", padding: "6px" }}>Keep exploring</button>
      </div>
    </div>
  );
}

// ── 3. VIP CHECKOUT MODAL (inline) ───────────────────────────────────────────
type PlanType = "WEEKLY" | "MONTHLY";

function VipCheckoutInner() {
  const { isVipModalOpen, closeVipModal, upgradeToVip } = useRada();
  const [plan, setPlan] = useState<PlanType>("WEEKLY");
  const [phone, setPhone] = useState("0712345678");
  const [showStk, setShowStk] = useState(false);
  const [pin, setPin] = useState("");
  const [processing, setProcessing] = useState(false);
  const [smsTxt, setSmsTxt] = useState<string | null>(null);

  if (!isVipModalOpen) return null;

  const amount = plan === "WEEKLY" ? 250 : 750;

  const handlePay = () => { setShowStk(true); setPin(""); };

  const confirmPin = () => {
    if (pin.length < 4) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setShowStk(false);
      const code = "OA" + Math.floor(10000000 + Math.random() * 90000000).toString().slice(0, 8);
      const t = new Date();
      setSmsTxt(`${code} Confirmed. KES ${amount}.00 sent to RADA DATING LTD (Till 894021) on ${t.toLocaleDateString()} at ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Cost KES 0.00.`);
      upgradeToVip();
      setTimeout(() => { setSmsTxt(null); closeVipModal(); }, 3500);
    }, 1200);
  };

  const kp: React.CSSProperties = { padding: "14px", borderRadius: "10px", background: "rgba(128,128,128,0.1)", border: "1px solid var(--rada-border)", color: "var(--rada-pearl)", fontSize: "18px", fontWeight: 600, cursor: "pointer" };

  return (
    <>
      {smsTxt && (
        <div style={{ position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)", background: "#00a651", color: "#fff", borderRadius: "12px", padding: "12px 18px", zIndex: 10200, maxWidth: "340px", fontSize: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>💬 SAFARICOM M-PESA</div>
          <p style={{ margin: 0 }}>{smsTxt}</p>
        </div>
      )}

      {showStk && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }}>
          <div style={{ background: "var(--rada-surface-raised)", borderRadius: "16px", border: "1px solid var(--rada-border-teal)", padding: "24px 20px", width: "300px", textAlign: "center", color: "var(--rada-pearl)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#00a651", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff" }}>S</div>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>M-PESA EXPRESS</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--rada-pearl-muted)", marginBottom: "16px" }}>Pay <strong>KES {amount}.00</strong> to <strong>RADA DATING LTD</strong> (Till 894021)?<br />Enter M-PESA PIN:</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "8px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: "16px", height: "16px", borderRadius: "50%", background: pin.length > i ? "#00a651" : "rgba(128,128,128,0.2)", border: "2px solid rgba(128,128,128,0.3)" }} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", margin: "16px 0" }}>
              {["1","2","3","4","5","6","7","8","9"].map((n) => <button key={n} style={kp} onClick={() => pin.length < 4 && setPin(p => p + n)} disabled={processing}>{n}</button>)}
              <button style={{ ...kp, fontSize: "11px", color: "#10B981" }} onClick={() => setPin("1234")}>1234</button>
              <button style={kp} onClick={() => pin.length < 4 && setPin(p => p + "0")} disabled={processing}>0</button>
              <button style={kp} onClick={() => setPin(p => p.slice(0, -1))} disabled={processing}>⌫</button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(128,128,128,0.1)", border: "1px solid var(--rada-border)", color: "var(--rada-pearl-muted)", cursor: "pointer" }} onClick={() => setShowStk(false)} disabled={processing}>Cancel</button>
              <button style={{ flex: 1, padding: "12px", borderRadius: "10px", background: pin.length < 4 ? "#777" : "#00a651", border: "none", color: "#fff", fontWeight: 700, cursor: pin.length < 4 ? "default" : "pointer" }} onClick={confirmPin} disabled={pin.length < 4 || processing}>{processing ? "Processing..." : "Send"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} role="dialog" aria-modal="true">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }} onClick={closeVipModal} />
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "480px", background: "var(--rada-surface-raised)", borderRadius: "24px 24px 0 0", border: "1px solid var(--rada-border-teal)", borderBottom: "none", padding: "24px 20px 36px", maxHeight: "92vh", overflowY: "auto", color: "var(--rada-pearl)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ background: "var(--rada-gold-gradient)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 800, color: "#0A0A0C" }}>✦ RADA VIP</div>
            <button onClick={closeVipModal} style={{ background: "transparent", border: "none", color: "var(--rada-pearl-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--rada-pearl)", margin: "0 0 6px" }}>Dating with Clarity &amp; Velocity</h2>
          <p style={{ fontSize: "13px", color: "var(--rada-pearl-muted)", margin: "0 0 20px" }}>Transparent pricing. No automated card traps or hidden subscriptions.</p>

          {[{ icon: "👁️", t: "See Who Liked You Upfront", d: "Skip the deck and connect immediately." }, { icon: "⚡", t: "5 Weekly Super Sparks", d: "Jump to the top of their radar." }, { icon: "🛡️", t: "Incognito Mode & Radar Boost", d: "3x profile engagement." }].map(f => (
            <div key={f.t} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--rada-pearl)" }}>{f.t}</div>
                <div style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", marginTop: "2px" }}>{f.d}</div>
              </div>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "20px 0" }}>
            {(["WEEKLY", "MONTHLY"] as const).map((p) => (
              <div key={p} onClick={() => setPlan(p)} style={{ borderRadius: "14px", padding: "14px 12px", textAlign: "center", cursor: "pointer", background: plan === p ? "var(--rada-gold-subtle)" : "rgba(128,128,128,0.06)", border: `2px solid ${plan === p ? "var(--rada-gold)" : "var(--rada-border)"}`, transition: "all 0.2s" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: plan === p ? "var(--rada-gold)" : "var(--rada-pearl-muted)", marginBottom: "4px" }}>{p === "WEEKLY" ? "FLEXIBLE" : "BEST VALUE"}</div>
                <div style={{ fontSize: "13px", color: "var(--rada-pearl-muted)", marginBottom: "4px" }}>{p === "WEEKLY" ? "1 Week" : "1 Month"}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--rada-pearl)" }}>KES {p === "WEEKLY" ? 250 : 750}</div>
                <div style={{ fontSize: "11px", color: "var(--rada-pearl-muted)", marginTop: "2px" }}>{p === "WEEKLY" ? "KES 35/day" : "Save 25%"}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "6px" }}>Safaricom M-Pesa Number</label>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(128,128,128,0.08)", border: "1px solid var(--rada-border-teal)", borderRadius: "10px", overflow: "hidden" }}>
              <span style={{ padding: "12px", fontSize: "13px", color: "var(--rada-gold)", borderRight: "1px solid var(--rada-border)", flexShrink: 0 }}>🇰🇪 +254</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="712345678" style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "var(--rada-pearl)", fontSize: "14px", outline: "none" }} />
            </div>
          </div>

          <button onClick={handlePay} style={{ width: "100%", padding: "15px", borderRadius: "14px", border: "none", background: "var(--rada-gold-gradient)", color: "#0A0A0C", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px var(--rada-gold-subtle)" }}>
            Pay KES {amount} via M-Pesa Express ✦
          </button>
          <p style={{ fontSize: "11px", color: "var(--rada-pearl-dim)", textAlign: "center", marginTop: "12px" }}>🔒 100% Secure via Safaricom Daraja. No recurring automatic debits.</p>
        </div>
      </div>
    </>
  );
}

// ── 3.5. COIN PURCHASE MODAL (inline) ────────────────────────────────────────
type CoinPackId = "SPARK_50" | "CUPID_200" | "ROYAL_500";

const COIN_PACKS: { id: CoinPackId; title: string; coins: number; priceKsh: number; tag?: string; desc: string }[] = [
  { id: "SPARK_50", title: "Spark Pack", coins: 50, priceKsh: 150, desc: "Unlock 5 chats or 3 direct super sparks" },
  { id: "CUPID_200", title: "Cupid Pack", coins: 200, priceKsh: 450, tag: "POPULAR", desc: "Unlock 20 chats + 4 momentum boosts" },
  { id: "ROYAL_500", title: "Royal Rada", coins: 500, priceKsh: 950, tag: "BEST VALUE", desc: "50 chat unlocks + VIP radar spotlight" },
];

function CoinPurchaseModalInner() {
  const { isCoinModalOpen, closeCoinModal, purchaseCoins, coins } = useRada();
  const [selectedPack, setSelectedPack] = useState<CoinPackId>("CUPID_200");
  const [phone, setPhone] = useState("0712345678");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isCoinModalOpen) return null;

  const currentPack = COIN_PACKS.find((p) => p.id === selectedPack) || COIN_PACKS[1];

  const handleBuy = async () => {
    setIsProcessing(true);
    setStatusMsg("Sending M-Pesa prompt to " + phone + "...");
    try {
      const res = await purchaseCoins(selectedPack, phone);
      if (res.success) {
        setStatusMsg(`✓ Received ${currentPack.coins} Coins! New Balance: ${res.balance} Coins`);
        setTimeout(() => {
          setStatusMsg(null);
          setIsProcessing(false);
          closeCoinModal();
        }, 1800);
      } else {
        setStatusMsg(`Error: ${res.error || "Payment failed"}`);
        setIsProcessing(false);
      }
    } catch {
      setStatusMsg("Payment process interrupted. Please retry.");
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10500, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} role="dialog" aria-modal="true">
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)" }} onClick={closeCoinModal} />
      <div style={{
        position: "relative", zIndex: 10501, width: "100%", maxWidth: "380px",
        background: "var(--rada-surface-raised)",
        border: "1px solid var(--rada-border-teal)",
        borderRadius: "24px", padding: "26px 20px",
        boxShadow: "var(--rada-shadow-lg)",
        color: "var(--rada-pearl)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "12px", background: "var(--rada-gold-subtle)", border: "1px solid var(--rada-border-teal)", color: "var(--rada-gold)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>
              <span>🪙 RADA TREASURY</span>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "var(--rada-pearl)", letterSpacing: "-0.01em" }}>Acquire Coins</h3>
          </div>
          <button onClick={closeCoinModal} style={{ background: "rgba(128,128,128,0.1)", border: "none", color: "var(--rada-pearl-muted)", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "var(--rada-pearl-muted)", margin: "0 0 16px", lineHeight: 1.4 }}>
          Current balance: <strong style={{ color: "var(--rada-gold)" }}>{coins} Coins</strong>. Use coins for match chat unlock (10 coins) and direct super sparks (15 coins).
        </p>

        {/* Package Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
          {COIN_PACKS.map((pack) => {
            const isSelected = selectedPack === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPack(pack.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px", borderRadius: "14px", cursor: "pointer",
                  background: isSelected ? "var(--rada-gold-subtle)" : "rgba(128,128,128,0.05)",
                  border: isSelected ? "1.5px solid var(--rada-gold)" : "1px solid var(--rada-border)",
                  transition: "all 0.18s ease",
                  boxShadow: isSelected ? "0 4px 16px var(--rada-gold-subtle)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "var(--rada-pearl)" : "var(--rada-pearl-muted)" }}>{pack.title}</span>
                    {pack.tag && (
                      <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px", background: "var(--rada-gold)", color: "#0A0A0C" }}>{pack.tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--rada-pearl-dim)", marginTop: "2px" }}>{pack.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--rada-gold)" }}>{pack.coins} 🪙</div>
                  <div style={{ fontSize: "11px", color: "var(--rada-pearl-muted)" }}>KES {pack.priceKsh}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safaricom Phone Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", display: "block", marginBottom: "6px" }}>M-Pesa Express Phone Number</label>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(128,128,128,0.08)", border: "1px solid var(--rada-border-teal)", borderRadius: "12px", overflow: "hidden" }}>
            <span style={{ padding: "10px 12px", fontSize: "13px", color: "var(--rada-gold)", borderRight: "1px solid var(--rada-border)", flexShrink: 0 }}>🇰🇪 +254</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="712345678" style={{ flex: 1, padding: "10px", background: "transparent", border: "none", color: "var(--rada-pearl)", fontSize: "14px", outline: "none" }} />
          </div>
        </div>

        {statusMsg && (
          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "var(--rada-gold-subtle)", border: "1px solid var(--rada-border-teal)", color: "var(--rada-gold)", fontSize: "12px", textAlign: "center", marginBottom: "14px" }}>
            {statusMsg}
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={isProcessing}
          style={{
            width: "100%", padding: "14px", borderRadius: "14px", border: "none",
            background: "var(--rada-gold-gradient)",
            color: "#0A0A0C", fontWeight: 800, fontSize: "14px", cursor: isProcessing ? "not-allowed" : "pointer",
            boxShadow: "0 6px 24px var(--rada-gold-subtle)", letterSpacing: "0.02em",
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {isProcessing ? "Processing M-Pesa..." : `Pay KES ${currentPack.priceKsh} via M-Pesa ✦`}
        </button>

        <p style={{ fontSize: "10px", color: "var(--rada-pearl-dim)", textAlign: "center", marginTop: "10px" }}>
          🔒 Instant Safaricom Daraja STK Push. Virtual currency non-refundable as per Terms.
        </p>
      </div>
    </div>
  );
}

// ── 4. AUTH & ONBOARDING GATE ────────────────────────────────────────────────
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isHydrated } = useRada();
  const [ready, setReady] = useState(false);

  const isPublicRoute = pathname === "/onboarding" || pathname === "/login" || pathname === "/terms";

  useEffect(() => {
    if (!isHydrated) return;
    try {
      const done = localStorage.getItem("rada_onboarded");
      const hasValidUser = currentUser?.fullName && (!currentUser.id?.startsWith("user-me") || currentUser.photos?.length > 0);
      if (!done && !hasValidUser && !isPublicRoute) {
        router.replace("/login");
        return;
      }
    } catch { /* ignore */ }
    setReady(true);
  }, [pathname, router, isHydrated, currentUser, isPublicRoute]);

  if (isPublicRoute) return <>{children}</>;
  if (!ready && !isHydrated) return <div style={{ minHeight: "100vh", background: "var(--rada-bg)" }} />;
  return <>{children}</>;
}

// ── 5. APP SHELL ─────────────────────────────────────────────────────────────
export const AppClientShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isNoNavPage = pathname === "/onboarding" || pathname === "/login" || pathname === "/terms";

  return (
    <ThemeProvider>
      <ToastProvider>
        <RadaProvider>
          <HmrErrorBoundary>
            <OnboardingGate>
              <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: isNoNavPage ? "0" : "72px" }}>
                {children}
              </div>
              <FloatingThemeToggle />
              <BottomNavInner />
              <MatchCelebrationInner />
              <VipCheckoutInner />
              <CoinPurchaseModalInner />
            </OnboardingGate>
          </HmrErrorBoundary>
        </RadaProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default AppClientShell;
