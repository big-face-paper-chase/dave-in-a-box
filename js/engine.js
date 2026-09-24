/* dave-in-a-box — engine.js
 * A tiny Web Audio live-coding DJ engine.
 * Patterns are plain objects produced by the DSL helpers (drums/bass/keys).
 * The scheduler runs a classic lookahead loop; each 16th note is one step.
 */
'use strict';

/* ---------- note names to frequencies ---------- */

function noteToFreq(token) {
  const m = /^([a-gA-G])([#b]?)(-?\d+)$/.exec(String(token).trim());
  if (!m) return null;
  const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[m[1].toLowerCase()];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  const midi = (parseInt(m[3], 10) + 1) * 12 + base + acc;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/* ---------- the DSL (exposed as globals for the live editors) ---------- */

function drums(map) {
  return { type: 'drums', map: map || {} };
}

function _melodic(kind, seq, opts) {
  opts = opts || {};
  const notes = String(seq).trim() === '' ? [] : String(seq).trim().split(/\s+/);
  const out = {
    type: 'melodic',
    kind: kind,
    notes: notes,
    wave: kind === 'bass' ? 'sawtooth' : 'triangle',
    cutoff: kind === 'bass' ? 700 : 2200,
    decay: 0.22,
    peak: 0.4,
    send: 1
  };
  for (const k of Object.keys(opts)) out[k] = opts[k];
  return out;
}

function bass(seq, opts) { return _melodic('bass', seq, opts); }
function keys(seq, opts) { return _melodic('keys', seq, opts); }

/* ---------- the engine ---------- */

class DaveEngine {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.bpm = 92;
    this.swing = 0;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.patterns = { drums: null, bass: null, keys: null };
    this.muted = { drums: false, bass: false, keys: false };
    this.cutoff = 16000;
    this.delayAmt = 0.22;
  }

  ensureCtx() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    const c = (this.ctx = new AC());

    // shared noise buffer
    const len = c.sampleRate;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // master: gain -> lowpass (MUFFLE) -> compressor -> out
    this.master = c.createGain();
    this.master.gain.value = 0.9;
    this.filter = c.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = this.cutoff;
    this.filter.Q.value = 0.7;
    this.comp = c.createDynamicsCompressor();
    this.master.connect(this.filter);
    this.filter.connect(this.comp);
    this.comp.connect(c.destination);

    // dub-style delay send
    this.sendBus = c.createGain();
    this.sendBus.gain.value = 1;
    this.delay = c.createDelay(2.0);
    this.delay.delayTime.value = this.dotted8();
    this.fb = c.createGain();
    this.fb.gain.value = 0.38;
    this.dampen = c.createBiquadFilter();
    this.dampen.type = 'lowpass';
    this.dampen.frequency.value = 2400;
    const wet = c.createGain();
    wet.gain.value = 0.5;
    this.sendBus.connect(this.delay);
    this.delay.connect(this.dampen);
    this.dampen.connect(this.fb);
    this.fb.connect(this.delay);
    this.dampen.connect(wet);
    wet.connect(this.master);

    // per-channel gains (for muting)
    this.chanGain = {};
    for (const n of ['drums', 'bass', 'keys']) {
      const g = c.createGain();
      g.gain.value = 1;
      g.connect(this.master);
      this.chanGain[n] = g;
    }
  }

  dotted8() { return (60 / this.bpm) * 0.75; }

  setBpm(b) {
    this.bpm = Math.min(200, Math.max(60, b));
    if (this.delay) this.delay.delayTime.value = this.dotted8();
  }
  setSwing(s) { this.swing = Math.min(0.6, Math.max(0, s)); }
  setCutoff(f) {
    this.cutoff = f;
    if (this.filter) this.filter.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.03);
  }
  setDelayAmt(a) { this.delayAmt = a; }
  setMuted(ch, m) {
    this.muted[ch] = m;
    if (this.chanGain[ch]) {
      this.chanGain[ch].gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.02);
    }
  }
  setPattern(ch, pat) { this.patterns[ch] = pat; }

  play() {
    this.ensureCtx();
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 25);
  }

  stop() {
    this.playing = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  tick() {
    const stepDur = 60 / this.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.14) {
      const off = this.step % 2 === 1 ? stepDur * this.swing * 0.5 : 0;
      this.scheduleStep(this.step, this.nextTime + off);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  scheduleStep(step, t) {
    for (const ch of ['drums', 'bass', 'keys']) {
      if (this.muted[ch]) continue;
      const p = this.patterns[ch];
      if (!p) continue;
      if (p.type === 'drums') this.playDrums(p.map, step, t);
      else if (p.type === 'melodic') this.playMelodic(ch, p, step, t);
    }
  }

  /* ----- drums ----- */

  playDrums(map, step, t) {
    for (const k of Object.keys(map)) {
      const s = String(map[k]);
      if (!s.length) continue;
      const ch = s[step % s.length];
      if (ch === 'x' || ch === 'X' || ch === 'o' || ch === 'O') {
        this.drumHit(k, t, ch === 'X' || ch === 'O' ? 1.25 : 1);
      }
    }
  }

  drumHit(kind, t, v) {
    switch (kind) {
      case 'kick': return this.kick(t, v);
      case 'snare': return this.snare(t, v);
      case 'clap': return this.clap(t, v);
      case 'chat': return this.hat(t, 0.05, v);
      case 'ohat': return this.hat(t, 0.38, v);
      case 'perc': return this.perc(t, v);
      default: return null; // unknown drum name: ignored, no crash
    }
  }

  _env(g, t, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0011, peak), t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  }

  kick(t, v) {
    v = v || 1;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    this._env(g, t, 0.95 * v, 0.3);
    o.connect(g); g.connect(this.chanGain.drums);
    o.start(t); o.stop(t + 0.35);
  }

  noiseHit(t, o) {
    o = o || {};
    const dur = o.dur || 0.2, peak = o.peak || 0.5, send = o.send || 0;
    const c = this.ctx, s = c.createBufferSource();
    s.buffer = this.noiseBuf; s.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.type || 'highpass';
    f.frequency.value = o.freq || 7000;
    f.Q.value = o.Q || 1;
    const g = c.createGain();
    this._env(g, t, peak, dur);
    s.connect(f); f.connect(g); g.connect(this.chanGain.drums);
    if (send > 0) {
      const sg = c.createGain();
      sg.gain.value = send;
      g.connect(sg); sg.connect(this.sendBus);
    }
    s.start(t); s.stop(t + dur + 0.05);
  }

  snare(t, v) {
    v = v || 1;
    this.noiseHit(t, { dur: 0.16, type: 'bandpass', freq: 1900, Q: 0.8, peak: 0.55 * v, send: 0.15 });
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle'; o.frequency.value = 190;
    this._env(g, t, 0.35 * v, 0.09);
    o.connect(g); g.connect(this.chanGain.drums);
    o.start(t); o.stop(t + 0.12);
  }

  clap(t, v) {
    v = v || 1;
    for (let i = 0; i < 3; i++) {
      this.noiseHit(t + i * 0.012, { dur: 0.09, type: 'bandpass', freq: 1300, Q: 1.5, peak: 0.4 * v });
    }
  }

  hat(t, dur, v) {
    v = v || 1;
    this.noiseHit(t, { dur: dur, type: 'highpass', freq: 7800, peak: 0.3 * v });
  }

  perc(t, v) {
    v = v || 1;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = 880;
    this._env(g, t, 0.16 * v, 0.05);
    o.connect(g); g.connect(this.chanGain.drums);
    o.start(t); o.stop(t + 0.08);
    this.noiseHit(t, { dur: 0.04, type: 'bandpass', freq: 3200, Q: 2, peak: 0.18 * v });
  }

  /* ----- melodic (bass / keys) ----- */

  melodicNote(ch, t, freq, dur, opts) {
    const c = this.ctx;
    const o = c.createOscillator(), o2 = c.createOscillator();
    const g = c.createGain(), f = c.createBiquadFilter();
    o.type = opts.wave || 'sawtooth';
    o.frequency.value = freq;
    o2.type = opts.wave || 'sawtooth';
    o2.frequency.value = freq;
    o2.detune.value = 8;
    f.type = 'lowpass';
    f.frequency.value = opts.cutoff || 1200;
    f.Q.value = 1;
    const peak = opts.peak || 0.4;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0011, peak), t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.06, dur));
    o.connect(f); o2.connect(f); f.connect(g); g.connect(this.chanGain[ch]);
    if (this.delayAmt > 0.01) {
      const sg = c.createGain();
      sg.gain.value = this.delayAmt * (opts.send === undefined ? 1 : opts.send);
      g.connect(sg); sg.connect(this.sendBus);
    }
    o.start(t); o2.start(t);
    o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  playMelodic(ch, p, step, t) {
    const n = p.notes.length;
    if (!n) return;
    const tok = p.notes[step % n];
    if (!tok || tok === '.' || tok === '-') return;
    const freq = noteToFreq(tok);
    if (!freq) return;
    this.melodicNote(ch, t, freq, p.decay || 0.22, p);
  }

  /* ----- one-shots ----- */

  airhorn() {
    this.ensureCtx();
    const t = this.ctx.currentTime + 0.02, c = this.ctx;
    const freqs = [392, 493.88, 587.33]; // the sacred chord of poor decisions
    for (const fr of freqs) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.03);
      g.gain.setValueAtTime(0.2, t + 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 0.75);
    }
  }

  siren() {
    this.ensureCtx();
    const t = this.ctx.currentTime + 0.02, c = this.ctx;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(650, t);
    o.frequency.linearRampToValueAtTime(1250, t + 0.35);
    o.frequency.linearRampToValueAtTime(650, t + 0.7);
    o.frequency.linearRampToValueAtTime(1250, t + 1.05);
    o.frequency.linearRampToValueAtTime(650, t + 1.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 1.5);
  }
}
