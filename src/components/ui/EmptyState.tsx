"use client";

import React from "react";
import styles from "./EmptyState.module.css";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: { label: string; onClick: () => void };
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "✨",
  title,
  description,
  actionLabel,
  onAction,
  action,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const resolvedActionLabel = actionLabel || action?.label;
  const resolvedOnAction = onAction || action?.onClick;

  return (
    <div className={styles.container}>
      <div className={styles.iconCircle}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      
      {(resolvedActionLabel || secondaryActionLabel) && (
        <div className={styles.actions}>
          {resolvedActionLabel && (
            <Button variant="primary" onClick={resolvedOnAction}>
              {resolvedActionLabel}
            </Button>
          )}
          {secondaryActionLabel && (
            <Button variant="ghost" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
