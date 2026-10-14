"use client";

import React from "react";
import styles from "./LocationBadge.module.css";

interface LocationBadgeProps {
  county: string;
  area?: string;
  distanceKm?: number;
  size?: "sm" | "md";
}

export const LocationBadge: React.FC<LocationBadgeProps> = ({
  county,
  area,
  distanceKm,
  size = "md",
}) => {
  const baseLocation = area ? `${area}, ${county}` : county;
  const displayLocation = distanceKm !== undefined && distanceKm >= 0
    ? `${baseLocation} • ${distanceKm < 1 ? "<1" : distanceKm}km away`
    : baseLocation;

  return (
    <span className={`${styles.badge} ${styles[size]}`} title={`Location: ${displayLocation}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--rada-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span className={styles.text}>{displayLocation}</span>
    </span>
  );
};

export default LocationBadge;
