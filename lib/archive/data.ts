import type {
  ArchiveArticle,
  InspirationEntry,
  RaqEntry,
  TalkEntry,
} from "./types";

export const archiveArticles: ArchiveArticle[] = [
  {
    slug: "procedural-fish-from-seek-to-forage",
    title: "Make a Fish Think, Not Twitch: From Seek to Forage",
    dek: "A noob-to-pro guide to giving a procedural creature perception, hunger, pursuit, rest, growth, and reproduction without turning the page into a screensaver.",
    category: "Interfaces",
    format: "Tutorial",
    readingMinutes: 12,
    publishedAt: "2026-08-14",
    updatedAt: "2026-08-14",
    featured: true,
    accent: "steering / appetite / ecology",
    sections: [
      {
        id: "start-with-three-layers",
        heading: "1. Separate wanting, steering, and swimming",
        paragraphs: [
          "The beginner mistake is to point every body joint at the prey. The fish turns instantly, the tail has no opinion, and the result looks like a cursor wearing a costume. Start with three layers instead: action selection decides what the fish wants, steering chooses a direction, and locomotion turns that direction into a moving body.",
          "Think of a rider, a set of reins, and a horse. Hunger is the rider choosing a destination. Pursuit is the reins changing direction. The spine solver is the horse producing motion under limits. Each layer can improve without rewriting the others.",
        ],
        list: [
          "Action selection: rest, notice, hunt, digest, reproduce.",
          "Steering: seek, predict, evade, avoid, arrive.",
          "Locomotion: acceleration, turn rate, body wave, fins and tail lag.",
        ],
        quote:
          "Believable motion begins when intention and articulation stop being the same variable.",
      },
      {
        id: "tiny-seek-demo",
        heading: "2. Build the smallest seek behavior",
        paragraphs: [
          "A seek behavior does not teleport the fish. It asks for a velocity toward a target, compares that with the current velocity, and applies only a bounded portion of the difference. The acceleration limit is what gives the creature weight.",
          "Try this before adding a tail, prey, or personality. If one dot cannot approach and turn without buzzing around its target, a detailed body will only make the flaw more expensive to see.",
        ],
        code: {
          language: "ts",
          label: "one bounded steering step",
          value: `const offset = subtract(target, position);
const desired = scale(normalize(offset), maxSpeed);
const steering = limit(subtract(desired, velocity), maxForce);

velocity = limit(add(velocity, steering * dt), maxSpeed);
position = add(position, velocity * dt);`,
        },
      },
      {
        id: "predict-the-quarry",
        heading: "3. Chase where the prey is going",
        paragraphs: [
          "Seeking the prey's current position creates a permanently late predator. Prediction only needs to be modest: estimate a look-ahead time from distance, cap it, and add the prey's velocity over that interval. Recalculate every simulation step so a wrong guess expires almost immediately.",
          "Near the prey, shorten the prediction and slow the turn. Far away, look farther ahead. This removes the sharp left-right corrections that make a chase look algorithmic while keeping capture understandable.",
        ],
        code: {
          language: "ts",
          label: "lightweight pursuit",
          value: `const distance = length(prey.position - hunter.position);
const lookAhead = clamp(distance / hunter.maxSpeed, 0.08, 0.55);
const intercept = prey.position + prey.velocity * lookAhead;

return arrive(intercept, { slowRadius: 54, stopRadius: 10 });`,
        },
      },
      {
        id: "burst-and-coast",
        heading: "4. Let the fish look before it lunges",
        paragraphs: [
          "Continuous maximum-speed pursuit reads as panic. Real fish often alternate a burst with a coast. In an interface, that pause is useful twice: it lets the prey create a readable escape and gives the predator a moment that looks like perception rather than stalled animation.",
          "Use a short burst timer, a shorter coast timer, and hysteresis around hunger. The state should not flip every frame at one threshold. A fed fish digests; a hungry fish notices; only then does it commit.",
        ],
        list: [
          "Notice: face the school and sample an intercept point.",
          "Burst: commit for a small window with stronger acceleration.",
          "Coast: reduce thrust, keep momentum, and update the next decision.",
          "Digest: ignore new prey long enough for the meal to feel consequential.",
        ],
      },
      {
        id: "make-prey-worth-reading",
        heading: "5. Give prey an escape strategy, not random noise",
        paragraphs: [
          "Pure randomness is not intelligence; it is merely difficult to predict. Useful evasion blends four legible forces: flee the predator's predicted position, move sideways when it is close, separate from siblings, and prefer cover or safe edges. Add a brief dart only when danger crosses a threshold.",
          "The viewer should be able to explain the motion after watching once: the small fish saw danger, cut across the attack line, and tried to hide. That causal readability matters more than biological fidelity.",
        ],
      },
      {
        id: "growth-and-reproduction",
        heading: "6. Turn meals into a slow visible history",
        paragraphs: [
          "A meal should not scale the whole drawing by ten percent. Grow anatomy at milestones: a slightly longer spine, a fuller torso, a wider turn, then a calm recovery. The changes accumulate slowly enough that a returning visitor notices a different animal without watching a progress bar.",
          "Reproduction needs an eligibility rule, room in the population cap, and a quiet delay after the final meal. Settling before division makes the event feel caused rather than triggered. The children inherit a portion of the parent's morphology, then restart their own meal counters.",
        ],
        quote:
          "A living system is a history made visible, not an effect played on schedule.",
      },
      {
        id: "protect-the-page",
        heading: "7. Keep the ecology subordinate to the portfolio",
        paragraphs: [
          "The most sophisticated behavior rule is knowing where not to run. Confine the ecology to the hero, stop it when the hero leaves the viewport, hide it on touch-first screens, honor reduced motion, and let the visitor turn it off. Pointer following should begin only after the fish itself is selected and stop on the second selection.",
          "Your turn: draw a dot that seeks one moving target with bounded acceleration. Do not add a body yet. Reverse the target while the dot is moving and tune only maximum force until the turn feels intentional rather than instant.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-08-14",
        note: "Initial guide with pursuit, burst-and-coast appetite, growth, and hero-boundary design.",
      },
    ],
  },
  {
    slug: "spring-octopus-platformer-one-force-at-a-time",
    title: "Build a Spring Octopus Platformer, One Force at a Time",
    dek: "A practical route from one falling circle to an endless keyboard-controlled ascent game with live tentacles, reachable platforms, a soft camera, and honest failure states.",
    category: "Engineering",
    format: "Tutorial",
    readingMinutes: 11,
    publishedAt: "2026-08-14",
    updatedAt: "2026-08-14",
    accent: "platform physics / FABRIK / game feel",
    sections: [
      {
        id: "one-body-one-platform",
        heading: "1. Begin with a circle that can land",
        paragraphs: [
          "Do not begin with eight tentacles. Begin with a body position, velocity, gravity, and one platform segment. A landing occurs only when the body crossed the platform from above during the current step, is moving downward, and overlaps the platform horizontally.",
          "This swept test prevents the character from landing through the underside and reduces tunnelling when a frame arrives late. Keep the fixed simulation step boring before the silhouette becomes expressive.",
        ],
        code: {
          language: "ts",
          label: "crossing a platform from above",
          value: `const wasAbove = previousBottom <= platform.y;
const crossedTop = nextBottom >= platform.y;
const overlaps = x + radius >= platform.left && x - radius <= platform.right;

if (velocityY > 0 && wasAbove && crossedTop && overlaps) land();`,
        },
      },
      {
        id: "steer-air-not-pose",
        heading: "2. Let keys change momentum, not coordinates",
        paragraphs: [
          "A and D should express desired horizontal velocity. Acceleration moves the actual velocity toward that desire, drag settles it when input stops, and a speed cap protects reachability. Directly adding pixels to x makes the character feel detached from every jump.",
          "On touch, hold buttons should write to the same input channel as the keyboard. Pointer capture and blur cleanup matter because a stuck virtual key can ruin the whole run.",
        ],
      },
      {
        id: "generate-only-reachable-steps",
        heading: "3. Generate platforms from the previous launch",
        paragraphs: [
          "Random placement is not procedural level design. Each new platform should be sampled inside the horizontal distance the character can cover before reaching that height. Compute flight time from gravity and launch velocity, then multiply by the horizontal speed budget with a safety margin.",
          "The first few platforms should be wider and closer. Difficulty can then tighten width, increase lateral change, or introduce moving surfaces—but never ask for a jump the current physics cannot produce.",
        ],
        quote:
          "Procedural does not mean unrestricted. It means variety generated inside a contract.",
      },
      {
        id: "camera-reveals-intent",
        heading: "4. Make the camera reveal, not chase",
        paragraphs: [
          "Keep the character below an upper screen threshold until it reaches it. After that, move the camera upward only and ease toward the target. Platforms descend through view while their world coordinates remain stable.",
          "A camera that follows every vertical wobble makes landing harder to read. An upward-only camera preserves recent context and uses the top of the screen to promise the next decision.",
        ],
      },
      {
        id: "attach-the-eight-feet",
        heading: "5. Add tentacles as a portrayal layer",
        paragraphs: [
          "The root physics decides where the octopus is. The gait planner decides which feet may move. FABRIK solves each planted chain toward its target, and a soft spring ribbon follows the solved guide to add recoil and curl. The renderer never fixes a bad landing or invents a footstep.",
          "During flight, feet trail and gather beneath the body. On contact, they plant across the platform in a wave. Limiting concurrent steps preserves support and stops all eight arms from snapping at once.",
        ],
      },
      {
        id: "finish-the-loop",
        heading: "6. Finish the run before adding effects",
        paragraphs: [
          "The playable loop is start, steer, land, climb, fall, recover, and restart. Score the highest platform or height, persist a best value locally, pause when the tab is hidden, and keep a visible exit. Only then add ink, landing squash, particles, sound, or collectibles.",
          "Your turn: make one body bounce from one platform and steer in the air. Once three consecutive landings feel controllable, add a second reachable platform. Leave tentacles out until the root game is fun as a circle.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-08-14",
        note: "Initial noob-to-pro build path for the keyboard octopus ascent game.",
      },
    ],
  },
  {
    slug: "learn-hard-technical-systems-with-one-small-loop",
    title: "How to Learn a Hard Technical System Without Drowning",
    dek: "A psychology-backed learning loop for turning documentation, terminals, and unfamiliar code into durable mental models—one prediction and one experiment at a time.",
    category: "Lessons",
    format: "Field Note",
    readingMinutes: 9,
    publishedAt: "2026-08-14",
    updatedAt: "2026-08-14",
    accent: "mental models / retrieval / feedback",
    sections: [
      {
        id: "replace-coverage-with-capability",
        heading: "1. Stop trying to cover the topic",
        paragraphs: [
          "A long syllabus feels responsible because it names everything. It also hides the only useful question: what can you explain, predict, and change after the session? Choose one capability small enough to complete, such as reading one SQL query plan or explaining why one animation overshoots.",
          "The goal is not to consume a chapter. It is to leave with one model that can survive a new example.",
        ],
      },
      {
        id: "explanation-model-demo-action",
        heading: "2. Use one four-part learning loop",
        paragraphs: [
          "First explain the problem in plain language. Then attach a mental model. Show the smallest demo that could contradict that model. Finally, make one change or prediction yourself. The action is deliberately small so feedback arrives before working memory fills up.",
        ],
        list: [
          "Explain: what problem does this idea solve?",
          "Model: what familiar system behaves similarly?",
          "Demo: what is the smallest visible example?",
          "Action: what single prediction or edit proves understanding?",
        ],
      },
      {
        id: "predict-before-run",
        heading: "3. Predict before you run",
        paragraphs: [
          "A command that merely succeeds gives a pleasant feeling and weak evidence. Pause first and predict one observable detail: the row count, the direction of the bounce, the state transition, or the error class. The gap between prediction and result is where the mental model becomes editable.",
          "Wrong predictions are useful when they are specific. They reveal the exact rule your intuition invented.",
        ],
      },
      {
        id: "retrieve-not-reread",
        heading: "4. Retrieve the idea instead of rereading it",
        paragraphs: [
          "After the example works, close the explanation and answer a small question from memory. Retrieval feels harder than rereading because it exposes missing structure. That difficulty is productive: the answer becomes easier to access later because you practiced accessing it now.",
          "Keep questions short and answers shorter. A useful memory note might be: ‘Why can fixed-step simulation drop time?’ → ‘To avoid an unbounded catch-up spiral after a stall.’",
        ],
      },
      {
        id: "store-mistakes-not-transcripts",
        heading: "5. Save corrected mistakes, not session transcripts",
        paragraphs: [
          "Learning memory should contain the analogy that worked, the prediction that failed, the corrected rule, and the next smallest step. Command logs and copied documentation make a poor external brain because they preserve activity without preserving understanding.",
          "Your turn: choose one technical idea you currently describe with vague words. Write one sentence predicting what a tiny example will do. Then run only the example needed to prove or break that sentence.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-08-14",
        note: "Initial publication using the explain, model, demo, action, and retrieval loop.",
      },
    ],
  },
  {
    slug: "building-signal-breaker-step-by-step",
    title: "How I Built Signal Breaker: A Browser Game in Seven Layers",
    dek: "A step-by-step build log for turning a dead 404 route into a small, testable canvas game without letting game state leak into React.",
    category: "Engineering",
    format: "Build Log",
    readingMinutes: 13,
    publishedAt: "2026-08-14",
    updatedAt: "2026-08-14",
    featured: true,
    accent: "game loop / collision / game feel",
    sections: [
      {
        id: "start-with-a-complete-contract",
        heading: "1. Start with a complete contract, not a list of effects",
        paragraphs: [
          "Signal Breaker began with a product question: can an error route recover attention instead of merely apologizing? The answer did not need a large game. It needed one complete loop that a visitor could understand immediately: move the paddle, serve the ball, break the 404, recover the route, or leave.",
          "I wrote the states before the visuals: ready, playing, still lost, won, and game over. That forced every transition to have an exit. The home link and restart action are not UI added around the game; they are part of the game contract because a playful error page must never become another trap.",
        ],
        list: [
          "One readable objective: clear the 404 brick field.",
          "One movement axis: horizontal paddle control.",
          "One primary action: launch the ball.",
          "Two honest exits: restart or return home.",
        ],
        quote:
          "Build the smallest loop that can finish. Effects only matter after a player can win, lose, and leave.",
      },
      {
        id: "model-state-before-canvas",
        heading: "2. Model the game before drawing it",
        paragraphs: [
          "The canvas is a view. It should not be the place where score, collision rules, power-up timers, or life transitions are invented. I keep those facts in one plain Break404Model containing world dimensions, status, balls, bricks, paddle, timers, particles, input state, and one-shot sound cues.",
          "The model factory makes a full valid starting state, while resizeModel converts it to a new canvas size without erasing every broken brick. That separation makes the risky rules inspectable without a browser and prevents rendering concerns from becoming hidden state.",
        ],
        code: {
          language: "ts",
          label: "a renderer-independent model",
          value: `type Break404Model = {
  status: "ready" | "playing" | "stillLost" | "won" | "gameOver";
  time: number;
  lives: number;
  score: number;
  combo: number;
  bricks: Brick[];
  balls: Ball[];
  paddle: Paddle;
  powers: FallingPower[];
  particles: Particle[];
  input: { pointerX: number | null; left: boolean; right: boolean };
};`,
        },
      },
      {
        id: "separate-loop-update-render",
        heading: "3. Give time, rules, drawing, and React separate jobs",
        paragraphs: [
          "The requestAnimationFrame loop measures elapsed time, clamps it to 33 milliseconds, consumes one-shot input, advances the model, dispatches sound cues, renders the canvas, and schedules the next frame. It does not contain the collision rules themselves.",
          "updateGame mutates only the model. renderGame reads it. React receives a small HUD snapshot roughly every 80 milliseconds rather than every frame. The canvas stays immediate while the surrounding page keeps normal component semantics for text, buttons, and links.",
        ],
        code: {
          language: "ts",
          label: "the frame boundary",
          value: `const tick = (now: number) => {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  updateGame(model, { dt, launch: consumeLaunch() });
  for (const cue of model.sfx) audio.play(cue);
  renderGame(context, model);

  if (hudAccumulator > 0.08) syncHud(model);
  requestAnimationFrame(tick);
};`,
        },
      },
      {
        id: "make-the-paddle-a-control-surface",
        heading: "4. Make collision response part of player control",
        paragraphs: [
          "A technically correct bounce can still feel arbitrary. Wall and brick contacts reflect the ball along the shallow collision axis, but the paddle does something more useful: the contact position becomes an outgoing angle. A center hit travels mostly upward; an edge hit creates a sharper return.",
          "The current speed grows slightly after contact but remains clamped between a readable minimum and maximum. That small rule turns the paddle from a moving wall into an aiming surface and gives the player a way to influence the next several seconds.",
        ],
        code: {
          language: "ts",
          label: "paddle hit to outgoing angle",
          value: `const hit = (ball.x - paddle.x) / paddle.w;
const offset = clamp(hit, 0, 1) * 2 - 1;
const angle = -Math.PI / 2 + offset * 1.05;
const speed = clamp(
  Math.hypot(ball.vx, ball.vy) * 1.02,
  baseSpeed * 0.9,
  maxSpeed,
);

ball.vx = Math.cos(angle) * speed;
ball.vy = Math.sin(angle) * speed;`,
        },
      },
      {
        id: "add-feel-as-bounded-systems",
        heading: "5. Add game feel as bounded systems",
        paragraphs: [
          "Combos, particles, shake, sound, and power-ups arrived only after the base game was playable. Each effect has an owner and an end condition. Combo resets through a timer. Wide, fire, and slow modes expire against model time. Particles are capped. Shake decays. Sound is emitted as a cue and played by the shell after the update.",
          "That structure makes polish removable. Reduced-motion mode can skip particles and shake without changing collision or scoring. Muting audio does not suppress game events. If all effects disappear, the player still sees the ball, understands the objective, and can finish the route.",
        ],
        list: [
          "Combo: rewards consecutive hits, expires after a quiet window.",
          "Multi-ball: creates temporary complexity from one existing ball state.",
          "Wide paddle: modifies a measured dimension, then restores the base width.",
          "Fire ball: changes brick response without creating a second collision system.",
          "Slow motion: scales simulation time while UI and recovery timers remain understandable.",
        ],
      },
      {
        id: "design-the-quiet-path",
        heading: "6. Treat alternate input and quiet behavior as mechanics",
        paragraphs: [
          "Pointer and keyboard input both write to the same paddle model. Space and pointer-down both create the same one-frame launch intent. Audio is created or resumed only after an actual gesture, and mute state persists independently of the run.",
          "Reduced motion removes decorative shake and particle bursts. Hidden-tab time is ignored so returning to the page does not simulate a long invisible interval. These are not concessions after the game is finished; they define what a trustworthy browser game means inside a larger product.",
        ],
      },
      {
        id: "test-rules-tune-feel",
        heading: "7. Test rules and tune feel with different evidence",
        paragraphs: [
          "State transitions deserve assertions: a cleared field wins, losing the final ball spends a life, timed powers expire, and resize preserves broken bricks. Feel needs a different record: slow replays, awkward angles, repeated sessions, and notes about the exact tuning value under review.",
          "Keeping those evidence types separate protects the architecture. A future pass can change ball speed, combo timeout, or shake intensity without reopening model ownership. A test failure means the contract changed; a tuning change means the experience changed deliberately.",
        ],
        list: [
          "Test the model and update function without rendering.",
          "Keep tuning numbers in one configuration module.",
          "Capture hard-to-reproduce feel problems before changing values.",
          "Label measured performance separately from design judgment.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-08-14",
        note: "Initial publication with the interactive seven-step build sequence.",
      },
    ],
  },
  {
    slug: "procedural-motion-from-target-to-character",
    title: "Procedural Motion, Step by Step: From a Target to a Character",
    dek: "How fixed time, second-order dynamics, constraints, behavior states, page geometry, and a performance governor become one inspectable mascot engine.",
    category: "Interfaces",
    format: "Tutorial",
    readingMinutes: 14,
    publishedAt: "2026-08-14",
    updatedAt: "2026-08-14",
    featured: true,
    accent: "procedural motion / constraints / behavior",
    sections: [
      {
        id: "begin-with-the-engine-boundary",
        heading: "1. Begin with the engine boundary",
        paragraphs: [
          "The mascot is rendered inside a React product, but its motion is not React state. Positions, velocities, solver arrays, behavior timers, and particle pools can change sixty times per second without changing the semantic UI. Mirroring them through setState would turn the component tree into an expensive frame bus.",
          "React mounts the canvas and talks to one imperative engine: start, pause, resize, setPointer, setReducedMotion, setQuality, setDebug, getSnapshot, and destroy. This keeps lifecycle and accessibility controls in the product layer while continuous simulation stays local to the runtime.",
        ],
        quote:
          "React configures and observes the motion system. It does not need to own every frame the system produces.",
      },
      {
        id: "make-time-boring",
        heading: "2. Make time boring before making motion expressive",
        paragraphs: [
          "Display frames are not a stable clock. A laptop changes refresh rate, a background tab pauses, and a busy main thread returns late. The engine therefore accumulates real frame time but advances the simulation in fixed 1/60-second steps.",
          "Frame delta, catch-up work, and the accumulator are bounded. If the engine falls too far behind, it drops excess simulation time and records that fact instead of trying to replay an unbounded backlog. Deterministic scenarios can drive the same public tick method with a manual clock in tests.",
        ],
        code: {
          language: "ts",
          label: "bounded fixed-step update",
          value: `accumulator += clamp(frameDt, 0, maxFrameDt);

let steps = 0;
while (accumulator >= fixedDt && steps < maxSteps) {
  update(fixedDt);
  accumulator -= fixedDt;
  steps += 1;
}

if (steps === maxSteps && accumulator >= fixedDt) {
  accumulator = 0;
  onDroppedSimulationTime();
}`,
        },
      },
      {
        id: "choose-a-target-not-a-pose",
        heading: "3. Choose a target, not a finished pose",
        paragraphs: [
          "Pointer input, wandering, scroll velocity, inspect targets, and scripted actions all express intent. They choose where the creature wants to be or what it should notice; they do not write spine joints directly.",
          "That distinction keeps input replaceable. Switching from pointer-follow to autonomous wander changes the target source. The motion filters and body solver continue reading the same kind of target, so behavior can evolve without multiplying pose implementations.",
        ],
        list: [
          "Observe raw input and page conditions.",
          "Choose one active target source.",
          "Filter target position and direction.",
          "Solve the body from those filtered values.",
          "Render and expose a debug snapshot.",
        ],
      },
      {
        id: "use-dynamics-as-a-motion-vocabulary",
        heading: "4. Use dynamics as a motion vocabulary",
        paragraphs: [
          "A second-order dynamics filter gives each continuous channel three useful ideas: frequency controls response speed, damping controls how quickly oscillation settles, and response shapes anticipation or overshoot. The same implementation can make follow feel heavy, sprint feel eager, and rest feel soft by switching recipes.",
          "The filter substeps when delta time is large relative to its natural period and guards against invalid numeric state. That stability work matters more than the perfect default values because one NaN in a root channel can contaminate the entire rig.",
        ],
        code: {
          language: "ts",
          label: "a readable motion recipe",
          value: `const motion = {
  root: { frequency: 2.2, damping: 0.82, response: 0.12 },
  facing: { frequency: 3.1, damping: 0.9, response: 0.08 },
  squash: { frequency: 4.0, damping: 0.72, response: -0.05 },
};

rootX.update(dt, target.x, target.vx);
rootY.update(dt, target.y, target.vy);`,
        },
      },
      {
        id: "solve-the-body-in-layers",
        heading: "5. Solve the body in layers",
        paragraphs: [
          "The filtered root is not yet a character. A body profile defines proportions; the pose controller places the main chain; distance and angle constraints keep it coherent; appendage solvers resolve toward local targets; deformation and expression turn motion state into silhouette and face decisions.",
          "The important rule is directional ownership: simulation solves, rendering reads. The canvas renderer can hide or decorate the rig, but it does not repair joint distances or invent a gait. If the debug skeleton looks wrong, the renderer is not allowed to disguise the mistake.",
        ],
      },
      {
        id: "behavior-selects-recipes",
        heading: "6. Let behavior select recipes and targets",
        paragraphs: [
          "Follow, wander, inspect, sprint, rest, and recovery are decision states, not animation clips. Each state owns a minimum duration, optional maximum duration, entry and exit hooks, and a motion recipe. One decision function decides when a transition is allowed.",
          "This prevents ambient behavior from flickering between states every time the pointer moves. It also gives explicit product actions a clean interruption path: a click, scatter, wake, or debug scenario can force a transition without sprinkling special cases through the render loop.",
        ],
        code: {
          language: "ts",
          label: "behavior definition shape",
          value: `type BehaviorDefinition = {
  name: MascotBehavior;
  minimumDuration: number;
  maximumDuration?: number;
  motion: MotionRecipe;
  enter?(): void;
  update?(dt: number): void;
  canExit?(elapsed: number): boolean;
  exit?(): void;
};`,
        },
      },
      {
        id: "make-the-page-part-of-the-world",
        heading: "7. Make the page part of the world—and budget for it",
        paragraphs: [
          "A portfolio mascot should react to the actual interface without querying layout every frame. A DOM obstacle registry captures relevant rectangles, refreshes them on meaningful layout events, and exposes a spatially useful cache to steering. Visibility and reduced-motion controllers define when the system should pause or simplify.",
          "Finally, a performance governor records simulation plus render time across a rolling window. It downgrades quality after sustained slow frames and upgrades cautiously. The character can lose dot density, effects, or secondary motion while preserving its target, silhouette, and input response.",
        ],
        list: [
          "Cache page geometry instead of mixing getBoundingClientRect into the frame loop.",
          "Stop the loop when the document is hidden.",
          "Reduce motion at the behavior and rendering layers, not only in CSS.",
          "Expose state, targets, obstacles, and timings in a debug route.",
          "Degrade detail before degrading control or meaning.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-08-14",
        note: "Initial publication with the interactive seven-step motion sequence.",
      },
    ],
  },
  {
    slug: "rbac-isnt-if-statements",
    title: "RBAC Isn't a Collection of if Statements",
    dek: "Resource rules, inheritance, routing guards, and permission debugging belong in a decision interface, not scattered UI branches.",
    category: "Engineering",
    format: "Essay",
    readingMinutes: 8,
    publishedAt: "2026-08-12",
    updatedAt: "2026-08-12",
    featured: true,
    accent: "permissions / resource rules",
    sections: [
      {
        id: "if-statements-are-not-a-model",
        heading: "If statements are not a permission model",
        paragraphs: [
          "The first version of many permission systems is honest and dangerous: if the role is admin, show the button. Then the product adds tenant isolation, resource ownership, inherited permissions, temporary exceptions, and route guards. The UI still looks like a few branches, but the real interface has become much larger than anyone admits.",
          "A permission module needs one small decision interface: given a subject, action, resource, and context, return an allow/deny result with the reason. The implementation can hide inheritance, overrides, tenant rules, and audit hints behind that seam.",
        ],
        quote:
          "The decision is the interface. The role labels are only one input.",
      },
      {
        id: "debug-the-decision",
        heading: "Debug the decision, not the symptom",
        paragraphs: [
          "When a user cannot open a page, the useful answer is not simply false. It is the route checked, the resource resolved, the inherited grants considered, and the rule that won. Without that trace, every bug becomes a tour through scattered guards and duplicated role checks.",
          "This is where a deep module pays for itself. Callers learn one interface, but maintainers get locality: routing, rendering, and server actions can all ask the same question and receive the same explanation.",
        ],
        list: [
          "Resolve tenant or workspace context before permission checks.",
          "Represent actions and resources explicitly.",
          "Return a reason code alongside allow or deny.",
          "Keep UI visibility and route access on the same decision path.",
        ],
      },
      {
        id: "guards-are-adapters",
        heading: "Guards are adapters",
        paragraphs: [
          "A route guard, a disabled button, and a backend policy check should not each reinvent permission logic. They are adapters at different seams. Their job is to translate local facts into the permission module's interface and handle the result appropriately.",
          "The moment a second adapter exists, the seam is real. That is the point where centralizing the decision stops being architecture theater and starts preventing drift.",
        ],
        code: {
          language: "ts",
          label: "permission decision shape",
          value: `type PermissionDecision = {
  allowed: boolean;
  reason: "granted" | "missing-action" | "wrong-tenant" | "resource-denied";
};

can({
  subject: currentUser,
  action: "invoice.approve",
  resource: invoice,
  context: tenantContext,
});`,
        },
      },
    ],
    revisions: [{ date: "2026-08-12", note: "Initial publication." }],
  },
  {
    slug: "modernize-frontend-without-rewrite",
    title: "How to Modernize a Frontend Without Starting a Rewrite",
    dek: "Incremental boundaries, compatibility layers, and rollout discipline beat the fantasy of a clean restart.",
    category: "Engineering",
    format: "Tutorial",
    readingMinutes: 9,
    publishedAt: "2026-08-12",
    updatedAt: "2026-08-12",
    featured: true,
    accent: "brownfield / rollout",
    sections: [
      {
        id: "rewrite-is-a-financing-plan",
        heading: "A rewrite is a financing plan",
        paragraphs: [
          "A full rewrite does not remove complexity. It borrows against the team's future attention and delays the moment real users test the new assumptions. Brownfield modernization is slower in screenshots and faster in reality because every slice has to survive contact with the existing business.",
          "The first useful move is to choose the seam: server state, routing, permissions, design tokens, form state, or table rendering. A modernization effort that tries to improve all of them at once has no interface and no rollback story.",
        ],
      },
      {
        id: "make-one-new-rule",
        heading: "Make one new rule enforceable",
        paragraphs: [
          "Good incremental work introduces a rule that new code can follow immediately while old code remains compatible. For example: new server data goes through query keys; new permission checks go through the decision module; new dense tables use the virtualized table shell.",
          "That compatibility layer is not glamorous, but it buys locality. Once callers learn the new interface, the implementation behind it can improve without reopening every screen.",
        ],
        list: [
          "Pick one modernization seam at a time.",
          "Define the new interface before converting pages.",
          "Ship through a compatibility adapter instead of blocking on purity.",
          "Measure the workflow the business actually uses.",
        ],
      },
      {
        id: "rollout-is-design",
        heading: "Rollout is design",
        paragraphs: [
          "The best technical shape still fails if it cannot be introduced safely. Brownfield architecture has to include feature flags, route-by-route migration, production comparison, and a rollback path. These are not deployment chores around the work; they are part of the module's real interface.",
          "Modernization succeeds when the old system gradually loses responsibility. The goal is not to win an argument about the new stack. The goal is to make the next safe change smaller than the last one.",
        ],
        code: {
          language: "text",
          label: "slice order",
          value: `1. Observe the workflow and baseline it.
2. Add the new interface behind a compatibility adapter.
3. Convert one high-value route.
4. Compare behavior, requests, and rollback path.
5. Promote the rule for future code.`,
        },
      },
    ],
    revisions: [{ date: "2026-08-12", note: "Initial publication." }],
  },
  {
    slug: "coding-agent-two-brains",
    title: "I Gave My Coding Agent Two Brains",
    dek: "Why one document should describe intent while another records what the system actually knows.",
    category: "AI Agents",
    format: "Essay",
    readingMinutes: 8,
    publishedAt: "2026-05-12",
    updatedAt: "2026-05-15",
    featured: true,
    accent: "split state / durable intent",
    sections: [
      {
        id: "one-file-two-jobs",
        heading: "One file was doing two incompatible jobs",
        paragraphs: [
          "The first version of my coding loop kept the plan, progress, discoveries, and recovery notes in one markdown file. It looked tidy. It also became unreliable the moment the agent had to resume after a failure. Human-readable intent and machine-readable state age at different speeds.",
          "A product brief should stay legible and argumentative. Runtime state should be boring, explicit, and easy to validate. Asking one document to be both creates a subtle split-brain problem: the prose says what should happen while scattered checkboxes imply what already happened.",
        ],
        quote: "Intent wants context. State wants certainty.",
      },
      {
        id: "the-split",
        heading: "The split that made recovery predictable",
        paragraphs: [
          "I kept prd.md as the place for goals, constraints, and trade-offs. Beside it, prd.state.json became a compact ledger of phases, completed work, active locks, and the next safe action. The agent reads both, but only the state file is trusted for resumption.",
          "That choice also made drift visible. If implementation changes the plan, the agent has to record the difference instead of quietly rewriting history. Humans can review the reasoning; automation can validate the state.",
        ],
        code: {
          language: "json",
          label: "prd.state.json",
          value: `{
  "phase": "build",
  "status": "waiting",
  "completed": ["plan", "scaffold"],
  "next": "verify-ci",
  "locks": []
}`,
        },
      },
      {
        id: "what-changed",
        heading: "The bigger lesson",
        paragraphs: [
          "Reliable agents need an opinionated boundary between explanation and coordination. The prose can be rich, but the hand-off surface must be small enough to inspect in seconds. This is less glamorous than adding another model call, and far more useful.",
          "I now look for this boundary in every long-running tool: what belongs to the story, and what must survive as fact? Once those are separated, watchdogs, retries, and human review become much easier to reason about.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-05-15",
        note: "Added the recovery-state example and clarified drift handling.",
      },
      { date: "2026-05-12", note: "Initial publication." },
    ],
  },
  {
    slug: "watchdog-pattern-for-agents",
    title: "The Watchdog Pattern: Agents Without the Wild West",
    dek: "A small supervisor loop can make autonomous coding feel less like crossing your fingers.",
    category: "AI Agents",
    format: "Tutorial",
    readingMinutes: 7,
    publishedAt: "2026-04-28",
    updatedAt: "2026-05-03",
    featured: true,
    accent: "bounded autonomy / recovery",
    sections: [
      {
        id: "supervise-outcomes",
        heading: "Supervise outcomes, not every thought",
        paragraphs: [
          "The useful version of a watchdog is not a second agent narrating the first. It is a deliberately small loop that checks observable conditions: did the process exit, did files change, are tests still moving, and has the current phase exceeded its time budget?",
          "This keeps the supervisor cheap and understandable. It does not need to know how the work was done; it needs to know when the contract has stopped being honored.",
        ],
      },
      {
        id: "safe-transitions",
        heading: "Make waiting a first-class state",
        paragraphs: [
          "Many automation bugs come from treating silence as failure. Builds wait. Deployments wait. Humans wait before approving a destructive action. A good loop distinguishes active work, intentional waiting, recoverable stalls, and terminal failure.",
          "Once waiting is explicit, retries become less aggressive and status becomes more honest. The agent can say what it needs instead of manufacturing activity to look alive.",
        ],
        list: [
          "Set a bounded heartbeat for active work.",
          "Persist the reason and owner of every wait state.",
          "Retry only idempotent actions automatically.",
          "Escalate when authority—not compute—is missing.",
        ],
      },
      {
        id: "boring-is-safe",
        heading: "The safety layer should be boring",
        paragraphs: [
          "The watchdog is infrastructure, not personality. Its best feature is that a tired human can inspect its state and predict the next move. Deterministic transitions and plain logs beat clever recovery prompts.",
        ],
      },
    ],
    revisions: [
      { date: "2026-05-03", note: "Added explicit wait-state guidance." },
      { date: "2026-04-28", note: "Initial publication." },
    ],
  },
  {
    slug: "portfolio-as-product",
    title: "A Portfolio Should Behave Like a Product",
    dek: "The case for treating a personal site as a designed system instead of a wall of finished screenshots.",
    category: "Interfaces",
    format: "Essay",
    readingMinutes: 6,
    publishedAt: "2026-03-19",
    updatedAt: "2026-03-19",
    featured: true,
    accent: "proof through behavior",
    sections: [
      {
        id: "show-the-instinct",
        heading: "Show the instinct, not only the artifact",
        paragraphs: [
          "A grid of project thumbnails proves that work exists. It rarely shows how someone thinks. The more interesting portfolio behaves like a small product: it has pacing, defaults, error states, performance budgets, and moments of useful surprise.",
          "That does not mean turning every page into a game. It means letting the interface demonstrate the same judgment the case studies claim you have.",
        ],
      },
      {
        id: "layers-of-proof",
        heading: "Build layers of proof",
        paragraphs: [
          "The first layer should be immediate: what you make and why it matters. The second rewards inspection with constraints, failures, and decisions. The third can be playful—an interaction, a working prototype, or an honest debug view.",
          "Visitors should never need the third layer to understand you, but the people who open it should discover real depth rather than decoration.",
        ],
        quote:
          "The interaction is not garnish. It is another piece of evidence.",
      },
      {
        id: "repeat-visits",
        heading: "Design for a second visit",
        paragraphs: [
          "A portfolio becomes more valuable when it can hold changing ideas: writing, references, experiments, and things you are still learning. A living archive gives people a reason to return and gives you a healthier reason to keep the site current.",
        ],
      },
    ],
    revisions: [{ date: "2026-03-19", note: "Initial publication." }],
  },
  {
    slug: "drag-drop-trees-and-state",
    title: "What Drag-and-Drop Trees Taught Me About State",
    dek: "The UI looks like moving boxes. The engineering problem is preserving identity through change.",
    category: "Engineering",
    format: "Build Log",
    readingMinutes: 9,
    publishedAt: "2026-02-14",
    updatedAt: "2026-02-20",
    accent: "identity / ordering / intent",
    sections: [
      {
        id: "not-an-array",
        heading: "A tree is not an array wearing indentation",
        paragraphs: [
          "My first implementation treated a drop as a splice plus a depth change. That worked until a parent moved across branches and every derived index became stale. Visual order, structural ancestry, and stable identity are separate facts.",
          "The fix was to make the operation semantic: move node A under parent B before sibling C. The reducer could then validate cycles, preserve IDs, and derive the new flat projection after the structural update.",
        ],
      },
      {
        id: "preview-vs-commit",
        heading: "Preview state is not committed state",
        paragraphs: [
          "During a drag, people need immediate feedback, but mutating the canonical tree on every pointer move made cancellation and keyboard support fragile. A projected destination became temporary interaction state; the actual tree changed once, on commit.",
          "That split removed a surprising amount of defensive code. It also made announcements for assistive technology more accurate because the final operation had a stable description.",
        ],
      },
      {
        id: "lesson",
        heading: "Model what the user means",
        paragraphs: [
          "Whenever UI state feels tangled, I now ask whether I am storing pixels and indexes instead of intent. Coordinates are useful evidence. They are rarely the domain model.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-02-20",
        note: "Clarified projected versus committed state.",
      },
      { date: "2026-02-14", note: "Initial publication." },
    ],
  },
  {
    slug: "playful-interfaces-performance",
    title: "Playful Interfaces Still Need Boring Budgets",
    dek: "Delight survives production when animation has ownership, limits, and a graceful way out.",
    category: "Lessons",
    format: "Field Note",
    readingMinutes: 5,
    publishedAt: "2026-01-31",
    updatedAt: "2026-01-31",
    accent: "motion / performance",
    sections: [
      {
        id: "budget-first",
        heading: "Decide the budget before the flourish",
        paragraphs: [
          "The fastest way to ruin a playful interface is to make the main thread negotiate with six animation systems. I assign ownership early: CSS handles state transitions, a motion library handles choreographed UI, and canvas owns continuous simulation.",
          "Every effect also gets an exit: reduced motion, lower detail, hidden-tab pause, or removal when it stops paying rent.",
        ],
      },
      {
        id: "measure-feeling",
        heading: "Measure the feeling indirectly",
        paragraphs: [
          "Game feel is subjective, but its failure modes are measurable. Long tasks, layout shifts, input latency, and unstable frame time all show up before someone says the page feels heavy.",
          "A stable 60 frames per second with one excellent reaction feels more premium than a dozen effects fighting at 42.",
        ],
      },
      {
        id: "restraint",
        heading: "Restraint makes the strange parts believable",
        paragraphs: [
          "When the reading surface stays quiet, the one creature, string, or tactile control can become memorable. Contrast is part of animation design too.",
        ],
      },
    ],
    revisions: [{ date: "2026-01-31", note: "Initial publication." }],
  },
  {
    slug: "memory-for-learning-agent",
    title: "Building Memory for a Hands-On Learning Agent",
    dek: "A tutor becomes useful when it remembers where momentum disappears, not just what was completed.",
    category: "Experiments",
    format: "Build Log",
    readingMinutes: 7,
    publishedAt: "2026-01-22",
    updatedAt: "2026-01-26",
    accent: "practice / memory / motivation",
    sections: [
      {
        id: "completion-is-thin",
        heading: "Completion history is too thin",
        paragraphs: [
          "A checklist can tell a tutor that lesson four is done. It cannot tell the tutor that the learner stopped twice at environment setup, came alive during debugging, and loses interest when explanations arrive before a concrete task.",
          "Those patterns are the useful memory. They change how the next session should begin.",
        ],
      },
      {
        id: "memory-shape",
        heading: "Keep memory inspectable",
        paragraphs: [
          "I use a small memory file with current goals, confidence by topic, recurring blockers, motivation triggers, and the next recommended exercise. Every update needs evidence from the session and a reason it should affect future teaching.",
          "The learner can edit or delete any claim. Memory that cannot be inspected quickly becomes an invisible curriculum.",
        ],
        list: [
          "Record patterns, not transcripts.",
          "Prefer recent repeated evidence over one-off frustration.",
          "Separate learner preference from tutor inference.",
          "Expire assumptions that have not been observed again.",
        ],
      },
      {
        id: "momentum",
        heading: "Optimize for returning tomorrow",
        paragraphs: [
          "The best session is not the one that covers the most material. It is the one that leaves a clear next move and enough unresolved curiosity to reopen the terminal tomorrow.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-01-26",
        note: "Added guidance for expiring stale assumptions.",
      },
      { date: "2026-01-22", note: "Initial publication." },
    ],
  },
  {
    slug: "debug-view-part-of-product",
    title: "The Debug View Is Part of the Product",
    dek: "If a system behaves procedurally, its hidden decisions need a visible language.",
    category: "Interfaces",
    format: "Field Note",
    readingMinutes: 6,
    publishedAt: "2025-12-18",
    updatedAt: "2026-01-08",
    accent: "observability / interaction",
    sections: [
      {
        id: "mystery-is-expensive",
        heading: "Mystery is expensive",
        paragraphs: [
          "A procedural character can look wrong for ten different reasons: the target may be late, the foot may have replanted too early, the chain may be unreachable, or the renderer may simply be hiding a correct rig. Without instrumentation, every fix is taste-driven guesswork.",
          "I now treat debug drawing as a first-class interface. Target points, velocity vectors, gait groups, constraint radii, and collision regions each get a stable visual convention. The system becomes something I can read while it moves.",
        ],
      },
      {
        id: "show-the-decision",
        heading: "Show the decision, not only the data",
        paragraphs: [
          "Raw coordinates rarely answer the question a developer is asking. A useful overlay explains why a foot requested a step, which constraint rejected it, and what destination the gait planner approved.",
          "That same principle applies outside animation. When software makes a non-obvious choice, the best diagnostic view exposes the rule and the evidence together.",
        ],
        quote: "A debug view is the interface for the system's own reasoning.",
      },
      {
        id: "remove-with-confidence",
        heading: "Polish after you can explain the motion",
        paragraphs: [
          "Once the rig reads clearly as circles and lines, the organic renderer can add curves, thickness, glow, and squash without becoming camouflage. If the simple view does not feel grounded, the finished character will only fail more beautifully.",
        ],
      },
    ],
    revisions: [
      {
        date: "2026-01-08",
        note: "Added the distinction between raw data and visible decisions.",
      },
      { date: "2025-12-18", note: "Initial publication." },
    ],
  },
  {
    slug: "hardware-prototypes-software-reliability",
    title: "What Hardware Prototypes Taught Me About Reliability",
    dek: "Physical systems make latency, failure and optimistic assumptions impossible to ignore.",
    category: "Engineering",
    format: "Essay",
    readingMinutes: 8,
    publishedAt: "2025-11-06",
    updatedAt: "2025-11-10",
    accent: "failure modes / feedback",
    sections: [
      {
        id: "physics-does-not-retry",
        heading: "Physics does not quietly retry",
        paragraphs: [
          "In software, a timing bug can disappear when the debugger opens. On a hardware prototype, the motor still overshoots, the sensor still drifts, and the battery still changes the behavior halfway through a demo.",
          "That honesty changed how I build web systems. I became less interested in whether the happy path works once and more interested in whether state remains legible when timing, input, and availability disagree.",
        ],
      },
      {
        id: "feedback-before-control",
        heading: "Design feedback before control",
        paragraphs: [
          "The first useful addition to a prototype is often not a smarter controller but a clearer signal: a status light, a current limit, a calibration state, or a trace of the last command. Feedback shortens the distance between failure and understanding.",
          "Interfaces deserve the same treatment. Pending, stale, offline, and partially complete are real product states, not edge-case copy to add after launch.",
        ],
        list: [
          "Make calibration explicit.",
          "Give every command a visible acknowledgement.",
          "Fail into a state that can be inspected.",
          "Assume the environment will disagree with the lab.",
        ],
      },
      {
        id: "graceful-degradation",
        heading: "Graceful degradation is a design material",
        paragraphs: [
          "A robust prototype does not pretend failure is impossible. It sheds nonessential behavior, preserves the important invariant, and tells the operator what changed. Reduced-motion modes, low-detail renderers, cached content, and safe retries are the web equivalents of that same habit.",
        ],
      },
    ],
    revisions: [
      {
        date: "2025-11-10",
        note: "Expanded the graceful-degradation comparison.",
      },
      { date: "2025-11-06", note: "Initial publication." },
    ],
  },
  {
    slug: "designing-for-changed-minds",
    title: "Designing for an Abrupt Change of Mind",
    dek: "Responsive systems reveal their quality when the user reverses direction halfway through an action.",
    category: "Interfaces",
    format: "Field Note",
    readingMinutes: 6,
    publishedAt: "2025-09-27",
    updatedAt: "2025-09-27",
    accent: "reversibility / continuity",
    sections: [
      {
        id: "the-reversal-test",
        heading: "The reversal test",
        paragraphs: [
          "Drag an object toward one destination, then reverse course before releasing it. Move a procedural creature right, then snap the target left. Open a panel and close it before the transition completes. These moments reveal whether the interface tracks intent or merely plays a sequence.",
          "A polished system should reorganize from its current state. It should not teleport back to the beginning of a clip or wait for the old idea to finish.",
        ],
      },
      {
        id: "preserve-continuity",
        heading: "Preserve what is still true",
        paragraphs: [
          "When direction changes, position is still true, velocity is evidence, and the user's latest target is authoritative. Good animation keeps the first two and smoothly accepts the third.",
          "This is why spring dynamics and goal-based solvers feel more alive than a stack of entrance and exit timelines. They retain momentum without becoming loyal to an obsolete destination.",
        ],
        quote:
          "Responsiveness is the ability to change your mind without breaking the world.",
      },
      {
        id: "product-consequence",
        heading: "Reversibility builds trust",
        paragraphs: [
          "The lesson reaches beyond motion. Draft states, undo, cancellation, optimistic updates, and interruptible navigation all communicate the same promise: the interface is listening now, not after its choreography finishes.",
        ],
      },
    ],
    revisions: [{ date: "2025-09-27", note: "Initial publication." }],
  },
  {
    slug: "prototype-should-produce-evidence",
    title: "A Prototype Should Produce Evidence",
    dek: "The best prototype is not the most convincing one; it is the one that makes the next decision cheaper.",
    category: "Experiments",
    format: "Build Log",
    readingMinutes: 7,
    publishedAt: "2025-08-11",
    updatedAt: "2025-08-19",
    accent: "questions / proof / scope",
    sections: [
      {
        id: "name-the-uncertainty",
        heading: "Start with the uncertainty",
        paragraphs: [
          "Before opening the editor, I try to write the sentence the prototype must make less uncertain. Can eight planted legs reorganize naturally after a sudden turn? Will people understand the navigation without being told it is playful? Can the agent recover after the process disappears?",
          "A prototype with one explicit uncertainty can stay rough and still be valuable. A prototype trying to prove the whole product usually becomes a premature product with no clear test.",
        ],
      },
      {
        id: "instrument-the-attempt",
        heading: "Instrument the attempt",
        paragraphs: [
          "I capture the inputs, the visible outcome, and the conditions around a failure. For interaction work that might mean frame time and a screen recording; for an agent it might mean state transitions and the exact recovery point.",
          "The record prevents a persuasive demo from erasing the failures that happened just before it.",
        ],
        list: [
          "Write the question before the implementation.",
          "Keep the simplest observable success condition.",
          "Save surprising failures, not only the final take.",
          "End with a decision, not a list of features.",
        ],
      },
      {
        id: "throw-away-or-promote",
        heading: "Know whether to throw it away or promote it",
        paragraphs: [
          "If the prototype answered its question with brittle code, I keep the evidence and discard the implementation. If the architecture itself survived the test, I promote it deliberately with types, tests, and constraints. Confusing those outcomes is how experiments quietly become production dependencies.",
        ],
      },
    ],
    revisions: [
      {
        date: "2025-08-19",
        note: "Added criteria for promoting experimental code.",
      },
      { date: "2025-08-11", note: "Initial publication." },
    ],
  },
];

export const inspirationEntries: InspirationEntry[] = [
  {
    id: "linear",
    name: "Linear",
    kind: "Web",
    url: "https://linear.app/",
    note: "Dense product surfaces stay calm because hierarchy comes from rhythm, not decoration.",
    tags: ["density", "navigation", "command-menu"],
    pinned: true,
    palette: ["#0c0c12", "#5e6ad2", "#d7d7e0"],
    motif: "rails",
  },
  {
    id: "raycast",
    name: "Raycast",
    kind: "Web",
    url: "https://www.raycast.com/",
    note: "Keyboard-first interaction still feels welcoming because every shortcut has a visible home.",
    tags: ["keyboard", "command-menu", "motion"],
    pinned: true,
    palette: ["#161318", "#ff6363", "#f2e9ec"],
    motif: "console",
  },
  {
    id: "teenage-engineering",
    name: "Teenage Engineering",
    kind: "Hardware",
    url: "https://teenage.engineering/",
    note: "The controls explain themselves before copy does; color is functional, not cosmetic.",
    tags: ["controls", "hardware", "color"],
    pinned: true,
    palette: ["#d8d3c8", "#f04f23", "#1b1b1b"],
    motif: "console",
  },
  {
    id: "rauno",
    name: "Rauno Freiberg",
    kind: "Motion",
    url: "https://rauno.me/",
    note: "Motion answers where an object came from and where it went instead of merely announcing itself.",
    tags: ["micro-interaction", "physics", "restraint"],
    palette: ["#111111", "#f5f5f5", "#6d6d6d"],
    motif: "orbital",
  },
  {
    id: "paco",
    name: "Paco Coursey",
    kind: "Web",
    url: "https://paco.me/",
    note: "High-signal writing and interface notes without turning the page into a personal brand machine.",
    tags: ["writing", "annotation", "clarity"],
    palette: ["#f5f4ef", "#121212", "#e24822"],
    motif: "editorial",
  },
  {
    id: "arc",
    name: "Arc",
    kind: "Web",
    url: "https://arc.net/",
    note: "Transitions preserve spatial context, making an unfamiliar browser model easier to learn.",
    tags: ["spatial", "navigation", "transition"],
    palette: ["#f2efe9", "#7557ff", "#ff8e6b"],
    motif: "stack",
  },
  {
    id: "panic",
    name: "Panic",
    kind: "Web",
    url: "https://panic.com/",
    note: "Proof that software can be precise, funny, and unmistakably made by people at the same time.",
    tags: ["personality", "type", "product"],
    palette: ["#f7df35", "#ef3e36", "#14213d"],
    motif: "signal",
  },
  {
    id: "vercel",
    name: "Vercel",
    kind: "Web",
    url: "https://vercel.com/",
    note: "A disciplined hierarchy lets technical detail and strong marketing occupy the same surface.",
    tags: ["hierarchy", "type", "developer-tool"],
    palette: ["#000000", "#ffffff", "#4f4f4f"],
    motif: "rails",
  },
  {
    id: "nothing",
    name: "Nothing",
    kind: "Mobile",
    url: "https://nothing.tech/",
    note: "A constrained dot-matrix language carries from hardware detail to the entire digital system.",
    tags: ["system", "type", "hardware"],
    palette: ["#f1f0ea", "#e23c32", "#111111"],
    motif: "signal",
  },
  {
    id: "poolside-fm",
    name: "Poolsuite",
    kind: "Web",
    url: "https://poolsuite.net/",
    note: "A fully committed interface metaphor turns a tiny utility into a place people remember.",
    tags: ["metaphor", "sound", "nostalgia"],
    palette: ["#ffd54b", "#23a8a2", "#f06a4e"],
    motif: "console",
  },
  {
    id: "lusion",
    name: "Lusion",
    kind: "Motion",
    url: "https://lusion.co/",
    note: "Heavy visual technology earns its cost by making exploration itself the portfolio proof.",
    tags: ["webgl", "portfolio", "interaction"],
    palette: ["#0d0d0d", "#f1ff5e", "#ececec"],
    motif: "orbital",
  },
  {
    id: "read-cv",
    name: "Read.cv Archive",
    kind: "Web",
    url: "https://read.cv/",
    note: "Profiles felt like quiet working documents rather than attention-optimized social pages.",
    tags: ["community", "profiles", "calm"],
    palette: ["#f1f1ef", "#202020", "#9b9b93"],
    motif: "editorial",
  },
  {
    id: "arena",
    name: "Are.na",
    kind: "Web",
    url: "https://www.are.na/",
    note: "Research grows through visible relationships rather than engagement metrics or a single algorithmic feed.",
    tags: ["research", "collections", "calm"],
    palette: ["#f4f4f4", "#202020", "#5b7cfa"],
    motif: "stack",
  },
  {
    id: "stripe-press",
    name: "Stripe Press",
    kind: "Web",
    url: "https://press.stripe.com/",
    note: "Commerce disappears behind editorial pacing, generous typography, and unusually confident book presentation.",
    tags: ["editorial", "commerce", "type"],
    palette: ["#f1eadf", "#181818", "#e05d38"],
    motif: "editorial",
  },
  {
    id: "bruno-simon",
    name: "Bruno Simon",
    kind: "Motion",
    url: "https://bruno-simon.com/",
    note: "The navigation mechanic is the portfolio proof: playful, legible, and inseparable from the work being introduced.",
    tags: ["webgl", "navigation", "play"],
    palette: ["#c7f0ff", "#67b56b", "#f4a94a"],
    motif: "orbital",
  },
  {
    id: "studio-freight",
    name: "Studio Freight",
    kind: "Web",
    url: "https://studiofreight.com/",
    note: "Large type, motion, and grid changes stay coherent because every expressive move belongs to one strong system.",
    tags: ["type", "grid", "motion"],
    palette: ["#f2efe8", "#181818", "#d5ff35"],
    motif: "rails",
  },
  {
    id: "koto",
    name: "Koto Studio",
    kind: "Motion",
    url: "https://koto.studio/",
    note: "Case studies enter quickly, then let the identity system carry the storytelling instead of over-explaining it.",
    tags: ["brand", "case-study", "pacing"],
    palette: ["#f2f1eb", "#151515", "#ff4d2e"],
    motif: "signal",
  },
  {
    id: "material-you",
    name: "Material You",
    kind: "Mobile",
    url: "https://m3.material.io/",
    note: "A design system explains adaptive color and component behavior as principles, tokens, and usable implementation guidance.",
    tags: ["system", "adaptive", "documentation"],
    palette: ["#f8f2fa", "#6750a4", "#1d192b"],
    motif: "stack",
  },
  {
    id: "active-theory",
    name: "Active Theory",
    kind: "Motion",
    url: "https://activetheory.net/",
    note: "Immersive work stays navigable because spectacle, loading, sound, and input are treated as one product system.",
    tags: ["webgl", "world-building", "performance"],
    pinned: true,
    palette: ["#050505", "#d7ff4f", "#f2f2ee"],
    motif: "orbital",
  },
  {
    id: "merodev",
    name: "Merouane Bali",
    kind: "Motion",
    url: "https://merodev.net/",
    note: "A 3D portfolio earns exploration by turning each transition into spatial orientation rather than a loading trick.",
    tags: ["portfolio", "3d", "spatial"],
    pinned: true,
    palette: ["#10141a", "#fb7d4d", "#dce8ff"],
    motif: "orbital",
  },
  {
    id: "unseen-studio",
    name: "Unseen Studio",
    kind: "Motion",
    url: "https://unseen.co/",
    note: "Drag, hold, and sound interactions create a world, while a quiet entry path keeps the experience consensual.",
    tags: ["sound", "gesture", "world-building"],
    palette: ["#090909", "#bbff3c", "#ecece6"],
    motif: "signal",
  },
  {
    id: "daybreak-studio",
    name: "Daybreak Studio",
    kind: "Web",
    url: "https://www.daybreak.studio/",
    note: "Editorial restraint and keyboard-level detail make large identity systems feel browsable instead of presented at you.",
    tags: ["brand-system", "editorial", "keyboard"],
    palette: ["#f0eee7", "#1b1b1b", "#4169ff"],
    motif: "editorial",
  },
  {
    id: "dennis-snellenberg",
    name: "Dennis Snellenberg",
    kind: "Web",
    url: "https://dennissnellenberg.com/",
    note: "A portfolio with expressive type and motion that still makes role, work, availability, and contact obvious in seconds.",
    tags: ["portfolio", "type", "clarity"],
    palette: ["#1c1d20", "#455ce9", "#f1f1f1"],
    motif: "rails",
  },
  {
    id: "basement-studio",
    name: "basement.studio",
    kind: "Web",
    url: "https://basement.studio/",
    note: "Bold art direction remains commercially legible because every visual system resolves into proof, capability, and a next action.",
    tags: ["art-direction", "brand", "conversion"],
    palette: ["#0c0c0c", "#ff5138", "#f0e9dc"],
    motif: "stack",
  },
  {
    id: "dogstudio",
    name: "Dogstudio",
    kind: "Motion",
    url: "https://dogstudio.co/",
    note: "Art, technology, and case-study evidence share one emotional surface without hiding the studio's actual work.",
    tags: ["immersive", "case-study", "studio"],
    palette: ["#0a0b0d", "#ff6044", "#d9e8ee"],
    motif: "signal",
  },
  {
    id: "aristide-benoist",
    name: "Aristide Benoist",
    kind: "Motion",
    url: "https://aristidebenoist.com/folio-v1",
    note: "A personal archive behaves like an audiovisual instrument while project names and authorship remain the stable spine.",
    tags: ["creative-code", "sound", "portfolio"],
    palette: ["#0d0d0d", "#ece7dd", "#d25f3d"],
    motif: "console",
  },
  {
    id: "max-milkin",
    name: "Max Milkin",
    kind: "Web",
    url: "https://www.maxmilkin.com/",
    note: "Performance-first motion gives typography physical presence without making the portfolio slower to understand.",
    tags: ["performance", "typography", "motion"],
    palette: ["#121315", "#e7e6df", "#89a7ff"],
    motif: "rails",
  },
  {
    id: "new-computer",
    name: "New Computer",
    kind: "Mobile",
    url: "https://new.computer/",
    note: "An AI product introduces an unfamiliar relationship through warm language, character, and visible conversational memory.",
    tags: ["ai", "character", "product-story"],
    palette: ["#f4efe3", "#e95b3f", "#23334a"],
    motif: "editorial",
  },
  {
    id: "cursor",
    name: "Cursor",
    kind: "Web",
    url: "https://cursor.com/",
    note: "Product proof, technical depth, and a strong visual identity arrive in layers instead of competing in one hero.",
    tags: ["developer-tool", "product-proof", "pacing"],
    palette: ["#111111", "#f3f0e8", "#8b8bff"],
    motif: "stack",
  },
  {
    id: "playdate",
    name: "Playdate",
    kind: "Hardware",
    url: "https://play.date/",
    note: "The site teaches an unusual physical control by letting the crank shape the entire tone, motion language, and game catalog.",
    tags: ["hardware", "play", "controls"],
    palette: ["#f8cf25", "#6c54a3", "#161616"],
    motif: "console",
  },
];

export const talkEntries: TalkEntry[] = [
  {
    id: "inventing-principle-clip",
    title: "Immediate Connection",
    speaker: "Bret Victor",
    url: "https://www.youtube.com/watch?v=PUv66718DII&t=252s",
    youtubeId: "PUv66718DII",
    durationMinutes: 12,
    displayDuration: "12 min clip",
    topic: "Design",
    difficulty: "Open",
    evergreen: true,
    kind: "Clip",
    why: "A concentrated demonstration of tools that show consequences while an idea is still forming.",
    leavesYouWith:
      "A sharper test for whether software is helping thought or merely recording it.",
    takeaway: "Feedback speed changes what you are capable of imagining.",
    startAtSeconds: 252,
    endAtSeconds: 972,
  },
  {
    id: "deep-modules-clip",
    title: "Deep Modules, Small Interfaces",
    speaker: "John Ousterhout",
    url: "https://www.youtube.com/watch?v=bmSAYlu0NcY&t=746s",
    youtubeId: "bmSAYlu0NcY",
    durationMinutes: 18,
    displayDuration: "18 min clip",
    topic: "Systems",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Clip",
    why: "The most useful section of a longer lecture, cut to one durable way of evaluating abstractions.",
    leavesYouWith:
      "A visual model for comparing interface cost with hidden capability.",
    takeaway: "Great modules hide a lot behind very little surface area.",
    startAtSeconds: 746,
    endAtSeconds: 1826,
  },
  {
    id: "procrastination",
    title: "Inside the Mind of a Master Procrastinator",
    speaker: "Tim Urban",
    url: "https://www.youtube.com/watch?v=arj7oStGLkU",
    youtubeId: "arj7oStGLkU",
    durationMinutes: 14,
    displayDuration: "14 min",
    topic: "Life",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "A funny model for a painfully familiar behavior—and one image that stays useful for years.",
    leavesYouWith:
      "Language for noticing when urgency is doing all of your prioritization.",
    takeaway:
      "The dangerous deadlines are the important ones nobody scheduled.",
  },
  {
    id: "all-the-little-things",
    title: "All the Little Things",
    speaker: "Sandi Metz",
    url: "https://www.youtube.com/watch?v=8bZh5LMaSmE",
    youtubeId: "8bZh5LMaSmE",
    durationMinutes: 38,
    displayDuration: "38 min",
    topic: "Craft",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "A live refactor that makes design judgment visible instead of presenting the clean answer afterward.",
    leavesYouWith:
      "A patient strategy for improving code without pretending you know the final shape.",
    takeaway: "Duplication is often cheaper than the wrong abstraction.",
  },
  {
    id: "fuck-you-pay-me",
    title: "F*ck You, Pay Me",
    speaker: "Mike Monteiro",
    url: "https://www.youtube.com/watch?v=jVkLVRt6c1U",
    youtubeId: "jVkLVRt6c1U",
    durationMinutes: 41,
    displayDuration: "41 min",
    topic: "Business",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "The clearest practical talk about contracts, leverage, and protecting creative work.",
    leavesYouWith:
      "Specific questions to ask before work begins and the confidence to put them in writing.",
    takeaway:
      "Professional boundaries are part of the work, not an awkward layer around it.",
  },
  {
    id: "inventing-on-principle",
    title: "Inventing on Principle",
    speaker: "Bret Victor",
    url: "https://www.youtube.com/watch?v=PUv66718DII",
    youtubeId: "PUv66718DII",
    durationMinutes: 54,
    displayDuration: "54 min",
    topic: "Design",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "A rare talk where a philosophy of work is demonstrated through tools rather than slogans.",
    leavesYouWith:
      "A reason to choose a principle strong enough to guide what you build and refuse.",
    takeaway:
      "Do not merely follow passion; find a principle that makes action necessary.",
  },
  {
    id: "simple-made-easy",
    title: "Simple Made Easy",
    speaker: "Rich Hickey",
    url: "https://www.youtube.com/watch?v=SxdOUGdseq4",
    youtubeId: "SxdOUGdseq4",
    durationMinutes: 62,
    displayDuration: "1 hr 02",
    topic: "Systems",
    difficulty: "Deep dive",
    evergreen: true,
    kind: "Talk",
    why: "It separates convenience from structural simplicity and permanently improves design conversations.",
    leavesYouWith:
      "A vocabulary for identifying where systems have become intertwined.",
    takeaway: "Easy is nearby. Simple is not entangled.",
  },
  {
    id: "philosophy-software-design",
    title: "A Philosophy of Software Design",
    speaker: "John Ousterhout",
    url: "https://www.youtube.com/watch?v=bmSAYlu0NcY",
    youtubeId: "bmSAYlu0NcY",
    durationMinutes: 61,
    displayDuration: "1 hr 01",
    topic: "Systems",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "A compact set of design principles grounded in decades of writing and reviewing real code.",
    leavesYouWith:
      "Better questions for code review: where is complexity exposed, repeated, or made temporal?",
    takeaway:
      "The strategic programmer invests a little today to move faster for years.",
  },
  {
    id: "last-lecture",
    title: "The Last Lecture",
    speaker: "Randy Pausch",
    url: "https://www.youtube.com/watch?v=ji5_MqicxSo",
    youtubeId: "ji5_MqicxSo",
    durationMinutes: 76,
    displayDuration: "1 hr 16",
    topic: "Life",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "A generous, unsentimental account of ambition, obstacles, teaching, and making time visible.",
    leavesYouWith:
      "A way to evaluate goals by who you become while pursuing them.",
    takeaway: "Brick walls reveal how badly we want what is behind them.",
  },
  {
    id: "carmack-conversation",
    title: "Programming, Gaming, VR and the Future",
    speaker: "John Carmack",
    url: "https://www.youtube.com/watch?v=I845O57ZSy4",
    youtubeId: "I845O57ZSy4",
    durationMinutes: 309,
    displayDuration: "5 hr 09",
    topic: "Craft",
    difficulty: "Deep dive",
    evergreen: false,
    kind: "Conversation",
    why: "Long enough for the polished answers to run out and the engineer's actual reasoning habits to appear.",
    leavesYouWith:
      "A close view of sustained technical curiosity across games, systems, and research.",
    takeaway:
      "Depth comes from repeatedly following details past the point where most people stop.",
  },
  {
    id: "art-of-code",
    title: "The Art of Code",
    speaker: "Dylan Beattie",
    url: "https://www.youtube.com/watch?v=6avJHaC3C2U",
    youtubeId: "6avJHaC3C2U",
    durationMinutes: 65,
    displayDuration: "1 hr 05",
    topic: "Craft",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "A tour through code as notation, performance, humor, constraint, and a material people use to express ideas.",
    leavesYouWith:
      "A wider definition of programming craft than correctness and commercial utility alone.",
    takeaway: "Code can be a tool, a text, an instrument, and a performance.",
  },
  {
    id: "growing-a-language",
    title: "Growing a Language",
    speaker: "Guy Steele",
    url: "https://www.youtube.com/watch?v=_ahvzDzKdB0",
    youtubeId: "_ahvzDzKdB0",
    durationMinutes: 54,
    displayDuration: "54 min",
    topic: "Systems",
    difficulty: "Deep dive",
    evergreen: true,
    kind: "Talk",
    why: "The form of the talk demonstrates its argument: powerful systems can grow from a deliberately small shared vocabulary.",
    leavesYouWith:
      "A memorable way to think about extensibility, primitives, and who gets to add new language.",
    takeaway: "A language should help its users become its designers.",
  },
  {
    id: "future-of-programming",
    title: "The Future of Programming",
    speaker: "Bret Victor",
    url: "https://www.youtube.com/watch?v=8pTEmbeENF4",
    youtubeId: "8pTEmbeENF4",
    durationMinutes: 33,
    displayDuration: "33 min",
    topic: "Design",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "A deadpan alternate-history talk that exposes how arbitrary our assumptions about programming tools can be.",
    leavesYouWith:
      "Permission to question the keyboard-and-text-file defaults that usually escape design criticism.",
    takeaway:
      "The future becomes easier to imagine after the present stops looking inevitable.",
  },
  {
    id: "hammock-driven-development",
    title: "Hammock Driven Development",
    speaker: "Rich Hickey",
    url: "https://www.youtube.com/watch?v=f84n5oFoZBc",
    youtubeId: "f84n5oFoZBc",
    durationMinutes: 39,
    displayDuration: "39 min",
    topic: "Craft",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "A practical defense of giving hard problems time to become clear before turning activity into code.",
    leavesYouWith:
      "A repeatable preparation process for design problems that resist immediate implementation.",
    takeaway:
      "Incubation is part of work when it is fed by careful preparation.",
  },
  {
    id: "stop-drawing-dead-fish",
    title: "Stop Drawing Dead Fish",
    speaker: "Bret Victor",
    url: "https://www.youtube.com/watch?v=ZfytHvgHybA",
    youtubeId: "ZfytHvgHybA",
    durationMinutes: 32,
    displayDuration: "32 min",
    topic: "Design",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "The clearest argument that digital objects should behave, respond, and remain editable as living material.",
    leavesYouWith:
      "A standard for interactive art that goes beyond playing a finished timeline after a click.",
    takeaway:
      "A dynamic medium deserves creations whose behavior can be directly shaped.",
  },
  {
    id: "the-mess-were-in",
    title: "The Mess We're In",
    speaker: "Joe Armstrong",
    url: "https://www.youtube.com/watch?v=lKXe3HUG2l4",
    youtubeId: "lKXe3HUG2l4",
    durationMinutes: 46,
    displayDuration: "46 min",
    topic: "Systems",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "A funny, uncomfortable tour of how software complexity and connectivity outran our ability to reason about failure.",
    leavesYouWith:
      "Better suspicion of accidental coupling, universal reachability, and systems that cannot fail in isolation.",
    takeaway:
      "The parts we connect become one failure domain unless we design boundaries deliberately.",
  },
  {
    id: "data-oriented-design",
    title: "Data-Oriented Design and C++",
    speaker: "Mike Acton",
    url: "https://www.youtube.com/watch?v=rX0ItVEVjHc",
    youtubeId: "rX0ItVEVjHc",
    durationMinutes: 107,
    displayDuration: "1 hr 47",
    topic: "Systems",
    difficulty: "Deep dive",
    evergreen: true,
    kind: "Talk",
    why: "A forceful demonstration that performance begins with the shape and movement of data, not isolated clever instructions.",
    leavesYouWith:
      "Concrete questions about access patterns, transformations, measurement, and what the hardware actually receives.",
    takeaway:
      "Understand the data you have, the answer you need, and the transformations between them.",
  },
  {
    id: "mother-of-all-demos",
    title: "The Mother of All Demos",
    speaker: "Douglas Engelbart and team",
    url: "https://www.youtube.com/watch?v=yJDv-zdhzMY",
    youtubeId: "yJDv-zdhzMY",
    durationMinutes: 100,
    displayDuration: "1 hr 40",
    topic: "Design",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "A 1968 system demonstrates pointing, hypertext, collaborative editing, windows, and video calls as one coherent augmentation vision.",
    leavesYouWith:
      "Humility about novelty and a more ambitious definition of tools for collective thought.",
    takeaway:
      "The important invention is often the connected working system, not any single interface object.",
  },
  {
    id: "preventing-collapse-civilization",
    title: "Preventing the Collapse of Civilization",
    speaker: "Jonathan Blow",
    url: "https://www.youtube.com/watch?v=ZSRHeXYDLko",
    youtubeId: "ZSRHeXYDLko",
    durationMinutes: 64,
    displayDuration: "1 hr 04",
    topic: "Craft",
    difficulty: "Deep dive",
    evergreen: true,
    kind: "Talk",
    why: "A provocative case for preserving deep implementation knowledge instead of accepting layers nobody can rebuild.",
    leavesYouWith:
      "A reason to document mechanisms, practice fundamentals, and keep critical knowledge executable.",
    takeaway:
      "A capability is fragile when a culture remembers the interface but forgets how to recreate the mechanism.",
  },
  {
    id: "nothing-is-something",
    title: "Nothing Is Something",
    speaker: "Sandi Metz",
    url: "https://www.youtube.com/watch?v=9lv2lBq6x4A",
    youtubeId: "9lv2lBq6x4A",
    durationMinutes: 44,
    displayDuration: "44 min",
    topic: "Craft",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "A precise lesson in replacing conditionals and missing values with objects that make behavior explicit.",
    leavesYouWith:
      "A practical way to recognize when null handling is hiding a missing concept in the model.",
    takeaway:
      "Absence can have behavior; naming it can simplify every caller.",
  },
  {
    id: "concurrency-not-parallelism",
    title: "Concurrency Is Not Parallelism",
    speaker: "Rob Pike",
    url: "https://www.youtube.com/watch?v=oV9rvDllKEg",
    youtubeId: "oV9rvDllKEg",
    durationMinutes: 31,
    displayDuration: "31 min",
    topic: "Systems",
    difficulty: "Intermediate",
    evergreen: true,
    kind: "Talk",
    why: "Simple gophers, burning books, and composition make a commonly muddled systems distinction memorable.",
    leavesYouWith:
      "A way to separate structuring independent work from executing work at the same instant.",
    takeaway:
      "Concurrency is about composition; parallelism is about simultaneous execution.",
  },
  {
    id: "principles-technology-leadership",
    title: "Principles of Technology Leadership",
    speaker: "Bryan Cantrill",
    url: "https://www.youtube.com/watch?v=9QMGAtxUlAc",
    youtubeId: "9QMGAtxUlAc",
    durationMinutes: 35,
    displayDuration: "35 min",
    topic: "Business",
    difficulty: "Open",
    evergreen: true,
    kind: "Talk",
    why: "It treats integrity, decency, and customer care as engineering constraints rather than culture-deck decoration.",
    leavesYouWith:
      "A sharper test for whether organizational values can guide a hard decision instead of merely describing ambition.",
    takeaway:
      "Technology leadership needs explicit principles because optimization alone cannot decide what is right.",
  },
];

export const raqEntries: RaqEntry[] = [
  {
    id: "taste-distrust",
    question: "Which part of your taste do you distrust?",
    topic: "Taste",
    askedAt: "After a portfolio critique",
    shortAnswer: "The part that confuses visible effort with quality.",
    longAnswer: [
      "I am naturally drawn to interfaces that reveal how much work went into them—motion, procedural behavior, unusual transitions, tiny systems. That instinct is useful until it starts rewarding effort the visitor cannot benefit from.",
      "When I am uncertain, I remove the cleverest element and see whether the idea survives. If it does, the effect can come back as support. If it does not, the effect was probably the idea wearing a costume.",
    ],
  },
  {
    id: "automate-without-saving-time",
    question: "What do you automate even when it does not save time?",
    topic: "Tools",
    askedAt: "In a late-night build session",
    shortAnswer:
      "Anything whose rules I want to understand by making them explicit.",
    longAnswer: [
      "Automation is sometimes a microscope. I will build a tiny tool for a task I could finish manually because encoding the task exposes assumptions, edge cases, and the parts that still need judgment.",
      "The first run may be slower. The payoff is a reusable explanation of the process—and often a better question about which part should remain human.",
    ],
  },
  {
    id: "interface-jealousy",
    question: "What interface made you jealous?",
    topic: "Taste",
    askedAt: "During a design review",
    shortAnswer:
      "The first time Arc made a transition explain the product model.",
    longAnswer: [
      "Not because the motion was beautiful, although it was. I was jealous because the transition did instructional work. It preserved where an object came from, where it landed, and how to find it again.",
      "That is the standard I keep chasing: an interaction that carries meaning and still feels inevitable after you have learned it.",
    ],
  },
  {
    id: "nobody-watching",
    question: "What do you build when nobody is watching?",
    topic: "Work",
    askedAt: "A quiet question after a demo",
    shortAnswer:
      "Small instruments—tools that make an invisible system tangible.",
    longAnswer: [
      "I like interfaces where a rule becomes something you can touch: a string that produces sound, a physics rig you can interrupt, or a status file that makes an agent's uncertainty visible.",
      "They are rarely the most marketable projects at first. They are usually where I learn the technique that later makes a practical product feel different.",
    ],
  },
  {
    id: "reversed-opinion",
    question: "Which technical opinion have you completely reversed?",
    topic: "Failure",
    askedAt: "In a code review thread",
    shortAnswer:
      "I used to think abstraction was proof of maturity. Now I make it earn its rent.",
    longAnswer: [
      "Early on, repeated code made me nervous, so I reached for a reusable layer before the examples had finished disagreeing with one another. The result was often a clean API hiding confused responsibilities.",
      "Now I tolerate a little duplication until the stable shape becomes obvious. The goal is not fewer lines. It is fewer concepts that must change together.",
    ],
  },
  {
    id: "polish-procrastination",
    question: "When does polish become procrastination?",
    topic: "Failure",
    askedAt: "Halfway through a launch week",
    shortAnswer:
      "When I cannot name the user behavior the next detail is meant to improve.",
    longAnswer: [
      "Polish has a job: clarify hierarchy, strengthen feedback, remove friction, or create an emotion worth the cost. When the only explanation is that the page does not feel finished, I stop and define the missing outcome.",
      "Sometimes the answer is genuinely another day of refinement. Sometimes it is publishing the thing and letting reality provide better taste than anxiety can.",
    ],
  },
  {
    id: "portfolio-hide",
    question: "What should a portfolio intentionally hide?",
    topic: "Internet",
    askedAt: "From another developer rebuilding theirs",
    shortAnswer:
      "Everything that does not help someone understand your judgment.",
    longAnswer: [
      "A portfolio is edited evidence, not a database backup. I would hide work included only from guilt, metrics without context, and process artifacts that explain activity but not a decision.",
      "Good editing is not dishonesty. The deeper material can still exist in an archive for people who want it; the main path should protect the clearest story.",
    ],
  },
  {
    id: "meaning-of-fast",
    question: "What does fast mean besides load time?",
    topic: "Work",
    askedAt: "During a performance discussion",
    shortAnswer:
      "How quickly the interface lets intention become a visible result.",
    longAnswer: [
      "A page can load in a second and still feel slow if it delays confidence. Fast also means obvious next actions, reversible experiments, immediate feedback, and preserving context when someone changes direction.",
      "The best performance work shortens both machine latency and human uncertainty.",
    ],
  },
  {
    id: "never-make-money",
    question: "What would you still build if it could never make money?",
    topic: "Life",
    askedAt: "On a walk, not in a meeting",
    shortAnswer:
      "Tools that help curious people stay curious long enough to become capable.",
    longAnswer: [
      "I keep returning to playful learning systems: a tutor that remembers where momentum disappears, a simulation that lets you touch an abstract rule, or a tiny creative tool with no account screen and no growth loop.",
      "Making those things changes how I understand teaching and software, even if the audience stays small.",
    ],
  },
  {
    id: "unusually-patient",
    question: "What are you unusually patient about?",
    topic: "Life",
    askedAt: "A rare non-technical interview question",
    shortAnswer:
      "Following a strange prototype until it explains what it wants to become.",
    longAnswer: [
      "I can stay with an awkward interaction for a long time if there is one moment inside it that feels genuinely new. Most prototypes begin as evidence without a product around them.",
      "The patience is not endless. I keep asking whether each iteration is producing information. If it is only producing prettier uncertainty, it is time to stop.",
    ],
  },
  {
    id: "skill-to-remove",
    question: "Which skill would you remove from your stack if you had to?",
    topic: "Tools",
    askedAt: "After comparing increasingly long tool lists",
    shortAnswer: "The ability to make complexity look intentional.",
    longAnswer: [
      "It is useful to rescue a complicated system with naming, visual hierarchy, and a clean abstraction. It is also dangerous because a well-presented system can survive long after its underlying idea should have been simplified.",
      "If I lost that escape hatch, I would have to confront accidental complexity earlier. I would miss the craft, but I might make better first decisions.",
    ],
  },
  {
    id: "useful-unnoticed",
    question: "What is the most useful thing you built that nobody noticed?",
    topic: "Work",
    askedAt: "At the end of a project retrospective",
    shortAnswer: "The recovery path behind a demo that looked effortless.",
    longAnswer: [
      "The visible feature was a smooth interaction. The useful work was the state boundary that let it resume after a refresh, reject an invalid operation, and explain what happened when a dependency failed.",
      "Invisible reliability rarely earns the screenshot, but it changes whether the team trusts the product enough to keep building on it.",
    ],
  },
  {
    id: "boring-on-purpose",
    question: "What do you keep deliberately boring?",
    topic: "Taste",
    askedAt: "While reviewing an over-designed settings screen",
    shortAnswer:
      "Anything someone visits while already uncertain or frustrated.",
    longAnswer: [
      "Authentication, destructive actions, recovery, settings, and error explanations do not need a new interaction metaphor. They need stable language, expected controls, and a clear route back.",
      "Personality can live around those moments, but trust comes from making the important action feel unsurprising.",
    ],
  },
  {
    id: "internet-wish",
    question: "What do you wish the internet had kept?",
    topic: "Internet",
    askedAt: "Inside a conversation about old personal sites",
    shortAnswer: "More small places with a visible owner and no growth plan.",
    longAnswer: [
      "I miss pages that could be odd, unfinished, and deeply specific without being optimized into a content strategy. Their edges revealed a person learning in public rather than a funnel being improved.",
      "The answer is not nostalgia for bad accessibility or slow pages. It is protecting room for software whose success is that a few people remember where it lives.",
    ],
  },
  {
    id: "good-enough-to-ship",
    question: "How do you know when something is good enough to ship?",
    topic: "Failure",
    askedAt: "Two hours before a self-imposed deadline",
    shortAnswer:
      "When the remaining uncertainty needs real users more than another private iteration.",
    longAnswer: [
      "I check that the core promise is legible, the failure modes are recoverable, and the performance floor is respectable. Then I list what I still dislike and ask which items can only be judged in use.",
      "Shipping is not declaring the work finished. It is changing the source of evidence from imagination to reality.",
    ],
  },
  {
    id: "protect-from-optimization",
    question: "What part of your work do you protect from optimization?",
    topic: "Life",
    askedAt: "During a conversation about productivity systems",
    shortAnswer:
      "The first hour of a strange idea, before it has to justify itself.",
    longAnswer: [
      "Early ideas are unusually sensitive to metrics. Asking about audience, reuse, or revenue too quickly pushes them toward shapes that already have names and examples.",
      "I give the first prototype a small protected window to become specific. After that, constraints are welcome. Before that, efficiency can erase the very signal I am trying to find.",
    ],
  },
  {
    id: "delete-to-improve",
    question: "What did you delete that made the work much better?",
    topic: "Taste",
    askedAt: "After the third portfolio redesign",
    shortAnswer: "The requirement that every good idea had to appear on the homepage.",
    longAnswer: [
      "The homepage became more honest when it stopped carrying the whole archive, every experiment, and every proof detail at once. A visitor can understand the main claim quickly, then choose whether to descend into systems, writing, or play.",
      "Deleting from the main path did not erase the work. It gave the work an address where the right person could find it without making everyone else pay the attention cost.",
    ],
  },
  {
    id: "ai-should-not-decide",
    question: "What should an AI agent never decide on your behalf?",
    topic: "Tools",
    askedAt: "While designing an automation boundary",
    shortAnswer: "Which irreversible consequence is acceptable to another person.",
    longAnswer: [
      "An agent can gather evidence, compare options, draft language, and execute a clearly bounded decision. It should not silently choose who absorbs a risk, whether a public claim is fair, or when another person's data may be repurposed.",
      "The boundary is not intelligence. It is authority. More capable tools make that distinction more important, not less.",
    ],
  },
  {
    id: "motion-earns-place",
    question: "How does an animation earn its place?",
    topic: "Taste",
    askedAt: "During a motion critique",
    shortAnswer: "It explains state, preserves context, or creates a feeling worth the delay.",
    longAnswer: [
      "I ask what becomes harder to understand if the motion disappears. A transition may show origin and destination; a spring may communicate weight; a living creature may make an otherwise abstract system approachable.",
      "If removing the animation changes nothing except the amount of visible effort, it belongs in a lab rather than the main product path.",
    ],
  },
  {
    id: "leave-failure-visible",
    question: "Which failure would you leave visible in a case study?",
    topic: "Failure",
    askedAt: "While editing a polished build log",
    shortAnswer: "The one that changed the architecture, not merely the screenshot.",
    longAnswer: [
      "A dead end is useful when it exposes a wrong assumption: React state used as a frame bus, a random level generator producing impossible jumps, or an agent retrying without a recovery boundary.",
      "Showing the correction makes judgment inspectable. A gallery of only final states proves taste; a well-chosen failure can prove learning speed.",
    ],
  },
  {
    id: "why-creatures",
    question: "Why keep building strange little creatures?",
    topic: "Life",
    askedAt: "By someone expecting a practical project",
    shortAnswer: "Because a creature makes dozens of invisible engineering decisions emotionally legible.",
    longAnswer: [
      "A procedural animal forces timing, state, input, constraints, performance, accessibility, and rendering to cooperate. People notice immediately when those systems disagree, even if they cannot name the failing subsystem.",
      "The result is playful, but the lesson transfers: products also feel trustworthy when intention, feedback, and recovery belong to one coherent model.",
    ],
  },
  {
    id: "defaults-win",
    question: "When should the boring default win?",
    topic: "Work",
    askedAt: "Before replacing a familiar control",
    shortAnswer: "Whenever novelty asks the user to learn but gives them no lasting leverage.",
    longAnswer: [
      "A new interaction can be justified by speed, spatial understanding, accessibility, or expressive capability. It cannot be justified only by making the interface feel owned.",
      "I like unusual systems, so this is a useful constraint: the stranger the control, the clearer its payoff and escape route must be.",
    ],
  },
  {
    id: "research-grade",
    question: "What does research-grade mean in product work?",
    topic: "Work",
    askedAt: "After a request to make the motion more intelligent",
    shortAnswer: "A claim connected to evidence, then translated into a testable design choice.",
    longAnswer: [
      "Citing a paper is not the outcome. If pursuit research says prediction beats chasing the current position, the product decision is a bounded intercept point. If reading guidance says long lines lose people, the decision is a readable measure and a preference control.",
      "Research earns its place when someone can point from source to assumption to implementation—and change the implementation if the evidence changes.",
    ],
  },
  {
    id: "redo-invisible",
    question: "What would you rebuild even if nobody noticed the difference?",
    topic: "Tools",
    askedAt: "During a maintenance week",
    shortAnswer: "A state boundary that currently works only because events arrive in a lucky order.",
    longAnswer: [
      "Temporal luck is expensive. The feature can look perfect while refreshes, retries, hidden tabs, or slow responses are quietly constructing invalid states.",
      "I would rather replace that luck before adding a visible feature. The visitor may never notice the rewrite, but the next feature will not inherit a trap.",
    ],
  },
  {
    id: "taste-without-copying",
    question: "How do you study great portfolios without copying them?",
    topic: "Internet",
    askedAt: "With too many inspiration tabs open",
    shortAnswer: "Record the decision and its effect, not the surface treatment.",
    longAnswer: [
      "Instead of saving ‘large orange type,’ I save ‘one dominant signal makes a dense page scannable.’ Instead of copying a cursor, I ask how the interaction preserved context or made the maker's skill undeniable.",
      "The principle can combine with my own constraints. The color, typeface, 3D object, and transition should emerge from this site's material rather than another site's screenshot.",
    ],
  },
  {
    id: "portfolio-memory",
    question: "What should someone remember after closing this portfolio?",
    topic: "Internet",
    askedAt: "At the start of this redesign",
    shortAnswer: "That the systems were serious and the person making them was still curious.",
    longAnswer: [
      "Proof matters: shipped work, architecture, outcomes, and the ability to explain trade-offs. But proof without personality becomes interchangeable with a polished résumé template.",
      "The creatures, field notes, strange questions, and small instruments are not there to distract from competence. They show what the competence is in service of: making technology feel understandable, alive, and worth exploring.",
    ],
  },
];

export function getArticle(slug: string): ArchiveArticle | undefined {
  return archiveArticles.find((article) => article.slug === slug);
}

export function formatArchiveDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

/** Short host label ("hashnode.dev") for badging a syndicated post's origin. */
export function externalArticleLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "external";
  }
}
