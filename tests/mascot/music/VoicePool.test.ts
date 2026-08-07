import assert from "node:assert/strict";
import { test } from "node:test";

import { VoicePool } from "@/lib/mascot/music/VoicePool";

function makePool(capacity: number) {
  const stopped: number[] = [];
  let nextHandleId = 0;
  const pool = new VoicePool<{ id: number }>({
    capacity,
    stop: (handle) => stopped.push(handle.id),
  });
  return {
    pool,
    stopped,
    newHandle: () => ({ id: nextHandleId++ }),
  };
}

test("acquiring never exceeds the configured capacity", () => {
  const { pool } = makePool(3);
  for (let i = 0; i < 10; i += 1) {
    const reservation = pool.acquire();
    assert.ok(reservation);
    pool.assign(reservation!.id, { id: i });
  }
  assert.equal(pool.getActiveCount(), 3);
});

test("zero-capacity pool never acquires and never throws", () => {
  const { pool } = makePool(0);
  const reservation = pool.acquire();
  assert.equal(reservation, null);
  assert.equal(pool.getActiveCount(), 0);
  pool.release(0);
  pool.free(0);
  pool.clear();
});

test("fills free slots before stealing anything", () => {
  const { pool, stopped } = makePool(3);
  for (let i = 0; i < 3; i += 1) {
    const reservation = pool.acquire()!;
    assert.equal(reservation.stole, false);
    pool.assign(reservation.id, { id: i });
  }
  assert.equal(stopped.length, 0);
});

test("steals a quiet released voice before any loud (unreleased) voice", () => {
  const { pool, stopped } = makePool(2);

  const a = pool.acquire()!;
  pool.assign(a.id, { id: 100 });
  pool.release(a.id); // a is now quiet

  const b = pool.acquire()!;
  pool.assign(b.id, { id: 200 }); // b stays loud (not released)

  // Pool is full: one quiet (a), one loud (b). The next acquire must steal a.
  const c = pool.acquire()!;
  assert.equal(c.stole, true);
  assert.equal(
    c.id,
    a.id,
    "should steal the quiet voice's slot, not the loud one",
  );
  assert.deepEqual(stopped, [100]);
});

test("among several quiet voices, steals the oldest one", () => {
  const { pool, stopped } = makePool(3);

  const first = pool.acquire()!;
  pool.assign(first.id, { id: 1 });
  pool.release(first.id);

  const second = pool.acquire()!;
  pool.assign(second.id, { id: 2 });
  pool.release(second.id);

  const third = pool.acquire()!;
  pool.assign(third.id, { id: 3 });
  pool.release(third.id);

  const next = pool.acquire()!;
  assert.equal(next.id, first.id);
  assert.deepEqual(stopped, [1]);
});

test("steals the oldest voice overall when nothing is quiet", () => {
  const { pool, stopped } = makePool(2);

  const first = pool.acquire()!;
  pool.assign(first.id, { id: 1 });

  const second = pool.acquire()!;
  pool.assign(second.id, { id: 2 });

  // Neither has been released — both are "loud". Must steal the oldest (first).
  const next = pool.acquire()!;
  assert.equal(next.id, first.id);
  assert.deepEqual(stopped, [1]);
});

test("free() makes a slot immediately reusable without stealing", () => {
  const { pool, stopped } = makePool(1);
  const first = pool.acquire()!;
  pool.assign(first.id, { id: 1 });
  pool.free(first.id);

  const second = pool.acquire()!;
  assert.equal(second.stole, false);
  assert.equal(
    stopped.length,
    0,
    "free() already ended playback; no stop() call needed",
  );
});

test("clear() stops every active handle and resets all slots", () => {
  const { pool, stopped } = makePool(3);
  for (let i = 0; i < 3; i += 1) {
    const reservation = pool.acquire()!;
    pool.assign(reservation.id, { id: i });
  }
  pool.clear();
  assert.equal(pool.getActiveCount(), 0);
  assert.equal(stopped.length, 3);

  // Pool is fully reusable afterwards.
  const reservation = pool.acquire()!;
  assert.equal(reservation.stole, false);
});

test("getQuietActiveCount reflects released-but-not-yet-freed voices", () => {
  const { pool } = makePool(2);
  const a = pool.acquire()!;
  pool.assign(a.id, { id: 1 });
  const b = pool.acquire()!;
  pool.assign(b.id, { id: 2 });

  assert.equal(pool.getQuietActiveCount(), 0);
  pool.release(a.id);
  assert.equal(pool.getQuietActiveCount(), 1);
});

test("capacity is fixed at construction and reported via getCapacity", () => {
  const { pool } = makePool(5);
  assert.equal(pool.getCapacity(), 5);
});
