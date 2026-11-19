// Tiny synthesised sound effects (Web Audio, no files). Sound starts on the first key or click.
let ctx = null;
export function unlockAudio() { if (!ctx) { try { ctx = new AudioContext(); } catch { ctx = null; } } if (ctx && ctx.state === 'suspended') ctx.resume(); }

function tone(freq, dur, type, vol, slide = 0) {
  if (!ctx) return;
  const t = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sfx = {
  fire: () => tone(660, 0.08, 'triangle', 0.05, -300),
  hit: () => tone(220, 0.06, 'square', 0.04, -80),
  kill: () => tone(420, 0.14, 'sawtooth', 0.05, 380),
  hurt: () => tone(140, 0.35, 'sawtooth', 0.12, -90),
  dash: () => tone(300, 0.16, 'sine', 0.08, 500),
  pick: () => tone(980, 0.07, 'sine', 0.04, 300),
  clear: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.07), i * 90)),
  over: () => [330, 262, 196, 131].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.07), i * 160)),
  pickUpgrade: () => tone(740, 0.2, 'square', 0.06, 500),
};
