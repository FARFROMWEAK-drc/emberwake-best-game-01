// Keyboard and mouse. Held keys steer, the mouse aims, and one-shot presses are queued as flags.
export const ACT_CONFIRM = 1, ACT_PAUSE = 2, ACT_CHOICE1 = 4, ACT_CHOICE2 = 8, ACT_CHOICE3 = 16, ACT_DASH = 32;
const CHOICES = { Digit1: ACT_CHOICE1, Digit2: ACT_CHOICE2, Digit3: ACT_CHOICE3 };

export function createInput(canvas, toField) {
  const held = new Set();
  const mouse = { x: 640, y: 360, down: false, clicked: false };
  let actions = 0;
  window.addEventListener('keydown', (e) => {
    held.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Enter') actions |= ACT_CONFIRM;
    else if (e.code === 'Space') actions |= ACT_DASH | ACT_CONFIRM;
    else if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACT_PAUSE;
    else if (CHOICES[e.code]) actions |= CHOICES[e.code];
    else return;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => held.delete(e.code));
  window.addEventListener('blur', () => { held.clear(); mouse.down = false; });
  canvas.addEventListener('pointermove', (e) => Object.assign(mouse, toField(e.clientX, e.clientY)));
  canvas.addEventListener('pointerdown', (e) => { Object.assign(mouse, toField(e.clientX, e.clientY)); mouse.down = true; mouse.clicked = true; });
  window.addEventListener('pointerup', () => { mouse.down = false; });
  const any = (...codes) => codes.some((c) => held.has(c));
  return {
    mouse,
    axis: () => ({ x: (any('KeyD', 'ArrowRight') ? 1 : 0) - (any('KeyA', 'ArrowLeft') ? 1 : 0), y: (any('KeyS', 'ArrowDown') ? 1 : 0) - (any('KeyW', 'ArrowUp') ? 1 : 0) }),
    takeActions() { const a = actions; actions = 0; return a; },
    takeClick() { const c = mouse.clicked; mouse.clicked = false; return c; },
  };
}
