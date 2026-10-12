"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./PromptReactionSheet.module.css";

interface PromptReactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  promptQuestion: string;
  promptAnswer: string;
  userName: string;
  onSubmit: (comment: string, isSuperSpark: boolean) => void;
}

export const PromptReactionSheet: React.FC<PromptReactionSheetProps> = ({
  isOpen,
  onClose,
  promptQuestion,
  promptAnswer,
  userName,
  onSubmit,
}) => {
  const [comment, setComment] = useState("");
  const [isSuperSpark, setIsSuperSpark] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onSubmit(comment.trim(), isSuperSpark);
    setComment("");
    onClose();
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.grabber} />
        
        <div className={styles.header}>
          <span className={styles.tag}>React to {userName}&apos;s Prompt</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Prompt Quote Box */}
        <div className={styles.promptQuote}>
          <span className={styles.promptQ}>{promptQuestion}</span>
          <p className={styles.promptA}>&ldquo;{promptAnswer}&rdquo;</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <textarea
            className={styles.textarea}
            placeholder={`Say something specific about this to ${userName}...`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={140}
            autoFocus
          />
          <div className={styles.charCount}>{comment.length}/140</div>

          {/* Spark Option */}
          <div className={styles.sparkRow}>
            <label className={styles.sparkLabel}>
              <input
                type="checkbox"
                checked={isSuperSpark}
                onChange={(e) => setIsSuperSpark(e.target.checked)}
                className={styles.checkbox}
              />
              <span className={styles.sparkText}>
                Send as <strong>Super Spark ✦</strong> (Stands out in their radar)
              </span>
            </label>
          </div>

          <div className={styles.actions}>
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant={isSuperSpark ? "amber" : "primary"}
              type="submit"
              disabled={!comment.trim()}
            >
              {isSuperSpark ? "Send Super Spark ✦" : "Send with Like 🤍"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptReactionSheet;
