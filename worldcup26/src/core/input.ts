// Unified keyboard + gamepad input with edge detection.
// Keyboard: arrows/WASD move, Shift sprint, S/X pass, D/C lob-through, A/Z shoot, W/V slide, E switch, Q GK charge
// Gamepad (Xbox layout): left stick move, A pass, X shoot, B lob, Y through, RB sprint, LB switch, RT slide

export type Action =
  | 'pass' | 'lob' | 'through' | 'shoot' | 'slide' | 'switch' | 'sprint' | 'gk'
  | 'pause' | 'replay';

const KEYMAP: Record<string, Action> = {
  KeyS: 'pass', KeyX: 'pass',
  KeyD: 'lob', KeyC: 'lob',
  KeyA: 'shoot', KeyZ: 'shoot',
  KeyW: 'slide', KeyV: 'slide',
  KeyE: 'switch', Space: 'switch',
  KeyQ: 'gk',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
  Escape: 'pause', KeyP: 'pause',
  KeyR: 'replay',
  KeyT: 'through',
};

const PAD_BUTTONS: Record<number, Action> = {
  0: 'pass',    // A / Cross
  1: 'lob',     // B / Circle
  2: 'shoot',   // X / Square
  3: 'through', // Y / Triangle
  4: 'switch',  // LB
  5: 'sprint',  // RB
  7: 'slide',   // RT
  6: 'gk',      // LT
  9: 'pause',   // Start
  8: 'replay',  // Back
};

export class Input {
  private keys = new Set<string>();
  private down = new Set<Action>();
  private pressed = new Set<Action>();
  private released = new Set<Action>();
  private holdTime = new Map<Action, number>();
  moveX = 0; // -1..1 (pitch +x)
  moveZ = 0;
  padConnected = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      const a = KEYMAP[e.code];
      if (a) { e.preventDefault(); this.press(a); }
      if (e.code.startsWith('Arrow')) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      const a = KEYMAP[e.code];
      if (a) this.release(a);
    });
    window.addEventListener('blur', () => { this.keys.clear(); this.down.clear(); this.holdTime.clear(); });
    window.addEventListener('gamepadconnected', () => { this.padConnected = true; });
    window.addEventListener('gamepaddisconnected', () => { this.padConnected = false; });
  }

  private press(a: Action): void {
    if (!this.down.has(a)) { this.pressed.add(a); this.holdTime.set(a, 0); }
    this.down.add(a);
  }

  private release(a: Action): void {
    if (this.down.has(a)) this.released.add(a);
    this.down.delete(a);
  }

  /** call once per frame */
  update(dt: number): void {
    // keyboard movement
    let x = 0, z = 0;
    if (this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('ArrowRight')) x += 1;

    // gamepad
    const pads = navigator.getGamepads?.() ?? [];
    const pad = pads.find((p) => p && p.connected);
    if (pad) {
      this.padConnected = true;
      const dz = 0.18;
      const ax = pad.axes[0] ?? 0, ay = pad.axes[1] ?? 0;
      if (Math.abs(ax) > dz) x += ax;
      if (Math.abs(ay) > dz) z += ay;
      // dpad
      if (pad.buttons[12]?.pressed) z -= 1;
      if (pad.buttons[13]?.pressed) z += 1;
      if (pad.buttons[14]?.pressed) x -= 1;
      if (pad.buttons[15]?.pressed) x += 1;
      for (const [idxStr, action] of Object.entries(PAD_BUTTONS)) {
        const idx = Number(idxStr);
        const btn = pad.buttons[idx];
        const isDown = !!btn && (btn.pressed || btn.value > 0.5);
        if (isDown && !this.down.has(action)) this.press(action);
        else if (!isDown && this.down.has(action) && !this.keyHolds(action)) this.release(action);
      }
    }
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    // screen-relative: up = -z (toward far touchline); camera looks down -z so up means -z... map directly
    this.moveX = x;
    this.moveZ = z;

    for (const a of this.down) this.holdTime.set(a, (this.holdTime.get(a) ?? 0) + dt);
  }

  private keyHolds(a: Action): boolean {
    for (const k of this.keys) if (KEYMAP[k] === a) return true;
    return false;
  }

  isDown(a: Action): boolean { return this.down.has(a); }
  justPressed(a: Action): boolean { return this.pressed.has(a); }
  justReleased(a: Action): boolean { return this.released.has(a); }
  held(a: Action): number { return this.holdTime.get(a) ?? 0; }

  /** consume edge events at end of frame */
  lateUpdate(): void {
    this.pressed.clear();
    this.released.clear();
  }
}
