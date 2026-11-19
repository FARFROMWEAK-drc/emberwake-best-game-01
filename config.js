// Every tuning number, colour and content table in one place. The field is a fixed 1280x720.
export const FIELD = { w: 1280, h: 720 };
export const STEP = 1 / 60;
export const FINAL_WAVE = 6;
export const HP_START = 4;
export const PLAYER = { r: 13, speed: 250, dashSpeed: 760, dashTime: 0.16, dashCooldown: 1.6, invuln: 1.1, fireGap: 0.26, boltSpeed: 720, boltLife: 0.9, magnet: 90 };
export const COMBO = { window: 3, perStep: 8 };
export const SHARDS_PER_HEART = 14;

// Foe kinds: hp, radius, speed, score; `keep` is the range a spitter holds, `gap` its seconds between shots.
export const FOES = {
  wisp: { hp: 1, r: 12, speed: 120, score: 10, col: '#7a5cff' },
  spitter: { hp: 3, r: 15, speed: 75, score: 30, col: '#ff5c8a', keep: 270, gap: 2.1 },
  brute: { hp: 9, r: 27, speed: 58, score: 60, col: '#ff9d4a' },
  gloomhorn: { hp: 120, r: 58, speed: 38, score: 1000, col: '#b0307a', gap: 1.5 },
};

// What each wave sends: [kind, count] pairs, spread across the wave's spawn time.
export const WAVES = [
  [['wisp', 10]],
  [['wisp', 12], ['spitter', 3]],
  [['wisp', 14], ['spitter', 4], ['brute', 2]],
  [['wisp', 16], ['spitter', 6], ['brute', 3]],
  [['wisp', 18], ['spitter', 7], ['brute', 5]],
  [['gloomhorn', 1], ['wisp', 16], ['spitter', 4]],
];

export const UPGRADES = [
  { id: 'bright', name: 'Bright Bolts', text: 'Bolts hit 40% harder.' },
  { id: 'wick', name: 'Quick Wick', text: 'Fire 30% faster.' },
  { id: 'twin', name: 'Twin Flame', text: 'Fire one more bolt per shot.' },
  { id: 'pierce', name: 'Piercing Glow', text: 'Bolts pass through one more foe.' },
  { id: 'heart', name: 'Heartwax', text: '+1 max heart and heal one.' },
  { id: 'soles', name: 'Swift Soles', text: 'Move 12% faster, dash recharges sooner.' },
  { id: 'nova', name: 'Starburst', text: 'Dashing releases a ring of bolts.' },
  { id: 'moth', name: 'Moth Magnet', text: 'Shards fly to you from far away.' },
];

export const PALETTE = { sky: '#070b12', ground: '#0e1622', grid: '#16233a', light: '#ffd27a', bolt: '#fff1b8', hurt: '#ff4d5e', text: '#f3ead7', muted: '#8a97ad', shard: '#6ff2d1', panel: '#101a2b' };
export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
export const BEST_KEY = 'emberwake.best';
