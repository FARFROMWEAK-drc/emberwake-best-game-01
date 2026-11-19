// Everything drawn: the night field, the lantern's light, foes, bolts, the HUD and each screen's overlay.
import { FIELD, FINAL_WAVE, FONT, FOES, HP_START, PALETTE, PLAYER, SHARDS_PER_HEART } from './config.js';
import { PHASE_OVER, PHASE_UPGRADE, PHASE_WIN } from './world.js';

export const SCREEN_TITLE = 'title', SCREEN_PLAY = 'play', SCREEN_PAUSED = 'paused';
const CARD = { w: 330, h: 230, gap: 36, y: 250 };

/** Where upgrade card `i` sits on the field; main uses it to turn a click into a choice. */
export function cardRect(i) {
  const total = 3 * CARD.w + 2 * CARD.gap, x0 = (FIELD.w - total) / 2;
  return { x: x0 + i * (CARD.w + CARD.gap), y: CARD.y, w: CARD.w, h: CARD.h };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1, ox = 0, oy = 0;

  function fit() {
    const dpr = window.devicePixelRatio || 1, w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    scale = Math.min(canvas.width / FIELD.w, canvas.height / FIELD.h);
    ox = (canvas.width - FIELD.w * scale) / 2; oy = (canvas.height - FIELD.h * scale) / 2;
  }
  const toField = (cx, cy) => { const dpr = window.devicePixelRatio || 1; return { x: (cx * dpr - ox) / scale, y: (cy * dpr - oy) / scale }; };

  const text = (str, x, y, size, color, align = 'center', weight = 'bold') => { ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y); };
  const glow = (x, y, r, color, alpha) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };

  function drawField(state) {
    ctx.fillStyle = PALETTE.sky; ctx.fillRect(0, 0, FIELD.w, FIELD.h);
    ctx.fillStyle = PALETTE.ground; ctx.fillRect(20, 20, FIELD.w - 40, FIELD.h - 40);
    ctx.strokeStyle = PALETTE.grid; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 60; x < FIELD.w - 20; x += 80) { ctx.moveTo(x, 20); ctx.lineTo(x, FIELD.h - 20); }
    for (let y = 60; y < FIELD.h - 20; y += 80) { ctx.moveTo(20, y); ctx.lineTo(FIELD.w - 20, y); }
    ctx.stroke();
    glow(state.player.x, state.player.y, 340, PALETTE.light, 0.28);
  }

  function drawFoe(f) {
    const def = FOES[f.kind], hurt = f.flash > 0;
    glow(f.x, f.y, f.r * 2.4, def.col, 0.35);
    ctx.fillStyle = hurt ? '#ffffff' : '#1a1030'; ctx.strokeStyle = def.col; ctx.lineWidth = 3;
    ctx.beginPath();
    if (f.kind === 'brute') ctx.rect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    else if (f.kind === 'spitter') { ctx.moveTo(f.x, f.y - f.r - 3); ctx.lineTo(f.x + f.r + 2, f.y + f.r); ctx.lineTo(f.x - f.r - 2, f.y + f.r); ctx.closePath(); }
    else ctx.arc(f.x, f.y, f.r, 0, 6.2832);
    ctx.fill(); ctx.stroke();
    if (f.kind === 'gloomhorn') { for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(f.x + s * 30, f.y - 40); ctx.lineTo(f.x + s * 62, f.y - 86); ctx.lineTo(f.x + s * 12, f.y - 52); ctx.fill(); ctx.stroke(); } }
    ctx.fillStyle = def.col; const e = f.r * 0.32;
    ctx.beginPath(); ctx.arc(f.x - e, f.y - 2, Math.max(2.5, f.r * 0.14), 0, 6.2832); ctx.arc(f.x + e, f.y - 2, Math.max(2.5, f.r * 0.14), 0, 6.2832); ctx.fill();
    if (f.maxHp > 3) { ctx.fillStyle = '#00000088'; ctx.fillRect(f.x - f.r, f.y + f.r + 8, f.r * 2, 5); ctx.fillStyle = def.col; ctx.fillRect(f.x - f.r, f.y + f.r + 8, f.r * 2 * (f.hp / f.maxHp), 5); }
  }

  function drawWorld(state) {
    const p = state.player;
    for (const c of state.shards) { glow(c.x, c.y, 16, PALETTE.shard, 0.6); ctx.fillStyle = PALETTE.shard; ctx.beginPath(); ctx.moveTo(c.x, c.y - 6); ctx.lineTo(c.x + 4, c.y); ctx.lineTo(c.x, c.y + 6); ctx.lineTo(c.x - 4, c.y); ctx.fill(); }
    for (const f of state.foes) drawFoe(f);
    for (const o of state.orbs) { glow(o.x, o.y, 18, PALETTE.hurt, 0.7); ctx.fillStyle = '#ffd0d6'; ctx.beginPath(); ctx.arc(o.x, o.y, 5, 0, 6.2832); ctx.fill(); }
    for (const b of state.bolts) { glow(b.x, b.y, 20, PALETTE.bolt, 0.8); ctx.strokeStyle = PALETTE.bolt; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.025, b.y - b.vy * 0.025); ctx.stroke(); }
    for (const s of state.sparks) { ctx.globalAlpha = s.life / s.max; ctx.fillStyle = PALETTE.light; ctx.fillRect(s.x - 2, s.y - 2, 4, 4); }
    ctx.globalAlpha = 1;
    // the lantern spirit: a flame in a small glass, blinking while it is protected
    if (!(p.invuln > 0 && Math.floor(state.time * 14) % 2)) {
      glow(p.x, p.y, 70, PALETTE.light, 0.9);
      ctx.fillStyle = '#fff7da'; ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER.r, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = PALETTE.light; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + p.aimX * PLAYER.r, p.y + p.aimY * PLAYER.r); ctx.lineTo(p.x + p.aimX * (PLAYER.r + 12), p.y + p.aimY * (PLAYER.r + 12)); ctx.lineWidth = 5; ctx.stroke();
    }
  }

  function drawHud(state, best) {
    for (let i = 0; i < state.maxHp; i += 1) { ctx.fillStyle = i < state.hp ? PALETTE.hurt : '#3a2530'; ctx.beginPath(); ctx.arc(46 + i * 36, 52, 12, 0, 6.2832); ctx.fill(); ctx.strokeStyle = '#00000066'; ctx.lineWidth = 2; ctx.stroke(); }
    text(`WAVE ${state.wave} / ${FINAL_WAVE}`, FIELD.w / 2, 46, 26, PALETTE.text);
    text(String(state.score).padStart(6, '0'), FIELD.w - 44, 46, 34, PALETTE.light, 'right');
    text(`BEST ${Math.max(best, state.score)}`, FIELD.w - 44, 78, 16, PALETTE.muted, 'right');
    if (state.combo > 1) text(`COMBO x${state.combo}`, FIELD.w - 44, 106, 20, PALETTE.shard, 'right');
    const ready = 1 - state.player.dashCool / state.stats.dashCooldown;
    ctx.fillStyle = '#00000066'; ctx.fillRect(34, FIELD.h - 52, 180, 10); ctx.fillStyle = ready >= 1 ? PALETTE.shard : PALETTE.muted; ctx.fillRect(34, FIELD.h - 52, 180 * ready, 10);
    text(ready >= 1 ? 'DASH READY  [SPACE]' : 'DASH', 34, FIELD.h - 68, 14, PALETTE.muted, 'left');
    const remaining = state.queue.length + state.foes.length;
    text(`SHADOWS LEFT ${remaining}`, FIELD.w / 2, FIELD.h - 44, 16, PALETTE.muted);
    text(`SHARDS ${state.shardCount}/${SHARDS_PER_HEART} = HEART`, 240, FIELD.h - 44, 14, PALETTE.shard, 'left');
    if (state.banner > 0) { ctx.globalAlpha = Math.min(1, state.banner); text(state.wave === FINAL_WAVE ? 'THE GLOOMHORN WAKES' : `WAVE ${state.wave}`, FIELD.w / 2, 200, 56, PALETTE.light); ctx.globalAlpha = 1; }
  }

  const dim = (a) => { ctx.fillStyle = `rgba(4,7,14,${a})`; ctx.fillRect(0, 0, FIELD.w, FIELD.h); };

  function drawTitle() {
    dim(0.55);
    text('EMBERWAKE', FIELD.w / 2, 190, 108, PALETTE.light);
    text('LAST LANTERN', FIELD.w / 2, 270, 44, PALETTE.text);
    text('Hold back the shadows. Wake no Gloomhorn... too late.', FIELD.w / 2, 340, 22, PALETTE.muted, 'center', 'normal');
    const lines = ['WASD  move', 'MOUSE  aim      HOLD CLICK  fire', 'SPACE  dash through danger', 'Survive 6 waves, pick a gift between each'];
    lines.forEach((l, i) => text(l, FIELD.w / 2, 410 + i * 34, 24, PALETTE.text, 'center', 'normal'));
    text('PRESS ENTER OR CLICK TO LIGHT THE LANTERN', FIELD.w / 2, 600, 28, PALETTE.shard);
  }

  function drawUpgrade(state) {
    dim(0.7);
    text(`WAVE ${state.wave} CLEARED`, FIELD.w / 2, 120, 58, PALETTE.light);
    text('Choose a gift for the lantern   [1] [2] [3] or click', FIELD.w / 2, 190, 24, PALETTE.text, 'center', 'normal');
    state.choices.forEach((u, i) => {
      const r = cardRect(i);
      ctx.fillStyle = PALETTE.panel; ctx.strokeStyle = PALETTE.light; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 16); ctx.fill(); ctx.stroke();
      text(String(i + 1), r.x + 34, r.y + 38, 34, PALETTE.shard);
      text(u.name, r.x + r.w / 2, r.y + 100, 30, PALETTE.light);
      const words = u.text.split(' '); let line = '', row = 0;
      for (const w of words) { if ((line + w).length > 24) { text(line.trim(), r.x + r.w / 2, r.y + 148 + row * 28, 20, PALETTE.text, 'center', 'normal'); line = ''; row += 1; } line += w + ' '; }
      text(line.trim(), r.x + r.w / 2, r.y + 148 + row * 28, 20, PALETTE.text, 'center', 'normal');
    });
  }

  function drawEnd(state, best) {
    dim(0.72);
    const won = state.phase === PHASE_WIN;
    text(won ? 'DAWN BREAKS' : 'THE LANTERN GOES OUT', FIELD.w / 2, 160, 70, won ? PALETTE.light : PALETTE.hurt);
    text(won ? 'The Gloomhorn is vanquished.' : `You fell on wave ${state.wave} of ${FINAL_WAVE}.`, FIELD.w / 2, 232, 26, PALETTE.text, 'center', 'normal');
    text(`SCORE  ${state.score}`, FIELD.w / 2, 330, 54, PALETTE.light);
    text(`${state.score >= best && state.score > 0 ? 'NEW BEST!  ' : `Best ${best}   `}Shadows banished ${state.kills}   Top combo x${state.bestCombo}`, FIELD.w / 2, 400, 24, PALETTE.shard, 'center', 'normal');
    text('PRESS ENTER OR CLICK TO PLAY AGAIN', FIELD.w / 2, 520, 30, PALETTE.text);
  }

  function draw(state, screen, best) {
    fit();
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const sh = state.shake;
    ctx.setTransform(scale, 0, 0, scale, ox + (Math.random() - 0.5) * sh * scale, oy + (Math.random() - 0.5) * sh * scale);
    ctx.save(); ctx.beginPath(); ctx.rect(-40, -40, FIELD.w + 80, FIELD.h + 80); ctx.clip();
    drawField(state); drawWorld(state);
    if (state.flash > 0) { ctx.fillStyle = `rgba(255,77,94,${state.flash})`; ctx.fillRect(0, 0, FIELD.w, FIELD.h); }
    drawHud(state, best);
    if (screen === SCREEN_TITLE) drawTitle();
    else if (screen === SCREEN_PAUSED) { dim(0.6); text('PAUSED', FIELD.w / 2, 330, 80, PALETTE.light); text('Press P to resume', FIELD.w / 2, 410, 26, PALETTE.text, 'center', 'normal'); }
    else if (state.phase === PHASE_UPGRADE) drawUpgrade(state);
    else if (state.phase === PHASE_OVER || state.phase === PHASE_WIN) drawEnd(state, best);
    ctx.restore();
  }

  fit();
  return { draw, toField, hpStart: HP_START };
}
