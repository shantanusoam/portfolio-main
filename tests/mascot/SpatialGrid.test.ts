import assert from "node:assert/strict";
import { test } from "node:test";

import { SpatialGrid } from "@/lib/mascot/interaction/SpatialGrid";

interface Item {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function makeItem(id: string, x: number, y: number, size = 20): Item {
  return { id, left: x, top: y, right: x + size, bottom: y + size };
}

test("finds items overlapping the query radius", () => {
  const grid = new SpatialGrid<Item>({ cellSize: 50 });
  const items = [
    makeItem("a", 0, 0),
    makeItem("b", 500, 500),
    makeItem("c", 40, 10),
  ];
  grid.rebuild(items);

  const nearby = grid.queryNearby(10, 10, 60);
  const ids = nearby.map((i) => i.id).sort();
  assert.deepEqual(ids, ["a", "c"]);
});

test("returns no duplicates for items spanning multiple cells", () => {
  const grid = new SpatialGrid<Item>({ cellSize: 20 });
  const items = [makeItem("wide", 0, 0, 100)];
  grid.rebuild(items);
  const nearby = grid.queryNearby(50, 50, 40);
  assert.equal(nearby.length, 1);
});

test("empty grid returns an empty array", () => {
  const grid = new SpatialGrid<Item>({ cellSize: 50 });
  grid.rebuild([]);
  assert.deepEqual(grid.queryNearby(0, 0, 1000), []);
});

test("rebuild replaces the previous contents", () => {
  const grid = new SpatialGrid<Item>({ cellSize: 50 });
  grid.rebuild([makeItem("old", 0, 0)]);
  grid.rebuild([makeItem("new", 0, 0)]);
  const nearby = grid.queryNearby(0, 0, 10);
  assert.deepEqual(
    nearby.map((i) => i.id),
    ["new"],
  );
});

test("items far outside the query radius are excluded", () => {
  const grid = new SpatialGrid<Item>({ cellSize: 50 });
  grid.rebuild([makeItem("far", 5000, 5000)]);
  assert.deepEqual(grid.queryNearby(0, 0, 100), []);
});
