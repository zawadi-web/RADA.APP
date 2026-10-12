"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRada } from "@/lib/rada-context";
import { IntentBadge } from "@/components/ui/IntentBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Message } from "@/lib/types";
import styles from "./page.module.css";

const REPORT_REASONS = [
  "Scammer / Soliciting Money (M-Pesa requests)",
  "Catfish / Fake Photos",
  "Disrespectful / Inappropriate Behavior",
  "Underage (Under 18)",
  "Not Dating Intentionally / Bot",
];

export default function MatchesPage() {
  const {
    matches,
    conversations,
    sendMessage,
    blockUser,
    dbUserId,
    setConversations,
    refreshMatches,
    coins,
    openCoinModal,
    canSendMessageInConversation,
    unlockConversationWithCoins,
    currentUser,
  } = useRada();
  const { showToast } = useToast();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMatch = matches.find((m) => m.conversationId === activeConvId);
  const activeMessages = activeConvId ? (conversations[activeConvId] || []) : [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  // Load live matches from DB on mount and auto-select the newest
  useEffect(() => {
    if (dbUserId) {
      refreshMatches().then(() => {
        // After refresh, the matches state will update via the context
        // The effect below will then auto-select
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUserId]);

  // Auto-select the first (newest) match whenever matches list changes and nothing is selected
  useEffect(() => {
    if (matches.length > 0 && !activeConvId) {
      setActiveConvId(matches[0].conversationId);
    }
  }, [matches, activeConvId]);

  // Poll for new messages every 5 seconds (near-real-time)
  const pollMessages = useCallback(async () => {
    if (!activeConvId || !dbUserId) return;
    const activeMatchData = matches.find((m) => m.conversationId === activeConvId);
    if (!activeMatchData) return;
    // Only poll if the conversationId looks like a real DB ID (not a mock conv-xxx)
    if (activeConvId.startsWith("conv-")) return;
    try {
      const res = await fetch(`/api/messages?matchId=${activeConvId}&userId=${dbUserId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        // Merge with existing to avoid losing optimistic updates
        setConversations((prev: Record<string, Message[]>) => ({
          ...prev,
          [activeConvId]: data.messages,
        }));
      }
    } catch {
      // Silently fail polls
    }
  }, [activeConvId, dbUserId, matches, setConversations]);

  useEffect(() => {
    pollMessages();
    const interval = setInterval(pollMessages, 5000);
    return () => clearInterval(interval);
  }, [pollMessages]);

  const chatGate = activeConvId ? canSendMessageInConversation(activeConvId) : { allowed: true, remainingFree: 5, requiresUnlock: false };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId || isSending) return;
    if (chatGate.requiresUnlock) {
      showToast("5 free messages used. Unlock unlimited chat with 10 coins 🪙", "neutral");
      return;
    }
    const text = inputText.trim();
    setInputText("");

    // Optimistic update (local)
    sendMessage(activeConvId, text);

    // Persist to DB if real match
    if (dbUserId && activeConvId && !activeConvId.startsWith("conv-")) {
      setIsSending(true);
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: activeConvId, senderId: dbUserId, content: text }),
        });
      } catch (err) {
        console.error("[MatchesPage] Send message error:", err);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleSendPromptChip = (chipText: string) => {
    if (!activeConvId) return;
    sendMessage(activeConvId, chipText);
  };

  const handleBlockActiveUser = () => {
    if (activeMatch) {
      blockUser(activeMatch.matchedWith.id);
      setActiveConvId(null);
      setShowSafetyMenu(false);
      showToast(`${activeMatch.matchedWith.fullName.split(" ")[0]} was blocked and removed from radar`, "neutral");
    }
  };

  const handleReportSubmit = () => {
    if (activeMatch) {
      blockUser(activeMatch.matchedWith.id);
      setIsReportOpen(false);
      setActiveConvId(null);
      setShowSafetyMenu(false);
      showToast(`Report filed for ${selectedReason}. User blocked. 🛡️`, "coral");
    }
  };

  return (
    <main className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Radar &amp; Chats</h1>
          <p className={styles.subtitle}>Intentional connections with 48h momentum</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={openCoinModal}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.35)",
              color: "#D4AF37", borderRadius: "16px", padding: "6px 12px",
              fontSize: "12px", fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 10px rgba(212, 175, 55, 0.2)",
            }}
          >
            <span>🪙 {coins} Coins</span>
            <span style={{ fontSize: "10px", padding: "1px 5px", background: "#D4AF37", color: "#07020D", borderRadius: "8px", fontWeight: 800 }}>+ BUY</span>
          </button>
          <div className={styles.activeCountBadge}>
            {matches.length} on radar
          </div>
        </div>
      </header>

      {/* 48h Momentum Radar Carousel */}
      {matches.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>⚡</span>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-warm-cream)", marginBottom: "8px" }}>
            No Matches Yet
          </h2>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", maxWidth: "320px", margin: "0 auto" }}>
            When you and another member connect on Rada, your 48-hour momentum radar conversation will appear here!
          </p>
        </div>
      ) : (
        <section className={styles.radarSection}>
          <span className={styles.sectionLabel}>ACTIVE RADAR CONNECTIONS</span>
          <div className={styles.radarScroll}>
            {matches.map((match) => {
              const isUrgent = match.momentumHoursRemaining < 24;
              const isSelected = match.conversationId === activeConvId;
              return (
                <button
                  key={match.id}
                  type="button"
                  className={`${styles.radarItem} ${isSelected ? styles.radarItemActive : ""}`}
                  onClick={() => setActiveConvId(match.conversationId)}
                >
                  <div className={`${styles.avatarRing} ${isUrgent ? styles.urgentRing : styles.freshRing}`}>
                    {match.matchedWith.photos[0]?.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={match.matchedWith.photos[0].url}
                        alt={match.matchedWith.fullName}
                        width={56}
                        height={56}
                        className={styles.avatarImg}
                        style={{ objectFit: "cover", borderRadius: "50%" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, rgba(255,107,138,0.3), rgba(157,78,221,0.3))",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#FFF8F0",
                        }}
                      >
                        {match.matchedWith.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`${styles.momentumBadge} ${isUrgent ? styles.urgentBadge : ""}`}>
                      {match.momentumHoursRemaining}h
                    </span>
                  </div>
                  <span className={styles.radarName}>{match.matchedWith.fullName.split(" ")[0]}</span>
                  <span className={styles.radarArea}>{match.matchedWith.area}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Conversation Container */}
      {matches.length > 0 && (
        <>
        {activeMatch ? (
          <section className={styles.chatSection}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <div className={styles.partnerInfo}>
              <div className={styles.chatAvatar}>
                {activeMatch.matchedWith.photos[0]?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeMatch.matchedWith.photos[0].url}
                    alt={activeMatch.matchedWith.fullName}
                    width={40}
                    height={40}
                    className={styles.avatarImg}
                    style={{ objectFit: "cover", borderRadius: "50%" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(255,107,138,0.3), rgba(157,78,221,0.3))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#FFF8F0",
                    }}
                  >
                    {activeMatch.matchedWith.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className={styles.nameBadgeRow}>
                  <strong className={styles.partnerName}>{activeMatch.matchedWith.fullName.split(" ")[0]}</strong>
                  <IntentBadge intent={activeMatch.matchedWith.intent} size="small" />
                </div>
                <span className={styles.partnerLocation}>
                  {activeMatch.matchedWith.area}, {activeMatch.matchedWith.county} • {activeMatch.matchedWith.occupation}
                </span>
              </div>
            </div>

            <div className={styles.headerActions}>
              <button
                className={styles.safetyBtn}
                onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                aria-label="Safety menu"
              >
                ⋮
              </button>
              {showSafetyMenu && (
                <div className={styles.safetyDropdown}>
                  <button onClick={handleBlockActiveUser} className={styles.blockBtn}>
                    Block {activeMatch.matchedWith.fullName.split(" ")[0]}
                  </button>
                  <button
                    onClick={() => {
                      setIsReportOpen(true);
                      setShowSafetyMenu(false);
                    }}
                    className={styles.reportBtn}
                  >
                    Report &amp; Block
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 48-Hour Momentum Strip */}
          <div className={styles.momentumStrip}>
            <span>⚡ <strong>{activeMatch.momentumHoursRemaining} hours left</strong> to keep this momentum active</span>
          </div>

          {/* Message Thread */}
          <div className={styles.messagesList}>
            {activeMessages.map((msg) => {
              if (msg.isSystem) {
                return (
                  <div key={msg.id} className={styles.systemMessage}>
                    <span>{msg.content}</span>
                  </div>
                );
              }

              const isMe = msg.senderId === "user-me" || (dbUserId ? msg.senderId === dbUserId : false);
              return (
                <div
                  key={msg.id}
                  className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowPartner}`}
                >
                  <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubblePartner}`}>
                    <p className={styles.msgText}>{msg.content}</p>
                    <span className={styles.msgTime}>
                      {typeof msg.createdAt === "string" && msg.createdAt.length > 20
                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : msg.createdAt}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Icebreaker Starter Chips */}
          <div className={styles.icebreakers}>
            <button
              className={styles.chip}
              onClick={() => handleSendPromptChip("What's your favorite coffee spot in Nairobi?")}
            >
              ☕ Coffee spot debate?
            </button>
            <button
              className={styles.chip}
              onClick={() => handleSendPromptChip("What made you choose this intention on Rada?")}
            >
              🎯 Why this intention?
            </button>
            <button
              className={styles.chip}
              onClick={() => handleSendPromptChip("Saturday Karura run or Sunday slow brunch?")}
            >
              🌳 Saturday vs Sunday vibe?
            </button>
          </div>

          {/* Coin Chat Economy Banner or Input Bar */}
          {chatGate.requiresUnlock ? (
            <div style={{
              margin: "12px 14px", padding: "18px 16px", borderRadius: "18px",
              background: "linear-gradient(135deg, rgba(212,175,55,0.14) 0%, rgba(21,12,36,0.9) 100%)",
              border: "1px solid rgba(212, 175, 55, 0.4)",
              textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>🔒 🪙</div>
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#FFF9EB", margin: "0 0 4px" }}>
                5 Free Messages Used
              </h4>
              <p style={{ fontSize: "12px", color: "rgba(248,244,235,0.7)", margin: "0 0 14px", lineHeight: 1.4 }}>
                To keep conversation quality high and prevent spam, unlock unlimited chat with {activeMatch.matchedWith.fullName.split(" ")[0]} for <strong>10 Coins</strong>.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={async () => {
                    if (coins < 10) {
                      openCoinModal();
                      showToast("You need 10 coins. Top up now to continue chatting!", "neutral");
                      return;
                    }
                    const res = await unlockConversationWithCoins(activeConvId!);
                    if (res.success) {
                      showToast("✦ Chat Unlocked! You now have unlimited messaging.", "success");
                    } else {
                      showToast(res.error || "Unlock failed", "coral");
                    }
                  }}
                  style={{
                    padding: "11px 18px", borderRadius: "12px", border: "none",
                    background: "linear-gradient(135deg, #FBE8A6 0%, #D4AF37 100%)",
                    color: "#07020D", fontWeight: 800, fontSize: "13px", cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(212,175,55,0.4)",
                  }}
                >
                  Unlock Unlimited Chat (10 Coins) ✦
                </button>
                <button
                  type="button"
                  onClick={openCoinModal}
                  style={{
                    padding: "11px 14px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                    color: "#FFF8EA", fontWeight: 600, fontSize: "12px", cursor: "pointer",
                  }}
                >
                  Get Coins
                </button>
              </div>
            </div>
          ) : (
            <>
              {chatGate.remainingFree < 5 && (
                <div style={{
                  padding: "4px 16px", margin: "0 8px 6px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  fontSize: "11px", color: "#D4AF37",
                  background: "rgba(212,175,55,0.08)", borderRadius: "8px",
                  border: "1px solid rgba(212,175,55,0.2)",
                }}>
                  <span>💬 {chatGate.remainingFree} of 5 free messages remaining</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (coins < 10) { openCoinModal(); return; }
                      const res = await unlockConversationWithCoins(activeConvId!);
                      if (res.success) showToast("Chat unlocked for unlimited messages! ✦", "success");
                    }}
                    style={{ color: "#D4AF37", textDecoration: "underline", fontSize: "11px", cursor: "pointer" }}
                  >
                    Unlock Unlimited (10 coins)
                  </button>
                </div>
              )}

              {/* Input Bar */}
              <form onSubmit={handleSend} className={styles.inputBar}>
                <input
                  type="text"
                  placeholder={`Message ${activeMatch.matchedWith.fullName.split(" ")[0]}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={styles.textInput}
                  disabled={isSending}
                />
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className={styles.sendButton}
                >
                  {isSending ? "..." : "Send"}
                </Button>
              </form>
            </>
          )}
        </section>
      ) : (
        <div className={styles.noMatchSelected}>
          <p>Select an active radar match above to start chatting!</p>
        </div>
      )}
      </>
      )}

      {/* Safety Report Modal */}
      <Modal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Report Member"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0 }}>
            Your safety is our top priority. Reports are reviewed by human Kenyan safety moderators within 2 hours.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: selectedReason === reason ? "rgba(255, 90, 95, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${selectedReason === reason ? "var(--color-radiant-coral)" : "var(--color-border)"}`,
                  cursor: "pointer",
                  fontSize: "13px",
                  color: "var(--color-warm-cream)",
                }}
              >
                <input
                  type="radio"
                  name="reportReason"
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsReportOpen(false)}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="pass"
              onClick={handleReportSubmit}
              style={{ flex: 1 }}
            >
              Submit &amp; Block
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
