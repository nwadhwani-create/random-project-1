export class AudioEngine {
  private context: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private crowdOscillator: OscillatorNode | null = null;

  async ensureStarted(): Promise<void> {
    if (!this.context) {
      this.context = new AudioContext();
      this.crowdGain = this.context.createGain();
      this.crowdOscillator = this.context.createOscillator();
      const filter = this.context.createBiquadFilter();
      this.crowdOscillator.type = "sawtooth";
      this.crowdOscillator.frequency.value = 78;
      filter.type = "lowpass";
      filter.frequency.value = 420;
      this.crowdGain.gain.value = 0.025;
      this.crowdOscillator.connect(filter).connect(this.crowdGain).connect(this.context.destination);
      this.crowdOscillator.start();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  updateCrowdIntensity(intensity: number): void {
    if (!this.context || !this.crowdGain || !this.crowdOscillator) return;
    const now = this.context.currentTime;
    this.crowdGain.gain.linearRampToValueAtTime(0.02 + intensity * 0.065, now + 0.3);
    this.crowdOscillator.frequency.linearRampToValueAtTime(70 + intensity * 42, now + 0.25);
  }

  kick(power: number): void {
    this.ping(95 + power * 130, 0.08, 0.08 + power * 0.08, "triangle");
  }

  whistle(): void {
    this.ping(1480, 0.22, 0.12, "sine");
  }

  goal(): void {
    this.ping(440, 0.5, 0.22, "square");
    window.setTimeout(() => this.ping(660, 0.42, 0.16, "square"), 130);
  }

  private ping(frequency: number, duration: number, volume: number, type: OscillatorType): void {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }
}
