"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./VoiceNotePlayer.module.css";
import { VoiceNote } from "@/lib/types";

interface VoiceNotePlayerProps {
  voiceNote: VoiceNote;
  userName?: string;
  autoPlay?: boolean;
}

const BAR_PATTERNS = [
  25, 45, 70, 85, 60, 40, 75, 95, 100, 80, 50, 65, 85, 70, 45, 60, 90, 75, 55, 40, 65, 80, 50, 30,
];

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  voiceNote,
  userName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const duration = voiceNote.durationSec || 20;

  // Toggle speed
  const handleCycleSpeed = () => {
    setSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  // Synthesize soft vocal chime during playback
  const playAmbientTone = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        // Warm harmonic sequence
        const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        osc.frequency.setValueAtTime(randomNote, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // AudioContext unavailable or blocked by policy
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const stepMs = 100 / speed;
      const totalSteps = (duration * 1000) / stepMs;
      const stepDelta = 1 / totalSteps;

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 1) {
            setIsPlaying(false);
            return 0;
          }
          if (Math.random() > 0.7) {
            playAmbientTone();
          }
          return prev + stepDelta;
        });
      }, stepMs);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, duration]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      playAmbientTone();
      setIsPlaying(true);
    }
  };

  const currentSeconds = Math.floor(progress * duration);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className={styles.container}>
      {/* Header Prompt Tag */}
      <div className={styles.header}>
        <div className={styles.promptBadge} title={voiceNote.promptTitle}>
          <span>🎙️</span>
          <span>{voiceNote.promptTitle}</span>
        </div>
        <button
          className={styles.speedBtn}
          onClick={handleCycleSpeed}
          title="Playback speed"
          type="button"
        >
          {speed}x
        </button>
      </div>

      {/* Interactive Player Controls & Waveform */}
      <div className={styles.playerRow}>
        <button
          className={`${styles.playBtn} ${isPlaying ? styles.playBtnActive : ""}`}
          onClick={togglePlay}
          type="button"
          aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className={styles.icon}>
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className={styles.icon}>
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>

        <div className={styles.waveformWrapper}>
          <div className={styles.waveform}>
            {BAR_PATTERNS.map((pct, idx) => {
              const barProgress = idx / BAR_PATTERNS.length;
              const isPlayed = progress >= barProgress;
              const isCurrent = isPlaying && Math.abs(progress - barProgress) < 0.08;
              return (
                <div
                  key={idx}
                  className={`${styles.bar} ${isPlayed ? styles.barPlayed : ""} ${isCurrent ? styles.barActive : ""}`}
                  style={{
                    height: `${pct}%`,
                    cursor: "pointer",
                  }}
                  onClick={() => setProgress(barProgress)}
                />
              );
            })}
          </div>

          <div className={styles.timeRow}>
            <span>{formatTime(currentSeconds)} / {formatTime(duration)}</span>
            <span className={styles.vibeTag}>
              {userName ? `${userName}'s Voice Vibe` : "Authentic Nairobi Vibe"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
