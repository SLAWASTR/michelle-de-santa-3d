/**
 * Michelle De Santa 3D - Procedural WebAudio Sound Engine
 * Noir Jazz soundtrack & interactive 3D sound effects (Zero external files needed)
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
    this.tempo = 92; // Swing jazz BPM
    this.step = 0;

    // Car engine node
    this.engineOsc = null;
    this.engineGain = null;
    this.engineNoise = null;
    this.isEngineRunning = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.startMusic();
    } catch (e) {
      console.warn('Web Audio not supported or failed to initialize', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /* ---------------- NOIR JAZZ MUSIC GENERATOR ---------------- */

  startMusic() {
    if (this.isPlayingMusic || !this.ctx) return;
    this.isPlayingMusic = true;

    // Jazzy chord progression in D minor noir
    // Dm9 -> G13 -> Cm9 -> F13 -> Bbmaj7 -> Em7b5 -> A7alt -> Dm9
    const bassline = [
      73.42, 82.41, 87.31, 98.00,  // D, E, F, G
      98.00, 110.0, 116.54, 123.47, // G, A, Bb, B
      65.41, 73.42, 77.78, 87.31,  // C, D, Eb, F
      87.31, 98.00, 103.83, 110.0, // F, G, Ab, A
      58.27, 65.41, 69.30, 73.42,  // Bb, C, Db, D
      82.41, 87.31, 92.50, 98.00,  // E, F, F#, G
      110.0, 116.5, 123.4, 130.8,  // A, Bb, B, C
      73.42, 87.31, 110.0, 146.8   // D arpeggio
    ];

    const chordTones = [
      [293.66, 349.23, 440.0, 523.25], // Dm7
      [196.00, 246.94, 293.66, 392.00], // G7
      [261.63, 311.13, 392.00, 466.16], // Cm7
      [174.61, 220.00, 261.63, 349.23], // F7
      [233.08, 293.66, 349.23, 440.00], // Bbmaj7
      [164.81, 196.00, 233.08, 293.66], // Em7b5
      [220.00, 277.18, 329.63, 392.00], // A7
      [293.66, 349.23, 440.0, 587.33]  // Dm9
    ];

    const leadNotes = [
      587.33, 0, 523.25, 440.0, 466.16, 440.0, 0, 392.0,
      349.23, 392.0, 440.0, 0, 523.25, 587.33, 659.25, 587.33
    ];

    const beatInterval = (60 / this.tempo) * 1000 / 2; // 8th notes

    this.musicTimer = setInterval(() => {
      if (!this.isPlayingMusic || !this.ctx || this.isMuted) return;

      const t = this.ctx.currentTime;
      const bIndex = this.step % bassline.length;
      const cIndex = Math.floor((this.step / 4) % chordTones.length);

      // 1. Upright Acoustic Bass Note
      if (this.step % 2 === 0) {
        this.playBassNote(bassline[bIndex], t, 0.45);
      }

      // 2. Jazz Brush Hi-Hat (swing feel)
      const isSwing = this.step % 2 === 1;
      this.playHiHat(t, isSwing ? 0.05 : 0.08);

      // 3. Electric Piano Rhodes Chord on beat 1 and syncopated beat 3.5
      if (this.step % 8 === 0 || this.step % 8 === 5) {
        this.playChords(chordTones[cIndex], t, 0.9);
      }

      // 4. Subtle Saxophone / Trumpet Muted Lead
      const lead = leadNotes[this.step % leadNotes.length];
      if (lead > 0 && Math.random() > 0.3) {
        this.playLeadNote(lead, t, 0.6);
      }

      this.step++;
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
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + dur);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  playHiHat(time, vol) {
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
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
  }

  playChords(notes, time, dur) {
    notes.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur);
    });
  }

  playLeadNote(freq, time, dur) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.06, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }

  /* ---------------- SOUND EFFECTS ---------------- */

  playFootstep() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  playJump() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playPunch() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Whoosh + Thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  playCashThrow() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Fling chime (money coins + paper flutter)
    [880, 1174, 1318, 1760].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = t + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.2, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startT);
      osc.stop(startT + 0.25);
    });
  }

  playCalmFocus() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Deep sub-drone + shimmer
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.8);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  playHorn() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Vintage 1930s "AHOO-GA!" horn
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';

    // AHOO pitch rise then GA drop
    osc1.frequency.setValueAtTime(220, t);
    osc1.frequency.exponentialRampToValueAtTime(440, t + 0.22);
    osc1.frequency.setValueAtTime(220, t + 0.23);

    osc2.frequency.setValueAtTime(260, t);
    osc2.frequency.exponentialRampToValueAtTime(520, t + 0.22);
    osc2.frequency.setValueAtTime(260, t + 0.23);

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
  }

  playTypewriter() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(600 + Math.random() * 200, t);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.03);
  }

  playMissionComplete() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Brass triumphal fanfare
    const notes = [
      { f: 392.00, d: 0.15 }, // G
      { f: 523.25, d: 0.15 }, // C
      { f: 659.25, d: 0.20 }, // E
      { f: 783.99, d: 0.50 }  // G high
    ];

    let delay = 0;
    notes.forEach((n) => {
      const start = t + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.3, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + n.d);
      delay += n.d * 0.85;
    });
  }

  /* ---------------- VINTAGE CAR ENGINE AUDIO ---------------- */

  startCarEngine() {
    this.ensureContext();
    if (this.isEngineRunning || !this.ctx) return;
    this.isEngineRunning = true;

    const t = this.ctx.currentTime;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();

    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, t); // Idle RPM

    // Low pass filter to make it sound like a throaty V8 engine
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, t);

    this.engineGain.gain.setValueAtTime(0.2, t);

    this.engineOsc.connect(filter);
    filter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start(t);
  }

  updateCarEngine(speedRatio) {
    if (!this.isEngineRunning || !this.engineOsc || !this.ctx) return;
    const targetFreq = 45 + speedRatio * 110;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
  }

  stopCarEngine() {
    if (!this.isEngineRunning) return;
    this.isEngineRunning = false;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
    }
    setTimeout(() => {
      if (this.engineOsc) {
        try { this.engineOsc.stop(); } catch(e) {}
        this.engineOsc = null;
      }
    }, 250);
  }
}

window.soundEngine = new SoundEngine();
