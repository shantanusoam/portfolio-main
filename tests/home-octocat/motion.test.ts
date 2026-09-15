import assert from "node:assert/strict";
import test from "node:test";
import { HomeOctocatMotion, type Ledge } from "../../lib/home-octocat/motion";

const floor: Ledge = {
  id: "instrument",
  x: 20,
  y: 600,
  width: 1160,
  goal: false,
};
const step = (m: HomeOctocatMotion, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 120); i++) m.update(1 / 120);
};
function setup(surfaces = [floor]) {
  const motion = new HomeOctocatMotion();
  motion.setLayout(surfaces, 1200, 800, 0);
  motion.play();
  return motion;
}

test("a buffered jump crouches first, rises, and settles on the same DOM ledge", () => {
  const m = setup();
  m.jump();
  step(m, 0.04);
  assert.equal(m.state, "crouching");
  assert.equal(m.y, 600);
  step(m, 0.2);
  assert.equal(m.state, "jumping");
  assert.ok(m.y < 530);
  step(m, 1.6);
  assert.equal(m.grounded, true);
  assert.equal(m.ledgeId, "instrument");
  assert.equal(m.y, 600);
  assert.ok(Math.abs(m.squash) < 0.01, "landing spring settles");
});

test("one-way text platforms allow ascent and award a spark on descent only", () => {
  const goal = { id: "name", x: 700, y: 460, width: 420, goal: true };
  const m = setup([floor, goal]);
  m.jump();
  step(m, 0.4);
  assert.ok(m.y < goal.y);
  assert.equal(m.visited.size, 0);
  step(m, 0.5);
  assert.equal(m.ledgeId, "name");
  assert.equal(m.y, 460);
  assert.deepEqual(Array.from(m.visited), ["name"]);
  m.jump();
  step(m, 1.5);
  assert.equal(m.visited.size, 1, "repeat landings never double-count");
});

test("releasing jump early produces a lower jump", () => {
  const full = setup();
  const tap = setup();
  full.jump();
  tap.jump();
  let fullTop = 600;
  let tapTop = 600;
  for (let i = 0; i < 100; i++) {
    if (i === 20) tap.jumpHeld = false;
    full.update(1 / 120);
    tap.update(1 / 120);
    fullTop = Math.min(fullTop, full.y);
    tapTop = Math.min(tapTop, tap.y);
  }
  assert.ok(tapTop - fullTop > 45);
});

test("swept landing catches a fast fall and chooses the highest crossed ledge", () => {
  const m = setup([
    floor,
    { id: "upper", x: 900, y: 594, width: 200, goal: true },
  ]);
  m.grounded = false;
  m.y = 590;
  m.vy = 950;
  m.update(1 / 120);
  assert.equal(m.y, 594);
  assert.equal(m.ledgeId, "upper");
  assert.equal(m.visited.size, 1);
});

test("coyote time accepts a jump immediately after leaving a narrow ledge", () => {
  const m = setup([{ ...floor, x: 300, width: 100 }]);
  m.x = 404;
  m.vx = 240;
  m.axis = 1;
  step(m, 0.025);
  assert.equal(m.grounded, false);
  m.jump();
  step(m, 0.1);
  assert.ok(m.vy < -600);
});

test("page scrolling carries the whole rig without changing jump velocity", () => {
  const m = setup();
  step(m, 0.3);
  const headY = m.head.y;
  const tipY = m.limbs[2].points[8].y;
  m.setLayout([{ ...floor, y: 420 }], 1200, 800, 180);
  assert.equal(m.y, 420);
  assert.equal(m.head.y, headY - 180);
  assert.equal(m.limbs[2].points[8].y, tipY - 180);
  assert.equal(m.vy, 0);
  m.jump();
  step(m, 0.2);
  const airborneY = m.y;
  const vy = m.vy;
  m.setLayout([{ ...floor, y: 400 }], 1200, 800, 200);
  assert.equal(m.y, airborneY - 20);
  assert.equal(m.vy, vy);
});

test("dragging springs toward the pointer and releases with bounded momentum", () => {
  const m = setup();
  const startX = m.x;
  m.grab(300, 250);
  step(m, 0.04);
  assert.equal(m.state, "dragging");
  assert.ok(m.x < startX && m.x > 300, "the body follows instead of snapping");
  m.release();
  assert.ok(Math.abs(m.vx) <= 620 && Math.abs(m.vy) <= 760);
  assert.equal(m.dragging, false);
  step(m, 2);
  assert.equal(m.grounded, true);
});

test("feet stay planted between steps; spring chains remain finite under repeated reversals", () => {
  const m = setup();
  step(m, 0.4);
  const plantedX = m.limbs[0].foot.x;
  step(m, 0.4);
  assert.equal(m.limbs[0].foot.x, plantedX);
  for (let i = 0; i < 1800; i++) {
    m.axis = Math.floor(i / 45) % 2 ? -1 : 1;
    if (i % 180 === 0) m.jump();
    if (i % 180 === 25) m.jumpHeld = false;
    m.update(1 / 120);
    for (const limb of m.limbs)
      for (const point of limb.points) {
        assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
        assert.ok(Math.hypot(point.x - m.x, point.y - m.y) < 180);
      }
  }
});

test("reset clears grabs, pending jumps and score; reduced-motion idle stays still", () => {
  const m = setup();
  m.visited.add("name");
  m.grab(300, 200);
  m.reset();
  assert.equal(m.visited.size, 0);
  assert.equal(m.dragging, false);
  assert.equal(m.axis, 0);
  m.stop();
  m.reducedMotion = true;
  const x = m.x;
  step(m, 10);
  assert.equal(m.x, x);
  assert.equal(m.state, "idle");
});
