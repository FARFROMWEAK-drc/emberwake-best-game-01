// Boot and the one loop. Input is read every frame, the world advances in fixed 1/60 s steps, and the
// renderer paints it. ?seed=N fixes the shadows' pattern; ?shot=start|play|upgrade|end stages a scene.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EV_CLEAR, EV_DASH, EV_FIRE, EV_HIT, EV_HURT, EV_KILL, EV_OVER, EV_PICK, EV_WIN, PHASE_OVER, PHASE_PLAY, PHASE_UPGRADE, PHASE_WIN } from './world.js';
import { ACT_CHOICE1, ACT_CHOICE2, ACT_CHOICE3, ACT_CONFIRM, ACT_DASH, ACT_PAUSE, createInput } from './input.js';
import { cardRect, createRenderer, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { sfx, unlockAudio } from './audio.js';

const params = new URLSearchParams(window.location.search);
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const canvas = document.getElementById('game');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

const readBest = () => { try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; } };
const saveBest = (v) => { try { window.localStorage.setItem(BEST_KEY, String(v)); } catch { /* private window: best lasts this visit */ } };

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  const paint = () => { renderer.draw(world.state, scene.screen, scene.best); if (++painted < 2) requestAnimationFrame(paint); else window.__shotReady = true; };
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, renderer.toField);
  let screen = SCREEN_TITLE, best = readBest(), acc = 0, last = performance.now();
  const sounds = [[EV_FIRE, sfx.fire], [EV_HIT, sfx.hit], [EV_KILL, sfx.kill], [EV_HURT, sfx.hurt], [EV_PICK, sfx.pick], [EV_DASH, sfx.dash], [EV_CLEAR, sfx.clear]];

  function finish() { const s = world.state; if (s.score > best) { best = s.score; saveBest(best); } }

  function frame(now) {
    acc += Math.min(0.25, (now - last) / 1000); last = now;
    const actions = input.takeActions(), clicked = input.takeClick(), s = world.state;
    if (actions) unlockAudio();
    if (clicked) unlockAudio();
    if (screen === SCREEN_TITLE) { if (actions & ACT_CONFIRM || clicked) { world.reset(); screen = SCREEN_PLAY; acc = 0; } }
    else if (actions & ACT_PAUSE && s.phase === PHASE_PLAY) screen = screen === SCREEN_PAUSED ? SCREEN_PLAY : SCREEN_PAUSED;
    else if (s.phase === PHASE_UPGRADE) {
      let pick = actions & ACT_CHOICE1 ? 0 : actions & ACT_CHOICE2 ? 1 : actions & ACT_CHOICE3 ? 2 : -1;
      if (clicked) for (let i = 0; i < 3; i += 1) { const r = cardRect(i), m = input.mouse; if (m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) pick = i; }
      if (pick >= 0 && world.choose(pick)) { sfx.pickUpgrade(); acc = 0; }
    } else if (s.phase === PHASE_OVER || s.phase === PHASE_WIN) { if (actions & ACT_CONFIRM || clicked) { world.reset(); acc = 0; } }
    else if (screen === SCREEN_PLAY) {
      const axis = input.axis(), m = input.mouse;
      const control = { aimX: m.x, aimY: m.y, moveX: axis.x, moveY: axis.y, fire: m.down, dash: !!(actions & ACT_DASH) };
      while (acc >= STEP) {
        const flags = world.step(STEP, control); control.dash = false; acc -= STEP;
        for (const [flag, play] of sounds) if (flags & flag) play();
        if (flags & (EV_OVER | EV_WIN)) { finish(); if (flags & EV_OVER) sfx.over(); else sfx.clear(); break; }
      }
    }
    renderer.draw(world.state, screen, best);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const shot = params.get('shot');
if (shot) runShot(shot); else runGame();
