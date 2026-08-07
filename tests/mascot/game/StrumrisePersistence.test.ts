import assert from "node:assert/strict";
import { test } from "node:test";

import {
  loadStrumriseSave,
  saveStrumriseSave,
  type StorageLike,
} from "@/lib/mascot/game/StrumrisePersistence";

function fakeStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  };
}

test("loading with no storage available returns safe defaults", () => {
  const save = loadStrumriseSave();
  assert.deepEqual(save, { bestScore: 0, bestHeight: 0, muted: false });
});

test("loading an empty fake storage returns safe defaults", () => {
  const save = loadStrumriseSave(fakeStorage());
  assert.deepEqual(save, { bestScore: 0, bestHeight: 0, muted: false });
});

test("save then load round-trips through the fake storage", () => {
  const storage = fakeStorage();
  saveStrumriseSave({ bestScore: 500, bestHeight: 3200, muted: true }, storage);
  const save = loadStrumriseSave(storage);
  assert.deepEqual(save, { bestScore: 500, bestHeight: 3200, muted: true });
});

test("saveStrumriseSave merges partial updates onto the existing save", () => {
  const storage = fakeStorage();
  saveStrumriseSave({ bestScore: 100 }, storage);
  saveStrumriseSave({ muted: true }, storage);
  const save = loadStrumriseSave(storage);
  assert.deepEqual(save, { bestScore: 100, bestHeight: 0, muted: true });
});

test("corrupt JSON in storage falls back to defaults instead of throwing", () => {
  const storage = fakeStorage({ "strumrise:save": "{not-json" });
  const save = loadStrumriseSave(storage);
  assert.deepEqual(save, { bestScore: 0, bestHeight: 0, muted: false });
});

test("a validly-parsed but wrong-shaped object falls back to defaults", () => {
  const storage = fakeStorage({
    "strumrise:save": JSON.stringify({ bestScore: "not a number" }),
  });
  const save = loadStrumriseSave(storage);
  assert.deepEqual(save, { bestScore: 0, bestHeight: 0, muted: false });
});

test("a storage whose getItem throws is treated as unavailable", () => {
  const throwingStorage: StorageLike = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => undefined,
  };
  const save = loadStrumriseSave(throwingStorage);
  assert.deepEqual(save, { bestScore: 0, bestHeight: 0, muted: false });
});
