export interface WorkbenchStep {
  id: string;
  label: string;
  title: string;
  goal: string;
  build: string[];
  checkpoint: string;
  files: string[];
}

export interface ArticleWorkbench {
  eyebrow: string;
  title: string;
  intro: string;
  liveHref: string;
  liveLabel: string;
  systemHref: string;
  systemLabel: string;
  steps: WorkbenchStep[];
}

export const articleWorkbenches: Record<string, ArticleWorkbench> = {
  "building-signal-breaker-step-by-step": {
    eyebrow: "Interactive build sequence / 7 steps",
    title: "Assemble the game in the order risk appears.",
    intro:
      "Select a step to inspect its goal, implementation tasks, proof checkpoint, and the real files that own the work. The sequence starts with a playable rule and adds game feel only after the loop is trustworthy.",
    liveHref: "/dead-channel-demo",
    liveLabel: "Play Signal Breaker",
    systemHref: "/systems/signal-breaker",
    systemLabel: "Open the system record",
    steps: [
      {
        id: "contract",
        label: "01 / Contract",
        title: "Define the smallest complete game",
        goal: "A player can move, launch, break every brick, lose a life, restart, or return home without learning a separate interface.",
        build: [
          "Write the ready, playing, recovery, won, and game-over states before drawing the first frame.",
          "Choose one world-space coordinate system and let canvas scaling handle device pixels.",
          "Keep the 404 recovery action visible so play never traps the visitor.",
        ],
        checkpoint:
          "You can describe every terminal and recovery state without mentioning particles, sound, or power-ups.",
        files: ["game/types.ts", "game/config.ts", "Break404.tsx"],
      },
      {
        id: "model",
        label: "02 / Model",
        title: "Create state that does not depend on rendering",
        goal: "The paddle, balls, bricks, score, timers, and effects exist as plain data that can be updated and tested without a canvas.",
        build: [
          "Create one model factory with explicit defaults.",
          "Give moving entities stable IDs and keep derived counts such as bricksRemaining close to the model.",
          "Add a resize path that preserves progress instead of silently restarting the run.",
        ],
        checkpoint:
          "The model can be created and resized in a test with no DOM or CanvasRenderingContext2D.",
        files: ["game/model.ts", "game/types.ts", "game/layout404.ts"],
      },
      {
        id: "loop",
        label: "03 / Loop",
        title: "Separate input, simulation, rendering, and UI",
        goal: "The frame loop owns time; the update function owns rules; the renderer only reads state; React receives a throttled summary for the HUD.",
        build: [
          "Clamp frame delta so tab switches cannot launch the ball through the world.",
          "Latch one-shot actions such as launch and consume them once per update.",
          "Sync the React HUD at a lower cadence than the canvas frame rate.",
        ],
        checkpoint:
          "Removing the HUD does not change gameplay, and replacing the renderer does not change the rules.",
        files: ["Break404.tsx", "game/update.ts", "game/render.ts"],
      },
      {
        id: "collision",
        label: "04 / Collision",
        title: "Turn contact into a controllable response",
        goal: "Wall and brick collisions are stable, while paddle position gives the player intentional control over the return angle.",
        build: [
          "Use circle-versus-AABB detection for balls, bricks, paddle, and falling power-ups.",
          "Resolve the shallow collision axis before changing velocity to avoid repeated overlap.",
          "Map the hit position across the paddle to an outgoing angle and cap the resulting speed.",
        ],
        checkpoint:
          "Center hits travel mostly upward, edge hits create sharper angles, and the ball cannot remain embedded in a surface.",
        files: ["game/update.ts"],
      },
      {
        id: "feel",
        label: "05 / Feel",
        title: "Add feedback after the rules are legible",
        goal: "Combos, particles, shake, sound, and power-ups explain important events without hiding the ball or changing the core contract.",
        build: [
          "Emit one-shot sound cues from the model instead of playing audio inside collision code.",
          "Cap particle count and decay shake every frame.",
          "Use short timers for combos and power-ups so every temporary rule has an explicit end.",
        ],
        checkpoint:
          "Turning off sound, particles, and shake leaves a complete, understandable game.",
        files: ["game/update.ts", "game/audio.ts", "game/config.ts"],
      },
      {
        id: "access",
        label: "06 / Access",
        title: "Design alternate input and quiet exits",
        goal: "Pointer, touch, keyboard, reduced-motion, mute, hidden-tab behavior, and page recovery are part of the first-class game contract.",
        build: [
          "Route pointer and keyboard movement into the same paddle model.",
          "Create or resume audio only after a user gesture and persist the mute choice.",
          "Pause simulation while the document is hidden and remove decorative motion when reduced motion is requested.",
        ],
        checkpoint:
          "A keyboard-only visitor can complete a run, mute it, restart it, and leave it.",
        files: ["Break404.tsx", "game/audio.ts", "game/update.ts"],
      },
      {
        id: "proof",
        label: "07 / Proof",
        title: "Test rules, then tune by observation",
        goal: "Game state transitions are deterministic where possible, while feel is reviewed with slow, repeated, recorded play sessions.",
        build: [
          "Test win, life loss, power-up expiry, resize preservation, and capped effect pools.",
          "Record awkward paddle angles and unreachable recoveries instead of tuning from memory.",
          "Document which values are measured and which are deliberate taste decisions.",
        ],
        checkpoint:
          "A future tuning pass can change numbers without reopening state ownership or rendering architecture.",
        files: ["game/logic.test.ts", "game/config.ts", "docs/"],
      },
    ],
  },
  "procedural-motion-from-target-to-character": {
    eyebrow: "Interactive build sequence / 7 steps",
    title: "Grow motion from a target, not from a timeline.",
    intro:
      "The mascot becomes believable one layer at a time: stable time, a filtered target, a constrained pose, behavior, world awareness, and finally adaptive polish. Each step remains inspectable in the Motion Lab.",
    liveHref: "/motion-lab",
    liveLabel: "Open Motion Lab",
    systemHref: "/systems/procedural-mascot",
    systemLabel: "Open the system record",
    steps: [
      {
        id: "boundary",
        label: "01 / Boundary",
        title: "Give React a small imperative contract",
        goal: "React mounts the canvas and forwards meaningful events; per-frame positions and solver state stay inside the engine.",
        build: [
          "Define start, pause, resize, pointer, quality, reduced-motion, debug, and destroy methods.",
          "Keep mutable simulation arrays behind the engine boundary.",
          "Expose snapshots for diagnostics rather than mirroring every joint into component state.",
        ],
        checkpoint:
          "The character can animate for several seconds without causing React renders on every frame.",
        files: ["MascotEngine.ts", "ProceduralMascotCanvas.tsx", "types.ts"],
      },
      {
        id: "clock",
        label: "02 / Clock",
        title: "Stabilize simulation time",
        goal: "Motion receives consistent update steps even when display frames arrive unevenly or the tab wakes after inactivity.",
        build: [
          "Accumulate real frame time and advance the simulation in fixed slices.",
          "Bound frame delta and catch-up steps to prevent a spiral of death.",
          "Drop excess simulation time deliberately and report that event to diagnostics.",
        ],
        checkpoint:
          "The same deterministic scenario produces the same state sequence when driven by a manual test clock.",
        files: ["core/FixedStepLoop.ts", "debug/DeterministicScenarios.ts"],
      },
      {
        id: "target",
        label: "03 / Target",
        title: "Convert raw intent into a motion target",
        goal: "Pointer, wander, scroll, and scripted actions choose where the creature wants to go without directly setting body joints.",
        build: [
          "Normalize input into one target director.",
          "Suppress pointer influence when interface controls need priority.",
          "Keep target selection separate from the solver that follows it.",
        ],
        checkpoint:
          "Switching from pointer-follow to wander changes the target source, not the pose code.",
        files: [
          "behavior/TargetDirector.ts",
          "behavior/WanderPlanner.ts",
          "input/PointerInput.ts",
        ],
      },
      {
        id: "dynamics",
        label: "04 / Dynamics",
        title: "Filter the target into expressive response",
        goal: "Frequency, damping, and response describe the feel of follow, anticipation, and settling without hand-authored keyframes.",
        build: [
          "Use second-order dynamics for root position, facing, squash, and other continuous channels.",
          "Substep large deltas relative to the filter's natural period.",
          "Reset invalid numeric state to the current target instead of allowing NaN to spread through the rig.",
        ],
        checkpoint:
          "You can make the creature heavy, eager, or calm by changing a motion recipe instead of rewriting the solver.",
        files: ["motion/SecondOrderDynamics.ts", "motion/MotionRecipes.ts"],
      },
      {
        id: "pose",
        label: "05 / Pose",
        title: "Resolve a body from constraints",
        goal: "A root target becomes a readable spine, contour, face, and appendages whose distances and angles remain bounded.",
        build: [
          "Create a small joint chain from a body profile.",
          "Use FABRIK, Verlet, and angle constraints only where each technique earns its complexity.",
          "Render from solved state; never let drawing code repair physics.",
        ],
        checkpoint:
          "The debug rig remains coherent when the target reverses direction or becomes temporarily unreachable.",
        files: [
          "motion/PoseController.ts",
          "motion/SpineSolver.ts",
          "motion/FabrikSolver.ts",
        ],
      },
      {
        id: "behavior",
        label: "06 / Behavior",
        title: "Layer decisions above motion recipes",
        goal: "Follow, wander, inspect, sprint, rest, and recovery select targets and tuning without becoming animation timelines.",
        build: [
          "Give each state minimum duration, optional maximum duration, entry/exit hooks, and one motion recipe.",
          "Keep transition rules in one decision function.",
          "Allow explicit actions to interrupt when product intent is stronger than ambient behavior.",
        ],
        checkpoint:
          "The debug overlay can explain both the current state and why a transition is or is not allowed.",
        files: ["behavior/BehaviorMachine.ts", "MascotRuntime.ts"],
      },
      {
        id: "world",
        label: "07 / World + budget",
        title: "Make the creature belong to the page",
        goal: "Cached DOM obstacles, visibility, reduced motion, and a performance governor let the character adapt to the product around it.",
        build: [
          "Refresh DOM geometry on meaningful layout changes rather than querying every frame.",
          "Pause on hidden tabs and reduce behavior before removing meaning.",
          "Measure simulation plus render time and downgrade quality only after a sustained slow window.",
        ],
        checkpoint:
          "The mascot can lose dots, effects, or cadence while preserving identity, input response, and readable debug state.",
        files: [
          "interaction/DomObstacleRegistry.ts",
          "core/PerformanceGovernor.ts",
          "input/VisibilityController.ts",
        ],
      },
    ],
  },
};
