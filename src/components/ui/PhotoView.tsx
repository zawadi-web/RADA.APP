"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "./PhotoView.module.css";

interface PhotoViewProps {
  src: string;
  alt: string;
  aspectRatio?: "square" | "portrait" | "story";
  isVerified?: boolean;
  priority?: boolean;
  className?: string;
  overlayChildren?: React.ReactNode;
}

export const PhotoView: React.FC<PhotoViewProps> = ({
  src,
  alt,
  aspectRatio = "portrait",
  isVerified = false,
  priority = false,
  className = "",
  overlayChildren,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={`${styles.container} ${styles[aspectRatio]} ${className}`}
      role="img"
      aria-label={alt}
    >
      {!hasError && src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 480px) 100vw, 480px"
          className={`${styles.image} ${isLoading ? styles.blur : styles.loaded}`}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      ) : (
        <div className={styles.fallback}>
          <span className={styles.fallbackIcon}>👤</span>
          <span className={styles.fallbackText}>{alt || "Photo unavailable"}</span>
        </div>
      )}

      {isVerified && (
        <div className={styles.verifiedBadge} title="Verified Profile">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      )}

      {overlayChildren && <div className={styles.overlay}>{overlayChildren}</div>}
    </div>
  );
};

export default PhotoView;
