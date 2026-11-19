// The rules: one lantern spirit against waves of shadow. createWorld(rng) returns the state and the
// functions that change it. step() advances one fixed tick and returns the EV_* flags of what happened.
import { COMBO, FIELD, FINAL_WAVE, FOES, HP_START, PLAYER, SHARDS_PER_HEART, UPGRADES, WAVES } from './config.js';

export const EV_FIRE = 1, EV_HIT = 2, EV_KILL = 4, EV_HURT = 8, EV_PICK = 16, EV_CLEAR = 32, EV_OVER = 64, EV_WIN = 128, EV_DASH = 256;
export const PHASE_PLAY = 'play', PHASE_UPGRADE = 'upgrade', PHASE_OVER = 'over', PHASE_WIN = 'win';

export function createWorld(rng) {
  let state;

  function reset() {
    state = {
      phase: PHASE_PLAY, time: 0, wave: 1, score: 0, combo: 0, comboTimer: 0, bestCombo: 0, kills: 0, shardCount: 0,
      hp: HP_START, maxHp: HP_START, shake: 0, flash: 0, banner: 2.2, choices: [],
      player: { x: FIELD.w / 2, y: FIELD.h / 2, vx: 0, vy: 0, aimX: 1, aimY: 0, fireTimer: 0, dashTimer: 0, dashCool: 0, invuln: 0 },
      stats: { damage: 1, fireGap: PLAYER.fireGap, bolts: 1, pierce: 0, speed: PLAYER.speed, dashCooldown: PLAYER.dashCooldown, nova: false, magnet: PLAYER.magnet },
      bolts: [], orbs: [], foes: [], shards: [], sparks: [], queue: [], spawnTimer: 0, taken: [],
    };
    startWave(1);
  }

  function startWave(n) {
    state.wave = n;
    state.banner = 2.2;
    state.queue = [];
    for (const [kind, count] of WAVES[n - 1]) for (let i = 0; i < count; i += 1) state.queue.push(kind);
    for (let i = state.queue.length - 1; i > 0; i -= 1) { const j = Math.floor(rng.next() * (i + 1)); [state.queue[i], state.queue[j]] = [state.queue[j], state.queue[i]]; }
    const boss = state.queue.indexOf('gloomhorn');
    if (boss > 0) { state.queue.splice(boss, 1); state.queue.unshift('gloomhorn'); }
    state.spawnTimer = 1.2;
  }

  function spawnFoe(kind) {
    const def = FOES[kind], side = Math.floor(rng.next() * 4), m = def.r + 20;
    const x = side === 0 ? -m : side === 1 ? FIELD.w + m : rng.range(0, FIELD.w);
    const y = side === 2 ? -m : side === 3 ? FIELD.h + m : rng.range(0, FIELD.h);
    const scale = 1 + 0.05 * state.wave;
    state.foes.push({ kind, x, y, r: def.r, hp: def.hp, maxHp: def.hp, speed: def.speed * scale, fireTimer: rng.range(0.8, def.gap ?? 2), flash: 0, phase: rng.range(0, 6.28) });
  }

  function burst(x, y, count, speed, life) {
    for (let i = 0; i < count; i += 1) { const a = rng.range(0, 6.2832), s = rng.range(0.3, 1) * speed; state.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life }); }
  }

  function fireBolt(angle, from) {
    state.bolts.push({ x: from.x, y: from.y, vx: Math.cos(angle) * PLAYER.boltSpeed, vy: Math.sin(angle) * PLAYER.boltSpeed, life: PLAYER.boltLife, pierce: state.stats.pierce, hit: new Set() });
  }

  function volley(p) {
    const n = state.stats.bolts, base = Math.atan2(p.aimY, p.aimX);
    for (let i = 0; i < n; i += 1) fireBolt(base + (i - (n - 1) / 2) * 0.16, p);
  }

  function hurtPlayer(events) {
    const p = state.player;
    if (p.invuln > 0 || p.dashTimer > 0) return;
    state.hp -= 1; p.invuln = PLAYER.invuln; state.shake = 14; state.flash = 0.35; state.combo = 0; events.flags |= EV_HURT;
    burst(p.x, p.y, 16, 220, 0.5);
    if (state.hp <= 0) { state.phase = PHASE_OVER; events.flags |= EV_OVER; }
  }

  function killFoe(foe, events) {
    const def = FOES[foe.kind];
    state.combo += 1; state.comboTimer = COMBO.window; state.bestCombo = Math.max(state.bestCombo, state.combo);
    state.score += Math.round(def.score * (1 + Math.floor(state.combo / COMBO.perStep) * 0.5));
    state.kills += 1; state.shake = Math.max(state.shake, foe.kind === 'gloomhorn' ? 24 : 5); events.flags |= EV_KILL;
    burst(foe.x, foe.y, foe.kind === 'gloomhorn' ? 70 : 14, 260, 0.6);
    const drops = foe.kind === 'gloomhorn' ? 12 : foe.kind === 'brute' ? 4 : foe.kind === 'spitter' ? 2 : 1;
    for (let i = 0; i < drops; i += 1) state.shards.push({ x: foe.x + rng.range(-10, 10), y: foe.y + rng.range(-10, 10), vx: rng.range(-60, 60), vy: rng.range(-60, 60), age: 0 });
  }

  function step(dt, input) {
    const events = { flags: 0 };
    if (state.phase !== PHASE_PLAY) return 0;
    const p = state.player, s = state.stats;
    state.time += dt; state.banner = Math.max(0, state.banner - dt); state.shake = Math.max(0, state.shake - dt * 40); state.flash = Math.max(0, state.flash - dt);
    p.invuln = Math.max(0, p.invuln - dt); p.dashCool = Math.max(0, p.dashCool - dt); p.fireTimer = Math.max(0, p.fireTimer - dt);

    // aim, move, dash
    const ax = input.aimX - p.x, ay = input.aimY - p.y, al = Math.hypot(ax, ay) || 1;
    p.aimX = ax / al; p.aimY = ay / al;
    if (input.dash && p.dashCool === 0) {
      const ml = Math.hypot(input.moveX, input.moveY);
      const dx = ml ? input.moveX / ml : p.aimX, dy = ml ? input.moveY / ml : p.aimY;
      p.vx = dx * PLAYER.dashSpeed; p.vy = dy * PLAYER.dashSpeed; p.dashTimer = PLAYER.dashTime; p.dashCool = s.dashCooldown; events.flags |= EV_DASH;
      if (s.nova) for (let i = 0; i < 10; i += 1) fireBolt((i / 10) * 6.2832, p);
    }
    if (p.dashTimer > 0) p.dashTimer -= dt;
    else { const ml = Math.hypot(input.moveX, input.moveY) || 1; p.vx = (input.moveX / ml) * s.speed * (input.moveX || input.moveY ? 1 : 0); p.vy = (input.moveY / ml) * s.speed * (input.moveX || input.moveY ? 1 : 0); }
    p.x = Math.min(FIELD.w - PLAYER.r, Math.max(PLAYER.r, p.x + p.vx * dt));
    p.y = Math.min(FIELD.h - PLAYER.r, Math.max(PLAYER.r, p.y + p.vy * dt));
    if (input.fire && p.fireTimer === 0) { volley(p); p.fireTimer = s.fireGap; events.flags |= EV_FIRE; }

    // spawning
    state.spawnTimer -= dt;
    if (state.queue.length && state.spawnTimer <= 0) { spawnFoe(state.queue.pop()); state.spawnTimer = Math.max(0.25, 1.3 - state.wave * 0.12); }

    // foes
    for (const f of state.foes) {
      const def = FOES[f.kind], dx = p.x - f.x, dy = p.y - f.y, d = Math.hypot(dx, dy) || 1;
      f.flash = Math.max(0, f.flash - dt); f.phase += dt * 3;
      const toward = def.keep && d < def.keep ? -0.7 : def.keep && d < def.keep + 60 ? 0 : 1;
      const sway = f.kind === 'wisp' ? Math.sin(f.phase) * 0.5 : 0;
      f.x += ((dx / d) * toward - (dy / d) * sway) * f.speed * dt; f.y += ((dy / d) * toward + (dx / d) * sway) * f.speed * dt;
      if (def.gap) {
        f.fireTimer -= dt;
        if (f.fireTimer <= 0) {
          f.fireTimer = def.gap * (f.kind === 'gloomhorn' ? 1 - 0.4 * (1 - f.hp / f.maxHp) : 1);
          const n = f.kind === 'gloomhorn' ? 14 : 1, a0 = Math.atan2(dy, dx) + (f.kind === 'gloomhorn' ? f.phase : 0);
          for (let i = 0; i < n; i += 1) { const a = a0 + (i / n) * 6.2832 * (n > 1 ? 1 : 0); state.orbs.push({ x: f.x, y: f.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, life: 5 }); }
        }
      }
      if (d < f.r + PLAYER.r - 2) hurtPlayer(events);
    }
    for (const o of state.orbs) { o.x += o.vx * dt; o.y += o.vy * dt; o.life -= dt; if (Math.hypot(o.x - p.x, o.y - p.y) < 8 + PLAYER.r - 3) { o.life = 0; hurtPlayer(events); } }
    state.orbs = state.orbs.filter((o) => o.life > 0 && o.x > -40 && o.x < FIELD.w + 40 && o.y > -40 && o.y < FIELD.h + 40);

    // bolts hit foes
    for (const b of state.bolts) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      for (const f of state.foes) {
        if (b.life <= 0 || b.hit.has(f) || f.hp <= 0 || Math.hypot(f.x - b.x, f.y - b.y) > f.r + 6) continue;
        b.hit.add(f); f.hp -= s.damage; f.flash = 0.1; events.flags |= EV_HIT; burst(b.x, b.y, 3, 120, 0.25);
        if (f.hp <= 0) killFoe(f, events);
        if (b.pierce-- <= 0) b.life = 0;
      }
    }
    state.bolts = state.bolts.filter((b) => b.life > 0 && b.x > -20 && b.x < FIELD.w + 20 && b.y > -20 && b.y < FIELD.h + 20);
    state.foes = state.foes.filter((f) => f.hp > 0);

    // shards, sparks, combo
    for (const c of state.shards) {
      c.age += dt; const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy) || 1;
      c.vx *= 0.96; c.vy *= 0.96;
      if (d < s.magnet && c.age > 0.25) { c.vx += (dx / d) * 1400 * dt; c.vy += (dy / d) * 1400 * dt; }
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (d < PLAYER.r + 8 && c.age > 0.25) {
        c.age = -1; state.score += 5; state.taken.push(c); events.flags |= EV_PICK;
      }
    }
    state.shards = state.shards.filter((c) => c.age >= 0);
    for (const sp of state.sparks) { sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vx *= 0.94; sp.vy *= 0.94; sp.life -= dt; }
    state.sparks = state.sparks.filter((sp) => sp.life > 0);
    if (state.comboTimer > 0) { state.comboTimer -= dt; if (state.comboTimer <= 0) state.combo = 0; }
    if (state.taken.length) {
      state.shardCount += state.taken.length; state.taken.length = 0;
      while (state.shardCount >= SHARDS_PER_HEART) { state.shardCount -= SHARDS_PER_HEART; if (state.hp < state.maxHp) state.hp += 1; }
    }

    // wave clear
    if (!state.queue.length && !state.foes.length && state.phase === PHASE_PLAY) {
      events.flags |= EV_CLEAR; state.orbs = [];
      state.score += 100 * state.wave;
      if (state.wave >= FINAL_WAVE) { state.phase = PHASE_WIN; state.score += 500 * state.hp; events.flags |= EV_WIN; }
      else { state.phase = PHASE_UPGRADE; state.choices = drawChoices(); }
    }
    return events.flags;
  }

  function drawChoices() {
    const pool = UPGRADES.slice(), out = [];
    while (out.length < 3) out.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
    return out;
  }

  function choose(index) {
    if (state.phase !== PHASE_UPGRADE || !state.choices[index]) return false;
    const u = state.choices[index].id, s = state.stats;
    if (u === 'bright') s.damage *= 1.4;
    else if (u === 'wick') s.fireGap *= 0.7;
    else if (u === 'twin') s.bolts += 1;
    else if (u === 'pierce') s.pierce += 1;
    else if (u === 'heart') { state.maxHp += 1; state.hp = Math.min(state.maxHp, state.hp + 1); }
    else if (u === 'soles') { s.speed *= 1.12; s.dashCooldown *= 0.8; }
    else if (u === 'nova') s.nova = true;
    else if (u === 'moth') s.magnet *= 2.4;
    state.phase = PHASE_PLAY; state.player.invuln = 1;
    startWave(state.wave + 1);
    return true;
  }

  reset();
  return { reset, step, choose, get state() { return state; } };
}
