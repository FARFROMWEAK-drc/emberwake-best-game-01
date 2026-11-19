// The screenshot scenes behind ?shot=start|play|upgrade|end. Each plays the real rules forward from a
// fresh world with a simple autopilot, so a frame is what the game really looks like for that seed.
import { FIELD, STEP } from './config.js';
import { PHASE_OVER, PHASE_PLAY, PHASE_UPGRADE } from './world.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** The autopilot's input: shoot the nearest foe, back away from any that are close, else circle. */
function pilot(state, careless) {
  const p = state.player;
  let near = null, nd = Infinity;
  for (const f of state.foes) { const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < nd) { nd = d; near = f; } }
  const aim = near ?? { x: FIELD.w / 2, y: FIELD.h / 2 };
  let mx = 0, my = 0;
  if (near && nd < (careless ? 60 : 230)) { mx = (p.x - near.x) / nd; my = (p.y - near.y) / nd; }
  else if (!careless) { mx = (FIELD.w / 2 - p.x) / 400; my = (FIELD.h / 2 - p.y) / 400; }
  if (!careless) { const k = Math.hypot(mx, my) || 1; if (p.x < 90) mx = 1; if (p.x > FIELD.w - 90) mx = -1; if (p.y < 90) my = 1; if (p.y > FIELD.h - 90) my = -1; mx /= Math.max(1, k); my /= Math.max(1, k); }
  return { aimX: aim.x, aimY: aim.y, moveX: mx, moveY: my, fire: true, dash: !!near && nd < 90 && !careless };
}

/** Set `world` to the named scene and return the screen to draw and the best score to show. */
export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  if (name === 'start') { for (let i = 0; i < 180; i += 1) world.step(STEP, pilot(s, false)); return { screen: SCREEN_TITLE, best: 4820 }; }
  if (name === 'play') {
    for (let i = 0; i < 60 * 40 && s.phase === PHASE_PLAY && !(s.wave >= 2 && s.foes.length >= 9); i += 1) { world.step(STEP, pilot(s, false)); if (s.phase === PHASE_UPGRADE) world.choose(0); }
    return { screen: SCREEN_PLAY, best: 4820 };
  }
  if (name === 'upgrade') {
    for (let i = 0; i < 60 * 120 && s.phase === PHASE_PLAY; i += 1) world.step(STEP, pilot(s, false));
    return { screen: SCREEN_PLAY, best: 4820 };
  }
  for (let i = 0; i < 60 * 600 && s.phase !== PHASE_OVER; i += 1) { world.step(STEP, pilot(s, s.wave < 3 ? false : true)); if (s.phase === PHASE_UPGRADE) world.choose(i % 3); }
  return { screen: SCREEN_PLAY, best: 4820 };
}
