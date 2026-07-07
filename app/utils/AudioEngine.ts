class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private isAmbientPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      // Use standard or webkit AudioContext
      const AudioCtxClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    // Resume context if suspended (browser autoplay policy)
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        this.ambientGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      } else if (this.isAmbientPlaying) {
        this.ambientGain?.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.5);
      }
    }
    return this.isMuted;
  }

  public getMuteState(): boolean {
    return this.isMuted;
  }

  // Start the background magical drone
  public startAmbient() {
    this.initCtx();
    if (!this.ctx || this.isAmbientPlaying) return;

    this.isAmbientPlaying = true;

    try {
      const ctx = this.ctx;

      // 1. Create Oscillators (Deep mysterious frequencies)
      this.ambientOsc1 = ctx.createOscillator();
      this.ambientOsc1.type = "sine";
      this.ambientOsc1.frequency.setValueAtTime(55, ctx.currentTime); // A1

      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc2.type = "triangle";
      this.ambientOsc2.frequency.setValueAtTime(55.4, ctx.currentTime); // Dissonant beating frequency

      // 2. Filter (Lowpass filter to keep it dark and warm)
      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientFilter.type = "lowpass";
      this.ambientFilter.frequency.setValueAtTime(150, ctx.currentTime);
      this.ambientFilter.Q.setValueAtTime(4, ctx.currentTime);

      // 3. Ambient Gain
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, ctx.currentTime);

      // 4. Connect LFO to filter frequency to make the sound wave/swell
      this.lfo = ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // 12-second cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(40, ctx.currentTime); // Swell by +/- 40Hz

      // Connect LFO
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.ambientFilter.frequency);

      // Connect main graph
      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);
      this.ambientGain.connect(ctx.destination);

      // Start nodes
      this.ambientOsc1.start();
      this.ambientOsc2.start();
      this.lfo.start();
    } catch (e) {
      console.error("Failed to start ambient audio", e);
    }
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    try {
      this.ambientOsc1?.stop();
      this.ambientOsc2?.stop();
      this.lfo?.stop();
      this.ambientOsc1 = null;
      this.ambientOsc2 = null;
      this.lfo = null;
    } catch {
      // Ignored
    }
  }

  // Generate white noise buffer for paper/scratch sounds
  private getNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not initialized");
    const bufferSize = this.ctx.sampleRate * 1.5; // 1.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Synthesize a brief writing scratch sound
  public playScratch(durationMs = 80, isSoft = false) {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      // Bandpass filter to sound like quill on parchment
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      
      // Randomize frequency slightly for natural variation
      const baseFreq = isSoft ? 1800 : 1500;
      const freq = baseFreq + Math.random() * 600 - 300;
      filter.frequency.setValueAtTime(freq, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);

      const gain = ctx.createGain();
      const volume = isSoft ? 0.005 : 0.015;
      const randomVol = volume * (0.8 + Math.random() * 0.4);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      // Fast envelope rise
      gain.gain.linearRampToValueAtTime(randomVol, ctx.currentTime + 0.01);
      // Exponential decay
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);

      // Connect
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + durationMs / 1000 + 0.05);
    } catch {
      // Ignored
    }
  }

  // Synthesize a page flipping / rustle sound
  public playPageFlip() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      // Sweeping bandpass filter
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.45);
      filter.Q.setValueAtTime(1.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      // Combine with a low frequency sweep for the book spine motion
      const lowOsc = ctx.createOscillator();
      lowOsc.type = "sine";
      lowOsc.frequency.setValueAtTime(120, ctx.currentTime);
      lowOsc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);

      const lowGain = ctx.createGain();
      lowGain.gain.setValueAtTime(0.12, ctx.currentTime);
      lowGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

      // Connections
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      lowOsc.connect(lowGain);
      lowGain.connect(ctx.destination);

      // Start & Stop
      noise.start();
      noise.stop(ctx.currentTime + 0.55);
      lowOsc.start();
      lowOsc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignored
    }
  }

  // Synthesize a Parseltongue hiss/whisper
  public playWhisper() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(6000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.8);
      filter.Q.setValueAtTime(8, ctx.currentTime);

      // Add a volume LFO for shivering whisper
      const volLfo = ctx.createOscillator();
      volLfo.type = "sawtooth";
      volLfo.frequency.setValueAtTime(15, ctx.currentTime); // 15Hz vibrato

      const volLfoGain = ctx.createGain();
      volLfoGain.gain.setValueAtTime(0.005, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0.008, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.95);

      volLfo.connect(volLfoGain);
      volLfoGain.connect(gain.gain);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      volLfo.start();
      
      noise.stop(ctx.currentTime + 1.0);
      volLfo.stop(ctx.currentTime + 1.0);
    } catch {
      // Ignored
    }
  }

  // Double thump heartbeat sound
  public playHeartbeat() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      
      const playThump = (timeOffset: number, volume: number) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(65, ctx.currentTime + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + timeOffset + 0.15);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + timeOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.25);
      };

      // Play double beat: Thump-thump
      playThump(0, 0.25);
      playThump(0.22, 0.18);
    } catch {
      // Ignored
    }
  }
}

// Export a singleton instance
export const audio = new AudioEngine();
