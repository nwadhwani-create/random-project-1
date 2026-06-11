export interface InputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  pass: boolean;
  shoot: boolean;
  shootHeld: boolean;
  tackle: boolean;
  switchPlayer: boolean;
  cameraToggle: boolean;
  pause: boolean;
}

export class InputManager {
  private keys = new Set<string>();
  private gamepadIndex: number | null = null;
  private prevButtons: boolean[] = [];
  private edgeButtons = new Set<number>();

  readonly state: InputState = {
    moveX: 0,
    moveZ: 0,
    sprint: false,
    pass: false,
    shoot: false,
    shootHeld: false,
    tackle: false,
    switchPlayer: false,
    cameraToggle: false,
    pause: false,
  };

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  update(): void {
    this.edgeButtons.clear();
    const gp = this.getGamepad();

    // Movement
    let mx = 0;
    let mz = 0;

    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) mx -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) mx += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) mz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) mz += 1;

    if (gp) {
      const lx = this.deadzone(gp.axes[0] ?? 0);
      const ly = this.deadzone(gp.axes[1] ?? 0);
      if (Math.abs(lx) > Math.abs(mx)) mx = lx;
      if (Math.abs(ly) > Math.abs(mz)) mz = ly;
    }

    const len = Math.hypot(mx, mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    this.state.moveX = mx;
    this.state.moveZ = mz;

    // Actions
    this.state.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.gpButton(gp, 7);
    this.state.shootHeld = this.keys.has('Space') || this.gpButton(gp, 0);
    this.state.shoot = this.state.shootHeld;
    this.state.pass = this.keyEdge('KeyE') || this.btnEdge(gp, 2);
    this.state.tackle = this.keyEdge('KeyF') || this.btnEdge(gp, 1);
    this.state.switchPlayer = this.keyEdge('KeyQ') || this.btnEdge(gp, 4);
    this.state.cameraToggle = this.keyEdge('KeyC') || this.btnEdge(gp, 3);
    this.state.pause = this.keyEdge('Escape') || this.btnEdge(gp, 9);

    if (gp) {
      this.prevButtons = gp.buttons.map((b) => b.pressed);
    }
  }

  private getGamepad(): Gamepad | null {
    if (this.gamepadIndex !== null) {
      return navigator.getGamepads()[this.gamepadIndex] ?? null;
    }
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (pad) {
        this.gamepadIndex = pad.index;
        return pad;
      }
    }
    return null;
  }

  private deadzone(v: number, dz = 0.15): number {
    return Math.abs(v) < dz ? 0 : v;
  }

  private gpButton(gp: Gamepad | null, idx: number): boolean {
    return gp?.buttons[idx]?.pressed ?? false;
  }

  private prevKeyState = new Set<string>();

  private keyEdge(key: string): boolean {
    return this.keys.has(key) && !this.prevKeyState.has(key);
  }

  private btnEdge(gp: Gamepad | null, btnIdx: number): boolean {
    const btnDown = this.gpButton(gp, btnIdx);
    const wasDown = this.prevButtons[btnIdx] ?? false;
    return btnDown && !wasDown;
  }

  /** Call at end of frame to track key edges */
  endFrame(): void {
    this.prevKeyState = new Set(this.keys);
  }
}
