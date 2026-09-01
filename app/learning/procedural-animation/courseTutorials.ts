export type PlaygroundControl =
  | "joints"
  | "segment"
  | "angle"
  | "damping"
  | "response"
  | "width"
  | "debug"
  | "autopilot"
  | "play"
  | "break";

export interface TutorialStep {
  title: string;
  file: string;
  action: string;
  code: string;
  expected: string;
}

export interface ControlLesson {
  control: PlaygroundControl;
  label: string;
  effect: string;
  tryThis: string;
}

export interface DebugHint {
  symptom: string;
  fix: string;
}

export interface CourseSource {
  label: string;
  path: string;
  note: string;
}

export interface LessonTutorial {
  outcome: string;
  steps: readonly TutorialStep[];
  controls: readonly ControlLesson[];
  verify: readonly string[];
  debug: readonly DebugHint[];
  sources: readonly CourseSource[];
}

export const COURSE_SETUP = {
  title: "Use the browser, not a game engine",
  description:
    "The workshop uses a plain Canvas 2D project so every force, constraint and frame is visible. TypeScript is helpful, but the finished standalone demo also runs without installing anything.",
  commands: `npm create vite@latest procedural-fish -- --template vanilla-ts
cd procedural-fish
npm install
npm run dev`,
  files: ["index.html", "src/main.ts", "src/fish.ts"],
} as const;

export const COURSE_REPOSITORY_URL =
  "https://github.com/shantanusoam/portfolio-main/tree/main/public/course-files";

export const TUTORIALS: Record<string, LessonTutorial> = {
  intent: {
    outcome:
      "A visible target and a mover with separate responsibilities. The target says what is wanted; the mover decides how to get there.",
    steps: [
      {
        title: "Create one canvas with a stable coordinate system",
        file: "src/main.ts",
        action:
          "Size the backing buffer for device pixel ratio, then keep the simulation in CSS pixels. This prevents blurry drawing without making the physics device-dependent.",
        code: `const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener("resize", resize);
resize();`,
        expected:
          "The canvas remains sharp at 100% and 200% zoom, while your coordinates still match pointer coordinates.",
      },
      {
        title: "Represent intent as data",
        file: "src/fish.ts",
        action:
          "Keep the target outside the fish. A pointer, autopilot path or prey can all write to the same contract later.",
        code: `type Point = { x: number; y: number };

const target: Point = { x: 320, y: 180 };
const root = { x: 120, y: 180, vx: 0, vy: 0 };

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  target.x = event.clientX - rect.left;
  target.y = event.clientY - rect.top;
});`,
        expected:
          "Moving the pointer changes only target.x and target.y. It does not teleport or directly rotate the fish.",
      },
      {
        title: "Draw the contract before the creature",
        file: "src/main.ts",
        action:
          "Render the target ring and root dot first. If their relationship is unclear, anatomy will only hide the bug.",
        code: `function drawIntent() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  ctx.strokeStyle = "#79c7d2";
  ctx.beginPath();
  ctx.arc(target.x, target.y, 9, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#eaf8fa";
  ctx.beginPath();
  ctx.arc(root.x, root.y, 6, 0, Math.PI * 2);
  ctx.fill();
}`,
        expected:
          "You can point to two different objects on screen and name their owners: input owns the ring; the controller owns the dot.",
      },
    ],
    controls: [
      {
        control: "autopilot",
        label: "Autopilot / pointer",
        effect: "Changes who owns the target without changing the mover.",
        tryThis:
          "Switch control twice. The body should continue smoothly instead of respawning.",
      },
      {
        control: "debug",
        label: "Rig overlay",
        effect:
          "Reveals the root and chain that the painted body normally hides.",
        tryThis: "Turn it on now and identify joint zero before continuing.",
      },
    ],
    verify: [
      "Pointer coordinates line up with the visible target ring.",
      "Changing input ownership does not rebuild the canvas.",
      "The target and root can be logged and tested independently.",
    ],
    debug: [
      {
        symptom: "The target is offset on a Retina display.",
        fix: "Keep pointer and simulation values in CSS pixels; apply DPR only through the canvas transform.",
      },
      {
        symptom: "The creature snaps when switching to pointer control.",
        fix: "Change the target owner, not the root position. Let the controller absorb the new target.",
      },
    ],
    sources: [
      {
        label: "Target ownership",
        path: "lib/mascot/behavior/TargetDirector.ts",
        note: "The production boundary that chooses a target without drawing the body.",
      },
      {
        label: "Pointer boundary",
        path: "lib/mascot/input/PointerInput.ts",
        note: "Normalizes browser input before it reaches behavior or physics.",
      },
    ],
  },
  vectors: {
    outcome:
      "A frame-rate-independent mover with position, velocity, acceleration and a speed limit you can reason about.",
    steps: [
      {
        title: "Add the three quantities that describe motion",
        file: "src/fish.ts",
        action:
          "Position is state, velocity is change per second, and acceleration changes that velocity. Keep all three explicit.",
        code: `const root = {
  x: 120,
  y: 180,
  vx: 0,
  vy: 0,
};

const maxSpeed = 280;
const steeringStrength = 18;`,
        expected:
          "There is no animation yet, but every value has a unit: pixels, pixels/second, or pixels/second squared.",
      },
      {
        title: "Steer toward the target using delta time",
        file: "src/fish.ts",
        action:
          "Acceleration points from the root to the target. Integrate velocity and position with dt measured in seconds.",
        code: `function updateRoot(dt: number) {
  const ax = (target.x - root.x) * steeringStrength;
  const ay = (target.y - root.y) * steeringStrength;

  root.vx += ax * dt;
  root.vy += ay * dt;
  root.x += root.vx * dt;
  root.y += root.vy * dt;
}`,
        expected:
          "The root accelerates toward the target instead of teleporting. It will overshoot for now—that is the next problem.",
      },
      {
        title: "Cap speed without changing direction",
        file: "src/fish.ts",
        action:
          "Scale both velocity components by the same factor when the magnitude exceeds the cap.",
        code: `const speed = Math.hypot(root.vx, root.vy);
if (speed > maxSpeed) {
  const scale = maxSpeed / speed;
  root.vx *= scale;
  root.vy *= scale;
}`,
        expected:
          "Long pointer jumps no longer accelerate forever, and diagonal movement is not faster than horizontal movement.",
      },
    ],
    controls: [
      {
        control: "response",
        label: "Response",
        effect:
          "Raises or lowers how eagerly the root commits to a new target.",
        tryThis: "Compare 0.15 with 0.80 during one hard pointer reversal.",
      },
      {
        control: "play",
        label: "Play / pause",
        effect: "Freezes simulation state without discarding it.",
        tryThis:
          "Pause mid-turn and inspect whether velocity and facing agree.",
      },
    ],
    verify: [
      "Movement is similar at 30, 60 and 120 frames per second.",
      "Diagonal speed never exceeds the same scalar cap.",
      "Facing comes from actual velocity once speed is above a small threshold.",
    ],
    debug: [
      {
        symptom: "The fish moves much faster on a high-refresh monitor.",
        fix: "Convert the frame delta from milliseconds to seconds and multiply every integration step by dt.",
      },
      {
        symptom: "The face spins while almost stopped.",
        fix: "Retain the previous heading until velocity magnitude passes an epsilon.",
      },
    ],
    sources: [
      {
        label: "Numeric guards",
        path: "lib/mascot/core/NumericGuards.ts",
        note: "The finite-value, clamp and normalization helpers used by the production engine.",
      },
      {
        label: "Pose controller",
        path: "lib/mascot/motion/PoseController.ts",
        note: "Turns filtered root motion into position and stable orientation.",
      },
    ],
  },
  damping: {
    outcome:
      "A root that can feel calm, playful or nervous through three explainable parameters instead of scattered magic numbers.",
    steps: [
      {
        title: "Start with a spring that has visible energy",
        file: "src/fish.ts",
        action:
          "Pull toward the target and subtract a velocity-proportional force. The second term is what removes stored energy.",
        code: `function springAxis(
  position: number,
  velocity: number,
  targetValue: number,
  stiffness: number,
  damping: number,
) {
  return stiffness * (targetValue - position) - damping * velocity;
}`,
        expected:
          "With low damping the root overshoots repeatedly; increasing damping shortens that ringing.",
      },
      {
        title: "Express personality as a recipe",
        file: "src/fish.ts",
        action:
          "Name parameter groups by intent so tuning decisions survive after you forget the raw values.",
        code: `const motion = {
  calm: { frequency: 0.96, damping: 0.8, response: -0.04 },
  playful: { frequency: 1.7, damping: 0.72, response: 0.08 },
  heavy: { frequency: 0.55, damping: 1.12, response: 0 },
} as const;`,
        expected:
          "You can switch temperament with one recipe and explain the visible difference before running it.",
      },
      {
        title: "Test with a step input",
        file: "src/main.ts",
        action:
          "Reverse the target after the root settles. Continuous pointer noise is a poor diagnostic because it hides ringing.",
        code: `let targetSide = 1;

canvas.addEventListener("click", () => {
  targetSide *= -1;
  target.x = canvas.clientWidth * (targetSide > 0 ? 0.8 : 0.2);
  target.y = canvas.clientHeight * 0.5;
});`,
        expected:
          "Each click produces the same measurable reversal, making recipes comparable instead of subjective guesses.",
      },
    ],
    controls: [
      {
        control: "damping",
        label: "Damping",
        effect:
          "Controls how quickly motion energy disappears. Around 1 settles cleanly; lower values ring longer.",
        tryThis: "Set 0.20, reverse once, then set 1.00 and repeat.",
      },
      {
        control: "response",
        label: "Response",
        effect: "Shapes anticipation and overshoot around target changes.",
        tryThis: "Keep damping fixed and compare -0.10, 0 and 0.25.",
      },
      {
        control: "break",
        label: "Break it",
        effect:
          "Applies a deliberately unstable recipe so causes are easier to see.",
        tryThis:
          "Repair damping first; notice that impossible folding remains a separate problem.",
      },
    ],
    verify: [
      "A step reversal settles within a deliberate amount of time.",
      "Only the root supplies major energy; secondary parts trail it.",
      "Each named recipe has a written perceptual intention.",
    ],
    debug: [
      {
        symptom: "The creature jitters even with high damping.",
        fix: "Check noisy targets and large frame deltas before raising damping again; damping cannot repair bad input.",
      },
      {
        symptom: "Everything feels slow rather than calm.",
        fix: "Raise frequency slightly while keeping damping near critical. Speed of response and energy decay are different controls.",
      },
    ],
    sources: [
      {
        label: "Second-order filter",
        path: "lib/mascot/motion/SecondOrderDynamics.ts",
        note: "Production implementation with stable substeps and finite-value recovery.",
      },
      {
        label: "Motion recipes",
        path: "docs/mascot/MOTION_RECIPES.md",
        note: "Why each behavior uses a different frequency, damping and response.",
      },
    ],
  },
  chains: {
    outcome:
      "A root-to-tail spine whose segments keep exact length while movement propagates from the controlled head.",
    steps: [
      {
        title: "Create the joints in a known pose",
        file: "src/fish.ts",
        action:
          "Initialize every point one segment behind its parent. A valid starting pose prevents a violent first solve.",
        code: `type Joint = { x: number; y: number; angle: number };

function createSpine(count: number, length: number): Joint[] {
  return Array.from({ length: count }, (_, index) => ({
    x: root.x - index * length,
    y: root.y,
    angle: Math.PI,
  }));
}`,
        expected:
          "Rig overlay shows one straight, evenly spaced chain instead of coincident points at the root.",
      },
      {
        title: "Pin joint zero to the root",
        file: "src/fish.ts",
        action:
          "The root is controlled; the remaining anatomy is derived. Reapply this ownership every simulation step.",
        code: `function pinRoot(joints: Joint[]) {
  joints[0].x = root.x;
  joints[0].y = root.y;
}`,
        expected:
          "The first joint exactly matches the mover while the rest of the chain is still free to lag.",
      },
      {
        title: "Enforce one rest length per link",
        file: "src/fish.ts",
        action:
          "Solve head to tail. Normalize the child direction, then rebuild its position exactly one segment from the parent.",
        code: `for (let i = 1; i < joints.length; i += 1) {
  const parent = joints[i - 1];
  const child = joints[i];
  const angle = Math.atan2(child.y - parent.y, child.x - parent.x);

  child.x = parent.x + Math.cos(angle) * segmentLength;
  child.y = parent.y + Math.sin(angle) * segmentLength;
  child.angle = angle;
}`,
        expected:
          "No link stretches during pursuit, and the tail receives the head's trajectory one joint at a time.",
      },
    ],
    controls: [
      {
        control: "joints",
        label: "Joints",
        effect:
          "Changes curve resolution and solver cost, not overall intention.",
        tryThis: "Compare 6, 18 and 28 while the rig overlay is visible.",
      },
      {
        control: "segment",
        label: "Link length",
        effect: "Controls total body length and how visible each bend becomes.",
        tryThis:
          "Keep joints fixed and double link length; watch elbows become easier to see.",
      },
      {
        control: "debug",
        label: "Rig overlay",
        effect:
          "Shows whether the geometry is valid before the silhouette smooths it.",
        tryThis:
          "Confirm adjacent dots remain evenly spaced through a hard reversal.",
      },
    ],
    verify: [
      "Every adjacent joint pair stays within a small tolerance of segmentLength.",
      "The chain begins in a valid, non-coincident pose.",
      "Increasing iterations is bounded and does not silently become unbounded work.",
    ],
    debug: [
      {
        symptom: "The first frame explodes outward.",
        fix: "Initialize joints at their rest spacing or add a zero-distance fallback direction before normalizing.",
      },
      {
        symptom: "More joints make the fish longer.",
        fix: "When comparing resolution, reduce segment length so jointCount × segmentLength stays roughly constant.",
      },
    ],
    sources: [
      {
        label: "Production spine solver",
        path: "lib/mascot/motion/SpineSolver.ts",
        note: "Bounded head-to-tail distance and regional angle constraints.",
      },
      {
        label: "Spine tests",
        path: "tests/mascot/SpineSolver.test.ts",
        note: "Executable invariants for length preservation and bounded iterations.",
      },
    ],
  },
  angles: {
    outcome:
      "A spine that bends more near the tail than the head and never flips at the ±π angle seam.",
    steps: [
      {
        title: "Wrap angle differences onto the shortest path",
        file: "src/fish.ts",
        action:
          "Normalize the difference before clamping. Otherwise a tiny turn across ±π looks like a full revolution.",
        code: `function wrapAngle(angle: number) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}`,
        expected:
          "Turning through the left-facing direction no longer creates a one-frame whip.",
      },
      {
        title: "Clamp change, not absolute heading",
        file: "src/fish.ts",
        action:
          "Limit each joint relative to the previous segment so the full animal can face any direction.",
        code: `function clampTurn(from: number, to: number, limit: number) {
  const delta = wrapAngle(to - from);
  const safeDelta = Math.max(-limit, Math.min(limit, delta));
  return from + safeDelta;
}`,
        expected:
          "The fish can turn around completely, but no single joint creates an impossible corner.",
      },
      {
        title: "Distribute stiffness along the body",
        file: "src/fish.ts",
        action:
          "Blend from a small head limit to a larger tail limit with smoothstep.",
        code: `function regionalLimit(t: number, head: number, tail: number) {
  const eased = t * t * (3 - 2 * t);
  return head + (tail - head) * eased;
}

const t = (i - 1) / Math.max(1, joints.length - 2);
const limit = regionalLimit(t, headLimit, tailLimit);
child.angle = clampTurn(previousAngle, candidateAngle, limit);`,
        expected:
          "The head reads as a firm mass while the tail completes the curve.",
      },
    ],
    controls: [
      {
        control: "angle",
        label: "Turn limit",
        effect: "Sets the maximum bend contributed by each link.",
        tryThis:
          "Compare 8° with 55°. Find the first value that folds during a reversal.",
      },
      {
        control: "segment",
        label: "Link length",
        effect:
          "Makes the same angular change cover more or less physical distance.",
        tryThis:
          "Use a long link with a loose angle to expose the failure clearly.",
      },
      {
        control: "break",
        label: "Break / repair",
        effect:
          "Creates loose links and angles so you can isolate the constraint failure.",
        tryThis:
          "Repair angle first, then link length. Name what each repair changes.",
      },
    ],
    verify: [
      "No joint exceeds its regional angle limit.",
      "The head region bends less than the posterior region.",
      "Crossing from +π to -π does not create a visible flip.",
    ],
    debug: [
      {
        symptom: "The fish occasionally whips when facing left.",
        fix: "Wrap the signed angle delta before clamping; do not clamp two raw absolute angles.",
      },
      {
        symptom: "The whole body feels like a steel rod.",
        fix: "Use a head-to-tail gradient instead of one very small global limit.",
      },
    ],
    sources: [
      {
        label: "Angle constraints",
        path: "lib/mascot/motion/AngleConstraint.ts",
        note: "The exact wrap, clamp and regional-limit helpers used in production.",
      },
      {
        label: "Motion architecture",
        path: "docs/mascot/ARCHITECTURE.md",
        note: "Explains where constraints sit between pose and rendering.",
      },
    ],
  },
  silhouette: {
    outcome:
      "A body surface generated from the spine, with a stable nose, shoulder, belly and taper that stay attached during turns.",
    steps: [
      {
        title: "Estimate a tangent at every joint",
        file: "src/fish.ts",
        action:
          "Use neighboring joints rather than the current segment alone. This makes the local frame less sensitive to one sharp link.",
        code: `function tangentAt(joints: Joint[], index: number) {
  const before = joints[Math.max(0, index - 1)];
  const after = joints[Math.min(joints.length - 1, index + 1)];
  const angle = Math.atan2(after.y - before.y, after.x - before.x);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}`,
        expected:
          "Local orientation changes continuously along a reasonably constrained spine.",
      },
      {
        title: "Rotate the tangent into a normal",
        file: "src/fish.ts",
        action:
          "A 90° rotation gives the left/right axis used by the body rails and attached features.",
        code: `const tangent = tangentAt(joints, i);
const normal = { x: -tangent.y, y: tangent.x };

left[i] = {
  x: joints[i].x + normal.x * width,
  y: joints[i].y + normal.y * width,
};
right[i] = {
  x: joints[i].x - normal.x * width,
  y: joints[i].y - normal.y * width,
};`,
        expected:
          "Both surface rails stay centered on the spine even through a full turn.",
      },
      {
        title: "Design width as anatomy",
        file: "src/fish.ts",
        action:
          "Use normalized distance t so morphology is independent of the number of joints.",
        code: `function bodyWidth(t: number, maxWidth: number) {
  const head = 0.52 + 0.48 * Math.sin(Math.min(1, t * 2.85) * Math.PI * 0.5);
  const tail = Math.pow(1 - t, 1.45);
  const shoulder = 1 + 0.18 * Math.exp(-Math.pow((t - 0.24) / 0.25, 2));
  const nose = t < 0.07 ? Math.sin((t / 0.07) * Math.PI * 0.5) : 1;
  return Math.max(0, head * tail * shoulder * nose) * maxWidth;
}`,
        expected:
          "The nose closes softly, volume peaks near the shoulder, and the final tail point reaches zero width.",
      },
    ],
    controls: [
      {
        control: "width",
        label: "Body width",
        effect: "Changes morphology without changing steering or constraints.",
        tryThis:
          "Move from 8px to 26px and confirm the root trajectory is unchanged.",
      },
      {
        control: "joints",
        label: "Joints",
        effect: "Changes sampling resolution for both spine and contour.",
        tryThis:
          "Find the lowest joint count that still gives a clean shoulder curve.",
      },
      {
        control: "debug",
        label: "Rig overlay",
        effect:
          "Lets you verify that surface errors come from the profile rather than the hidden skeleton.",
        tryThis:
          "Toggle it while turning and watch whether the contour or spine is actually misbehaving.",
      },
    ],
    verify: [
      "The first and last contour points close without a flat wall or detached gap.",
      "Eyes and fins use a local joint frame, never a fixed viewport offset.",
      "Changing width leaves root motion and link lengths unchanged.",
    ],
    debug: [
      {
        symptom: "The body sparkles or grows spikes while turning.",
        fix: "Smooth tangents across neighbors and fix angle constraints before adding more contour points.",
      },
      {
        symptom: "Eyes slide across the face.",
        fix: "Store their offset in a head-local tangent/normal frame, then reconstruct world position each frame.",
      },
    ],
    sources: [
      {
        label: "Body profile",
        path: "lib/mascot/character/BodyProfile.ts",
        note: "The current production nose, shoulder, belly and tail width curve.",
      },
      {
        label: "Contour construction",
        path: "lib/mascot/appearance/BodyContour.ts",
        note: "Builds a surface from spine-local coordinates.",
      },
    ],
  },
  secondary: {
    outcome:
      "One pinned secondary chain that remembers motion, trails the root and settles without inventing its own performance.",
    steps: [
      {
        title: "Store current and previous positions",
        file: "src/fish.ts",
        action:
          "Verlet integration infers velocity from the difference, so every free node needs both snapshots.",
        code: `type VerletNode = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  pinned: boolean;
};`,
        expected:
          "The data model can remember motion without a separate vx/vy pair per secondary point.",
      },
      {
        title: "Integrate memory with drag",
        file: "src/fish.ts",
        action:
          "Move from current position by the retained previous displacement, then add bounded external acceleration.",
        code: `for (const node of nodes) {
  if (node.pinned) continue;
  const vx = (node.x - node.previousX) * drag;
  const vy = (node.y - node.previousY) * drag;
  node.previousX = node.x;
  node.previousY = node.y;
  node.x += vx + accelerationX * dt * dt;
  node.y += vy + accelerationY * dt * dt;
}`,
        expected:
          "The free tip continues briefly after the root changes direction, then loses energy through drag.",
      },
      {
        title: "Pin the base and solve distances",
        file: "src/fish.ts",
        action:
          "Attach node zero to a body-local anchor every frame, then correct link lengths with a small bounded iteration count.",
        code: `nodes[0].x = anchor.x;
nodes[0].y = anchor.y;
nodes[0].previousX = anchor.x;
nodes[0].previousY = anchor.y;

integrateVerlet(nodes, dt, drag);
solveDistanceConstraints(nodes, segmentLength, 3);`,
        expected:
          "The fin or whisker cannot detach from the body and keeps a soft, decaying lag.",
      },
    ],
    controls: [
      {
        control: "damping",
        label: "Root damping",
        effect:
          "Changes how much energy is available for secondary motion to inherit.",
        tryThis:
          "Compare a clean stop with a ringing root before blaming the fin.",
      },
      {
        control: "response",
        label: "Response",
        effect:
          "Changes the severity of direction changes that create follow-through.",
        tryThis:
          "Use pointer control and make one sharp reversal, not continuous scribbles.",
      },
      {
        control: "play",
        label: "Pause",
        effect:
          "Lets you inspect whether the base is pinned and the tip is free.",
        tryThis:
          "Pause mid-turn and identify the one node that should exactly match its anchor.",
      },
    ],
    verify: [
      "Node zero matches its body anchor every frame.",
      "The tip settles when the root stops; it does not wave at rest.",
      "Large frame deltas and solver iterations are capped.",
    ],
    debug: [
      {
        symptom: "The secondary chain explodes after returning to the tab.",
        fix: "Clamp frame delta and maximum per-step displacement; reset timing on visibility changes.",
      },
      {
        symptom: "The fin appears to power the body.",
        fix: "Drive amplitude from root speed or acceleration and decay it faster than the primary action.",
      },
    ],
    sources: [
      {
        label: "Verlet chain",
        path: "lib/mascot/motion/VerletChain.ts",
        note: "Pinned nodes, bounded integration and positional distance constraints.",
      },
      {
        label: "Creature rig",
        path: "lib/mascot/character/CreatureRig.ts",
        note: "Owns spine and secondary anatomy as one updateable rig.",
      },
    ],
  },
  behavior: {
    outcome:
      "Explicit rest, wander, follow and off states where exactly one system owns the target and every continuous motion has an exit.",
    steps: [
      {
        title: "Name the states before writing transitions",
        file: "src/fish.ts",
        action:
          "A finite union prevents impossible combinations such as resting and chasing simultaneously.",
        code: `type Behavior = "rest" | "wander" | "follow" | "avoid";

type BehaviorState = {
  name: Behavior;
  elapsed: number;
};

let behavior: BehaviorState = { name: "rest", elapsed: 0 };`,
        expected:
          "DevTools always shows one named behavior rather than several competing booleans.",
      },
      {
        title: "Give each state one target policy",
        file: "src/fish.ts",
        action:
          "Resolve the target from behavior, then pass one result into the unchanged motion controller.",
        code: `function targetFor(state: Behavior): Point {
  switch (state) {
    case "rest": return { x: root.x, y: root.y };
    case "follow": return pointer;
    case "avoid": return nearestSafePoint();
    case "wander": return wanderPlanner.currentTarget();
  }
}`,
        expected:
          "Switching behavior changes intent, not the physics or rendering implementation.",
      },
      {
        title: "Make transitions bounded and interruptible",
        file: "src/fish.ts",
        action:
          "Advance elapsed time, allow explicit input to interrupt, and cap autonomous states so none can trap the visitor.",
        code: `function updateBehavior(dt: number) {
  behavior.elapsed += dt;

  if (pointerPressed) transition("follow");
  else if (dangerNearby) transition("avoid");
  else if (behavior.name === "rest" && behavior.elapsed > 1.2) {
    transition("wander");
  } else if (behavior.name === "follow" && pointerIdle > 2.5) {
    transition("rest");
  }
}`,
        expected:
          "Follow starts only after invitation, ends automatically, and urgent avoidance can interrupt it.",
      },
    ],
    controls: [
      {
        control: "autopilot",
        label: "Autopilot / pointer",
        effect:
          "Demonstrates a target-owner transition without rebuilding the rig.",
        tryThis:
          "Take control, stop moving, then return to autopilot and watch the settle.",
      },
      {
        control: "play",
        label: "Play / pause",
        effect: "Provides an immediate local exit from continuous motion.",
        tryThis:
          "Pause while pointer control is active; the control must remain visible and usable.",
      },
      {
        control: "damping",
        label: "Damping",
        effect:
          "Lets each named state feel different while sharing the same body and solver.",
        tryThis:
          "Compare the lesson's calm recipe with Break it, then restore it.",
      },
    ],
    verify: [
      "Only one behavior owns the target at a time.",
      "Pointer follow requires deliberate activation and has a visible exit.",
      "Reduced motion and feature-off override autonomous transitions.",
    ],
    debug: [
      {
        symptom: "The fish sometimes freezes indefinitely.",
        fix: "Give passive states a maximum duration or a deterministic exit condition, then test it with a fake clock.",
      },
      {
        symptom: "The fish flickers between two moods.",
        fix: "Add minimum durations or hysteresis so adjacent transition thresholds do not fight every frame.",
      },
    ],
    sources: [
      {
        label: "Behavior machine",
        path: "lib/mascot/behavior/BehaviorMachine.ts",
        note: "Minimum/maximum durations and centralized transitions.",
      },
      {
        label: "Runtime policy",
        path: "lib/mascot/MascotRuntime.ts",
        note: "Connects behavior, target ownership, motion recipes and interruption rules.",
      },
    ],
  },
  timestep: {
    outcome:
      "One bounded simulation clock that behaves predictably across refresh rates, background-tab resumes and slow frames.",
    steps: [
      {
        title: "Separate render time from simulation time",
        file: "src/main.ts",
        action:
          "Choose one fixed update step. Rendering may happen at any browser cadence, but physics consumes stable slices.",
        code: `const fixedDt = 1 / 60;
const maxFrameDt = 0.05;
const maxSteps = 3;
let accumulator = 0;
let previous = performance.now();`,
        expected:
          "The simulation has a declared step size and a declared work budget before the loop starts.",
      },
      {
        title: "Consume a bounded accumulator",
        file: "src/main.ts",
        action:
          "Clamp real time, run at most maxSteps updates, and deliberately drop excess time rather than creating a slow-frame spiral.",
        code: `function frame(now: number) {
  const frameDt = Math.min((now - previous) / 1000, maxFrameDt);
  previous = now;
  accumulator += frameDt;

  let steps = 0;
  while (accumulator >= fixedDt && steps < maxSteps) {
    update(fixedDt);
    accumulator -= fixedDt;
    steps += 1;
  }
  if (steps === maxSteps) accumulator = 0;
  render();
  requestAnimationFrame(frame);
}`,
        expected:
          "A long frame cannot schedule unbounded catch-up work or feed several seconds into one physics update.",
      },
      {
        title: "Reset timing when visibility changes",
        file: "src/main.ts",
        action:
          "Discard the stale baseline after a hidden tab returns instead of simulating the entire absence.",
        code: `document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    previous = performance.now();
    accumulator = 0;
  }
});

requestAnimationFrame(frame);`,
        expected:
          "Returning after several seconds produces a normal next frame rather than a teleport or constraint explosion.",
      },
    ],
    controls: [
      {
        control: "play",
        label: "Play / pause",
        effect:
          "Tests whether timing state can stop and resume without injecting fake elapsed time.",
        tryThis: "Pause for five seconds, resume, and look for a jump.",
      },
      {
        control: "joints",
        label: "Joints",
        effect:
          "Raises solver work in a controlled way for a quick stress comparison.",
        tryThis:
          "Compare 6 and 28 joints; input should remain immediate in both cases.",
      },
      {
        control: "debug",
        label: "Rig overlay",
        effect:
          "Makes solver instability visible before the body surface hides it.",
        tryThis:
          "Resume with the overlay on and confirm link spacing stays valid.",
      },
    ],
    verify: [
      "A five-second tab pause does not advance five seconds of physics.",
      "At most maxSteps updates execute for one rendered frame.",
      "Simulation state lives outside React render state and one loop owns it.",
    ],
    debug: [
      {
        symptom: "The fish teleports after switching tabs.",
        fix: "Reset previous timestamp and accumulator on visibility return; do not reuse the stale clock baseline.",
      },
      {
        symptom: "One slow frame creates a permanent slowdown.",
        fix: "Cap catch-up steps and drop excess accumulated time after the budget is exhausted.",
      },
    ],
    sources: [
      {
        label: "Fixed-step loop",
        path: "lib/mascot/core/FixedStepLoop.ts",
        note: "The tested production accumulator, work cap and interpolation boundary.",
      },
      {
        label: "Performance notes",
        path: "docs/mascot/PERFORMANCE.md",
        note: "Documents measured evidence, quality tiers and the remaining browser metrics.",
      },
    ],
  },
  ship: {
    outcome:
      "A shippable creature loop with named presets, reduced-motion behavior, pause/off controls and a repeatable review matrix.",
    steps: [
      {
        title: "Compose systems in dependency order",
        file: "src/main.ts",
        action:
          "Update input and behavior first, then root motion, constraints, secondary anatomy and rendering. Each stage consumes the previous one.",
        code: `function update(dt: number) {
  input.update();
  behavior.update(dt);
  rootMotion.update(dt, behavior.target);
  spine.solve(rootMotion.position);
  secondary.update(dt, spine);
}

function render() {
  renderer.draw({ spine, secondary, behavior });
}`,
        expected:
          "When something looks wrong, you can inspect one upstream layer at a time instead of tuning every value together.",
      },
      {
        title: "Respect motion and visibility preferences",
        file: "src/main.ts",
        action:
          "Treat reduced motion and an explicit off switch as top-level policies, not particle-count suggestions.",
        code: `const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
let enabled = localStorage.getItem("fish:disabled") !== "true";

function allowedToAnimate() {
  return enabled && !reduceMotion.matches && !document.hidden;
}

reduceMotion.addEventListener("change", () => loop.resetTiming());`,
        expected:
          "The creature can be stopped persistently, and reduced motion renders a calm static state without a hidden busy loop.",
      },
      {
        title: "Review the same scenarios every time",
        file: "src/review.ts",
        action:
          "Turn taste into a regression matrix. Record visible pass criteria beside code-level invariants.",
        code: `const scenarios = [
  "long pursuit",
  "hard reversal",
  "micro target move",
  "viewport edge",
  "pause and resume",
  "reduced motion",
  "feature off",
] as const;

for (const scenario of scenarios) review(scenario);`,
        expected:
          "A new visual tweak is checked against known failure modes instead of judged from one flattering motion path.",
      },
    ],
    controls: [
      {
        control: "break",
        label: "Break / repair",
        effect:
          "Runs a compact before/after review using known bad and known calm presets.",
        tryThis:
          "Explain every visible repair in dependency order before marking the course complete.",
      },
      {
        control: "autopilot",
        label: "Autopilot / pointer",
        effect: "Covers both autonomous and directly controlled product modes.",
        tryThis:
          "Verify that switching ownership never loses the off/pause escape.",
      },
      {
        control: "debug",
        label: "Rig overlay",
        effect:
          "Turns invisible constraints into inspectable production evidence.",
        tryThis: "Use it during the hard-reversal and pause/resume scenarios.",
      },
    ],
    verify: [
      "Every tunable parameter has a unit or a written perceptual purpose.",
      "Reduced motion, mobile policy, visibility pause and persistent off all work.",
      "Root, constraints, render cost and behavior can be inspected independently.",
      "The review matrix passes before aesthetic polish is accepted.",
    ],
    debug: [
      {
        symptom: "The demo is beautiful but hard to use around real content.",
        fix: "Review occlusion, focus, text contrast, target ownership and the off switch as product requirements, not final polish.",
      },
      {
        symptom: "Nobody knows which constant to change six weeks later.",
        fix: "Move related values into named motion recipes and document the visible intention beside them.",
      },
    ],
    sources: [
      {
        label: "Production engine",
        path: "lib/mascot/MascotEngine.ts",
        note: "Composes timing, input, runtime, quality and rendering boundaries.",
      },
      {
        label: "Playtest record",
        path: "docs/mascot/PLAYTEST.md",
        note: "Separates what was manually observed from what still requires evidence.",
      },
      {
        label: "Architecture record",
        path: "docs/mascot/ARCHITECTURE.md",
        note: "Accepted decisions, ownership boundaries and known limitations.",
      },
    ],
  },
};
