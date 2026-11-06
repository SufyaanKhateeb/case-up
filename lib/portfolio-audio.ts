import type { Trick } from "./character-state";

// Locally synthesized effects following the public sebg.ch sound design.
// No recordings, remote scripts, or background music are loaded.
export type SoundEffect = "blip" | "pat" | "giggle" | "grab" | "drop" | "dance" | "punch" | "panic" | "fly" | "vanish" | "hiccup" | "peekaboo" | "selfie" | "dizzy" | "sneeze" | "sulk" | "bell" | "whoosh" | "scratch" | "shatter" | "sleep" | "wake";
export const trickSound: Record<Trick, SoundEffect> = {
  Dance: "dance", "Punching bag": "punch", Panic: "panic", Fly: "fly", Vanish: "vanish", Hiccup: "hiccup", Peekaboo: "peekaboo", Selfie: "selfie", Dizzy: "dizzy", Sneeze: "sneeze", Sulk: "sulk",
};

function browserContext() {
  const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Constructor();
}

export type AudioStatus = "muted" | "pending" | "running";
export function createPortfolioAudio(makeContext: () => AudioContext = browserContext, onStatus: (status: AudioStatus) => void = () => {}) {
  let context: AudioContext | null = null, output: GainNode | null = null;
  let enabled = false, activated = false, revision = 0;
  let pendingEffect: SoundEffect | null = null;
  const voices = new Map<AudioScheduledSourceNode, AudioNode[]>();
  const last = new Map<SoundEffect, number>();
  function updateStatus() {
    const ready = context?.state === "running";
    onStatus(!enabled ? "muted" : ready ? "running" : "pending");
    if (enabled && ready && pendingEffect) {
      const effect = pendingEffect; pendingEffect = null; void play(effect);
    }
  }
  function stop() {
    revision++;
    for (const [source, nodes] of Array.from(voices)) {
      source.onended = null;
      try { source.stop(); } catch { /* Already ended. */ }
      source.disconnect(); nodes.forEach(node => node.disconnect());
    }
    voices.clear(); last.clear(); pendingEffect = null;
  }
  function setEnabled(value: boolean) {
    enabled = value;
    if (!value) stop();
    updateStatus();
  }
  const browserActivated = () => typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true;
  async function unlock(fromGesture = false) {
    if (!enabled) return false;
    activated = activated || fromGesture || browserActivated();
    if (!activated) return false;
    try {
      if (!context || context.state === "closed") {
        context = makeContext(); output = context.createGain();
        output.gain.value = .7; output.connect(context.destination);
        context.onstatechange = updateStatus;
      }
      const current = context;
      if (current.state !== "running") await current.resume();
      if (!enabled || current !== context) return false;
      const ready = current.state === "running";
      updateStatus();
      return ready;
    } catch { return false; }
  }
  function track(source: AudioScheduledSourceNode, nodes: AudioNode[]) {
    voices.set(source, nodes);
    source.onended = () => {
      source.disconnect(); nodes.forEach(node => node.disconnect()); voices.delete(source);
    };
  }
  async function play(effect: SoundEffect) {
    // Do not even create/resume a context for startup, scroll or idle cues before
    // a real interaction. Browsers warn on each forbidden autoplay attempt.
    if (!enabled || (!activated && !browserActivated())) return false;
    if (!context || !output || context.state !== "running") {
      // After activation, retain only the latest cue while resuming.
      pendingEffect = effect;
      void unlock();
      return false;
    }
    const ticket = revision;
    try {
      if (context.state !== "running") await context.resume();
      if (!enabled || ticket !== revision || context.state !== "running") return false;
      const ctx = context, destination = output, now = ctx.currentTime + .01;
      const interval = effect === "blip" ? .12 : effect === "scratch" ? .06 : 0;
      if (now - (last.get(effect) ?? -Infinity) < interval) return false;
      last.set(effect, now);
      const envelope = (at: number, peak: number, duration: number) => {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(peak, at + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
        gain.connect(destination); return gain;
      };
      const tone = (at: number, type: OscillatorType, from: number, to: number, duration: number, volume = .13, vibrato?: [number, number]) => {
        const oscillator = ctx.createOscillator(), gain = envelope(at, volume, duration);
        oscillator.type = type; oscillator.frequency.setValueAtTime(from, at);
        oscillator.frequency.exponentialRampToValueAtTime(to, at + duration);
        oscillator.connect(gain); track(oscillator, [gain]);
        if (vibrato) {
          const lfo = ctx.createOscillator(), depth = ctx.createGain();
          lfo.frequency.value = vibrato[0];
          depth.gain.setValueAtTime(vibrato[1], at); depth.gain.linearRampToValueAtTime(0, at + duration);
          lfo.connect(depth); depth.connect(oscillator.frequency); track(lfo, [depth]);
          lfo.start(at); lfo.stop(at + duration);
        }
        oscillator.start(at); oscillator.stop(at + duration);
      };
      const noise = (at: number, duration: number, volume: number, type: BiquadFilterType, from: number, to = from, q = .9) => {
        const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
        source.buffer = buffer; filter.type = type; filter.Q.value = q;
        filter.frequency.setValueAtTime(from, at); filter.frequency.exponentialRampToValueAtTime(to, at + duration);
        const gain = envelope(at, volume, duration);
        source.connect(filter); filter.connect(gain); track(source, [filter, gain]);
        source.start(at); source.stop(at + duration);
      };
      switch (effect) {
        case "blip": { const pitch = 392 * 2 ** (Math.random() * 5 / 12); tone(now, "triangle", pitch * 1.25, pitch, .07, .1); break; }
        case "sleep": {
          const at = now + .35, oscillator = ctx.createOscillator(), gain = ctx.createGain(), filter = ctx.createBiquadFilter();
          oscillator.type = "sawtooth"; oscillator.frequency.setValueAtTime(262, at);
          oscillator.frequency.linearRampToValueAtTime(349, at + .35); oscillator.frequency.linearRampToValueAtTime(175, at + 1.2);
          filter.type = "lowpass"; filter.Q.value = 6; filter.frequency.setValueAtTime(400, at);
          filter.frequency.linearRampToValueAtTime(1100, at + .4); filter.frequency.linearRampToValueAtTime(300, at + 1.1);
          gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(.075, at + .3);
          gain.gain.linearRampToValueAtTime(.06, at + .8); gain.gain.linearRampToValueAtTime(0, at + 1.2);
          oscillator.connect(gain); gain.connect(filter); filter.connect(destination); track(oscillator, [gain, filter]);
          oscillator.start(at); oscillator.stop(at + 1.2); break;
        }
        case "wake": tone(now, "triangle", 587, 880, .06, .14); tone(now + .07, "triangle", 880, 1319, .12, .14); break;
        case "pat": tone(now, "sine", 523, 587, .16); tone(now + .13, "sine", 659, 784, .3, .12); break;
        case "giggle": [988, 880, 932, 784].forEach((pitch, i) => tone(now + i * .12, "triangle", pitch, pitch * 1.12, .1)); break;
        case "grab": tone(now, "triangle", 196, 523, .4, .14, [14, 14]); break;
        case "drop": tone(now, "sine", 392, 220, .7, .15, [11, 80]); break;
        case "dance": [523, 659, 784, 659, 587, 740, 880, 1047].forEach((pitch, i) => tone(now + i * .2, "triangle", pitch, pitch, .12, .11)); break;
        case "panic": [988, 740, 988, 740, 988, 740, 988, 740].forEach((pitch, i) => tone(now + i * .1, "triangle", pitch, pitch, .08, .1)); break;
        case "fly": tone(now, "triangle", 262, 784, 1.9, .12, [9, 20]); break;
        case "hiccup": [.3, 1.2, 1.8].forEach(at => tone(now + at, "triangle", 700, 1400, .07)); break;
        case "peekaboo": tone(now + 1.6, "triangle", 392, 1175, .18, .14); tone(now + 1.76, "triangle", 784, 1568, .14, .12); break;
        case "selfie": noise(now + 1.1, .05, .25, "highpass", 2000); tone(now + 1.1, "square", 1800, 1200, .03, .06); break;
        case "dizzy": tone(now, "sine", 880, 330, 1.2, .13, [7, 70]); break;
        case "sneeze": noise(now + 1.15, .3, .35, "bandpass", 2600, 700, 1.2); tone(now + 1.15, "triangle", 880, 220, .25, .1); break;
        case "sulk": tone(now, "triangle", 262, 247, .12, .12); tone(now + .15, "triangle", 220, 165, .3, .12); break;
        case "vanish": tone(now + .2, "sine", 880, 110, 1, .12, [30, 40]); tone(now + 2.2, "sine", 110, 880, 1, .12, [30, 40]); break;
        case "punch": tone(now, "sine", 160, 50, .18, .3); noise(now, .08, .3, "lowpass", 900); break;
        case "bell": [0, .22].forEach(at => { tone(now + at, "sine", 1319, 1319, .6, .12); tone(now + at, "sine", 3296, 3296, .3, .05); }); break;
        case "whoosh": noise(now, .45, .15, "bandpass", 300, 1800); break;
        case "scratch": noise(now, .05, .08, "bandpass", 2500 + Math.random() * 2500); break;
        case "shatter": noise(now, .3, .2, "highpass", 1500); [523, 659, 784, 1047].forEach((pitch, i) => tone(now + .08 + i * .08, "triangle", pitch, pitch, .2, .12)); break;
      }
      return true;
    } catch { stop(); return false; }
  }
  function dispose() {
    stop(); activated = false;
    output?.disconnect(); output = null;
    if (context) context.onstatechange = null;
    void context?.close().catch(() => {}); context = null;
  }
  return { setEnabled, unlock, play, stop, dispose };
}
