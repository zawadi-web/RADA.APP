// Audio synthesizer for WhatsApp-style call sounds using the Web Audio API.
// 100% self-contained: No external audio asset downloads or 404s.

class CallSoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!this.ctx || this.ctx.state === "closed") {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Outgoing calling sound: A subtle soft beep when establishing connection to offline/connecting contact
   */
  public playCallingTone(): { stop: () => void } {
    const ctx = this.getContext();
    if (!ctx) return { stop: () => {} };

    let isPlaying = true;
    let timer: NodeJS.Timeout | null = null;
    let currentOsc: OscillatorNode | null = null;

    const playBeep = () => {
      if (!isPlaying || !this.ctx || this.ctx.state === "closed") return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(425, this.ctx.currentTime); // Standard dial tone frequency

        gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + 0.45);
        currentOsc = osc;

        timer = setTimeout(playBeep, 2500);
      } catch {
        // Audio error suppression
      }
    };

    playBeep();

    return {
      stop: () => {
        isPlaying = false;
        if (timer) clearTimeout(timer);
        try {
          if (currentOsc) {
            currentOsc.stop();
            currentOsc.disconnect();
          }
        } catch {}
      },
    };
  }

  /**
   * Outgoing ringback tone: Classic WhatsApp / telephone ringing tone
   * Dual-tone 440Hz + 480Hz modulated pulse (1.2s tone, 2.0s pause)
   */
  public playRingingTone(): { stop: () => void } {
    const ctx = this.getContext();
    if (!ctx) return { stop: () => {} };

    let isPlaying = true;
    let timer: NodeJS.Timeout | null = null;
    let activeNodes: { osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;

    const playRingCycle = () => {
      if (!isPlaying || !this.ctx || this.ctx.state === "closed") return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 440Hz and 480Hz US/Modern dual tone
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);
        osc1.type = "sine";
        osc2.type = "sine";

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        // Ring for 1.2s with soft fade-in and fade-out
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.07, now + 0.05);
        gain.gain.setValueAtTime(0.07, now + 1.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.22);
        osc2.stop(now + 1.22);

        activeNodes = { osc1, osc2, gain };

        // Cycle repeats every 3.2 seconds (1.2s ring + 2.0s silence)
        timer = setTimeout(playRingCycle, 3200);
      } catch {
        // Audio error suppression
      }
    };

    playRingCycle();

    return {
      stop: () => {
        isPlaying = false;
        if (timer) clearTimeout(timer);
        try {
          if (activeNodes) {
            activeNodes.gain.gain.linearRampToValueAtTime(0.001, (this.ctx?.currentTime || 0) + 0.05);
            activeNodes.osc1.stop();
            activeNodes.osc2.stop();
          }
        } catch {}
      },
    };
  }

  /**
   * Incoming call ringtone: WhatsApp marimba chime melody
   * Repeated melodic marimba notes with exponential envelope decay
   */
  public playIncomingRingtone(): { stop: () => void } {
    const ctx = this.getContext();
    if (!ctx) return { stop: () => {} };

    let isPlaying = true;
    let timer: NodeJS.Timeout | null = null;

    // Melodic notes for WhatsApp signature marimba arpeggio (Frequencies in Hz)
    const melody: { freq: number; delay: number; duration: number }[] = [
      { freq: 659.25, delay: 0.0, duration: 0.12 },  // E5
      { freq: 830.61, delay: 0.14, duration: 0.12 }, // G#5
      { freq: 987.77, delay: 0.28, duration: 0.12 }, // B5
      { freq: 1318.51, delay: 0.42, duration: 0.22 }, // E6
      { freq: 987.77, delay: 0.70, duration: 0.12 }, // B5
      { freq: 830.61, delay: 0.84, duration: 0.14 }, // G#5
      { freq: 659.25, delay: 0.98, duration: 0.25 }, // E5
      // Second phrase
      { freq: 739.99, delay: 1.30, duration: 0.12 }, // F#5
      { freq: 880.00, delay: 1.44, duration: 0.12 }, // A5
      { freq: 1108.73, delay: 1.58, duration: 0.22 }, // C#6
      { freq: 987.77, delay: 1.84, duration: 0.28 }, // B5
    ];

    const playMelody = () => {
      if (!isPlaying || !this.ctx || this.ctx.state === "closed") return;
      try {
        const startT = this.ctx.currentTime;

        melody.forEach((note) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "triangle"; // Gives warm wooden marimba harmonic body
          osc.frequency.setValueAtTime(note.freq, startT + note.delay);

          gain.gain.setValueAtTime(0.001, startT + note.delay);
          gain.gain.exponentialRampToValueAtTime(0.18, startT + note.delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startT + note.delay + note.duration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(startT + note.delay);
          osc.stop(startT + note.delay + note.duration + 0.05);
        });

        // Loop melody every 2.8 seconds
        timer = setTimeout(playMelody, 2800);
      } catch {
        // Audio error suppression
      }
    };

    playMelody();

    return {
      stop: () => {
        isPlaying = false;
        if (timer) clearTimeout(timer);
      },
    };
  }

  /**
   * Sound played when call successfully connects
   */
  public playConnectedChime() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch {}
  }

  /**
   * Sound played when call ends or is declined (3 descending beeps)
   */
  public playCallEndedTone() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [
        { freq: 480, delay: 0 },
        { freq: 400, delay: 0.12 },
        { freq: 320, delay: 0.24 },
      ].forEach((tone) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(tone.freq, now + tone.delay);
        gain.gain.setValueAtTime(0.001, now + tone.delay);
        gain.gain.exponentialRampToValueAtTime(0.1, now + tone.delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + tone.delay + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + tone.delay);
        osc.stop(now + tone.delay + 0.11);
      });
    } catch {}
  }
}

export const callSounds = new CallSoundEngine();
