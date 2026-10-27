// Small synthesizer for animation sounds. Everything is generated with the Web Audio API:
// oscillators for tones, a noise buffer for whooshes and splashes, envelopes for shape.
(() => {
  'use strict';
  let ctx = null, out = null, noise = null, volume = 0.6;
  let recent = [];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      out = ctx.createGain();
      out.gain.value = volume * 0.85;
      out.connect(comp);
      comp.connect(ctx.destination);
      // One second of white noise, reused by every noisy sound.
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Attack–hold–release envelope on a gain node.
  function envelope(peak, t0, attack, hold, release) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.setValueAtTime(peak, t0 + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
    g.connect(out);
    return g;
  }

  function tone(type, f0, f1, t0, dur, peak, release = 0.08) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + Math.max(0.02, dur));
    o.connect(envelope(peak, t0, 0.012, Math.max(0, dur - 0.012), release));
    o.start(t0);
    o.stop(t0 + dur + release + 0.05);
  }

  function noisy(filterType, f0, f1, t0, dur, peak, q = 1.2) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filterType;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0);
    f.frequency.exponentialRampToValueAtTime(f1, t0 + Math.max(0.02, dur));
    src.connect(f);
    f.connect(envelope(peak, t0, Math.min(0.05, dur / 3), Math.max(0, dur * 0.4), dur * 0.6 + 0.05));
    src.start(t0);
    src.stop(t0 + dur + 0.2);
  }

  const clampF = (f) => Math.min(4000, Math.max(40, f || 440));

  const voices = {
    glide: (e, d, t) => tone('triangle', clampF(e.from), clampF(e.to), t, Math.max(0.06, d), 0.11),
    curve(e, d, t) {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      const freqs = Float32Array.from(e.freqs.map(clampF));
      o.frequency.setValueCurveAtTime(freqs, t, Math.max(0.06, d));
      o.connect(envelope(0.1, t, 0.02, Math.max(0, d - 0.02), 0.1));
      o.start(t);
      o.stop(t + d + 0.2);
    },
    tick: (e, d, t) => tone('triangle', clampF(e.f), null, t, 0.03, 0.14, 0.09),
    pop: (e, d, t) => tone('sine', clampF(e.f * 2.2), clampF(e.f * 0.7), t, 0.06, 0.2, 0.06),
    chime(e, d, t) {
      [1, 1.25, 1.5, 2].forEach((r, i) => tone('sine', clampF(e.f * r), null, t + i * 0.035, 0.02, 0.07, 1.1));
    },
    chord(e, d, t) {
      e.freqs.forEach((f, i) => tone('sine', clampF(f), null, t + i * 0.09, 0.05, 0.08, 1.4));
    },
    whoosh: (e, d, t) => noisy('bandpass', 350, 2400, t, Math.max(0.15, d), 0.16),
    swoosh: (e, d, t) => noisy('bandpass', 2400, 350, t, Math.max(0.15, d), 0.16),
    snip: (e, d, t) => { noisy('highpass', 4000, 6000, t, 0.04, 0.22, 0.7); tone('square', 1800, 1200, t, 0.02, 0.04, 0.03); },
    thud: (e, d, t) => tone('sine', 140, 45, t, 0.18, 0.35, 0.12),
    // A sustained note built from harmonics: amps[i] is the strength of (i + 1) × f. Used to let you hear pitch, loudness and timbre.
    hum(e, d, t) {
      const amps = e.harmonics || [1], sum = amps.reduce((a, b) => a + Math.abs(b), 0) || 1;
      amps.forEach((a, i) => {
        const f = e.f * (i + 1);
        if (a > 0 && f < 6000) tone('sine', Math.max(30, f), null, t, Math.max(0.12, d), Math.max(0.0002, (0.16 * (e.gain ?? 1) * a) / sum), 0.15);
      });
    },
    splash: (e, d, t) => noisy('lowpass', 4000, 300, t, 0.45, 0.25, 0.8),
  };

  MV.sound = {
    unlock: ensure,
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (out) out.gain.setTargetAtTime(volume * 0.85, ctx.currentTime, 0.02);
    },
    play(e, seconds) {
      if (volume <= 0 || !ensure()) return;
      // Don't let a burst of simultaneous events turn into noise.
      const now = ctx.currentTime;
      recent = recent.filter((x) => now - x < 0.08);
      if (recent.length > 6) return;
      recent.push(now);
      try { voices[e.kind]?.(e, seconds, now + 0.01); } catch { /* a sound must never break the animation */ }
    },
  };
})();
