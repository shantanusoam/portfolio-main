import assert from "node:assert/strict";
import test from "node:test";
import {
  GRAVITY,
  HOP_SPEED,
  HomeOctocatMotion,
  nextPlatform,
  type Ledge,
  type Platform,
} from "../../lib/home-octocat/motion";
import { mochiPose } from "../../lib/home-octocat/pose";
const floor: Ledge = {
  id: "instrument",
  x: 20,
  y: 540,
  width: 1160,
  goal: false,
};
function setup(width = 1200, height = 800) {
  const m = new HomeOctocatMotion();
  m.setLayout([floor], width, height, 0);
  m.play();
  return m;
}
const step = (m: HomeOctocatMotion, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 120); i++) m.update(1 / 120);
};

test("the intro waits for input, then a short crouch precedes the first automatic hop", () => {
  const m = setup();
  const y = m.y;
  step(m, 4);
  assert.equal(m.y, y);
  assert.equal(m.phase, "ready");
  m.begin();
  step(m, 0.04);
  assert.equal(m.state, "crouching");
  assert.equal(m.y, y);
  step(m, 0.18);
  assert.ok(m.y < y - 40);
  assert.equal(m.state, "jumping");
});

test("one extra hop works per flight and refills only after a landing", () => {
  const m = setup();
  m.begin();
  step(m, 0.3);
  m.jump();
  assert.equal(m.extraHop, false);
  assert.ok(m.vy < -590);
  step(m, 0.1);
  const vy = m.vy;
  m.jump();
  assert.equal(m.vy, vy);
  m.platforms = [m.platforms[0]];
  step(m, 1.1);
  assert.equal(m.extraHop, true);
  assert.ok(m.landings > 0);
});

test("swept one-way contacts ignore ascent and catch the highest crossed platform on descent", () => {
  const m = setup();
  m.begin();
  step(m, 0.2);
  const p = {
    ...m.platforms[0],
    id: 99,
    x: 0,
    width: m.fieldWidth,
    y: m.y - 2,
  };
  m.platforms = [p];
  m.update(1 / 120);
  assert.equal(m.grounded, false);
  p.y = m.y + 2;
  m.vy = 990;
  m.update(1 / 120);
  assert.equal(m.y, p.y);
  assert.equal(m.grounded, true);
});

test("spring landings produce a higher launch; crumbling ledges cannot catch twice", () => {
  for (const kind of ["spring", "crumble"] as const) {
    const m = setup();
    m.begin();
    step(m, 0.2);
    const p = {
      ...m.platforms[0],
      kind,
      x: 0,
      y: m.y + 2,
      width: m.fieldWidth,
    };
    m.platforms = [p];
    m.vy = 600;
    m.update(1 / 120);
    assert.equal(m.grounded, true);
    assert.equal(p.broken, kind === "crumble");
    step(m, 0.08);
    assert.ok(m.vy < (kind === "spring" ? -800 : -600));
    if (kind === "crumble") {
      m.y = p.y - 2;
      m.vy = 600;
      m.update(1 / 120);
      assert.equal(m.grounded, false);
    }
  }
});

test("stars use swept pickup and cannot award twice", () => {
  const m = setup();
  m.begin();
  step(m, 0.2);
  const p = {
    ...m.platforms[0],
    id: 98,
    x: m.x - 35,
    width: 70,
    y: m.y + 6,
    star: true,
  };
  m.platforms = [p];
  m.vy = -850;
  m.update(1 / 120);
  assert.equal(m.stars, 1);
  assert.equal(p.star, false);
  step(m, 0.1);
  assert.equal(m.stars, 1);
});

test("generation stays reachable and inside the field on phone and desktop for 1000 rows", () => {
  for (const width of [288, 358, 580]) {
    let previous: Platform = {
      id: 0,
      x: 0,
      baseX: 0,
      y: 500,
      width,
      kind: "normal",
      star: false,
      broken: false,
      hit: 0,
    };
    for (let id = 1; id <= 1000; id++) {
      const next = nextPlatform(previous, id, width);
      const gap = previous.y - next.y;
      assert.ok(gap < HOP_SPEED ** 2 / (2 * GRAVITY) - 30);
      const separation = Math.abs(
        next.baseX + next.width / 2 - previous.baseX - previous.width / 2,
      );
      assert.ok(separation <= 130, "a normal hop can reach the next ledge");
      assert.ok(next.x >= 18 && next.x + next.width <= width - 18);
      previous = next;
    }
  }
});

test("a real steering controller can climb for 90 seconds with bounded platforms and particles", () => {
  for (const width of [390, 1200]) {
    const m = setup(width);
    m.begin();
    let target = m.x;
    let lastLanding = -1;
    for (let i = 0; i < 90 * 120; i++) {
      if (m.grounded && lastLanding !== m.landings) {
        const next = m.platforms
          .filter((p) => !p.broken && p.y < m.y - 5)
          .sort((a, b) => b.y - a.y)[0];
        if (next) target = next.x + next.width / 2;
        lastLanding = m.landings;
      }
      m.steer(target + m.fieldLeft);
      m.update(1 / 120);
      assert.notEqual(
        m.phase,
        "over",
        `controller fell at ${m.heightMetres}m, width ${width}`,
      );
      assert.ok(m.platforms.length < 24);
      assert.ok(m.particles.length <= 80);
      assert.ok(Number.isFinite(m.x + m.y + m.camera + m.squash + m.ears[0]));
    }
    assert.ok(m.heightMetres > 450);
    assert.ok(m.stars > 10);
    assert.ok(m.landings > 50);
  }
});

test("falling ends the run without resetting its result; retry clears the world and held input", () => {
  const m = setup();
  m.begin();
  step(m, 0.2);
  m.heightMetres = 45;
  m.stars = 3;
  m.platforms = [{ ...m.platforms[0], x: -2000, y: -10000 }];
  m.y = m.height + 70;
  m.vy = 600;
  m.update(1 / 120);
  assert.equal(m.phase, "over");
  assert.equal(m.heightMetres, 45);
  assert.equal(m.stars, 3);
  m.axis = 1;
  m.jump();
  assert.equal(m.phase, "climbing");
  assert.equal(m.heightMetres, 0);
  assert.equal(m.stars, 0);
  assert.equal(m.axis, 0);
});

test("resize preserves a run, camera never jumps backward, and the idle perch tracks scroll", () => {
  const m = setup();
  m.begin();
  step(m, 0.4);
  m.stars = 4;
  const fraction = m.x / m.fieldWidth;
  m.setLayout([floor], 390, 760, 0);
  assert.equal(m.stars, 4);
  assert.equal(m.phase, "climbing");
  assert.ok(Math.abs(m.x / m.fieldWidth - fraction) < 1e-6);
  let camera = m.camera;
  for (let i = 0; i < 120; i++) {
    m.update(1 / 120);
    assert.ok(m.camera >= camera);
    camera = m.camera;
  }
  m.stop();
  m.setLayout([{ ...floor, y: 340 }], 1200, 800, 200);
  assert.equal(m.y, 340);
});

test("reduced-motion idle is still, drag is bounded, and the body retains volume", () => {
  const m = setup();
  m.stop();
  m.reducedMotion = true;
  const x = m.x;
  step(m, 10);
  assert.equal(m.x, x);
  m.reducedMotion = false;
  m.grab(300, 260);
  step(m, 0.08);
  assert.ok(m.x > 300 && m.x < x);
  m.release();
  assert.ok(Math.abs(m.vx) <= 400 && Math.abs(m.vy) <= 650);
  m.play();
  m.begin();
  for (let i = 0; i < 600; i++) {
    m.axis = i % 120 < 60 ? 1 : -1;
    m.update(1 / 120);
    const pose = mochiPose(m);
    assert.ok(Math.abs(pose.sx ** 2 * pose.sy - 1) < 1e-9);
    assert.ok(
      Math.abs(m.tilt) < 0.3 && m.ears.every((ear) => Math.abs(ear) <= 0.7),
    );
  }
});
