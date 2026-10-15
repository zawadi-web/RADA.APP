"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRada } from "@/lib/rada-context";
import { IntentBadge } from "@/components/ui/IntentBadge";
import { LocationBadge } from "@/components/ui/LocationBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { VoiceNotePlayer } from "@/components/ui/VoiceNotePlayer";
import { PromptReactionSheet } from "@/components/features/PromptReactionSheet";
import { StoriesBar } from "@/components/features/StoriesBar";
import styles from "./page.module.css";

// Shared location error banner
const LocationErrorBanner = ({ error, onDismiss }: { error: string; onDismiss: () => void }) => (
  <div style={{
    background: "rgba(255,90,95,0.08)",
    border: "1px solid rgba(255,90,95,0.4)",
    borderRadius: "10px",
    padding: "10px 14px",
    margin: "0 16px 8px",
    fontSize: "12px",
    color: "#FF7B7F",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }}>
    <span style={{ flexShrink: 0 }}>⚠️</span>
    <span style={{ flex: 1 }}>{error}</span>
    <button
      onClick={onDismiss}
      style={{ background: "none", border: "none", color: "rgba(255,123,127,0.7)", cursor: "pointer", fontSize: "16px", padding: "0 2px", flexShrink: 0 }}
      aria-label="Dismiss"
    >✕</button>
  </div>
);

// Luxury Radar Location Toggle Button
const LocationBtn = ({
  useLocation, locationError, onToggle, isPending,
}: {
  useLocation: boolean; locationError: string | null; onToggle: () => void; isPending?: boolean;
}) => (
  <button
    onClick={onToggle}
    disabled={isPending}
    title={useLocation ? "GPS Radar Active — tap to toggle nationwide mode" : "Tap to enable precise GPS Radar for nearby singles"}
    style={{
      background: useLocation
        ? "var(--rada-surface-raised)"
        : "var(--rada-surface)",
      border: `1px solid ${useLocation ? "var(--rada-gold)" : locationError ? "rgba(239, 68, 68, 0.4)" : "var(--rada-border)"}`,
      borderRadius: "9999px",
      padding: "6px 14px",
      fontSize: "12px",
      fontWeight: 700,
      cursor: isPending ? "wait" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: "7px",
      transition: "all 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
      boxShadow: useLocation ? "0 2px 10px rgba(245, 207, 104, 0.2)" : "var(--rada-shadow-sm)",
      color: "var(--rada-pearl)",
    }}
  >
    {/* SVG Radar Instrument Icon */}
    <span style={{ display: "flex", alignItems: "center", position: "relative" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={useLocation ? "var(--rada-gold)" : "var(--rada-pearl-muted)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" fill={useLocation ? "var(--rada-gold)" : "none"} />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
      {/* Live Beacon Pulse */}
      <span
        style={{
          position: "absolute",
          top: "-1px",
          right: "-1px",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: useLocation ? "#34D399" : isPending ? "var(--rada-gold)" : "transparent",
          boxShadow: useLocation ? "0 0 6px #34D399" : "none",
        }}
      />
    </span>
    <span style={{ letterSpacing: "0.02em" }}>
      {isPending ? "Locating..." : useLocation ? "Radar Active" : "Radar: Kenya"}
    </span>
  </button>
);

export default function DiscoverPage() {
  const router = useRouter();
  const {
    currentCard,
    passCurrentCard,
    likeCurrentCard,
    superSparkCurrentCard,
    openVipModal,
    currentUser,
    useLocation,
    locationError,
    toggleLocation,
    isLoadingDeck,
    setLocationError,
  } = useRada();


  const [isPendingLocation, setIsPendingLocation] = useState(false);

  const handleLocationToggle = () => {
    if (!useLocation && !isPendingLocation) {
      setIsPendingLocation(true);
      toggleLocation();
      setTimeout(() => setIsPendingLocation(false), 5000);
    } else {
      toggleLocation();
      setIsPendingLocation(false);
    }
  };

  // Stop pending state once location resolves (success or error)
  React.useEffect(() => {
    if (useLocation || locationError) {
      setIsPendingLocation(false);
    }
  }, [useLocation, locationError]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [reactionPrompt, setReactionPrompt] = useState<{ question: string; answer: string } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = React.useRef(0);

  const photos = currentCard?.photos && currentCard.photos.length > 0
    ? currentCard.photos
    : [];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    setDragOffset(delta);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 80) {
      handleLike();
    } else if (dragOffset < -80) {
      handlePass();
    }
    setDragOffset(0);
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIdx < photos.length - 1) {
      setActivePhotoIdx((prev) => prev + 1);
    } else {
      setActivePhotoIdx(0);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activePhotoIdx > 0) {
      setActivePhotoIdx((prev) => prev - 1);
    }
  };

  const handlePromptReact = (question: string, answer: string) => {
    setReactionPrompt({ question, answer });
  };

  const handleReactionSubmit = (comment: string, isSuperSpark: boolean) => {
    if (isSuperSpark) {
      superSparkCurrentCard(comment);
    } else {
      likeCurrentCard(comment);
    }
    setActivePhotoIdx(0);
  };

  const handlePass = () => {
    passCurrentCard();
    setActivePhotoIdx(0);
    setDragOffset(0);
  };

  const handleLike = () => {
    likeCurrentCard();
    setActivePhotoIdx(0);
    setDragOffset(0);
  };

  if (isLoadingDeck && !currentCard) {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brandRow}>
            <span className={styles.brandSymbol}>✦</span>
            <span className={styles.brandName}>Rada</span>
          </div>
          <button className={styles.vipPill} onClick={openVipModal}>
            {currentUser.isVip ? "✦ VIP Active" : "Upgrade VIP"}
          </button>
        </header>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "16px", padding: "40px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, var(--color-radiant-coral), var(--color-deep-mauve))", animation: "pulse 1.5s ease-in-out infinite" }} />
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}>Finding your best matches...</p>
        </div>
      </main>
    );
  }

  if (!currentCard) {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <div className={styles.brandRow}>
            <span className={styles.brandSymbol}>✦</span>
            <span className={styles.brandName}>Rada</span>
          </div>
          <div className={styles.headerRight}>
            <LocationBtn
              useLocation={useLocation}
              locationError={locationError}
              onToggle={handleLocationToggle}
              isPending={isPendingLocation}
            />
            <button className={styles.vipPill} onClick={openVipModal}>
              {currentUser.isVip ? "✦ VIP Active" : "Upgrade VIP"}
            </button>
          </div>
        </header>

        {/* 24-Hour Active Radar Stories (Always Visible) */}
        <StoriesBar />

        {locationError && (
          <LocationErrorBanner error={locationError} onDismiss={() => setLocationError(null)} />
        )}
        <div className={styles.emptyWrapper}>
          <EmptyState
            icon="✦"
            title="Radar Ready"
            description="No new profiles on your radar matching your preferences right now. Check back soon as more members join!"
            actionLabel="View Profile →"
            onAction={() => router.push("/profile")}
          />
        </div>
      </main>
    );
  }

  const currentPhoto = photos[activePhotoIdx] || photos[0];

  return (
    <main className={styles.container}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.brandRow}>
          <span className={styles.brandSymbol}>✦</span>
          <span className={styles.brandName}>Rada</span>
        </div>
        <div className={styles.headerRight}>
          <LocationBtn
            useLocation={useLocation}
            locationError={locationError}
            onToggle={handleLocationToggle}
            isPending={isPendingLocation}
          />
          <button className={styles.vipPill} onClick={openVipModal}>
            {currentUser.isVip ? "✦ VIP Active" : "Upgrade VIP"}
          </button>
        </div>
      </header>

      {/* 24-Hour Active Radar Stories */}
      <StoriesBar />

      {locationError && (
        <LocationErrorBanner error={locationError} onDismiss={() => setLocationError(null)} />
      )}

      {/* Main Intent-First Card */}
      <div className={styles.cardContainer}>
        <div
          className={styles.profileCard}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: isDragging
              ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)`
              : undefined,
            transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          {dragOffset > 30 && (
            <div className={styles.swipeStampLike}>LIKE 🤍</div>
          )}
          {dragOffset < -30 && (
            <div className={styles.swipeStampPass}>PASS ✕</div>
          )}

          {/* Photo Viewport */}
          <div className={styles.photoViewport} key={currentCard.id}>
            {currentPhoto?.url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={currentPhoto.url}
                alt={currentCard.fullName}
                className={styles.profileImg}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "radial-gradient(circle at 50% 40%, #17171C 0%, #09090B 100%)",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(245, 207, 104, 0.16) 0%, rgba(20, 20, 24, 0.85) 100%)",
                    border: "2px solid var(--rada-gold)",
                    boxShadow: "var(--rada-gold-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                    fontWeight: 800,
                    color: "var(--rada-gold)",
                  }}
                >
                  {currentCard.fullName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "11px", color: "var(--rada-gold)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
                  ✦ Awaiting Photos
                </span>
              </div>
            )}

            {/* Photo Navigation Touch Areas */}
            <div className={styles.tapLeft} onClick={handlePrevPhoto} aria-label="Previous photo" />
            <div className={styles.tapRight} onClick={handleNextPhoto} aria-label="Next photo" />

            {/* Photo Segment Indicators */}
            {photos.length > 1 && (
              <div className={styles.photoIndicators}>
                {photos.map((_, idx) => (
                  <div
                    key={idx}
                    className={`${styles.indicatorDot} ${idx === activePhotoIdx ? styles.indicatorActive : ""}`}
                  />
                ))}
              </div>
            )}

            {/* Prominent Floating Intent Badge */}
            <div className={styles.floatingIntent}>
              <IntentBadge intent={currentCard.intent} size="large" glow />
            </div>

            {/* Bottom Gradient with Name & Vital Info */}
            <div className={styles.photoGradient}>
              <div className={styles.nameRow}>
                <h1 className={styles.userName}>{currentCard.fullName.split(" ")[0]}</h1>
                <span className={styles.userAge}>{currentCard.age}</span>
                {currentCard.verified && (
                  <span className={styles.verifiedCheck} title="Verified Kenyan ID">✓</span>
                )}
              </div>
              <div className={styles.locationRow}>
                <LocationBadge area={currentCard.area} county={currentCard.county} distanceKm={currentCard.distanceKm} />
                <span className={styles.occupationText}>{currentCard.occupation}</span>
              </div>
            </div>
          </div>

          {/* Intent Note Quote Callout */}
          {currentCard.intentNote && (
            <div className={styles.intentNoteBox}>
              <span className={styles.intentQuoteIcon}>❝</span>
              <p className={styles.intentNoteText}>{currentCard.intentNote}</p>
            </div>
          )}

          {/* Bio Section */}
          <div className={styles.bioSection}>
            <p className={styles.bioText}>{currentCard.bio}</p>
          </div>

          {/* Voice Intro Note */}
          {currentCard.voiceNote && (
            <div style={{ marginTop: "14px", marginBottom: "6px" }}>
              <VoiceNotePlayer
                voiceNote={currentCard.voiceNote}
                userName={currentCard.fullName.split(" ")[0]}
              />
            </div>
          )}

          {/* Interactive Prompts */}
          <div className={styles.promptsList}>
            {currentCard.prompts.map((prompt) => (
              <div key={prompt.id} className={styles.promptCard}>
                <span className={styles.promptQuestion}>{prompt.question}</span>
                <p className={styles.promptAnswer}>&ldquo;{prompt.answer}&rdquo;</p>
                <button
                  className={styles.reactBtn}
                  onClick={() => handlePromptReact(prompt.question, prompt.answer)}
                >
                  <span>React with note 💬</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Action Controls */}
        <div className={styles.actionControls}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.passBtn}`}
            onClick={handlePass}
            aria-label="Pass profile"
          >
            ✕
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.sparkBtn}`}
            onClick={() => handlePromptReact(currentCard.prompts[0]?.question || "Intentional note", currentCard.prompts[0]?.answer || "Hello!")}
            aria-label="Super spark"
          >
            ✦
          </button>

          <button
            type="button"
            className={`${styles.actionBtn} ${styles.likeBtn}`}
            onClick={handleLike}
            aria-label="Connect and Like"
          >
            🤍
          </button>
        </div>
      </div>

      {/* Prompt Reaction Modal */}
      {reactionPrompt && (
        <PromptReactionSheet
          isOpen={true}
          onClose={() => setReactionPrompt(null)}
          promptQuestion={reactionPrompt.question}
          promptAnswer={reactionPrompt.answer}
          userName={currentCard.fullName.split(" ")[0]}
          onSubmit={handleReactionSubmit}
        />
      )}
    </main>
  );
}
