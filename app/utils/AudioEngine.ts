class AudioEngine {
  private ctx: AudioContext | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private isMuted: boolean = false;
  private isAmbientPlaying: boolean = false;

  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private isRingHumPlaying: boolean = false;

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
        this.ringGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      } else {
        if (this.isAmbientPlaying) {
          this.ambientGain?.gain.setTargetAtTime(0.04, this.ctx.currentTime, 0.5);
        }
        if (this.isRingHumPlaying) {
          this.ringGain?.gain.setTargetAtTime(0.08, this.ctx.currentTime, 0.5);
        }
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

  // Synthesize venom sizzling burn sound
  public playSizzle() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 1.2);
      filter.Q.setValueAtTime(4, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 1.25);
    } catch {
      // Ignored
    }
  }

  // Synthesize a loud, piercing, dissonant magical scream
  public playScream() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const duration = 2.0;

      // Create a set of dissonant pitches for a terrifying screech
      const baseFreqs = [220, 224, 440, 660, 882];
      const oscs: OscillatorNode[] = [];
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.setValueAtTime(2200, ctx.currentTime);
      filter.Q.setValueAtTime(8, ctx.currentTime);

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.setValueAtTime(4000, ctx.currentTime);
      lowpass.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.04);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      baseFreqs.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        // Screaming pitch sweep and fast vibrato
        osc.frequency.linearRampToValueAtTime(f * 1.6, ctx.currentTime + 0.25);
        osc.frequency.exponentialRampToValueAtTime(f * 0.4, ctx.currentTime + duration);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.06, ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(filter);
        oscs.push(osc);
      });

      filter.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(ctx.destination);

      oscs.forEach((o) => {
        o.start();
        o.stop(ctx.currentTime + duration + 0.1);
      });

      // Play deep sub bass impact alongside it
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(90, ctx.currentTime);
      sub.frequency.exponentialRampToValueAtTime(15, ctx.currentTime + 0.95);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.35, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.95);

      sub.connect(subGain);
      subGain.connect(ctx.destination);

      sub.start();
      sub.stop(ctx.currentTime + 1.0);
    } catch {
      // Ignored
    }
  }

  // Start the Ring's ambient drone
  public startRingHum() {
    this.initCtx();
    if (!this.ctx || this.isRingHumPlaying) return;
    this.isRingHumPlaying = true;

    try {
      const ctx = this.ctx;
      this.ringOsc1 = ctx.createOscillator();
      this.ringOsc1.type = "triangle";
      this.ringOsc1.frequency.setValueAtTime(73.42, ctx.currentTime); // D2

      this.ringOsc2 = ctx.createOscillator();
      this.ringOsc2.type = "sine";
      this.ringOsc2.frequency.setValueAtTime(74.22, ctx.currentTime); // Dissonant beating

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);

      // Low frequency oscillator to make the hum pulsate/breathe
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(0.4, ctx.currentTime); // 2.5s swell cycle

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(70, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      this.ringGain = ctx.createGain();
      this.ringGain.gain.setValueAtTime(0, ctx.currentTime);
      this.ringGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.08, ctx.currentTime + 1.2);

      this.ringOsc1.connect(filter);
      this.ringOsc2.connect(filter);
      filter.connect(this.ringGain);
      this.ringGain.connect(ctx.destination);

      lfo.start();
      this.ringOsc1.start();
      this.ringOsc2.start();

      // Store reference to LFO inside oscillators so we can stop them cleanly if needed
      // (not strictly necessary since we stop osc nodes, but good to know)
    } catch {
      // Ignored
    }
  }

  // Fade out and stop the Ring's drone
  public stopRingHum() {
    if (!this.isRingHumPlaying) return;
    this.isRingHumPlaying = false;

    try {
      const ctx = this.ctx;
      const osc1 = this.ringOsc1;
      const osc2 = this.ringOsc2;
      const gain = this.ringGain;

      if (ctx && gain) {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
      }

      setTimeout(() => {
        try {
          osc1?.stop();
          osc2?.stop();
        } catch {
          // Ignore if already stopped
        }
      }, 950);

      this.ringOsc1 = null;
      this.ringOsc2 = null;
      this.ringGain = null;
    } catch {
      // Ignored
    }
  }

  // Low raspy white noise snake hiss sound
  public playHiss() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(4200, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 1.4);
      filter.Q.setValueAtTime(6, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.1);
      gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.7);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 1.45);
    } catch {
      // Ignored
    }
  }

  // Piercing blade swipe sound for the Sword of Gryffindor
  public playSlash() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.45);

      const osc2 = ctx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(1200, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.45);

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(550, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.55);
      osc2.stop(ctx.currentTime + 0.55);
    } catch {
      // Ignored
    }
  }

  // Celestial high-pass bell hum for Lumos reveal
  public playLumos() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1800, ctx.currentTime);

      const vibrato = ctx.createOscillator();
      vibrato.type = "sine";
      vibrato.frequency.setValueAtTime(7, ctx.currentTime);

      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(25, ctx.currentTime);

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      vibrato.start();
      osc.stop(ctx.currentTime + 1.45);
      vibrato.stop(ctx.currentTime + 1.45);
    } catch {
      // Ignored
    }
  }

  // Translucent warning whisper tone for the Resurrection Stone
  public playGhostWhisper() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.setValueAtTime(2400, ctx.currentTime);
      filter.Q.setValueAtTime(10, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(3.5, ctx.currentTime); // Shiver frequency

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.007, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.009, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      lfo.start();
      noise.stop(ctx.currentTime + 1.85);
      lfo.stop(ctx.currentTime + 1.85);
    } catch {
      // Ignored
    }
  }

  // Deep wind-chime ambient swell for entering the Pensieve
  public playPensieveSwell() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    try {
      const ctx = this.ctx;
      const freqs = [110, 220, 330, 440];
      const oscs: OscillatorNode[] = [];

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(550, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

      freqs.forEach((f) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(f * 0.97, ctx.currentTime + 2.8);

        osc.connect(filter);
        oscs.push(osc);
      });

      filter.connect(gain);
      gain.connect(ctx.destination);

      oscs.forEach((o) => {
        o.start();
        o.stop(ctx.currentTime + 2.9);
      });
    } catch {
      // Ignored
    }
  }

  // Crystal ring bell chime — played when hovering the Ring prop
  public playRingChime() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      const freqs = [659.25, 880, 1318.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.07);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.07 + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 1.65);
      });
    } catch { /* ignored */ }
  }

  // Crucio pain crackle — electrical dark magic torture
  public playCrucio() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      // Electrical crackle: noise bursts at irregular intervals
      for (let i = 0; i < 5; i++) {
        const delay = i * 0.12 + Math.random() * 0.06;
        const noise = ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer();

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(2800 + Math.random() * 1200, ctx.currentTime + delay);
        filter.Q.setValueAtTime(8, ctx.currentTime + delay);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 0.18);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(ctx.currentTime + delay);
        noise.stop(ctx.currentTime + delay + 0.2);
      }
      // Low ominous bass hit
      const sub = ctx.createOscillator();
      sub.type = "sawtooth";
      sub.frequency.setValueAtTime(55, ctx.currentTime);
      sub.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.7);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.12, ctx.currentTime);
      subGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start();
      sub.stop(ctx.currentTime + 0.75);
    } catch { /* ignored */ }
  }

  // Expelliarmus — sharp disarming crack
  public playExpelliarmus() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);

      const noise = ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const nFilter = ctx.createBiquadFilter();
      nFilter.type = "highpass";
      nFilter.frequency.setValueAtTime(2000, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.04, ctx.currentTime);
      nGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
      noise.start();
      noise.stop(ctx.currentTime + 0.35);
    } catch { /* ignored */ }
  }

  // Stupefy — blunt impact stun
  public playStupefy() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch { /* ignored */ }
  }

  // Protego — glass-like shield shatter hum
  public playProtego() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      const freqs = [1046.5, 1318.5, 1568];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.04);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + i * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.04 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.04);
        osc.stop(ctx.currentTime + i * 0.04 + 1.25);
      });
    } catch { /* ignored */ }
  }

  // Sectumsempra — dark cutting slash
  public playSectumsempra() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch { /* ignored */ }
  }

  // Wingardium Leviosa — rising airy sweep
  public playWingardium() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.35);
    } catch { /* ignored */ }
  }
}

// Export a singleton instance
export const audio = new AudioEngine();
