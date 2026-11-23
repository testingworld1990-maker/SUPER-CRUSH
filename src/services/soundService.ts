/**
 * Pure Web Audio API Sound Synthesizer & Haptic Feedback Service
 * Zero external audio files required — works 100% offline.
 */

class SoundService {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private musicEnabled = false;
  private vibrationEnabled = true;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private adPaused = false;
  private appHidden = false;

  // Heroic cinematic Avengers-style D-minor synth-brass arpeggio motif
  private readonly melodyNotes = [
    146.83, 146.83, 220.0, 261.63, 293.66, 261.63, 220.0, 174.61,
    146.83, 220.0, 293.66, 329.63, 349.23, 329.63, 293.66, 220.0,
  ];

  constructor() {
    if (typeof document !== 'undefined') {
      const syncVisibility = () => {
        const hidden = document.visibilityState === 'hidden';
        this.appHidden = hidden;
        if (hidden) {
          this.suspendAudio();
        } else if (!this.adPaused) {
          this.resumeAudio();
        }
      };
      document.addEventListener('visibilitychange', syncVisibility);
      window.addEventListener('pagehide', () => {
        this.appHidden = true;
        this.suspendAudio();
      });
    }
  }

  private suspendAudio() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  private resumeAudio() {
    if (this.ctx && this.ctx.state === 'suspended' && (this.soundEnabled || this.musicEnabled)) {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Called automatically by AdService while a full-screen video/interstitial ad is active. */
  public pauseForAd() {
    this.adPaused = true;
    this.suspendAudio();
  }

  /** Called automatically by AdService once a full-screen ad closes. */
  public resumeAfterAd() {
    this.adPaused = false;
    if (!this.appHidden) {
      this.resumeAudio();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public configure(opts: { sound: boolean; music: boolean; vibration: boolean }) {
    this.soundEnabled = opts.sound;
    this.vibrationEnabled = opts.vibration;
    if (opts.music !== this.musicEnabled) {
      this.musicEnabled = opts.music;
      if (this.musicEnabled) {
        this.startMusic();
      } else {
        this.stopMusic();
      }
    }
  }

  public vibrate(pattern: number | number[]) {
    if (!this.vibrationEnabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.14,
    slideTo?: number,
    delay = 0
  ) {
    if (!this.soundEnabled || this.adPaused || this.appHidden) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), startTime + duration);
    }

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  public playTap() {
    this.playTone(540, 0.06, 'sine', 0.09, 680);
  }

  public playSwap() {
    this.playTone(340, 0.09, 'triangle', 0.11, 520);
  }

  public playInvalid() {
    this.playTone(230, 0.11, 'sawtooth', 0.08, 150);
    this.playTone(170, 0.12, 'sawtooth', 0.07, 120, 0.07);
    this.vibrate(25);
  }

  public playMatch(combo = 1) {
    const scale = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const base = scale[Math.min(scale.length - 1, Math.max(0, combo - 1))];
    this.playTone(base, 0.16, 'triangle', 0.15, base * 1.15);
    this.playTone(base * 1.25, 0.14, 'sine', 0.1, base * 1.5, 0.045);
    this.vibrate(combo >= 3 ? [18, 20, 26] : 14);
  }

  public playSpecialBlast() {
    this.playTone(220, 0.25, 'sawtooth', 0.13, 880);
    this.playTone(660, 0.3, 'triangle', 0.14, 1320, 0.05);
    this.vibrate([25, 25, 45]);
  }

  public playRainbow() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.18, 'sine', 0.12, n * 1.05, idx * 0.045);
    });
    this.vibrate([30, 20, 30, 20, 60]);
  }

  public playUltimateReady() {
    this.playTone(587.33, 0.14, 'triangle', 0.12, 880);
    this.playTone(880.0, 0.22, 'sine', 0.14, 1174.66, 0.08);
    this.vibrate([15, 15, 30]);
  }

  public playHeroUltimate() {
    // Cinematic heroic power-chord surge + sub-bass impact boom
    this.playTone(110, 0.42, 'sawtooth', 0.16, 55);
    const chord = [293.66, 440.0, 587.33, 880.0, 1174.66];
    chord.forEach((freq, idx) => {
      this.playTone(freq, 0.35, idx % 2 === 0 ? 'triangle' : 'sawtooth', 0.12, freq * 1.08, idx * 0.04);
    });
    this.vibrate([35, 20, 45, 20, 75]);
  }

  public playBossHit() {
    this.playTone(160, 0.18, 'square', 0.12, 75);
    this.playTone(320, 0.12, 'triangle', 0.1, 200, 0.04);
    this.vibrate([25, 15, 35]);
  }

  public playCoin() {
    this.playTone(987.77, 0.08, 'sine', 0.12);
    this.playTone(1318.51, 0.18, 'sine', 0.13, undefined, 0.065);
  }

  public playSpinTick() {
    this.playTone(720, 0.035, 'triangle', 0.08, 480);
  }

  public playThaliTilt() {
    this.playTone(196.0, 0.28, 'sine', 0.14, 293.66);
    this.playTone(392.0, 0.24, 'triangle', 0.09, 587.33, 0.04);
    this.playTone(587.33, 0.18, 'sine', 0.06, 783.99, 0.09);
    this.vibrate([18, 16, 22]);
  }

  public playKadhaiSizzle() {
    const notes = [440.0, 554.37, 659.25, 880.0, 1108.73];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.22, idx % 2 === 0 ? 'triangle' : 'sine', 0.13, n * 1.06, idx * 0.04);
    });
    this.vibrate([22, 18, 28, 18, 45]);
  }

  public playParadeOffering(streak = 1) {
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];
    const freq = pentatonic[(streak - 1) % pentatonic.length];
    this.playTone(freq, 0.14, 'sine', 0.11, freq * 1.03);
    this.playTone(freq * 1.5, 0.1, 'triangle', 0.06, undefined, 0.03);
    this.vibrate(10);
  }

  public playParadeLeap() {
    this.playTone(130, 0.16, 'sine', 0.16, 72);
    this.playTone(440, 0.14, 'triangle', 0.1, 660, 0.04);
    this.vibrate([14, 14, 20]);
  }

  public playWin() {
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 0.1, 0.2, 0.32, 0.48, 0.6];
    fanfare.forEach((n, i) => {
      this.playTone(n, i === fanfare.length - 1 ? 0.45 : 0.16, 'triangle', 0.16, undefined, times[i]);
    });
    this.vibrate([40, 30, 40, 30, 90]);
  }

  public playFail() {
    const notes = [392.0, 349.23, 311.13, 261.63];
    notes.forEach((n, i) => {
      this.playTone(n, 0.22, 'triangle', 0.13, n * 0.96, i * 0.14);
    });
    this.vibrate([50, 40, 80]);
  }

  public playInfinitySnap() {
    // Crisp metallic snap crack -> massive sub-bass drop -> cosmic golden choir shimmer
    this.playTone(2200, 0.045, 'square', 0.14, 480, 0);
    this.playTone(95, 0.52, 'sine', 0.24, 34, 0.04);
    const cosmicChord = [293.66, 440.0, 587.33, 739.99, 880.0, 1174.66];
    cosmicChord.forEach((f, idx) => {
      this.playTone(f, 0.34, 'triangle', 0.11, f * 1.04, 0.08 + idx * 0.045);
    });
    this.vibrate([20, 15, 70, 25, 90]);
  }

  public playBossStrike() {
    // Menacing villain bass drop + distorted warning pulse
    this.playTone(130, 0.28, 'sawtooth', 0.15, 52, 0);
    this.playTone(185, 0.22, 'sawtooth', 0.12, 78, 0.09);
    this.playTone(75, 0.32, 'sine', 0.2, 40, 0.14);
    this.vibrate([45, 25, 65]);
  }

  public playHeroTag() {
    this.playTone(440, 0.08, 'triangle', 0.1, 660, 0);
    this.playTone(660, 0.11, 'sine', 0.11, 987.77, 0.05);
    this.vibrate(14);
  }

  public startMusic() {
    if (this.musicTimer !== null || typeof window === 'undefined') return;
    this.musicTimer = window.setInterval(() => {
      if (!this.musicEnabled || this.adPaused || this.appHidden) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;
      const step = this.musicStep++;
      const note = this.melodyNotes[step % this.melodyNotes.length];
      const now = ctx.currentTime;

      // Warm heroic synth-brass melody voice
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.036, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      // Subtle epic pulse on every 4th beat
      if (step % 4 === 0) {
        const bass = ctx.createOscillator();
        const bGain = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(73.42, now);
        bGain.gain.setValueAtTime(0.001, now);
        bGain.gain.linearRampToValueAtTime(0.045, now + 0.02);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        bass.connect(bGain);
        bGain.connect(ctx.destination);
        bass.start(now);
        bass.stop(now + 0.44);
      }
    }, 390);
  }

  public stopMusic() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundService = new SoundService();
