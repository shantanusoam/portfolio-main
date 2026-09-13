import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  flatten,
  initialNodes,
  moveNode,
} from "../../components/workshop/tree";

test("moving a group keeps descendants attached and visits each node once", () => {
  const next = moveNode(initialNodes, "share", "in");
  assert.equal(next.find((n) => n.id === "share")?.parentId, "prototype");
  assert.equal(next.find((n) => n.id === "docs")?.parentId, "share");
  assert.equal(flatten(next).length, initialNodes.length);
  assert.equal(
    new Set(flatten(next).map((n) => n.id)).size,
    initialNodes.length,
  );
  assert.equal(initialNodes.find((n) => n.id === "share")?.parentId, null);
});
test("outdent places the moved node after its parent and preserves history", () => {
  const next = moveNode(initialNodes, "sensor", "out");
  assert.deepEqual(
    flatten(next).map((n) => n.id),
    ["prototype", "enclosure", "sensor", "share", "docs"],
  );
  assert.equal(next.find((n) => n.id === "sensor")?.parentId, null);
  assert.equal(
    initialNodes.find((n) => n.id === "sensor")?.parentId,
    "prototype",
  );
});
test("boundary commands preserve identity, and sibling moves reverse", () => {
  assert.equal(moveNode(initialNodes, "prototype", "in"), initialNodes);
  assert.equal(moveNode(initialNodes, "prototype", "out"), initialNodes);
  assert.equal(moveNode(initialNodes, "prototype", "up"), initialNodes);
  assert.equal(moveNode(initialNodes, "missing", "up"), initialNodes);
  const next = moveNode(initialNodes, "sensor", "up");
  assert.deepEqual(moveNode(next, "sensor", "down"), initialNodes);
});
test("a long sequence of all supported commands never creates cycles or loses nodes", () => {
  let nodes = initialNodes;
  const commands = ["in", "out", "up", "down"] as const;
  for (let i = 0; i < 400; i++) {
    nodes = moveNode(
      nodes,
      initialNodes[(i * 7) % 5].id,
      commands[(i * 3) % 4],
    );
    const flat = flatten(nodes);
    assert.equal(flat.length, initialNodes.length);
    assert.equal(new Set(flat.map((n) => n.id)).size, initialNodes.length);
  }
});
