/** Synthesized audio — no external assets required */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private crowdGain: GainNode | null = null;
  private crowdOsc: OscillatorNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private excitement = 0;
  private enabled = true;

  init(): void {
    try {
      this.ctx = new AudioContext();
      this.setupCrowd();
    } catch {
      this.enabled = false;
    }
  }

  private setupCrowd(): void {
    if (!this.ctx) return;
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.03;
    this.crowdGain.connect(this.ctx.destination);

    this.crowdFilter = this.ctx.createBiquadFilter();
    this.crowdFilter.type = 'lowpass';
    this.crowdFilter.frequency.value = 800;
    this.crowdFilter.connect(this.crowdGain);

    // Noise-based crowd using multiple oscillators
    this.crowdOsc = this.ctx.createOscillator();
    this.crowdOsc.type = 'sawtooth';
    this.crowdOsc.frequency.value = 60;
    this.crowdOsc.connect(this.crowdFilter);
    this.crowdOsc.start();
  }

  setExcitement(level: number): void {
    this.excitement = Math.max(0, Math.min(1, level));
    if (this.crowdGain && this.crowdFilter) {
      this.crowdGain.gain.value = 0.02 + this.excitement * 0.08;
      this.crowdFilter.frequency.value = 600 + this.excitement * 1200;
    }
  }

  playKick(): void {
    this.playTone(200, 0.08, 'square', 0.15);
  }

  playWhistle(): void {
    this.playTone(2800, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(2200, 0.2, 'sine', 0.15), 100);
  }

  playGoal(): void {
    this.playTone(440, 0.3, 'sine', 0.3);
    setTimeout(() => this.playTone(554, 0.3, 'sine', 0.25), 150);
    setTimeout(() => this.playTone(659, 0.5, 'sine', 0.2), 300);
    this.setExcitement(1);
    setTimeout(() => this.setExcitement(0.3), 3000);
  }

  playNet(): void {
    this.playNoise(0.15, 0.1);
  }

  private playTone(freq: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.ctx || !this.enabled) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume: number): void {
    if (!this.ctx || !this.enabled) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  resume(): void {
    this.ctx?.resume();
  }
}
