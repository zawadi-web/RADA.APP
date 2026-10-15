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
  const chatCameraInputRef = useRef<HTMLInputElement>(null);

  // ── MESSAGE DELETION (Long Press WhatsApp-Style) ──
  const [selectedDeleteMsg, setSelectedDeleteMsg] = useState<Message | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          showToast("Video sent! ✦", "success");
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
        content: "", // Clean photo message with NO redundant text
        isRead: true,
        createdAt: new Date().toISOString(),
        type: "photo",
        mediaUrl: ev.target?.result as string,
      };
      setConversations((prev: any) => ({
        ...prev,
        [activeConvId]: [...(prev[activeConvId] || []), photoMsg],
      }));
      showToast("Photo sent! ✦", "success");
    };
    reader.readAsDataURL(file);
  };

  // Message Deletion Handlers (WhatsApp Long-Press)
  const handleMsgTouchStart = (msg: Message) => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      setSelectedDeleteMsg(msg);
    }, 450);
  };

  const handleMsgTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleDeleteMessage = async (msg: Message, mode: "everyone" | "me") => {
    if (!activeConvId) return;

    // Optimistic state update
    setConversations((prev: Record<string, Message[]>) => {
      const list = prev[activeConvId] || [];
      if (mode === "everyone") {
        return {
          ...prev,
          [activeConvId]: list.map((m) =>
            m.id === msg.id
              ? { ...m, content: "🚫 This message was deleted", mediaUrl: undefined, type: "text" }
              : m
          ),
        };
      } else {
        return {
          ...prev,
          [activeConvId]: list.filter((m) => m.id !== msg.id),
        };
      }
    });

    setSelectedDeleteMsg(null);
    showToast(mode === "everyone" ? "Message deleted for everyone" : "Message deleted for you", "neutral");

    try {
      await fetch("/api/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg.id, mode }),
      });
    } catch (err) {
      console.error("Delete message API error:", err);
    }
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
        // Merge with existing to avoid losing local media and trigger alerts
        setConversations((prev: Record<string, Message[]>) => {
          const currentList = prev[activeConvId] || [];

          // Retain all locally sent media (photos, videos, voice notes) so polling doesn't overwrite them
          const clientMediaMessages = currentList.filter(
            (m) => m.type === "photo" || m.type === "video" || m.type === "voice" || m.id.startsWith("msg-")
          );

          const serverMsgIds = new Set(data.messages.map((m: Message) => m.id));
          const unsavedClientMessages = clientMediaMessages.filter((m) => !serverMsgIds.has(m.id));

          const merged = [...data.messages, ...unsavedClientMessages];

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
            [activeConvId]: merged,
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
          <section style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "0 8px" }}>
              <span className={styles.sectionLabel} style={{ margin: 0, letterSpacing: "0.5px" }}>CHATS</span>
              <span style={{ fontSize: "11px", color: "#00A884", fontWeight: 700 }}>
                {matches.length} {matches.length === 1 ? "Conversation" : "Conversations"}
              </span>
            </div>

            {/* WhatsApp-Style Conversation List (Image 5) */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {matches.map((match) => {
                const convMessages = conversations[match.conversationId] || [];
                const lastMsg = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
                const isUrgent = match.momentumHoursRemaining < 24;
                const isMe = lastMsg ? (lastMsg.senderId === "user-me" || (dbUserId ? lastMsg.senderId === dbUserId : false)) : false;

                // Partner last message preview text or icon
                let previewContent = "✨ Radar aligned! Tap to open chat";
                let isPhotoPreview = false;
                let isVoicePreview = false;

                if (lastMsg) {
                  if (lastMsg.type === "photo") {
                    isPhotoPreview = true;
                    previewContent = "Photo";
                  } else if (lastMsg.type === "voice") {
                    isVoicePreview = true;
                    previewContent = `Voice message (${lastMsg.durationSec || 15}s)`;
                  } else if (lastMsg.content === "🚫 This message was deleted") {
                    previewContent = "This message was deleted";
                  } else {
                    previewContent = lastMsg.content;
                  }
                }

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => setActiveConvId(match.conversationId)}
                    className={styles.chatListItem}
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
                            : "linear-gradient(135deg, #00A884 0%, #25D366 100%)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
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
                              background: "#182229",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "18px",
                              fontWeight: 800,
                              color: "#00A884",
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
                          background: isUrgent ? "#FF4B4B" : "#00A884",
                          color: "#FFFFFF",
                          fontSize: "9px",
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: "6px",
                          border: "1.5px solid #0B0E14",
                        }}
                      >
                        {match.momentumHoursRemaining}h
                      </span>
                    </div>

                    {/* Middle Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "16px", fontWeight: 700, color: "#E9EDEF" }}>
                          {match.matchedWith.fullName}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#8696A0", fontWeight: 500 }}>
                          {lastMsg
                            ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : `${match.momentumHoursRemaining}h left`}
                        </span>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p
                          style={{
                            fontSize: "13.5px",
                            color: "#8696A0",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          {isMe && <span style={{ color: "#53BDEB", fontSize: "12px" }}>✓✓</span>}
                          {isPhotoPreview && <span>📷</span>}
                          {isVoicePreview && <span>🎙️</span>}
                          <span>{previewContent}</span>
                        </p>

                        {/* Unread indicator */}
                        {lastMsg && !isMe && !lastMsg.isRead && (
                          <span
                            style={{
                              background: "#00A884",
                              color: "#111B21",
                              fontSize: "10.5px",
                              fontWeight: 800,
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: "8px",
                              flexShrink: 0,
                            }}
                          >
                            1
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          /* Full Screen WhatsApp Chat View (100vw × 100dvh Edge-to-Edge) */
          <div className={styles.chatFullScreen}>
            {/* WhatsApp Header */}
            <div className={styles.chatHeaderFull}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setActiveConvId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#A7B2B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    padding: "4px",
                    marginLeft: "-4px",
                  }}
                  aria-label="Back to conversations"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Partner Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "#2A3942",
                    }}
                  >
                    {activeMatch.matchedWith.photos[0]?.url ? (
                      <img
                        src={activeMatch.matchedWith.photos[0].url}
                        alt={activeMatch.matchedWith.fullName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#E9EDEF", fontWeight: 700 }}>
                        {activeMatch.matchedWith.fullName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Partner Name & Live Status */}
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#E9EDEF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {activeMatch.matchedWith.fullName}
                  </div>
                  {(() => {
                    const partnerLastActive = (activeMatch.matchedWith as any)?.lastActive || activeMatch.lastActivity;
                    const diffMs = partnerLastActive ? Math.abs(Date.now() - new Date(partnerLastActive).getTime()) : NaN;
                    const isOnline = !isNaN(diffMs) && diffMs < 5 * 60 * 1000;
                    return (
                      <div style={{ fontSize: "11px", color: isOnline ? "#00A884" : "#8696A0", fontWeight: isOnline ? 600 : 400 }}>
                        {isOnline ? "online" : "last seen recently"}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Call & Safety Icons */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "#A7B2B8" }}>
                <button
                  type="button"
                  onClick={() => startCall("video")}
                  style={{ background: "none", border: "none", color: "#A7B2B8", cursor: "pointer", fontSize: "18px" }}
                  title="Video Call"
                  aria-label="Video Call"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => startCall("voice")}
                  style={{ background: "none", border: "none", color: "#A7B2B8", cursor: "pointer", fontSize: "18px" }}
                  title="Voice Call"
                  aria-label="Voice Call"
                >
                  <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.053 15.053 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-.99-1.12z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                  style={{ background: "none", border: "none", color: "#A7B2B8", cursor: "pointer", fontSize: "20px" }}
                  aria-label="Safety menu"
                >
                  ⋮
                </button>
                {showSafetyMenu && (
                  <div className={styles.safetyDropdown} style={{ top: "45px", right: "10px" }}>
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
            <div style={{
              padding: "5px 12px",
              background: "rgba(212, 175, 55, 0.08)",
              borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
              color: "#D4AF37",
              fontSize: "11px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}>
              <span>⚡ <strong>{activeMatch.momentumHoursRemaining}h remaining</strong> to keep this momentum active</span>
            </div>

            {/* Message Thread */}
            <div className={styles.messagesListFull}>
              {activeMessages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className={styles.systemMessage}>
                      <span>{msg.content}</span>
                    </div>
                  );
                }

                const isMe = msg.senderId === "user-me" || (dbUserId ? msg.senderId === dbUserId : false);
                const timeStr = typeof msg.createdAt === "string" && msg.createdAt.length > 20
                  ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : msg.createdAt;

                return (
                  <div
                    key={msg.id}
                    className={`${styles.messageRow} ${isMe ? styles.messageRowMe : styles.messageRowPartner}`}
                    onTouchStart={() => handleMsgTouchStart(msg)}
                    onTouchEnd={handleMsgTouchEnd}
                    onMouseDown={() => handleMsgTouchStart(msg)}
                    onMouseUp={handleMsgTouchEnd}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedDeleteMsg(msg);
                    }}
                    style={{ userSelect: "none", cursor: "pointer" }}
                  >
                    {/* Deleted Message */}
                    {msg.content === "🚫 This message was deleted" ? (
                      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubblePartner}`} style={{ opacity: 0.7 }}>
                        <span className={styles.deletedMessageText}>
                          🚫 This message was deleted
                        </span>
                        <span className={styles.msgTime} style={{ marginTop: "4px", display: "block" }}>{timeStr}</span>
                      </div>
                    ) : msg.type === "photo" && msg.mediaUrl ? (
                      /* Edge-to-Edge Photo Bubble (NO redundant '📷 Photo' text) */
                      <div className={styles.photoBubbleContainer} style={{ border: isMe ? "1.5px solid #00A884" : "1.5px solid rgba(255,255,255,0.15)" }}>
                        <img
                          src={msg.mediaUrl}
                          alt="Photo attachment"
                          className={styles.photoBubbleImg}
                        />
                        <div className={styles.floatingTimestamp}>
                          <span>{timeStr}</span>
                          {isMe && <span style={{ color: "#53BDEB" }}>✓✓</span>}
                        </div>
                      </div>
                    ) : (
                      /* Text / Audio / Video Bubble */
                      <div className={`${styles.bubble} ${isMe ? styles.bubbleMe : styles.bubblePartner}`}>
                        {msg.type === "video" && msg.mediaUrl && (
                          <div style={{ marginBottom: "6px", borderRadius: "10px", overflow: "hidden", maxWidth: "260px" }}>
                            <video
                              src={msg.mediaUrl}
                              controls
                              playsInline
                              style={{ width: "100%", maxHeight: "240px", borderRadius: "10px", display: "block", background: "#000" }}
                            />
                          </div>
                        )}
                        {msg.type === "voice" && msg.mediaUrl && (
                          <div style={{ marginBottom: "4px", minWidth: "190px", maxWidth: "240px" }}>
                            <audio src={msg.mediaUrl} controls style={{ width: "100%", height: "36px" }} />
                          </div>
                        )}
                        {msg.content && <p className={styles.msgText}>{msg.content}</p>}
                        <span className={styles.msgTime} style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", marginTop: "2px" }}>
                          {timeStr}
                          {isMe && <span style={{ color: "#53BDEB", fontSize: "11px" }}>✓✓</span>}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starter Chips */}
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
                margin: "8px 12px", padding: "16px", borderRadius: "16px",
                background: "rgba(212, 175, 55, 0.1)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "20px", marginBottom: "4px" }}>🔒 🪙</div>
                <h4 style={{ fontSize: "14px", fontWeight: 800, color: "#E9EDEF", margin: "0 0 4px" }}>
                  5 Free Messages Used
                </h4>
                <p style={{ fontSize: "12px", color: "#8696A0", margin: "0 0 12px" }}>
                  Unlock unlimited chat with {activeMatch.matchedWith.fullName.split(" ")[0]} for <strong>10 Coins</strong>.
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
                      }
                    }}
                    style={{
                      padding: "10px 16px", borderRadius: "12px", border: "none",
                      background: "linear-gradient(135deg, #00A884, #25D366)",
                      color: "#FFFFFF", fontWeight: 800, fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    Unlock Chat (10 Coins)
                  </button>
                  <button
                    type="button"
                    onClick={openCoinModal}
                    style={{
                      padding: "10px 14px", borderRadius: "12px",
                      background: "#2A3942", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#E9EDEF", fontWeight: 700, fontSize: "12px", cursor: "pointer",
                    }}
                  >
                    Get Coins
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Hidden File Inputs: Camera & Gallery */}
                <input
                  ref={chatCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  onChange={handleChatMediaUpload}
                />
                <input
                  ref={chatMediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleChatMediaUpload}
                />

                {/* WhatsApp-Style Input Bar (Image 4) */}
                {isRecordingVoice ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    background: "rgba(225, 29, 72, 0.15)",
                    borderTop: "1px solid rgba(225, 29, 72, 0.3)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#E11D48", boxShadow: "0 0 8px #E11D48" }} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#FDA4AF" }}>
                        Recording voice note ({voiceSeconds}s / 30s)...
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
                        style={{ padding: "6px 12px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "14px", color: "#8696A0", fontSize: "12px", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        style={{ padding: "6px 14px", background: "#00A884", border: "none", borderRadius: "14px", color: "#FFFFFF", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                      >
                        Send Note 🎙️
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className={styles.waInputBar}>
                    {/* Dark Capsule: Camera + Paperclip + Input + Emoji */}
                    <div className={styles.waCapsule}>
                      {/* Direct Hardware Camera Icon */}
                      <button
                        type="button"
                        className={styles.waIconBtn}
                        onClick={() => chatCameraInputRef.current?.click()}
                        title="Take photo with camera"
                        aria-label="Take photo with camera"
                      >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/>
                          <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        </svg>
                      </button>

                      {/* Gallery Attachment Paperclip */}
                      <button
                        type="button"
                        className={styles.waIconBtn}
                        onClick={() => chatMediaInputRef.current?.click()}
                        title="Attach photo or video"
                        aria-label="Attach photo or video"
                      >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5V6H9v9.5a3 3 0 0 0 6 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
                        </svg>
                      </button>

                      {/* Text Input */}
                      <input
                        type="text"
                        placeholder="Message"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className={styles.waInput}
                        disabled={isSending}
                      />

                      {/* Emoji Icon */}
                      <button
                        type="button"
                        className={styles.waIconBtn}
                        onClick={() => setInputText((prev) => prev + " ✦ ")}
                        title="Add emoji"
                        aria-label="Add emoji"
                      >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Circular Floating Action Button (Mic when empty, Send when typed) */}
                    {inputText.trim() ? (
                      <button
                        type="submit"
                        className={styles.waFab}
                        disabled={isSending}
                        title="Send message"
                        aria-label="Send message"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.waFab}
                        onClick={startVoiceRecording}
                        title="Record voice note"
                        aria-label="Record voice note"
                      >
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                      </button>
                    )}
                  </form>
                )}
              </>
            )}

            {/* Long-Press Message Deletion Bottom Sheet */}
            {selectedDeleteMsg && (
              <div className={styles.deleteModalOverlay} onClick={() => setSelectedDeleteMsg(null)}>
                <div className={styles.deleteModalSheet} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.deleteModalTitle}>Delete message?</div>

                  {/* If user is the sender, show 'Delete for everyone' */}
                  {(selectedDeleteMsg.senderId === "user-me" || (dbUserId && selectedDeleteMsg.senderId === dbUserId)) && (
                    <button
                      type="button"
                      className={`${styles.deleteOptionBtn} ${styles.deleteEveryoneBtn}`}
                      onClick={() => handleDeleteMessage(selectedDeleteMsg, "everyone")}
                    >
                      <span>🗑️</span> Delete for everyone
                    </button>
                  )}

                  <button
                    type="button"
                    className={`${styles.deleteOptionBtn} ${styles.deleteMeBtn}`}
                    onClick={() => handleDeleteMessage(selectedDeleteMsg, "me")}
                  >
                    <span>🗑️</span> Delete for me
                  </button>

                  <button
                    type="button"
                    className={`${styles.deleteOptionBtn} ${styles.deleteCancelBtn}`}
                    onClick={() => setSelectedDeleteMsg(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
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
