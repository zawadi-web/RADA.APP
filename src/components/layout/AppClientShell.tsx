"use client";

/**
 * AppClientShell — FULLY SELF-CONTAINED
 *
 * CRITICAL: This file imports ZERO external client components.
 * Every component rendered here is defined inline in this file.
 *
 * Why: In Next.js 16 webpack mode, any cross-module client component import
 * from a Server→Client boundary (layout.tsx → AppClientShell) goes through
 * an async lazy module resolver. During HMR that resolver briefly returns
 * `undefined`, causing React to throw "Element type is invalid. Received a
 * promise that resolves to: undefined."
 *
 * Solution: inline everything so there is no cross-module lazy resolution.
 * Only context providers (RadaProvider, ToastProvider) are imported because
 * they are pure JS with no JSX rendering issues.
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { RadaProvider, useRada } from "@/lib/rada-context";
import { ToastProvider } from "@/components/ui/Toast";
import { HmrErrorBoundary } from "./HmrErrorBoundary";

// ── 1. BOTTOM NAV (inline — was BottomNav.tsx) ──────────────────────────────
function BottomNavInner() {
  const pathname = usePathname();
  if (pathname === "/onboarding" || pathname === "/login" || pathname === "/terms") return null;
  const { unreadMessagesCount, newLikesCount } = useRada();

  const nav = [
    {
      label: "Discover", href: "/discover",
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="24" height="24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      label: "Radar & Chats", href: "/matches",
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="24" height="24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
    {
      label: "Likes", href: "/likes",
      badge: newLikesCount > 0 ? newLikesCount : undefined,
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="24" height="24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: "Profile", href: "/profile",
      icon: (a: boolean) => (
        <svg viewBox="0 0 24 24" width="24" height="24" fill={a ? "currentColor" : "none"} stroke="currentColor" strokeWidth={a ? 2 : 1.8} aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  return (
    <nav aria-label="Main Navigation" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
      display: "flex", justifyContent: "center",
      background: "rgba(8,13,20,0.96)",
      backdropFilter: "blur(20px) saturate(180%)",
      borderTop: "1px solid rgba(56,188,160,0.15)",
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
                color: isActive ? "#38BCA0" : "rgba(232,244,240,0.4)",
                textDecoration: "none",
                fontSize: "0.6875rem", fontWeight: 600,
                minHeight: "44px", padding: "4px 0",
                transition: "color 0.2s",
                position: "relative",
                filter: isActive ? "drop-shadow(0 0 8px rgba(56,188,160,0.5))" : "none",
              }}
            >
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", transform: isActive ? "translateY(-2px)" : "none", transition: "transform 0.2s" }}>
                {item.icon(isActive)}
                {item.badge && item.badge > 0 && (
                  <span aria-label={`${item.badge} notifications`} style={{
                    position: "absolute", top: "-4px", right: "-8px",
                    background: "#38BCA0", color: "#080D14",
                    fontSize: "0.625rem", fontWeight: 700,
                    minWidth: "16px", height: "16px",
                    borderRadius: "8px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    padding: "0 4px", boxShadow: "0 2px 8px rgba(56,188,160,0.4)",
                  }}>{item.badge}</span>
                )}
              </div>
              <span style={{ lineHeight: 1.1 }}>{item.label}</span>
              {isActive && (
                <span aria-hidden="true" style={{
                  width: "20px", height: "2px", borderRadius: "1px",
                  background: "#38BCA0", position: "absolute", bottom: 0,
                  boxShadow: "0 0 8px rgba(56,188,160,0.6)",
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
    backdrop: { position: "absolute" as const, inset: 0, background: "rgba(0,5,10,0.88)", backdropFilter: "blur(12px)" },
    card: {
      position: "relative" as const, zIndex: 1001, width: "100%", maxWidth: "360px",
      background: "linear-gradient(160deg,#0D1520,#111B26)", border: "1px solid rgba(56,188,160,0.3)",
      borderRadius: "24px", padding: "28px 20px", textAlign: "center" as const,
      boxShadow: "0 24px 48px rgba(0,0,0,0.7), 0 0 48px rgba(56,188,160,0.12)",
    },
    avatarRing: { width: "80px", height: "80px", borderRadius: "50%", border: "3px solid #38BCA0", overflow: "hidden" as const, boxShadow: "0 0 20px rgba(56,188,160,0.3)" },
  };

  return (
    <div style={s.overlay} role="dialog" aria-modal="true">
      <div style={s.backdrop} onClick={closeMatchModal} />
      <div style={s.card}>
        <div style={{ display: "inline-block", padding: "4px 12px", background: "rgba(56,188,160,0.12)", border: "1px solid rgba(56,188,160,0.35)", color: "#38BCA0", borderRadius: "20px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "12px" }}>
          ✦ RADAR ALIGNED
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#E8F4F0", margin: "0 0 6px" }}>You&apos;re on each other&apos;s orbit!</h2>
        <p style={{ fontSize: "14px", color: "rgba(232,244,240,0.55)", marginBottom: "24px" }}>
          You and <span style={{ color: "#38BCA0", fontWeight: 700 }}>{firstName}</span> both chose intentionally.
        </p>

        {/* Avatars */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={s.avatarRing}>
              {currentUser.photos[0]
                ? <img src={currentUser.photos[0].url} alt={currentUser.fullName} width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: 80, height: 80, background: "#38BCA0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#080D14" }}>{currentUser.fullName[0]}</div>
              }
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(232,244,240,0.5)" }}>You</span>
          </div>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#38BCA0,#2A9D8F)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 4px 16px rgba(56,188,160,0.4)" }}>✦</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={s.avatarRing}>
              {matchedUserModal.photos[0]
                ? <img src={matchedUserModal.photos[0].url} alt={firstName} width={80} height={80} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: 80, height: 80, background: "#2A9D8F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#080D14" }}>{firstName[0]}</div>
              }
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(232,244,240,0.5)" }}>{firstName}</span>
          </div>
        </div>

        {/* Momentum timer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(232,197,71,0.08)", border: "1px solid rgba(232,197,71,0.2)", borderRadius: "10px", padding: "10px 12px", fontSize: "12px", color: "#E8C547", marginBottom: "20px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          <span>48 hours to start the conversation before orbit decays.</span>
        </div>

        {/* Greeting preview */}
        <div style={{ background: "rgba(56,188,160,0.07)", border: "1px solid rgba(56,188,160,0.18)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "rgba(232,244,240,0.65)", marginBottom: "14px", textAlign: "left" }}>
          <span style={{ fontSize: "11px", color: "rgba(232,244,240,0.35)", display: "block", marginBottom: "4px" }}>Opening message:</span>
          <span style={{ fontStyle: "italic" }}>&ldquo;Hello {firstName}! 👋&rdquo;</span>
        </div>

        <button onClick={handleGoToChat} style={{
          width: "100%", padding: "13px", borderRadius: "12px", border: "none",
          background: "linear-gradient(135deg,#38BCA0,#2A9D8F)", color: "#080D14",
          fontWeight: 800, fontSize: "14px", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(56,188,160,0.4)", marginBottom: "10px",
        }}>
          Start Chatting with {firstName} 💬
        </button>
        <button onClick={closeMatchModal} style={{ background: "none", border: "none", color: "rgba(232,244,240,0.35)", fontSize: "13px", cursor: "pointer", padding: "6px" }}>Keep exploring</button>
      </div>
    </div>
  );
}

// ── 3. VIP CHECKOUT MODAL (inline — was VipCheckoutModal.tsx) ──────────────
// Paystack integration intentionally deferred — M-Pesa simulation for now.
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

  const kp: React.CSSProperties = { padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: "18px", fontWeight: 600, cursor: "pointer" };

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
          <div style={{ background: "#1A1A2E", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.15)", padding: "24px 20px", width: "300px", textAlign: "center", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#00a651", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>S</div>
              <span style={{ fontWeight: 700, fontSize: "14px" }}>M-PESA EXPRESS</span>
            </div>
            <p style={{ fontSize: "13px", color: "#ccc", marginBottom: "16px" }}>Pay <strong>KES {amount}.00</strong> to <strong>RADA DATING LTD</strong> (Till 894021)?<br />Enter M-PESA PIN:</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "8px" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: "16px", height: "16px", borderRadius: "50%", background: pin.length > i ? "#00a651" : "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)" }} />
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", margin: "16px 0" }}>
              {["1","2","3","4","5","6","7","8","9"].map((n) => <button key={n} style={kp} onClick={() => pin.length < 4 && setPin(p => p + n)} disabled={processing}>{n}</button>)}
              <button style={{ ...kp, fontSize: "11px", color: "#34D399" }} onClick={() => setPin("1234")}>1234</button>
              <button style={kp} onClick={() => pin.length < 4 && setPin(p => p + "0")} disabled={processing}>0</button>
              <button style={kp} onClick={() => setPin(p => p.slice(0, -1))} disabled={processing}>⌫</button>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#ccc", cursor: "pointer" }} onClick={() => setShowStk(false)} disabled={processing}>Cancel</button>
              <button style={{ flex: 1, padding: "12px", borderRadius: "10px", background: pin.length < 4 ? "#555" : "#00a651", border: "none", color: "#fff", fontWeight: 700, cursor: pin.length < 4 ? "default" : "pointer" }} onClick={confirmPin} disabled={pin.length < 4 || processing}>{processing ? "Processing..." : "Send"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} role="dialog" aria-modal="true">
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={closeVipModal} />
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "480px", background: "linear-gradient(160deg,#1A0B2E,#2D0A3E)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.12)", borderBottom: "none", padding: "24px 20px 36px", maxHeight: "92vh", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ background: "linear-gradient(135deg,#FF8C42,#FFD700)", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 800, color: "#1A0B2E" }}>✦ RADA VIP</div>
            <button onClick={closeVipModal} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "20px", cursor: "pointer" }}>✕</button>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#FFF8F0", margin: "0 0 6px" }}>Dating with Clarity &amp; Velocity</h2>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>Transparent pricing. No automated card traps or hidden subscriptions.</p>

          {[{ icon: "👁️", t: "See Who Liked You Upfront", d: "Skip the deck and connect immediately." }, { icon: "⚡", t: "5 Weekly Super Sparks", d: "Jump to the top of their radar." }, { icon: "🛡️", t: "Incognito Mode & Radar Boost", d: "3x profile engagement." }].map(f => (
            <div key={f.t} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
              <span style={{ fontSize: "22px", flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#FFF8F0" }}>{f.t}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>{f.d}</div>
              </div>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "20px 0" }}>
            {(["WEEKLY", "MONTHLY"] as const).map((p) => (
              <div key={p} onClick={() => setPlan(p)} style={{ borderRadius: "14px", padding: "14px 12px", textAlign: "center", cursor: "pointer", background: plan === p ? "rgba(255,140,66,0.15)" : "rgba(255,255,255,0.04)", border: `2px solid ${plan === p ? "#FF8C42" : "rgba(255,255,255,0.1)"}`, transition: "all 0.2s" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: plan === p ? "#FF8C42" : "#888", marginBottom: "4px" }}>{p === "WEEKLY" ? "FLEXIBLE" : "BEST VALUE"}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>{p === "WEEKLY" ? "1 Week" : "1 Month"}</div>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#FFF8F0" }}>KES {p === "WEEKLY" ? 250 : 750}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{p === "WEEKLY" ? "KES 35/day" : "Save 25%"}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "6px" }}>Safaricom M-Pesa Number</label>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", overflow: "hidden" }}>
              <span style={{ padding: "12px", fontSize: "13px", color: "#34D399", borderRight: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>🇰🇪 +254</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="712345678" style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "#fff", fontSize: "14px", outline: "none" }} />
            </div>
          </div>

          <button onClick={handlePay} style={{ width: "100%", padding: "15px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg,#00a651,#00c65e)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,166,81,0.35)" }}>
            Pay KES {amount} via M-Pesa Express ✦
          </button>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: "12px" }}>🔒 100% Secure via Safaricom Daraja. No recurring automatic debits.</p>
        </div>
      </div>
    </>
  );
}

// ── 3.5. COIN PURCHASE MODAL (inline) ──────────────────────────────────────
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
      <div style={{ position: "absolute", inset: 0, background: "rgba(5,2,10,0.88)", backdropFilter: "blur(14px)" }} onClick={closeCoinModal} />
      <div style={{
        position: "relative", zIndex: 10501, width: "100%", maxWidth: "380px",
        background: "linear-gradient(170deg, #120A1F 0%, #080310 100%)",
        border: "1px solid rgba(212, 175, 55, 0.35)",
        borderRadius: "24px", padding: "26px 20px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.8), 0 0 40px rgba(212, 175, 55, 0.15)",
        color: "#F8F4EB",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "12px", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>
              <span>🪙 RADA TREASURY</span>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: 800, margin: 0, color: "#FFF8EA", letterSpacing: "-0.01em" }}>Acquire Coins</h3>
          </div>
          <button onClick={closeCoinModal} style={{ background: "rgba(255,255,255,0.06)", border: "none", color: "#ccc", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <p style={{ fontSize: "13px", color: "rgba(248,244,235,0.65)", margin: "0 0 16px", lineHeight: 1.4 }}>
          Current balance: <strong style={{ color: "#D4AF37" }}>{coins} Coins</strong>. Use coins for unlimited match chat unlock (10 coins) and direct super sparks (15 coins).
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
                  background: isSelected ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.03)",
                  border: isSelected ? "1.5px solid #D4AF37" : "1px solid rgba(255,255,255,0.08)",
                  transition: "all 0.18s ease",
                  boxShadow: isSelected ? "0 4px 20px rgba(212,175,55,0.2)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#FFF9EA" : "#DDD" }}>{pack.title}</span>
                    {pack.tag && (
                      <span style={{ fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "6px", background: pack.tag === "BEST VALUE" ? "#D4AF37" : "#FF3366", color: "#000" }}>{pack.tag}</span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "rgba(248,244,235,0.5)", marginTop: "2px" }}>{pack.desc}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#D4AF37" }}>{pack.coins} 🪙</div>
                  <div style={{ fontSize: "11px", color: "rgba(248,244,235,0.7)" }}>KES {pack.priceKsh}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safaricom Phone Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "12px", color: "rgba(248,244,235,0.6)", display: "block", marginBottom: "6px" }}>M-Pesa Express Phone Number</label>
          <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: "12px", overflow: "hidden" }}>
            <span style={{ padding: "10px 12px", fontSize: "13px", color: "#34D399", borderRight: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>🇰🇪 +254</span>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="712345678" style={{ flex: 1, padding: "10px", background: "transparent", border: "none", color: "#FFF8EA", fontSize: "14px", outline: "none" }} />
          </div>
        </div>

        {statusMsg && (
          <div style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)", color: "#F7E39C", fontSize: "12px", textAlign: "center", marginBottom: "14px" }}>
            {statusMsg}
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={isProcessing}
          style={{
            width: "100%", padding: "14px", borderRadius: "14px", border: "none",
            background: "linear-gradient(135deg, #FBE8A6 0%, #D4AF37 50%, #A67C14 100%)",
            color: "#07020D", fontWeight: 800, fontSize: "14px", cursor: isProcessing ? "not-allowed" : "pointer",
            boxShadow: "0 6px 24px rgba(212,175,55,0.4)", letterSpacing: "0.02em",
            opacity: isProcessing ? 0.7 : 1,
          }}
        >
          {isProcessing ? "Processing M-Pesa..." : `Pay KES ${currentPack.priceKsh} via M-Pesa ✦`}
        </button>

        <p style={{ fontSize: "10px", color: "rgba(248,244,235,0.4)", textAlign: "center", marginTop: "10px" }}>
          🔒 Instant Safaricom Daraja STK Push. Virtual currency non-refundable as per Terms.
        </p>
      </div>
    </div>
  );
}

// ── 4. ONBOARDING GATE ────────────────────────────────────────────────────────
// Redirects new un-onboarded visitors to /onboarding
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
        router.replace("/onboarding");
        return;
      }
    } catch { /* ignore */ }
    setReady(true);
  }, [pathname, router, isHydrated, currentUser, isPublicRoute]);

  if (isPublicRoute) return <>{children}</>;
  if (!ready && !isHydrated) return <div style={{ minHeight: "100vh", background: "#0D0520" }} />;
  return <>{children}</>;
}

// ── 5. APP SHELL ──────────────────────────────────────────────────────────────
export const AppClientShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const isNoNavPage = pathname === "/onboarding" || pathname === "/login" || pathname === "/terms";

  return (
    <ToastProvider>
      <RadaProvider>
        <HmrErrorBoundary>
          <OnboardingGate>
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: isNoNavPage ? "0" : "72px" }}>
              {children}
            </div>
            <BottomNavInner />
            <MatchCelebrationInner />
            <VipCheckoutInner />
            <CoinPurchaseModalInner />
          </OnboardingGate>
        </HmrErrorBoundary>
      </RadaProvider>
    </ToastProvider>
  );
};

export default AppClientShell;
