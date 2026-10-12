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
      <span className={styles.pin} aria-hidden="true">📍</span>
      <span className={styles.text}>{displayLocation}</span>
    </span>
  );
};

export default LocationBadge;
