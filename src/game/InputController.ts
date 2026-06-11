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
  private previousLighting = false;
  private previousPass = false;
  private previousTackle = false;
  private gamepadName = "";

  constructor(private readonly statusElement: HTMLElement) {
    window.addEventListener("keydown", (event) => this.keys.add(event.code));
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
    state.pass = this.keys.has("Space");
    state.shootHeld = this.keys.has("KeyJ");
    state.tackle = this.keys.has("KeyK");
    state.cycleLighting = this.keys.has("KeyL");

    if (gamepad) {
      state.moveX += this.deadzone(gamepad.axes[0] ?? 0);
      state.moveZ += this.deadzone(gamepad.axes[1] ?? 0);
      state.sprint ||= (gamepad.buttons[7]?.value ?? 0) > 0.25;
      state.pass ||= Boolean(gamepad.buttons[0]?.pressed);
      state.shootHeld ||= Boolean(gamepad.buttons[2]?.pressed);
      state.tackle ||= Boolean(gamepad.buttons[1]?.pressed);
      this.statusElement.textContent = `Gamepad active: ${this.gamepadName || gamepad.id}`;
    }

    const length = Math.hypot(state.moveX, state.moveZ);
    if (length > 1) {
      state.moveX /= length;
      state.moveZ /= length;
    }

    state.shootReleased = this.previousShoot && !state.shootHeld;
    state.pass = state.pass && !this.previousPass;
    state.tackle = state.tackle && !this.previousTackle;
    state.cycleLighting = state.cycleLighting && !this.previousLighting;

    this.previousShoot = state.shootHeld;
    this.previousPass = state.pass || this.keys.has("Space") || Boolean(gamepad?.buttons[0]?.pressed);
    this.previousTackle = state.tackle || this.keys.has("KeyK") || Boolean(gamepad?.buttons[1]?.pressed);
    this.previousLighting = state.cycleLighting || this.keys.has("KeyL");

    return state;
  }

  private deadzone(value: number): number {
    return Math.abs(value) < 0.16 ? 0 : value;
  }
}
