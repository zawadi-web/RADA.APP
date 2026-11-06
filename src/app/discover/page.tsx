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
import { RadaOnAirModal } from "@/components/features/RadaOnAirModal";
import { GhostBusterModal } from "@/components/features/GhostBusterModal";
import { useTheme } from "@/lib/theme-context";
import styles from "./page.module.css";

// Shared location error banner
const LocationErrorBanner = ({ error, onDismiss }: { error: string; onDismiss: () => void }) => (
  <div style={{
    background: "rgba(255,90,95,0.08)",
    border: "1px solid rgba(255,90,95,0.4)",
    borderRadius: "10px",
    padding: "8px 12px",
    margin: "0 0 10px",
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

// Sleek Compact Radar Location Toggle
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
      background: useLocation ? "rgba(16, 185, 129, 0.12)" : "var(--rada-surface-raised, rgba(255,255,255,0.06))",
      border: `1px solid ${useLocation ? "#10B981" : locationError ? "rgba(239, 68, 68, 0.4)" : "var(--rada-border, rgba(255,255,255,0.1))"}`,
      borderRadius: "9999px",
      padding: "5px 11px",
      fontSize: "11.5px",
      fontWeight: 700,
      cursor: isPending ? "wait" : "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      color: useLocation ? "#10B981" : "var(--rada-pearl, #FFF8F0)",
      transition: "all 0.2s ease",
      boxShadow: useLocation ? "0 2px 8px rgba(16, 185, 129, 0.2)" : "none",
    }}
  >
    <span
      style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: useLocation ? "#10B981" : isPending ? "var(--rada-gold, #F5CF68)" : "#8696A0",
        boxShadow: useLocation ? "0 0 6px #10B981" : "none",
      }}
    />
    <span>{isPending ? "Locating..." : useLocation ? "Radar" : "Kenya"}</span>
  </button>
);

export default function DiscoverPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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
    resetSwipes,
  } = useRada();

  const [isPendingLocation, setIsPendingLocation] = useState(false);
  const [isRewinding, setIsRewinding] = useState(false);

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

  React.useEffect(() => {
    if (useLocation || locationError) {
      setIsPendingLocation(false);
    }
  }, [useLocation, locationError]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [reactionPrompt, setReactionPrompt] = useState<{ question: string; answer: string } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRadaOnAirOpen, setIsRadaOnAirOpen] = useState(false);
  const [isGhostBusterOpen, setIsGhostBusterOpen] = useState(false);
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

  const handleManualRewind = async () => {
    setIsRewinding(true);
    try {
      await resetSwipes();
    } finally {
      setIsRewinding(false);
    }
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "16px", padding: "60px 20px" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "linear-gradient(135deg, #FFF6D6, #F5CF68)", animation: "pulse 1.4s ease-in-out infinite" }} />
          <p style={{ color: "var(--rada-pearl-muted, #C4C4CD)", fontSize: "14px", fontWeight: 600 }}>Curating verified singles on your radar...</p>
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
            <button
              className={styles.iconBtn}
              onClick={handleManualRewind}
              disabled={isRewinding}
              title="Rewind swipes & rediscover profiles"
            >
              ↺
            </button>
            <button
              className={styles.vipPill}
              onClick={openVipModal}
              title="Upgrade VIP"
            >
              {currentUser.isVip ? "✦ VIP" : "✦ VIP"}
            </button>
            <button
              onClick={toggleTheme}
              className={styles.iconBtn}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* 24-Hour Active Radar Stories */}
        <StoriesBar />

        {locationError && (
          <LocationErrorBanner error={locationError} onDismiss={() => setLocationError(null)} />
        )}
        <div className={styles.emptyWrapper}>
          <EmptyState
            icon="✦"
            title="Radar Ready"
            description="You've swiped through all available singles matching your preferences right now. Tap rewind to rediscover real profiles and connect!"
            actionLabel={isRewinding ? "Rewinding Radar..." : "Rewind & Rediscover Profiles ↺"}
            onAction={handleManualRewind}
            secondaryActionLabel="View My Profile →"
            onSecondaryAction={() => router.push("/profile")}
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
          <button
            className={styles.iconBtn}
            onClick={handleManualRewind}
            disabled={isRewinding}
            title="Rewind swipes & rediscover profiles"
          >
            ↺
          </button>
          <button
            className={styles.vipPill}
            onClick={openVipModal}
            title="Upgrade VIP"
          >
            {currentUser.isVip ? "✦ VIP" : "✦ VIP"}
          </button>
          <button
            onClick={toggleTheme}
            className={styles.iconBtn}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* 24-Hour Active Radar Stories */}
      <StoriesBar />

      {/* Sleek Feature Capsule: Rada On Air (Live 8:00 PM) */}
      <div className={styles.featureCapsuleBar}>
        <button
          type="button"
          onClick={() => setIsRadaOnAirOpen(true)}
          className={styles.audioPill}
        >
          <span className={styles.pulseDot} />
          <span>🎙️ Rada On Air • Live Speed Dating</span>
          <span style={{ color: "var(--rada-gold, #F5CF68)", fontWeight: 800 }}>Join ✦</span>
        </button>
      </div>

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
                    width: "90px",
                    height: "90px",
                    borderRadius: "50%",
                    background: "rgba(245, 207, 104, 0.12)",
                    border: "2px solid var(--rada-gold, #F5CF68)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "36px",
                    fontWeight: 800,
                    color: "var(--rada-gold, #F5CF68)",
                  }}
                >
                  {currentCard.fullName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "11px", color: "var(--rada-gold, #F5CF68)", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
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
                {currentCard.isVerifiedGold && (
                  <span style={{ fontSize: "13px", color: "var(--rada-gold, #F5CF68)", fontWeight: 800 }} title="Rada Gold Liveness Verified">✦ Gold</span>
                )}
              </div>
              <div className={styles.locationRow}>
                <LocationBadge area={currentCard.area} county={currentCard.county} distanceKm={currentCard.distanceKm} />
                {currentCard.occupation && (
                  <span className={styles.occupationText}>{currentCard.occupation}</span>
                )}
              </div>
            </div>
          </div>

          {/* Minimalist Trust & Safety Bar */}
          <div className={styles.trustBar}>
            <span
              onClick={() => setIsGhostBusterOpen(true)}
              className={`${styles.trustBadge} ${styles.trustBadgeGold}`}
            >
              ⚡ Fast Responder ({currentCard.responsivenessScore ?? 96}%)
            </span>
            <span className={styles.trustBadge}>
              🛡️ DateSafe Escrow
            </span>
          </div>

          {/* Intent Note Quote Callout */}
          {currentCard.intentNote && (
            <div className={styles.intentNoteBox}>
              <span className={styles.intentQuoteIcon}>❝</span>
              <p className={styles.intentNoteText}>{currentCard.intentNote}</p>
            </div>
          )}

          {/* Bio Section */}
          {currentCard.bio && (
            <div className={styles.bioSection}>
              <p className={styles.bioText}>{currentCard.bio}</p>
            </div>
          )}

          {/* Voice Intro Note */}
          {currentCard.voiceNote && (
            <div style={{ padding: "0 18px", marginTop: "8px", marginBottom: "8px" }}>
              <VoiceNotePlayer
                voiceNote={currentCard.voiceNote}
                userName={currentCard.fullName.split(" ")[0]}
              />
            </div>
          )}

          {/* Interactive Prompts */}
          {currentCard.prompts && currentCard.prompts.length > 0 && (
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
          )}
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
            onClick={() => handlePromptReact(currentCard.prompts?.[0]?.question || "Intentional note", currentCard.prompts?.[0]?.answer || "Hello!")}
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

      {/* ✦ Rada On Air — Audio Speed Dating Lounge */}
      <RadaOnAirModal
        isOpen={isRadaOnAirOpen}
        onClose={() => setIsRadaOnAirOpen(false)}
      />

      {/* 👻 Ghost Buster Modal */}
      <GhostBusterModal
        isOpen={isGhostBusterOpen}
        onClose={() => setIsGhostBusterOpen(false)}
      />
    </main>
  );
}
