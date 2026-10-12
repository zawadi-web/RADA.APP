"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRada } from "@/lib/rada-context";
import { IntentBadge } from "@/components/ui/IntentBadge";
import { LocationBadge } from "@/components/ui/LocationBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { VoiceNotePlayer } from "@/components/ui/VoiceNotePlayer";
import { PromptReactionSheet } from "@/components/features/PromptReactionSheet";
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

// Location toggle button
const LocationBtn = ({
  useLocation, locationError, onToggle, isPending,
}: {
  useLocation: boolean; locationError: string | null; onToggle: () => void; isPending?: boolean;
}) => (
  <button
    onClick={onToggle}
    disabled={isPending}
    title={useLocation ? "Location ON — tap to disable" : "Enable location to see nearby matches"}
    style={{
      background: useLocation ? "rgba(52,211,153,0.15)" : isPending ? "rgba(255,200,50,0.12)" : "rgba(255,255,255,0.06)",
      border: `1px solid ${useLocation ? "#34D399" : locationError ? "rgba(255,90,95,0.5)" : isPending ? "rgba(255,200,50,0.5)" : "var(--color-border)"}`,
      color: useLocation ? "#34D399" : isPending ? "#FFC832" : locationError ? "#FF7B7F" : "var(--color-text-secondary)",
      borderRadius: "20px",
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: 600,
      cursor: isPending ? "wait" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      transition: "all 0.2s",
    }}
  >
    {isPending ? "⏳" : "📍"} {isPending ? "Locating..." : useLocation ? "Nearby" : "Location"}
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
                  background: "radial-gradient(circle at 50% 40%, #2D1445 0%, #0D0520 100%)",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(255,107,138,0.25), rgba(157,78,221,0.25))",
                    border: "2px solid rgba(255,107,138,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "42px",
                    fontWeight: 800,
                    color: "#FFF8F0",
                  }}
                >
                  {currentCard.fullName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: 600 }}>
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
