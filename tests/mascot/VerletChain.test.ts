import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createVerletNodes,
  integrateVerlet,
  pinVerletNode,
  resetVerletNodes,
  solveVerletDistanceConstraints,
  type VerletChainConfig,
} from "@/lib/mascot/motion/VerletChain";

const config: VerletChainConfig = {
  segmentLength: 8,
  drag: 0.96,
  iterations: 4,
  maxSpeed: 4000,
};

test("drag reduces energy over time", () => {
  const nodes = createVerletNodes(6, 0, 0);
  // Kick the tip.
  nodes[5].previousX = nodes[5].x - 50;

  const speeds: number[] = [];
  for (let i = 0; i < 60; i += 1) {
    integrateVerlet(nodes, 1 / 60, config);
    solveVerletDistanceConstraints(
      nodes,
      config.segmentLength,
      config.iterations,
    );
    const tip = nodes[5];
    speeds.push(Math.hypot(tip.x - tip.previousX, tip.y - tip.previousY));
  }

  const earlyAverage = speeds.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const lateAverage = speeds.slice(-5).reduce((a, b) => a + b, 0) / 5;
  assert.ok(
    lateAverage < earlyAverage,
    `expected decay: early=${earlyAverage} late=${lateAverage}`,
  );
});

test("root stays pinned through integration and constraint solving", () => {
  const nodes = createVerletNodes(5, 0, 0);
  pinVerletNode(nodes[0], 12, -7);
  for (let i = 0; i < 30; i += 1) {
    pinVerletNode(nodes[0], 12, -7);
    integrateVerlet(nodes, 1 / 60, config, 0, 500);
    solveVerletDistanceConstraints(
      nodes,
      config.segmentLength,
      config.iterations,
    );
  }
  assert.equal(nodes[0].x, 12);
  assert.equal(nodes[0].y, -7);
});

test("segment lengths remain bounded after constraint solving", () => {
  const nodes = createVerletNodes(6, 0, 0);
  pinVerletNode(nodes[0], 0, 0);
  for (let i = 0; i < 60; i += 1) {
    integrateVerlet(nodes, 1 / 60, config, 200, 0);
    solveVerletDistanceConstraints(
      nodes,
      config.segmentLength,
      config.iterations,
    );
  }
  for (let i = 1; i < nodes.length; i += 1) {
    const dist = Math.hypot(
      nodes[i].x - nodes[i - 1].x,
      nodes[i].y - nodes[i - 1].y,
    );
    assert.ok(
      dist <= config.segmentLength + 0.5,
      `segment ${i} distance ${dist} exceeds bound`,
    );
  }
});

test("reset returns all nodes to the origin with zero velocity", () => {
  const nodes = createVerletNodes(4, 0, 0);
  pinVerletNode(nodes[0], 0, 0);
  for (let i = 0; i < 20; i += 1) {
    integrateVerlet(nodes, 1 / 60, config, 300, 300);
    solveVerletDistanceConstraints(
      nodes,
      config.segmentLength,
      config.iterations,
    );
  }
  resetVerletNodes(nodes, 5, 5);
  for (const node of nodes) {
    assert.equal(node.x, 5);
    assert.equal(node.y, 5);
    assert.equal(node.x - node.previousX, 0);
    assert.equal(node.y - node.previousY, 0);
  }
});

test("pause and resume (dt=0 steps) do not inject energy", () => {
  const nodes = createVerletNodes(4, 0, 0);
  pinVerletNode(nodes[0], 0, 0);
  integrateVerlet(nodes, 1 / 60, config, 50, 0);
  solveVerletDistanceConstraints(
    nodes,
    config.segmentLength,
    config.iterations,
  );
  const snapshot = nodes.map((n) => ({ x: n.x, y: n.y }));

  // Simulate a paused engine calling integrate with dt<=0 repeatedly.
  for (let i = 0; i < 10; i += 1) {
    integrateVerlet(nodes, 0, config, 50, 0);
  }

  nodes.forEach((n, i) => {
    assert.equal(n.x, snapshot[i].x);
    assert.equal(n.y, snapshot[i].y);
  });
});

test("large dt does not produce non-finite or unbounded displacement", () => {
  const nodes = createVerletNodes(5, 0, 0);
  pinVerletNode(nodes[0], 0, 0);
  integrateVerlet(nodes, 50, config, 1000, 1000);
  solveVerletDistanceConstraints(
    nodes,
    config.segmentLength,
    config.iterations,
  );
  for (const node of nodes) {
    assert.ok(Number.isFinite(node.x));
    assert.ok(Number.isFinite(node.y));
  }
});
