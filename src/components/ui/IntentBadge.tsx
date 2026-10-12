"use client";

import React from "react";
import styles from "./IntentBadge.module.css";
import { IntentType } from "@/lib/types";

export type { IntentType };

interface IntentBadgeProps {
  intent: IntentType;
  size?: "sm" | "md" | "lg" | "small" | "large";
  showIcon?: boolean;
  glow?: boolean;
}

const INTENT_CONFIG: Record<
  IntentType,
  { label: string; icon: string; className: string }
> = {
  MARRIAGE: {
    label: "Dating to Marry",
    icon: "💍",
    className: styles.marriage,
  },
  LONG_TERM: {
    label: "Long-term Partner",
    icon: "🤍",
    className: styles.longTerm,
  },
  INTENTIONAL_DATING: {
    label: "Intentional Dating",
    icon: "☕",
    className: styles.intentional,
  },
  SERIOUS_RELATIONSHIP: {
    label: "Serious Relationship",
    icon: "🎯",
    className: styles.intentional,
  },
  EXPLORING: {
    label: "Exploring Vibes",
    icon: "✨",
    className: styles.exploring,
  },
};

export const IntentBadge: React.FC<IntentBadgeProps> = ({
  intent,
  size = "md",
  showIcon = true,
  glow = false,
}) => {
  const config = INTENT_CONFIG[intent] || INTENT_CONFIG.LONG_TERM;
  const normalizedSize = size === "large" || size === "lg" ? "md" : "sm";

  return (
    <span
      className={`${styles.badge} ${config.className} ${styles[normalizedSize]}`}
      style={glow ? { boxShadow: "0 0 16px rgba(255, 90, 95, 0.4)" } : undefined}
      title={`Intent: ${config.label}`}
    >
      {showIcon && <span className={styles.icon}>{config.icon}</span>}
      <span className={styles.label}>{config.label}</span>
    </span>
  );
};

export default IntentBadge;
