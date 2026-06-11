import type { InputState } from "./types";

const emptyState = (): InputState => ({
  moveX: 0,
  moveZ: 0,
  sprint: false,
  pass: false,
  shootHeld: false,
  shootReleased: false,
  tackle: false,
  cycleLighting: false,
});

export class InputController {
  private readonly keys = new Set<string>();
  private previousShoot = false;
  private previousGamepadPass = false;
  private previousGamepadTackle = false;
  private queuedPass = false;
  private queuedTackle = false;
  private queuedLighting = false;
  private gamepadName = "";

  constructor(private readonly statusElement: HTMLElement) {
    window.addEventListener("keydown", (event) => {
      if (this.isGameplayKey(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.repeat) return;
      if (event.code === "Space") this.queuedPass = true;
      if (event.code === "KeyK") this.queuedTackle = true;
      if (event.code === "KeyL") this.queuedLighting = true;
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("gamepadconnected", (event) => {
      this.gamepadName = event.gamepad.id;
      this.statusElement.textContent = `Gamepad connected: ${event.gamepad.id}`;
    });
    window.addEventListener("gamepaddisconnected", () => {
      this.gamepadName = "";
      this.statusElement.textContent = "Keyboard ready. Connect a controller for gamepad input.";
    });
  }

  read(): InputState {
    const state = emptyState();
    const gamepad = navigator.getGamepads().find((pad) => pad && pad.connected);

    if (this.keys.has("KeyA")) state.moveX -= 1;
    if (this.keys.has("KeyD")) state.moveX += 1;
    if (this.keys.has("KeyW")) state.moveZ -= 1;
    if (this.keys.has("KeyS")) state.moveZ += 1;

    state.sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    state.pass = this.queuedPass;
    state.shootHeld = this.keys.has("KeyJ");
    state.tackle = this.queuedTackle;
    state.cycleLighting = this.queuedLighting;

    let gamepadPass = false;
    let gamepadTackle = false;

    if (gamepad) {
      state.moveX += this.deadzone(gamepad.axes[0] ?? 0);
      state.moveZ += this.deadzone(gamepad.axes[1] ?? 0);
      state.sprint ||= (gamepad.buttons[7]?.value ?? 0) > 0.25;
      gamepadPass = Boolean(gamepad.buttons[0]?.pressed);
      state.pass ||= gamepadPass && !this.previousGamepadPass;
      state.shootHeld ||= Boolean(gamepad.buttons[2]?.pressed);
      gamepadTackle = Boolean(gamepad.buttons[1]?.pressed);
      state.tackle ||= gamepadTackle && !this.previousGamepadTackle;
      this.statusElement.textContent = `Gamepad active: ${this.gamepadName || gamepad.id}`;
    }

    const length = Math.hypot(state.moveX, state.moveZ);
    if (length > 1) {
      state.moveX /= length;
      state.moveZ /= length;
    }

    state.shootReleased = this.previousShoot && !state.shootHeld;

    this.previousShoot = state.shootHeld;
    this.previousGamepadPass = gamepadPass;
    this.previousGamepadTackle = gamepadTackle;
    this.queuedPass = false;
    this.queuedTackle = false;
    this.queuedLighting = false;

    return state;
  }

  private deadzone(value: number): number {
    return Math.abs(value) < 0.16 ? 0 : value;
  }

  private isGameplayKey(code: string): boolean {
    return ["Space", "KeyJ", "KeyK", "KeyL", "KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight"].includes(
      code,
    );
  }
}
