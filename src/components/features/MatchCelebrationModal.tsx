"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRada } from "@/lib/rada-context";
import { Button } from "@/components/ui/Button";
import styles from "./MatchCelebrationModal.module.css";

interface MatchCelebrationModalProps {
  onStartChat?: (conversationId: string) => void;
}

export const MatchCelebrationModal: React.FC<MatchCelebrationModalProps> = () => {
  const { matchedUserModal, closeMatchModal, currentUser, matches, sendMessage } = useRada();
  const [firstMessage, setFirstMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!matchedUserModal) return null;

  // Find conversation
  const currentMatch = matches.find((m) => m.matchedWith.id === matchedUserModal.id);

  const handleSend = () => {
    if (currentMatch && firstMessage.trim()) {
      sendMessage(currentMatch.conversationId, firstMessage.trim());
      setSent(true);
      setTimeout(() => {
        closeMatchModal();
      }, 1000);
    } else {
      closeMatchModal();
    }
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.backdrop} onClick={closeMatchModal} />
      <div className={styles.content}>
        <div className={styles.sparkleBadge}>
          <span>✨ 48H MOMENTUM ACTIVE</span>
        </div>

        <h2 className={styles.title}>You&apos;re on the same radar!</h2>
        <p className={styles.subtitle}>
          You and <span className={styles.highlight}>{matchedUserModal.fullName.split(" ")[0]}</span> both value intentional dating.
        </p>

        {/* Dual Avatars */}
        <div className={styles.avatarsRow}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatarImg}>
              {currentUser.photos[0] && (
                <Image
                  src={currentUser.photos[0].url}
                  alt={currentUser.fullName}
                  width={96}
                  height={96}
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
            <span className={styles.avatarName}>You</span>
          </div>

          <div className={styles.centerBadge}>
            <span className={styles.heartPulse}>🤍</span>
          </div>

          <div className={styles.avatarWrapper}>
            <div className={styles.avatarImg}>
              {matchedUserModal.photos[0] && (
                <Image
                  src={matchedUserModal.photos[0].url}
                  alt={matchedUserModal.fullName}
                  width={96}
                  height={96}
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
            <span className={styles.avatarName}>{matchedUserModal.fullName.split(" ")[0]}</span>
          </div>
        </div>

        {/* Momentum Warning Banner */}
        <div className={styles.momentumBanner}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>48 hours to start a conversation before this radar pause.</span>
        </div>

        {/* Fast Icebreaker / Direct Message */}
        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.messageInput}
            placeholder={`Say something nice to ${matchedUserModal.fullName.split(" ")[0]}...`}
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            disabled={sent}
          />
          <Button
            variant="primary"
            fullWidth
            onClick={handleSend}
            disabled={sent}
          >
            {sent ? "Message Sent! 🎉" : firstMessage.trim() ? "Send First Message" : "Keep Swiping"}
          </Button>
        </div>

        <button className={styles.dismissBtn} onClick={closeMatchModal}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default MatchCelebrationModal;
