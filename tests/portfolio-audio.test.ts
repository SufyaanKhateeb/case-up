import { test } from "node:test";
import assert from "node:assert/strict";
import { createPortfolioAudio, trickSound, type AudioStatus } from "../lib/portfolio-audio";
import { tricks } from "../lib/character-state";

function fakeAudio(onStatus?: (status: AudioStatus) => void) {
  const sources: { started: number[]; stopped: number[]; disconnected: boolean; onended: (() => void) | null }[] = [];
  const parameter = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {} });
  function source() {
    const result = {
      ...node(), frequency: parameter(), started: [] as number[], stopped: [] as number[], disconnected: false, onended: null as (() => void) | null,
      start(at: number) { this.started.push(at); }, stop(at = 0) { this.stopped.push(at); }, disconnect() { this.disconnected = true; },
    };
    sources.push(result); return result;
  }
  const finishResumes: (() => void)[] = [];
  const context = {
    state: "suspended", currentTime: 0, sampleRate: 48000, destination: node(), deferResume: false, rejectResume: false,
    onstatechange: null as (() => void) | null,
    async resume() {
      if (this.rejectResume) throw new Error("Activation required");
      if (this.deferResume) await new Promise<void>(resolve => { finishResumes.push(resolve); });
      this.state = "running";
      this.onstatechange?.();
    },
    async close() { this.state = "closed"; },
    createGain: () => ({ ...node(), gain: parameter() }),
    createOscillator: source, createBufferSource: source,
    createBiquadFilter: () => ({ ...node(), frequency: parameter(), Q: parameter() }),
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
  };
  return { context, sources, resume: () => finishResumes.splice(0).forEach(resolve => resolve()), engine: createPortfolioAudio(() => context as unknown as AudioContext, onStatus) };
}

test("sound defaults to silent and only schedules when explicitly enabled", async () => {
  const { engine, sources } = fakeAudio();
  assert.equal(await engine.play("pat"), false);
  engine.setEnabled(true);
  assert.equal(await engine.unlock(true), true);
  assert.equal(await engine.play("pat"), true);
  assert.equal(sources.length, 2);
  engine.dispose();
});

test("reload, scroll and idle cues never create audio before user activation", async () => {
  let contexts = 0;
  const statuses: AudioStatus[] = [];
  const engine = createPortfolioAudio(() => { contexts++; throw new Error("Must not initialize before a gesture"); }, status => statuses.push(status));
  engine.setEnabled(true);
  for (let i = 0; i < 5; i++) {
    assert.equal(await engine.unlock(), false);
    assert.equal(await engine.play("blip"), false);
    assert.equal(await engine.play("sleep"), false);
  }
  assert.equal(contexts, 0);
  assert.equal(statuses.at(-1), "pending");
  engine.dispose();
});

test("effects recover from a rejected first resume without another sound toggle", async () => {
  const { engine, context, sources } = fakeAudio();
  engine.setEnabled(true); context.rejectResume = true;
  assert.equal(await engine.unlock(true), false);
  context.rejectResume = false;
  await engine.play("pat");
  await Promise.resolve();
  assert.equal(context.state, "running");
  assert.equal(sources.length, 2);
  engine.dispose();
});

test("a running context plays even while an earlier resume promise is pending", async () => {
  const { engine, context, sources, resume } = fakeAudio();
  engine.setEnabled(true); context.deferResume = true;
  const activation = engine.unlock(true);
  context.state = "running";
  assert.equal(await engine.play("pat"), true);
  assert.equal(sources.length, 2);
  resume(); await activation;
  engine.dispose();
});

test("the control reports pending activation until the audio context actually runs", async () => {
  const statuses: AudioStatus[] = [];
  const { engine, context } = fakeAudio(status => statuses.push(status));
  engine.setEnabled(true); context.rejectResume = true;
  await engine.unlock(true);
  assert.equal(statuses.at(-1), "pending");
  context.rejectResume = false; await engine.unlock(true);
  assert.equal(statuses.at(-1), "running");
  context.state = "suspended"; context.onstatechange?.();
  assert.equal(statuses.at(-1), "pending");
  engine.setEnabled(false);
  assert.equal(statuses.at(-1), "muted");
  engine.dispose(); assert.equal(context.onstatechange, null);
});

test("muting cancels delayed trick notes and rejects a pending resume", async () => {
  const { engine, sources, context, resume } = fakeAudio();
  engine.setEnabled(true); await engine.unlock(true);
  await engine.play("hiccup");
  assert.deepEqual(sources.map(source => source.started[0]), [.31, 1.21, 1.81]);
  engine.setEnabled(false);
  assert.ok(sources.every(source => source.stopped.includes(0) && source.disconnected));
  engine.setEnabled(true); context.state = "suspended"; context.deferResume = true;
  const pending = engine.play("dance");
  engine.setEnabled(false); resume();
  assert.equal(await pending, false);
  assert.equal(sources.length, 3);
  engine.dispose();
});

test("all tricks have distinct working effects and interruption stops every voice", async () => {
  const { engine, sources } = fakeAudio();
  engine.setEnabled(true); await engine.unlock(true);
  assert.equal(new Set(Object.values(trickSound)).size, tricks.length);
  for (const trick of tricks) assert.equal(await engine.play(trickSound[trick]), true, trick);
  for (const effect of ["sleep", "wake"] as const) assert.equal(await engine.play(effect), true, effect);
  assert.ok(sources.length > tricks.length);
  engine.stop();
  assert.ok(sources.every(source => source.stopped.includes(0) && source.disconnected));
  engine.dispose();
});

test("scratch and speech are rate limited, audio failure remains optional", async () => {
  const { engine, context } = fakeAudio();
  engine.setEnabled(true); await engine.unlock(true);
  assert.equal(await engine.play("scratch"), true);
  assert.equal(await engine.play("scratch"), false);
  context.currentTime = .07;
  assert.equal(await engine.play("scratch"), true);
  assert.equal(await engine.play("blip"), true);
  context.currentTime = .1;
  assert.equal(await engine.play("blip"), false);
  engine.dispose();
  const unavailable = createPortfolioAudio(() => { throw new Error("Audio unavailable"); });
  unavailable.setEnabled(true);
  assert.equal(await unavailable.unlock(true), false);
  assert.equal(await unavailable.play("pat"), false);
  unavailable.dispose();
});

test("first activation flushes the latest queued cue without toggling sound again", async () => {
  const { engine, context, sources, resume } = fakeAudio();
  engine.setEnabled(true); context.deferResume = true;
  const activation = engine.unlock(true);
  await engine.play("dance"); await engine.play("pat");
  assert.equal(sources.length, 0);
  resume(); assert.equal(await activation, true);
  await Promise.resolve();
  assert.equal(sources.length, 2);
  engine.dispose();
});

test("muting during initial activation discards the queued cue", async () => {
  const { engine, context, sources, resume } = fakeAudio();
  engine.setEnabled(true); context.deferResume = true;
  const activation = engine.unlock(true); await engine.play("pat");
  engine.setEnabled(false); resume();
  assert.equal(await activation, false);
  assert.equal(sources.length, 0);
  engine.dispose();
});
