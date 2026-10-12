"use client";

import React from "react";
import styles from "./Loading.module.css";

export const Spinner: React.FC<{ size?: "sm" | "md" | "lg"; color?: "coral" | "amber" | "cream" }> = ({
  size = "md",
  color = "coral",
}) => {
  return (
    <div
      className={`${styles.spinner} ${styles[size]} ${styles[color]}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className={styles.skeletonCard} aria-busy="true" aria-label="Loading discovery card">
      <div className={styles.skeletonPhoto} />
      <div className={styles.skeletonContent}>
        <div className={styles.skeletonPill} />
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonPrompt} />
        <div className={styles.skeletonActions}>
          <div className={styles.skeletonCircle} />
          <div className={styles.skeletonCircleLg} />
          <div className={styles.skeletonCircle} />
        </div>
      </div>
    </div>
  );
};

export default Spinner;
