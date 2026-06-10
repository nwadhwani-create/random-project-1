// Fully synthesized audio: crowd ambience reacting to play, whistle, kicks, net.
// No external assets needed.

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private excitement = 0.2;
  private enabled = true;

  /** must be called from a user gesture */
  init(): void {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(ctx.destination);

    // ---- crowd bed: looping pink-ish noise through bandpass
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + 0.029 * w;
        b1 = 0.985 * b1 + 0.032 * w;
        b2 = 0.95 * b2 + 0.048 * w;
        d[i] = (b0 + b1 + b2) * 0.9;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    this.crowdFilter = ctx.createBiquadFilter();
    this.crowdFilter.type = 'bandpass';
    this.crowdFilter.frequency.value = 500;
    this.crowdFilter.Q.value = 0.5;
    this.crowdGain = ctx.createGain();
    this.crowdGain.gain.value = 0.12;
    src.connect(this.crowdFilter).connect(this.crowdGain).connect(this.master);
    src.start();
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.8 : 0;
  }

  /** call every frame with match excitement 0..1 */
  setExcitement(e: number, dt: number): void {
    this.excitement += (e - this.excitement) * Math.min(1, dt * 2);
    if (!this.crowdGain || !this.ctx) return;
    const g = 0.1 + this.excitement * 0.34;
    this.crowdGain.gain.setTargetAtTime(g, this.ctx.currentTime, 0.15);
    this.crowdFilter!.frequency.setTargetAtTime(420 + this.excitement * 900, this.ctx.currentTime, 0.2);
  }

  whistle(long = false): void {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const blasts = long ? [0, 0.35, 0.7] : [0];
    for (const off of blasts) {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = 2950;
      osc2.type = 'square'; osc2.frequency.value = 3360; // beat frequency = trill
      g.gain.setValueAtTime(0, t + off);
      g.gain.linearRampToValueAtTime(0.09, t + off + 0.02);
      g.gain.setValueAtTime(0.09, t + off + (long ? 0.55 : 0.32));
      g.gain.exponentialRampToValueAtTime(0.001, t + off + (long ? 0.65 : 0.42));
      osc.connect(g); osc2.connect(g);
      g.connect(this.master!);
      osc.start(t + off); osc2.start(t + off);
      osc.stop(t + off + 1); osc2.stop(t + off + 1);
    }
  }

  kick(power = 0.5): void {
    this.thump(60 + power * 40, 0.09, 0.14 + power * 0.12);
  }

  bounce(): void {
    this.thump(80, 0.05, 0.07);
  }

  private thump(freq: number, attack: number, vol: number): void {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2.2, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + attack);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(g).connect(this.master!);
    osc.start(t); osc.stop(t + 0.3);
    // click transient
    const noise = this.noiseBurst(0.02, vol * 0.7, 2200);
    void noise;
  }

  netRipple(): void {
    this.noiseBurst(0.18, 0.12, 900);
  }

  post(): void {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.3);
    g.gain.setValueAtTime(0.16, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(g).connect(this.master!);
    osc.start(t); osc.stop(t + 0.6);
  }

  goalRoar(): void {
    if (!this.ctx || !this.enabled) return;
    // big rising cheer
    this.noiseBurst(2.6, 0.5, 700, 0.35);
    this.noiseBurst(1.4, 0.3, 1800, 0.1);
  }

  ooh(): void {
    this.noiseBurst(0.9, 0.22, 500, 0.18);
  }

  private noiseBurst(dur: number, vol: number, freq: number, attack = 0.02): GainNode | null {
    if (!this.ctx || !this.enabled) return null;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(this.master!);
    src.start(t);
    return g;
  }
}
