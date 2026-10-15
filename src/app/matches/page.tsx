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

  // ── CALLS (Voice & Video) ──
  const [activeCallType, setActiveCallType] = useState<"voice" | "video" | null>(null);
  const [callStatus, setCallStatus] = useState<"ringing" | "connected" | "ended">("ringing");
  const [callDuration, setCallDuration] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── VOICE NOTES ──
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── PHOTO & 30s VIDEO ATTACHMENTS (Ephemeral - Not saved to SQL) ──
  const chatMediaInputRef = useRef<HTMLInputElement>(null);

  // Request browser notification permissions on load
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const activeMatch = matches.find((m) => m.conversationId === activeConvId);
  const activeMessages = activeConvId ? (conversations[activeConvId] || []) : [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  // Load live matches from DB on mount
  useEffect(() => {
    if (dbUserId) {
      refreshMatches().then(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUserId]);

  // Start Call Handler
  const startCall = async (type: "voice" | "video") => {
    setActiveCallType(type);
    setCallStatus("ringing");
    setCallDuration(0);
    setIsMicMuted(false);
    setIsCameraOff(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video",
        audio: true,
      });
      if (localVideoRef.current && type === "video") {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      // Permission rejected or not supported fallback
    }

    // Connect after 2.5 seconds
    setTimeout(() => {
      setCallStatus("connected");
      const startT = Date.now();
      callTimerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startT) / 1000));
      }, 1000);
    }, 2500);
  };

  const endCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      localVideoRef.current.srcObject = null;
    }
    setCallStatus("ended");
    setTimeout(() => {
      setActiveCallType(null);
    }, 600);
  };

  // Voice Note Recorder Handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const voiceMsg: Message = {
          id: `msg-voice-${Date.now()}`,
          conversationId: activeConvId!,
          senderId: dbUserId || "user-me",
          content: `🎙️ Voice Note (${voiceSeconds || 3}s)`,
          isRead: true,
          createdAt: new Date().toISOString(),
          type: "voice",
          mediaUrl: audioUrl,
          durationSec: voiceSeconds,
        };
        setConversations((prev: any) => ({
          ...prev,
          [activeConvId!]: [...(prev[activeConvId!] || []), voiceMsg],
        }));
        stream.getTracks().forEach((t) => t.stop());
        showToast("Voice note sent! ✦", "coral");
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVoice(true);
      setVoiceSeconds(0);

      const startT = Date.now();
      voiceTimerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startT) / 1000);
        setVoiceSeconds(sec);
        if (sec >= 30) {
          stopVoiceRecording();
        }
      }, 500);
    } catch {
      showToast("Microphone access denied. Please allow microphone permission.", "coral");
    }
  };

  const stopVoiceRecording = () => {
    if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecordingVoice(false);
  };

  // Ephemeral Photo & 30s Video Handler (Bypasses permanent DB tables)
  const handleChatMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConvId) return;

    if (file.type.startsWith("video/")) {
      const videoEl = document.createElement("video");
      videoEl.preload = "metadata";
      videoEl.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoEl.src);
        if (videoEl.duration > 30) {
          showToast("Video exceeds 30 seconds limit! Please choose a clip under 30s.", "coral");
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const videoMsg: Message = {
            id: `msg-video-${Date.now()}`,
            conversationId: activeConvId,
            senderId: dbUserId || "user-me",
            content: "📹 Video Clip (≤ 30s)",
            isRead: true,
            createdAt: new Date().toISOString(),
            type: "video",
            mediaUrl: ev.target?.result as string,
          };
          setConversations((prev: any) => ({
            ...prev,
            [activeConvId]: [...(prev[activeConvId] || []), videoMsg],
          }));
          showToast("Video sent! (Not stored in database) ✦", "coral");
        };
        reader.readAsDataURL(file);
      };
      videoEl.src = URL.createObjectURL(file);
      return;
    }

    // Photo
    const reader = new FileReader();
    reader.onload = (ev) => {
      const photoMsg: Message = {
        id: `msg-photo-${Date.now()}`,
        conversationId: activeConvId,
        senderId: dbUserId || "user-me",
        content: "📷 Photo",
        isRead: true,
        createdAt: new Date().toISOString(),
        type: "photo",
        mediaUrl: ev.target?.result as string,
      };
      setConversations((prev: any) => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] || []), photoMsg],
      }));
      showToast("Photo sent! (Not stored in database) ✦", "coral");
    };
    reader.readAsDataURL(file);
  };

  // Play pleasant chime on incoming message
  const playNotificationSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }, []);

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
        // Merge with existing to avoid losing optimistic updates and trigger alerts
        setConversations((prev: Record<string, Message[]>) => {
          const currentList = prev[activeConvId] || [];
          if (data.messages.length > currentList.length) {
            playNotificationSound();
            if (typeof document !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
              const latest = data.messages[data.messages.length - 1];
              new Notification(activeMatchData.matchedWith.fullName, {
                body: latest.content || "New message received on Rada",
                icon: activeMatchData.matchedWith.photos[0]?.url || "/icon-192.png",
              });
            }
          }
          return {
            ...prev,
            [activeConvId]: data.messages,
          };
        });
      }
    } catch {
      // Silently fail polls
    }
  }, [activeConvId, dbUserId, matches, setConversations, playNotificationSound]);

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
                          background: "var(--rada-gold-gradient)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          fontWeight: 800,
                          color: "#0A0A0C",
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
        {!activeMatch ? (
          <section style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "0 4px" }}>
              <span className={styles.sectionLabel} style={{ margin: 0 }}>RECENT CONVERSATIONS</span>
              <span style={{ fontSize: "11px", color: "var(--rada-gold)", fontWeight: 700 }}>
                {matches.length} {matches.length === 1 ? "Active Chat" : "Active Chats"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {matches.map((match) => {
                const convMessages = conversations[match.conversationId] || [];
                const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
                const isUrgent = match.momentumHoursRemaining < 24;

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => setActiveConvId(match.conversationId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 16px",
                      borderRadius: "18px",
                      background: "var(--rada-surface)",
                      border: "1px solid var(--rada-border)",
                      textAlign: "left",
                      cursor: "pointer",
                      width: "100%",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                  >
                    {/* Avatar with momentum ring */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          padding: "2px",
                          background: isUrgent
                            ? "linear-gradient(135deg, #FF6B8B, #FF8E53)"
                            : "linear-gradient(135deg, #FFF6D6, #F5CF68 40%, #D4AF37 75%, #9B700F 100%)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
                        }}
                      >
                        {match.matchedWith.photos[0]?.url ? (
                          <img
                            src={match.matchedWith.photos[0].url}
                            alt={match.matchedWith.fullName}
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              background: "#1A1A22",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "var(--rada-gold)",
                            }}
                          >
                            {match.matchedWith.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          position: "absolute",
                          bottom: "-2px",
                          right: "-2px",
                          background: isUrgent ? "#FF4B4B" : "#10B981",
                          color: "#FFFFFF",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: "6px",
                          border: "1.5px solid #09090B",
                        }}
                      >
                        {match.momentumHoursRemaining}h
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--rada-pearl)" }}>
                          {match.matchedWith.fullName}
                        </span>
                        <span style={{ fontSize: "11px", color: "var(--rada-pearl-dim)" }}>
                          {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `${match.momentumHoursRemaining}h left`}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <IntentBadge intent={match.matchedWith.intent} size="small" />
                        <span style={{ fontSize: "11px", color: "var(--rada-pearl-muted)" }}>
                          • {match.matchedWith.area}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: "13px",
                          color: lastMsg ? "var(--rada-pearl-muted)" : "var(--rada-gold)",
                          margin: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {lastMsg ? (
                          <>
                            {lastMsg.senderId === dbUserId ? "You: " : ""}
                            {lastMsg.content}
                          </>
                        ) : (
                          "✨ Radar aligned! Tap to open chat →"
                        )}
                      </p>
                    </div>

                    <div style={{ color: "var(--rada-pearl-dim)", fontSize: "18px", marginLeft: "4px" }}>
                      ›
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className={styles.chatSection}>
          {/* Chat Header */}
          <div className={styles.chatHeader}>
            <button
              type="button"
              onClick={() => setActiveConvId(null)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid var(--rada-border)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--rada-pearl)",
                cursor: "pointer",
                marginRight: "10px",
                flexShrink: 0,
              }}
              aria-label="Back to messages list"
              title="Back to messages"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
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
                      background: "var(--rada-gold-gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "#0A0A0C",
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 6px #10B981" }} />
                  <span style={{ fontSize: "11px", color: "#10B981", fontWeight: 700 }}>Online Now</span>
                  <span style={{ fontSize: "11px", color: "var(--rada-pearl-dim)" }}>• {activeMatch.matchedWith.area}</span>
                </div>
              </div>
            </div>

            <div className={styles.headerActions} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Voice Call Button */}
              <button
                type="button"
                onClick={() => startCall("voice")}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--rada-border)",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
                aria-label="Start Voice Call"
                title="Voice Call"
              >
                📞
              </button>
              {/* Video Call Button */}
              <button
                type="button"
                onClick={() => startCall("video")}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--rada-border)",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
                aria-label="Start Video Call"
                title="Video Call"
              >
                📹
              </button>
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
                    {/* Media Attachments (Ephemeral, never stored in DB) */}
                    {msg.type === "photo" && msg.mediaUrl && (
                      <div style={{ marginBottom: "6px", borderRadius: "12px", overflow: "hidden" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={msg.mediaUrl}
                          alt="Photo attachment"
                          style={{ maxWidth: "240px", maxHeight: "240px", width: "100%", objectFit: "cover", display: "block", borderRadius: "10px" }}
                        />
                      </div>
                    )}
                    {msg.type === "video" && msg.mediaUrl && (
                      <div style={{ marginBottom: "6px", borderRadius: "12px", overflow: "hidden", maxWidth: "240px" }}>
                        <video
                          src={msg.mediaUrl}
                          controls
                          playsInline
                          style={{ width: "100%", maxHeight: "240px", borderRadius: "10px", display: "block", background: "#000" }}
                        />
                      </div>
                    )}
                    {msg.type === "voice" && msg.mediaUrl && (
                      <div style={{ marginBottom: "6px", minWidth: "180px", maxWidth: "240px" }}>
                        <audio src={msg.mediaUrl} controls style={{ width: "100%", height: "36px" }} />
                      </div>
                    )}
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
              background: "var(--rada-gold-subtle)",
              border: "1px solid var(--rada-border-teal)",
              textAlign: "center", boxShadow: "var(--rada-shadow-md)",
            }}>
              <div style={{ fontSize: "24px", marginBottom: "4px" }}>🔒 🪙</div>
              <h4 style={{ fontSize: "15px", fontWeight: 800, color: "var(--rada-pearl)", margin: "0 0 4px" }}>
                5 Free Messages Used
              </h4>
              <p style={{ fontSize: "12px", color: "var(--rada-pearl-muted)", margin: "0 0 14px", lineHeight: 1.4 }}>
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
                    background: "var(--rada-gold-gradient)",
                    color: "#0A0A0C", fontWeight: 800, fontSize: "13px", cursor: "pointer",
                    boxShadow: "0 4px 16px var(--rada-gold-subtle)",
                  }}
                >
                  Unlock Unlimited Chat (10 Coins) ✦
                </button>
                <button
                  type="button"
                  onClick={openCoinModal}
                  style={{
                    padding: "11px 14px", borderRadius: "12px",
                    background: "var(--rada-surface-raised)", border: "1px solid var(--rada-border)",
                    color: "var(--rada-pearl)", fontWeight: 700, fontSize: "12px", cursor: "pointer",
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
              {isRecordingVoice ? (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "rgba(225, 29, 72, 0.12)",
                  border: "1px solid rgba(225, 29, 72, 0.3)",
                  borderRadius: "24px",
                  margin: "8px 12px 14px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#E11D48",
                      boxShadow: "0 0 8px #E11D48",
                    }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#FDA4AF" }}>
                      Recording Voice Note ({voiceSeconds}s / 30s)...
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
                        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                          mediaRecorderRef.current.stop();
                        }
                        setIsRecordingVoice(false);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: "14px",
                        color: "var(--rada-pearl-dim)",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      style={{
                        padding: "6px 14px",
                        background: "#E11D48",
                        border: "none",
                        borderRadius: "14px",
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Send Note 🎙️
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSend} className={styles.inputBar}>
                  <input
                    ref={chatMediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    style={{ display: "none" }}
                    onChange={handleChatMediaUpload}
                  />
                  <button
                    type="button"
                    onClick={() => chatMediaInputRef.current?.click()}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid var(--rada-border)",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    title="Send ephemeral photo or video (max 30s - not stored in DB)"
                    aria-label="Send photo or video"
                  >
                    📷
                  </button>

                  <input
                    type="text"
                    placeholder={`Message ${activeMatch.matchedWith.fullName.split(" ")[0]}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className={styles.textInput}
                    disabled={isSending}
                  />

                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid var(--rada-border)",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    title="Record voice note (max 30s)"
                    aria-label="Record voice note"
                  >
                    🎙️
                  </button>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className={styles.sendButton}
                  >
                    {isSending ? "..." : "Send"}
                  </Button>
                </form>
              )}
            </>
          )}
        </section>
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

      {/* Voice & Video Call Modal */}
      {activeCallType && activeMatch && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(7, 2, 13, 0.96)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "50px 24px 40px",
        }}>
          {/* Call Header */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              background: "rgba(212, 175, 55, 0.15)",
              color: "#D4AF37",
              border: "1px solid rgba(212, 175, 55, 0.3)",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              {activeCallType === "video" ? "📹 Encrypted Video Call" : "📞 Encrypted Voice Call"}
            </span>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--rada-pearl)", margin: "0 0 6px" }}>
              {activeMatch.matchedWith.fullName}
            </h2>
            <p style={{
              fontSize: "14px",
              color: callStatus === "connected" ? "#10B981" : "var(--rada-pearl-dim)",
              fontWeight: 600,
              margin: 0,
            }}>
              {callStatus === "ringing" && "Connecting to secure room..."}
              {callStatus === "connected" && `Connected • ${Math.floor(callDuration / 60)}:${(callDuration % 60).toString().padStart(2, "0")}`}
              {callStatus === "ended" && "Call Ended"}
            </p>
          </div>

          {/* Video or Avatar Display */}
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "340px",
            height: activeCallType === "video" ? "360px" : "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "20px 0",
          }}>
            {activeCallType === "video" ? (
              <div style={{
                position: "relative",
                width: "100%",
                height: "100%",
                borderRadius: "24px",
                overflow: "hidden",
                border: "1px solid var(--rada-border)",
                background: "#0F0F14",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              }}>
                {/* Simulated remote stream */}
                {activeMatch.matchedWith.photos[0]?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeMatch.matchedWith.photos[0].url}
                    alt={activeMatch.matchedWith.fullName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                  }}>
                    👤
                  </div>
                )}
                {/* Local user video preview */}
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    right: "16px",
                    width: "90px",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "14px",
                    border: "2px solid #D4AF37",
                    background: "#1E1E26",
                    display: isCameraOff ? "none" : "block",
                  }}
                />
              </div>
            ) : (
              <div style={{
                width: "130px",
                height: "130px",
                borderRadius: "50%",
                background: "var(--rada-gold-gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 40px rgba(212, 175, 55, 0.4)",
              }}>
                {activeMatch.matchedWith.photos[0]?.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={activeMatch.matchedWith.photos[0].url}
                    alt={activeMatch.matchedWith.fullName}
                    style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "48px", fontWeight: 800, color: "#0A0A0C" }}>
                    {activeMatch.matchedWith.fullName.charAt(0)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "20px",
          }}>
            {/* Mic Toggle */}
            <button
              type="button"
              onClick={() => setIsMicMuted(!isMicMuted)}
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: isMicMuted ? "#E11D48" : "rgba(255, 255, 255, 0.12)",
                border: "1px solid var(--rada-border)",
                color: "#FFFFFF",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title={isMicMuted ? "Unmute" : "Mute"}
            >
              {isMicMuted ? "🔇" : "🎙️"}
            </button>

            {/* Video Camera Toggle (If Video Call) */}
            {activeCallType === "video" && (
              <button
                type="button"
                onClick={() => setIsCameraOff(!isCameraOff)}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: isCameraOff ? "#E11D48" : "rgba(255, 255, 255, 0.12)",
                  border: "1px solid var(--rada-border)",
                  color: "#FFFFFF",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isCameraOff ? "🚫" : "📹"}
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={endCall}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#E11D48",
                border: "none",
                color: "#FFFFFF",
                fontSize: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(225, 29, 72, 0.4)",
              }}
              title="End Call"
            >
              📞
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
