import assert from "node:assert/strict";
import test from "node:test";
import {
  GRAVITY,
  HOP_SPEED,
  HomeOctocatMotion,
  nextPlatform,
  type Platform,
} from "../../lib/home-octocat/motion";
import { mochiPose } from "../../lib/home-octocat/pose";
const floor = { id: "instrument", x: 20, y: 540, width: 1160, goal: false };
function setup(width = 1200, height = 800) {
  const m = new HomeOctocatMotion();
  m.setLayout([{ ...floor, width: width - 40 }], width, height, 0);
  m.play();
  return m;
}
const step = (m: HomeOctocatMotion, seconds: number) => {
  for (let i = 0; i < Math.round(seconds * 120); i++) m.update(1 / 120);
};
const enter = () => {
  const m = setup();
  m.begin();
  return m;
};
const leap = (m: HomeOctocatMotion) => {
  m.jump();
  step(m, 0.08);
};

test("entry, standing and landings never auto-jump, even while a jump key stays held", () => {
  const m = setup();
  const y = m.y;
  step(m, 3);
  assert.equal(m.phase, "ready");
  m.begin();
  step(m, 3);
  assert.equal(m.y, y);
  assert.equal(m.grounded, true);
  leap(m);
  assert.ok(m.y < y);
  assert.equal(m.state, "jumping");
  step(m, 2);
  assert.ok(m.landings > 0);
  assert.equal(m.grounded, true);
  const landing = m.y;
  step(m, 2);
  assert.equal(m.y, landing);
  m.jump();
  step(m, 0.1);
  assert.equal(m.y, landing, "held input cannot retrigger");
  m.releaseJump();
  leap(m);
  assert.ok(m.y < landing);
});

test("holding makes a higher jump than tapping; the short hop reaches the opening ledge", () => {
  const apex = (hold: number) => {
    const m = enter();
    const initial = m.y;
    m.jump();
    let top = m.y;
    for (let i = 0; i < 120; i++) {
      if (i === Math.round(hold * 120)) m.releaseJump();
      m.update(1 / 120);
      top = Math.min(top, m.y);
    }
    return initial - top;
  };
  const tap = apex(0.055);
  const held = apex(0.4);
  assert.ok(tap > 75, `tap reaches first 70px ledge (${tap})`);
  assert.ok(held > tap + 35, `${held} should exceed ${tap}`);
});

test("walking off an edge allows a 100ms coyote jump without spending the double jump", () => {
  const m = enter();
  const p = m.platforms[0];
  p.x = p.baseX = m.x - 20;
  p.width = 40;
  m.axis = 1;
  for (let i = 0; i < 80 && m.grounded; i++) m.update(1 / 120);
  assert.equal(m.grounded, false);
  step(m, 0.025);
  m.jump();
  step(m, 0.06);
  assert.ok(m.vy < -500);
  assert.equal(m.extraHop, true);
  assert.ok(m.events.includes("hop"));
});

test("a press just before landing is buffered as a ground jump", () => {
  const m = enter();
  const base = m.platforms[0];
  m.grounded = false;
  m.y = base.y - 28;
  m.vy = 400;
  m.jump();
  assert.equal(m.extraHop, true);
  step(m, 0.18);
  assert.ok(m.landings > 0);
  assert.ok(m.vy < 0);
  assert.equal(m.extraHop, true);
  assert.ok(!m.events.includes("extra"));
});

test("one deliberate double jump per flight, refilled on landing", () => {
  const m = enter();
  leap(m);
  m.releaseJump();
  step(m, 0.08);
  m.jump();
  assert.equal(m.extraHop, false);
  const firstVy = m.vy;
  m.jump();
  assert.equal(m.vy, firstVy);
  m.releaseJump();
  step(m, 0.1);
  const vy = m.vy;
  m.jump();
  assert.equal(m.vy, vy);
  m.releaseJump();
  step(m, 1.5);
  assert.equal(m.extraHop, true);
  assert.ok(m.grounded);
});

test("feet alternate predictive steps and hold their world position through stance in both directions", () => {
  const m = enter();
  let leftSteps = 0;
  let rightSteps = 0;
  let plantedFrames = 0;
  for (let i = 0; i < 190; i++) {
    m.axis = i < 95 ? 1 : -1;
    const previous = m.feet.map((f) => ({ ...f }));
    m.update(1 / 120);
    m.feet.forEach((f, j) => {
      if (f.moving && !previous[j].moving) {
        if (j) rightSteps++;
        else leftSteps++;
      }
      if (!f.moving && !previous[j].moving) {
        assert.equal(f.x, previous[j].x);
        plantedFrames++;
        assert.ok(
          Math.abs(m.x + mochiPose(m).feet[j].x - f.x) < 1e-8,
          "rendered foot remains planted too",
        );
      }
      assert.ok(
        Math.abs(f.x - m.x) < 29,
        "legs remain attached at running speed",
      );
    });
  }
  assert.ok(leftSteps > 4 && rightSteps > 4 && plantedFrames > 80);
  m.axis = 0;
  step(m, 1);
  const pose = mochiPose(m);
  assert.ok(pose.feet.every((f) => Math.abs(f.y + 4) < 0.1));
});

test("moving ledges carry Mochi and the planted feet without sliding", () => {
  const m = enter();
  const p = m.platforms[0];
  p.kind = "moving";
  const x = m.x;
  const oldPlatform = p.x;
  const feet = m.feet.map((f) => f.x);
  step(m, 0.5);
  assert.ok(Math.abs(m.x - x - (p.x - oldPlatform)) < 1e-7);
  m.feet.forEach((f, i) =>
    assert.ok(Math.abs(f.x - feet[i] - (p.x - oldPlatform)) < 1e-7),
  );
  assert.equal(m.grounded, true);
});

test("one-way platforms ignore ascent and catch descending feet", () => {
  const m = enter();
  leap(m);
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

test("springs wait for a press; crumbling footholds telegraph for almost a second", () => {
  const spring = enter();
  spring.platforms[0].kind = "spring";
  const y = spring.y;
  step(spring, 2);
  assert.equal(spring.y, y);
  leap(spring);
  assert.ok(spring.vy < -730);
  assert.ok(spring.events.includes("spring"));
  const m = enter();
  const p = m.platforms[0];
  p.kind = "crumble";
  m.grounded = false;
  m.y = p.y - 2;
  m.vy = 300;
  m.update(1 / 120);
  assert.equal(m.grounded, true);
  step(m, 0.5);
  assert.equal(p.broken, false);
  step(m, 0.55);
  assert.equal(p.broken, true);
  assert.equal(m.grounded, false);
});

test("descending onto a puff squishes it and awards once, without side damage", () => {
  const m = enter();
  const p = m.platforms[0];
  p.puff = { x: m.x, defeated: false, squash: 0 };
  m.x =
    p.x +
    p.width / 2 +
    Math.sin((m.time + 1 / 120) * 1.3 + p.id) * p.width * 0.18;
  m.y = p.y - 24;
  m.grounded = false;
  m.vy = 350;
  m.vx = 0;
  m.update(1 / 120);
  assert.equal(p.puff.defeated, true);
  assert.equal(m.stars, 2);
  assert.equal(m.lives, 3);
  step(m, 0.2);
  assert.equal(m.stars, 2);
});

test("a side bump spends one heart, shows a reaction, and returns to a safe foothold", () => {
  const m = enter();
  const p = m.platforms[0];
  p.puff = { x: m.x, defeated: false, squash: 0 };
  m.update(1 / 120);
  assert.equal(m.lives, 2);
  assert.equal(m.reaction, "hurt");
  assert.ok(m.recovering > 0);
  step(m, 0.75);
  assert.equal(m.phase, "climbing");
  assert.equal(m.lives, 2);
  assert.equal(m.grounded, true);
  assert.ok(m.invulnerable > 0);
  assert.equal(m.y, m.launchY);
});

test("flowers save a checkpoint and restore a heart; falls return there until the hearts run out", () => {
  const m = enter();
  const cp: Platform = {
    ...m.platforms[0],
    id: 8,
    kind: "checkpoint",
    y: m.y - 200,
  };
  m.platforms = [cp];
  m.y = cp.y - 2;
  m.vy = 400;
  m.grounded = false;
  m.lives = 2;
  m.update(1 / 120);
  assert.equal(m.checkpointId, 8);
  assert.equal(m.lives, 3);
  for (let lives = 2; lives >= 0; lives--) {
    m.y = m.height + 80 - m.camera;
    m.grounded = false;
    m.vy = 900;
    m.update(1 / 120);
    assert.equal(m.lives, lives);
    if (lives) {
      step(m, 0.75);
      assert.equal(m.y, cp.y);
      assert.equal(m.grounded, true);
    }
  }
  assert.equal(m.phase, "over");
  const score = m.heightMetres;
  step(m, 1);
  assert.equal(m.heightMetres, score);
  m.jump();
  assert.equal(m.phase, "climbing");
  assert.equal(m.lives, 3);
  assert.equal(m.heightMetres, 0);
  assert.equal(m.grounded, true);
});

test("stars use swept pickup and cannot award twice", () => {
  const m = enter();
  leap(m);
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

test("1,000 rows preserve reachable gaps, obstacle clearance and field margins on small and large screens", () => {
  for (const width of [288, 358, 580]) {
    let p: Platform = {
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
      const n = nextPlatform(p, id, width);
      const gap = p.y - n.y;
      assert.ok(gap + (n.puff ? 25 : 0) < HOP_SPEED ** 2 / (2 * GRAVITY) - 12);
      assert.ok(Math.abs(n.baseX + n.width / 2 - p.baseX - p.width / 2) <= 116);
      assert.ok(n.x >= 18 && n.x + n.width <= width - 18);
      if (n.puff) assert.ok(n.width >= 110);
      p = n;
    }
  }
});

test("boops have visible payoff, repeated boops get dizzy, and the live gaze survives the reaction", () => {
  const m = setup();
  m.stop();
  m.lookActive = true;
  m.lookX = m.x + 400;
  m.lookY = m.y - 25;
  step(m, 0.3);
  m.boop();
  step(m, 0.12);
  const pose = mochiPose(m);
  assert.ok(pose.heart > 0.8 && pose.happy > 0.8 && pose.eyes[0] < 0.3);
  assert.ok(m.gazeX > 2);
  m.boop();
  step(m, 0.1);
  m.boop();
  assert.equal(m.reaction, "dizzy");
  step(m, 1.3);
  assert.equal(m.reaction, "none");
  assert.ok(m.gazeX > 2);
});

test("gaze reversals are damped, hover waves are restrained, and inactivity leads to sleep", () => {
  const m = setup();
  m.stop();
  m.lookActive = true;
  m.lookX = m.x + 400;
  m.lookY = m.y - 25;
  step(m, 0.3);
  assert.ok(m.gazeX > 2);
  m.lookX = m.x - 400;
  m.update(1 / 120);
  assert.ok(m.gazeX > 1);
  step(m, 0.4);
  assert.ok(m.gazeX < -2);
  m.lookActive = false;
  step(m, 0.4);
  assert.ok(Math.abs(m.gazeX) < 0.05);
  m.hover();
  step(m, 0.15);
  assert.ok(mochiPose(m).wave > 0.9);
  step(m, 1);
  m.hover();
  assert.equal(m.reaction, "none", "hover cooldown avoids constant waving");
  step(m, 18);
  assert.ok(m.sleepy > 0.9);
  m.attend();
  step(m, 1);
  assert.ok(m.sleepy < 0.03);
});

test("reduced motion keeps a still secondary pose but manual jumps and static pet feedback remain", () => {
  const m = setup();
  m.stop();
  m.reducedMotion = true;
  const x = m.x;
  step(m, 10);
  assert.equal(m.x, x);
  m.boop();
  step(m, 0.1);
  assert.ok(mochiPose(m).happy > 0);
  m.play();
  m.begin();
  m.jump();
  step(m, 0.2);
  assert.ok(m.y < m.launchY);
  const p = mochiPose(m);
  assert.equal(p.sx, 1);
  assert.equal(p.sy, 1);
  assert.equal(p.tilt, 0);
  assert.equal(p.bob, 0);
  assert.equal(p.look, 0);
  assert.deepEqual(p.ears, [-0.17, 0.22]);
  assert.deepEqual(
    p.feet.map((f) => f.y),
    [-4, -4],
  );
  assert.equal(m.particles.length, 0);
});

test("resize preserves progress; idle perches track scroll; secondary springs remain finite through reversals", () => {
  const m = enter();
  leap(m);
  const fraction = m.x / m.fieldWidth;
  m.stars = 4;
  m.setLayout([floor], 390, 760, 0);
  assert.equal(m.stars, 4);
  assert.ok(Math.abs(m.x / m.fieldWidth - fraction) < 1e-6);
  for (let i = 0; i < 600; i++) {
    m.axis = i % 120 < 60 ? 1 : -1;
    m.update(1 / 120);
    const p = mochiPose(m);
    assert.ok(Math.abs(p.sx ** 2 * p.sy - 1) < 1e-9);
    assert.ok(
      Math.abs(m.tilt) < 0.3 && m.ears.every((ear) => Math.abs(ear) <= 0.7),
    );
  }
  m.stop();
  m.setLayout([{ ...floor, y: 340 }], 1200, 800, 200);
  assert.equal(m.y, 340);
});

test("a manual controller crosses the introductory obstacles and checkpoints at phone and desktop widths", () => {
  for (const width of [390, 1200]) {
    const m = setup(width);
    m.begin();
    let target = m.x;
    let landing = -1;
    let jumpAt = -1;
    for (let i = 0; i < 35 * 120; i++) {
      if (m.grounded && landing !== m.landings) {
        const next = m.platforms
          .filter((p) => !p.broken && p.y < m.y - 4)
          .sort((p, q) => q.y - p.y)[0];
        if (next) {
          target = next.x + next.width / 2;
          if (next.puff)
            target =
              Math.abs(m.x - next.x) < Math.abs(m.x - next.x - next.width)
                ? next.x + 8
                : next.x + next.width - 8;
        }
        landing = m.landings;
        m.releaseJump();
        m.jump();
        jumpAt = m.time;
      }
      if (m.time - jumpAt > 0.35) m.releaseJump();
      m.steer(target + m.fieldLeft);
      m.update(1 / 120);
      assert.equal(m.lives, 3, `safe route at ${width}px, ${m.heightMetres}m`);
      assert.ok(m.platforms.length < 24 && m.particles.length <= 80);
      assert.ok(Number.isFinite(m.x + m.y + m.camera));
    }
    assert.ok(m.heightMetres > 350 && m.landings > 35 && m.checkpointId > 24);
  }
});
