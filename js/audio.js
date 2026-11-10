/**
 * Michelle De Santa 3D - Audio Engine (GTA 3 Style)
 * Robust WebAudio synthesis with zero crash risks and GTA 3 sound effects:
 * - Engine rumble & revs (synchronous, crash-proof)
 * - Car door open/close thud
 * - GTA 3 style pager beeps & Mission Passed fanfare
 * - Punch impacts, cash flutter, and retro jazz noir soundtrack
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.masterGain = null;
    this.isMuted = false;
    this.isPlayingMusic = false;
    this.musicTimer = null;
    this.tempo = 96;
    this.step = 0;

    // Car engine node (strictly managed, no async null pointers)
    this.engineOsc = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startMusic();
    } catch (e) {
      console.warn('Web Audio init error', e);
    }
  }

  ensureContext() {
    try {
      if (!this.ctx) {
        this.init();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {}
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
      }
    } catch (e) {}
    return this.isMuted;
  }

  /* ---------------- NOIR JAZZ / GTA RADIO SOUNDTRACK ---------------- */

  startMusic() {
    if (this.isPlayingMusic || !this.ctx) return;
    this.isPlayingMusic = true;

    // Retro Mafia Jazz bassline (Dm7 -> G7 -> Bbmaj7 -> A7)
    const bassline = [
      73.42, 82.41, 87.31, 98.00,
      98.00, 110.0, 116.54, 123.47,
      65.41, 73.42, 77.78, 87.31,
      87.31, 98.00, 103.83, 110.0,
      58.27, 65.41, 69.30, 73.42,
      82.41, 87.31, 92.50, 98.00,
      110.0, 116.5, 123.4, 130.8,
      73.42, 87.31, 110.0, 146.8
    ];

    const chordTones = [
      [293.66, 349.23, 440.0, 523.25],
      [196.00, 246.94, 293.66, 392.00],
      [261.63, 311.13, 392.00, 466.16],
      [174.61, 220.00, 261.63, 349.23]
    ];

    const beatInterval = (60 / this.tempo) * 1000 / 2;

    this.musicTimer = setInterval(() => {
      try {
        if (!this.isPlayingMusic || !this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const bIndex = this.step % bassline.length;
        const cIndex = Math.floor((this.step / 4) % chordTones.length);

        if (this.step % 2 === 0) {
          this.playBassNote(bassline[bIndex], t, 0.4);
        }

        const isSwing = this.step % 2 === 1;
        this.playHiHat(t, isSwing ? 0.05 : 0.08);

        if (this.step % 8 === 0 || this.step % 8 === 5) {
          this.playChords(chordTones[cIndex], t, 0.85);
        }

        this.step++;
      } catch (e) {}
    }, beatInterval);
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playBassNote(freq, time, dur) {
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, time);
      filter.frequency.exponentialRampToValueAtTime(100, time + dur);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur);
    } catch(e) {}
  }

  playHiHat(time, vol) {
    try {
      const bufferSize = this.ctx.sampleRate * 0.04;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol * 0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(time);
    } catch(e) {}
  }

  playChords(notes, time, dur) {
    try {
      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + dur);
      });
    } catch(e) {}
  }

  /* ---------------- SOUND EFFECTS (GTA 3 STYLE) ---------------- */

  playCarDoor() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Heavy metal car door slam
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.14);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch(e) {}
  }

  playFootstep() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 30, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.05);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch(e) {}
  }

  playJump() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.12);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch(e) {}
  }

  playPunch() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch(e) {}
  }

  playCashThrow() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [900, 1200, 1600].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startT = t + idx * 0.04;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startT);

        gain.gain.setValueAtTime(0.2, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startT);
        osc.stop(startT + 0.2);
      });
    } catch(e) {}
  }

  playCalmFocus() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.8);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.8);
    } catch(e) {}
  }

  playHorn() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(240, t);
      osc1.frequency.exponentialRampToValueAtTime(440, t + 0.22);
      osc1.frequency.setValueAtTime(240, t + 0.23);

      osc2.frequency.setValueAtTime(280, t);
      osc2.frequency.exponentialRampToValueAtTime(520, t + 0.22);
      osc2.frequency.setValueAtTime(280, t + 0.23);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.setValueAtTime(0.4, t + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.55);
      osc2.stop(t + 0.55);
    } catch(e) {}
  }

  playTypewriter() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(650, t);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch(e) {}
  }

  playMissionComplete() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Iconic GTA 3 style brass triumph
      const notes = [
        { f: 440.0, d: 0.15 },
        { f: 554.37, d: 0.15 },
        { f: 659.25, d: 0.20 },
        { f: 880.0, d: 0.60 }
      ];

      let delay = 0;
      notes.forEach((n) => {
        const start = t + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(n.f, start);

        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + n.d);
        delay += n.d * 0.85;
      });
    } catch(e) {}
  }

  /* ---------------- ROBUST CRASH-PROOF CAR ENGINE AUDIO ---------------- */

  startCarEngine() {
    this.ensureContext();
    if (this.isEngineRunning || !this.ctx) return;
    this.isEngineRunning = true;

    try {
      this.stopCarEngine(); // Clean up existing if any
      this.isEngineRunning = true;

      const t = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, t);

      this.engineGain.gain.setValueAtTime(0.2, t);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);

      this.engineOsc.start(t);
    } catch(e) {
      console.warn('startCarEngine error', e);
    }
  }

  updateCarEngine(speedRatio) {
    try {
      if (!this.isEngineRunning || !this.engineOsc || !this.ctx) return;
      const ratio = Math.max(0, Math.min(1.5, speedRatio || 0));
      const targetFreq = 45 + ratio * 120;
      this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    } catch(e) {}
  }

  stopCarEngine() {
    this.isEngineRunning = false;
    try {
      if (this.engineOsc) {
        try { this.engineOsc.stop(); } catch(e) {}
        try { this.engineOsc.disconnect(); } catch(e) {}
        this.engineOsc = null;
      }
      if (this.engineGain) {
        try { this.engineGain.disconnect(); } catch(e) {}
        this.engineGain = null;
      }
    } catch(e) {}
  }
}

window.soundEngine = new SoundEngine();
