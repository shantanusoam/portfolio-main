import assert from "node:assert/strict";
import { test } from "node:test";

import { AudioScheduler } from "@/lib/mascot/music/AudioScheduler";

test("scheduleNow plays at currentTime plus the safety offset, never in the past", () => {
  const clock = 10;
  const scheduler = new AudioScheduler({ getCurrentTime: () => clock });
  let playedAt: number | null = null;
  const time = scheduler.scheduleNow((t) => {
    playedAt = t;
  }, 0.006);
  assert.equal(time, 10.006);
  assert.equal(playedAt, 10.006);
});

test("scheduleNow defaults to the configured gesture safety offset", () => {
  const clock = 5;
  const scheduler = new AudioScheduler({ getCurrentTime: () => clock });
  const time = scheduler.scheduleNow(() => undefined);
  assert.ok(time > 5, "scheduled time must be strictly after currentTime");
  assert.ok(time - 5 < 0.05, "default safety offset should be small");
});

test("drainDue returns only notes within the look-ahead horizon, in time order", () => {
  const scheduler = new AudioScheduler({
    getCurrentTime: () => 0,
    scheduleAheadSeconds: 0.1,
  });
  const order: string[] = [];
  scheduler.enqueue({ time: 0.05, play: () => order.push("a") });
  scheduler.enqueue({ time: 0.02, play: () => order.push("b") });
  scheduler.enqueue({ time: 0.5, play: () => order.push("c") }); // outside horizon

  const due = scheduler.drainDue(0);
  assert.equal(due.length, 2);
  assert.equal(due[0].time, 0.02);
  assert.equal(due[1].time, 0.05);
  assert.equal(
    scheduler.getQueueLength(),
    1,
    "the far-future note stays queued",
  );

  due.forEach((note) => note.play(note.time));
  assert.deepEqual(order, ["b", "a"]);
  scheduler.clear();
});

test("drainDue is idempotent about ordering across repeated calls as the clock advances", () => {
  const scheduler = new AudioScheduler({
    getCurrentTime: () => 0,
    scheduleAheadSeconds: 0.1,
  });
  scheduler.enqueue({ time: 0.03, play: () => undefined });
  scheduler.enqueue({ time: 0.2, play: () => undefined });

  assert.equal(scheduler.drainDue(0).length, 1);
  assert.equal(scheduler.getQueueLength(), 1);
  assert.equal(scheduler.drainDue(0).length, 0, "not yet due");
  assert.equal(scheduler.drainDue(0.15).length, 1, "now within horizon");
  assert.equal(scheduler.getQueueLength(), 0);
  scheduler.clear();
});

test("queue is bounded: enqueueing past maxQueueLength drops the furthest-future note", () => {
  const scheduler = new AudioScheduler({
    getCurrentTime: () => 0,
    maxQueueLength: 2,
  });
  scheduler.enqueue({ time: 1, play: () => undefined });
  scheduler.enqueue({ time: 2, play: () => undefined });
  scheduler.enqueue({ time: 0.5, play: () => undefined });

  assert.equal(scheduler.getQueueLength(), 2);
  const due = scheduler.drainDue(1000); // drain everything remaining
  const times = due.map((n) => n.time);
  assert.deepEqual(
    times,
    [0.5, 1],
    "the time=2 note should have been dropped as least urgent",
  );
  scheduler.clear();
});

test("clear empties the queue and stops the look-ahead timer", () => {
  const scheduler = new AudioScheduler({ getCurrentTime: () => 0 });
  scheduler.enqueue({ time: 1, play: () => undefined });
  assert.ok(scheduler.isRunning());
  scheduler.clear();
  assert.equal(scheduler.getQueueLength(), 0);
  assert.equal(scheduler.isRunning(), false);
});

test("destroy behaves like clear and leaves the scheduler safely reusable", () => {
  const scheduler = new AudioScheduler({ getCurrentTime: () => 0 });
  scheduler.enqueue({ time: 1, play: () => undefined });
  scheduler.destroy();
  assert.equal(scheduler.getQueueLength(), 0);
  scheduler.enqueue({ time: 2, play: () => undefined });
  assert.equal(scheduler.getQueueLength(), 1);
  scheduler.clear();
});
