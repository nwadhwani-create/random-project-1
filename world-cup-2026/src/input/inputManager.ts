export interface InputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
  pass: boolean;
  shoot: boolean;
  lob: boolean;
  tackle: boolean;
  slideTackle: boolean;
  switchPlayer: boolean;
  pause: boolean;
  goalkeeper: boolean;
  power: number;
}

export class InputManager {
  private keys = new Set<string>();
  private gamepadIndex: number | null = null;
  private shootHeld = false;
  private shootStartTime = 0;
  readonly state: InputState = {
    moveX: 0,
    moveZ: 0,
    sprint: false,
    pass: false,
    shoot: false,
    lob: false,
    tackle: false,
    slideTackle: false,
    switchPlayer: false,
    pause: false,
    goalkeeper: false,
    power: 0,
  };

  private prevState = { ...this.state };
  private edgeTriggers = new Set<keyof InputState>();

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  update(): void {
    this.prevState = { ...this.state };
    this.edgeTriggers.clear();

    this.state.moveX = 0;
    this.state.moveZ = 0;
    this.state.sprint = false;
    this.state.pass = false;
    this.state.shoot = false;
    this.state.lob = false;
    this.state.tackle = false;
    this.state.slideTackle = false;
    this.state.switchPlayer = false;
    this.state.pause = false;
    this.state.goalkeeper = false;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.state.moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.state.moveZ += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.state.moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.state.moveX += 1;
    this.state.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.state.pass = this.keys.has('KeyX');
    this.state.lob = this.keys.has('KeyC');
    this.state.tackle = this.keys.has('KeyZ');
    this.state.slideTackle = this.keys.has('KeyV');
    this.state.switchPlayer = this.keys.has('KeyQ');
    this.state.pause = this.keys.has('Escape');
    this.state.goalkeeper = this.keys.has('Tab');

    const shootKey = this.keys.has('Space') || this.keys.has('KeyE');
    if (shootKey && !this.shootHeld) {
      this.shootHeld = true;
      this.shootStartTime = performance.now();
    }
    if (!shootKey && this.shootHeld) {
      this.shootHeld = false;
      this.state.shoot = true;
      this.state.power = Math.min(1, (performance.now() - this.shootStartTime) / 1500);
    }
    if (this.shootHeld) {
      this.state.power = Math.min(1, (performance.now() - this.shootStartTime) / 1500);
    }

    const gp = this.gamepadIndex !== null ? navigator.getGamepads()[this.gamepadIndex] : null;
    if (gp) {
      const deadzone = 0.15;
      const ax0 = Math.abs(gp.axes[0]) > deadzone ? gp.axes[0] : 0;
      const ax1 = Math.abs(gp.axes[1]) > deadzone ? gp.axes[1] : 0;
      if (ax0 !== 0 || ax1 !== 0) {
        this.state.moveX = ax0;
        this.state.moveZ = ax1;
      }
      this.state.sprint = this.state.sprint || gp.buttons[7]?.pressed;
      this.state.pass = this.state.pass || gp.buttons[0]?.pressed;
      this.state.shoot = this.state.shoot || gp.buttons[2]?.pressed;
      this.state.lob = this.state.lob || gp.buttons[1]?.pressed;
      this.state.tackle = this.state.tackle || gp.buttons[3]?.pressed;
      this.state.switchPlayer = this.state.switchPlayer || gp.buttons[4]?.pressed;
      if (gp.buttons[2]?.pressed) {
        this.state.power = gp.buttons[7]?.value ?? 0.5;
      }
    }

    for (const key of Object.keys(this.state) as (keyof InputState)[]) {
      if (key === 'power') continue;
      if (this.state[key] && !this.prevState[key]) {
        this.edgeTriggers.add(key);
      }
    }
  }

  isPressed(key: keyof InputState): boolean {
    return !!this.state[key];
  }

  justPressed(key: keyof InputState): boolean {
    return this.edgeTriggers.has(key);
  }
}
