import assert from "node:assert/strict";
import test from "node:test";
import { GameAudio } from "../../lib/space-impact/audio";
import { defaultPocketSettings } from "../../lib/space-impact/pocket/save";
type TestContext = Parameters<NonNullable<Parameters<typeof test>[0]>>[0];
class Param {
  value = 0;
  events: Array<{ value: number; time: number }> = [];
  setValueAtTime(value: number, time: number) {
    this.events.push({ value, time });
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.setValueAtTime(value, time);
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.setValueAtTime(value, time);
  }
}
class Node {
  // eslint-disable-next-line no-use-before-define
  connected: Node | null = null;
  disconnected = false;
  connect(node: Node) {
    this.connected = node;
  }

  disconnect() {
    this.disconnected = true;
  }
}
class Gain extends Node {
  gain = new Param();
}
class Oscillator extends Node {
  frequency = new Param();
  type = "sine";
  onended: (() => void) | null = null;
  started = -1;
  stopped = -1;
  start(time: number) {
    this.started = time;
  }

  stop(time = 0) {
    this.stopped = time;
  }
}
class Compressor extends Node {
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
}
class Context {
  // eslint-disable-next-line no-use-before-define
  static instances: Context[] = [];
  state = "suspended";
  currentTime = 10;
  destination = new Node();
  onstatechange: (() => void) | null = null;
  oscillators: Oscillator[] = [];
  gains: Gain[] = [];
  compressor = new Compressor();
  resumeCalls = 0;
  failResume = false;
  resumeGate: Promise<void> | null = null;
  constructor() {
    Context.instances.push(this);
  }

  createGain() {
    const gain = new Gain();
    this.gains.push(gain);
    return gain;
  }

  createOscillator() {
    const node = new Oscillator();
    this.oscillators.push(node);
    return node;
  }

  createDynamicsCompressor() {
    return this.compressor;
  }

  async resume() {
    this.resumeCalls++;
    if (this.failResume) throw new Error("Device denied");
    if (this.resumeGate) await this.resumeGate;
    if (this.state !== "closed") this.state = "running";
    this.onstatechange?.();
  }

  async close() {
    this.state = "closed";
  }
}
function harness(t: TestContext) {
  Context.instances = [];
  t.mock.method(
    globalThis,
    "setInterval",
    (() => 123) as unknown as typeof setInterval,
  );
  t.mock.method(
    globalThis,
    "clearInterval",
    (() => undefined) as typeof clearInterval,
  );
  const old = Object.getOwnPropertyDescriptor(globalThis, "AudioContext");
  Object.defineProperty(globalThis, "AudioContext", {
    value: Context,
    configurable: true,
  });
  t.after(() => {
    if (old) Object.defineProperty(globalThis, "AudioContext", old);
    else Reflect.deleteProperty(globalThis, "AudioContext");
  });
}
test("no context or voices until activation; Start can activate after gameplay begins", async (t) => {
  harness(t);
  const statuses: string[] = [];
  const audio = new GameAudio(defaultPocketSettings(), (s) => statuses.push(s));
  t.after(() => audio.dispose());
  audio.setActive(true);
  audio.play("shot");
  assert.equal(Context.instances.length, 0);
  assert.equal(audio.status, "locked");
  assert.equal(await audio.unlock(), true);
  const ctx = Context.instances[0];
  assert.equal(ctx.resumeCalls, 1);
  assert.deepEqual(statuses, ["running"]);
  assert.ok(ctx.oscillators.length > 0);
  assert.equal(ctx.compressor.connected, ctx.gains[0]);
  assert.equal(ctx.gains[0].connected, ctx.destination);
  assert.ok(
    ctx.oscillators.every(
      (node) =>
        node.started >= ctx.currentTime && node.started < ctx.currentTime + 0.1,
    ),
  );
});
test("mute removes queued voices, unmute restarts one scheduler, pause stops it", async (t) => {
  harness(t);
  const settings = defaultPocketSettings();
  const audio = new GameAudio(settings);
  t.after(() => audio.dispose());
  await audio.unlock();
  audio.setActive(true);
  const ctx = Context.instances[0];
  audio.play("pickup");
  const beforeMute = ctx.oscillators.slice();
  audio.configure({ ...settings, muted: true });
  assert.ok(beforeMute.every((node) => node.disconnected));
  const count = ctx.oscillators.length;
  audio.play("pulse");
  assert.equal(ctx.oscillators.length, count);
  audio.configure(settings);
  audio.setActive(true);
  audio.setActive(true);
  assert.equal(
    (
      setInterval as unknown as { mock: { callCount(): number } }
    ).mock.callCount(),
    2,
  );
  audio.setActive(false);
  assert.ok(ctx.oscillators.every((node) => node.disconnected));
});
test("effects produce audible-range notes and overlap stays bounded with immediate cleanup", async (t) => {
  harness(t);
  const audio = new GameAudio(defaultPocketSettings());
  t.after(() => audio.dispose());
  await audio.unlock();
  const ctx = Context.instances[0];
  audio.play("shot");
  assert.equal(ctx.oscillators.length, 1);
  assert.ok(ctx.oscillators[0].frequency.events[0].value >= 660);
  audio.play("shot");
  assert.equal(ctx.oscillators.length, 1);
  for (let i = 0; i < 100; i++) audio.play("pulse");
  assert.equal(ctx.oscillators.length, 24);
  assert.ok(
    ctx.gains
      .slice(1)
      .every((gain) => gain.gain.events.every((e) => e.value <= 0.12)),
  );
  audio.dispose();
  assert.ok(ctx.oscillators.every((node) => node.disconnected));
  assert.ok(ctx.gains.every((node) => node.disconnected));
  assert.equal(ctx.state, "closed");
  assert.equal(await audio.unlock(), false);
});
test("zero levels stay silent; a device interruption can be resumed by another gesture", async (t) => {
  harness(t);
  const audio = new GameAudio({
    ...defaultPocketSettings(),
    effects: 0,
    music: 0,
  });
  t.after(() => audio.dispose());
  await audio.unlock();
  audio.setActive(true);
  audio.play("pickup");
  const ctx = Context.instances[0];
  assert.equal(ctx.oscillators.length, 0);
  ctx.state = "interrupted";
  ctx.onstatechange?.();
  assert.equal(audio.status, "suspended");
  assert.equal(await audio.unlock(), true);
  assert.equal(ctx.resumeCalls, 2);
});
test("unsupported or rejected audio is recoverable and never blocks play", async (t) => {
  harness(t);
  Object.defineProperty(globalThis, "AudioContext", {
    value: undefined,
    configurable: true,
  });
  const audio = new GameAudio(defaultPocketSettings());
  t.after(() => audio.dispose());
  assert.equal(await audio.unlock(), false);
  assert.equal(audio.status, "unavailable");
  Object.defineProperty(globalThis, "AudioContext", {
    value: Context,
    configurable: true,
  });
  assert.equal(await audio.unlock(), true);
  const ctx = Context.instances[0];
  ctx.state = "suspended";
  ctx.failResume = true;
  assert.equal(await audio.unlock(), false);
  assert.equal(audio.status, "unavailable");
  ctx.failResume = false;
  assert.equal(await audio.unlock(), true);
});
test("route disposal while resume is pending cannot restart audio", async (t) => {
  harness(t);
  const audio = new GameAudio(defaultPocketSettings());
  await audio.unlock();
  const ctx = Context.instances[0];
  ctx.state = "suspended";
  let finish!: () => void;
  ctx.resumeGate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const pending = audio.unlock();
  audio.dispose();
  finish();
  assert.equal(await pending, false);
  assert.equal(ctx.state, "closed");
  assert.equal(ctx.onstatechange, null);
});
test("terminal fanfare survives inactive frames; explicit pause silences it", async (t) => {
  harness(t);
  const audio = new GameAudio(defaultPocketSettings());
  t.after(() => audio.dispose());
  await audio.unlock();
  audio.setActive(true);
  const ctx = Context.instances[0];
  const musicCount = ctx.oscillators.length;
  audio.setActive(false);
  audio.play("clear");
  audio.setActive(false);
  const fanfare = ctx.oscillators.slice(musicCount);
  assert.equal(fanfare.length, 4);
  assert.ok(fanfare.every((node) => !node.disconnected));
  audio.suspendPlayback();
  assert.ok(fanfare.every((node) => node.disconnected));
});
test("a delayed scheduler drops missed beats and does not burst on resume", async (t) => {
  harness(t);
  const audio = new GameAudio(defaultPocketSettings());
  t.after(() => audio.dispose());
  await audio.unlock();
  audio.setActive(true, true);
  const ctx = Context.instances[0];
  const scheduled = setInterval as unknown as {
    mock: { calls: Array<{ arguments: unknown[] }> };
  };
  const tick = scheduled.mock.calls[0].arguments[0] as () => void;
  const before = ctx.oscillators.length;
  ctx.currentTime += 60;
  tick();
  const fresh = ctx.oscillators.slice(before);
  assert.ok(fresh.length > 0 && fresh.length <= 3);
  assert.ok(
    fresh.every(
      (node) =>
        node.started >= ctx.currentTime && node.started < ctx.currentTime + 0.1,
    ),
  );
  audio.suspendPlayback();
  const pausedCount = ctx.oscillators.length;
  tick();
  assert.equal(ctx.oscillators.length, pausedCount);
});
