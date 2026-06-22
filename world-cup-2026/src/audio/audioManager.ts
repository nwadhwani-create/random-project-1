export class AudioManager {
  private ctx: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private crowdIntensity = 0.3;
  private targetIntensity = 0.3;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.crowdGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.crowdGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
      this.crowdGain.gain.value = 0.15;
      this.sfxGain.gain.value = 0.4;

      this.startCrowdAmbience();
      this.initialized = true;
    } catch {
      console.warn('Audio not available');
    }
  }

  private startCrowdAmbience(): void {
    if (!this.ctx || !this.crowdGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.5;

    source.connect(filter);
    filter.connect(this.crowdGain);
    source.start();
  }

  setCrowdIntensity(intensity: number): void {
    this.targetIntensity = Math.max(0.1, Math.min(1, intensity));
  }

  update(dt: number): void {
    if (!this.crowdGain) return;
    this.crowdIntensity += (this.targetIntensity - this.crowdIntensity) * dt * 2;
    this.crowdGain.gain.value = 0.05 + this.crowdIntensity * 0.25;
  }

  playKick(): void {
    this.playTone(200, 0.08, 'sine', 0.3);
  }

  playWhistle(): void {
    this.playTone(2800, 0.15, 'square', 0.2);
    setTimeout(() => this.playTone(2200, 0.2, 'square', 0.15), 150);
  }

  playGoal(): void {
    this.targetIntensity = 1.0;
    this.playTone(440, 0.3, 'sine', 0.4);
    setTimeout(() => this.playTone(554, 0.3, 'sine', 0.4), 200);
    setTimeout(() => this.playTone(659, 0.5, 'sine', 0.5), 400);
    setTimeout(() => { this.targetIntensity = 0.3; }, 5000);
  }

  playNet(): void {
    this.playNoise(0.15, 0.2);
  }

  private playTone(freq: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }
}
