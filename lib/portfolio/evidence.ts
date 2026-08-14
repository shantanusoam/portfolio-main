export type ProofMetric = {
  value: string;
  label: string;
  context: string;
  evidenceNote: string;
  href: string;
};

export type CurrentPosition = {
  body: string;
  support: string;
};

export type BuildTraceStep = {
  label: string;
  title: string;
  detail: string;
  build?: string[];
  checkpoint?: string;
  files?: string[];
};

export type FlagshipCaseStudy = {
  id: string;
  name: string;
  category: string;
  summary: string;
  problem: string;
  constraints: string[];
  decisions: string[];
  results: string[];
  image: string;
  systemImage: string;
  systemLayers: string[];
  trace: BuildTraceStep[];
  href: string;
};

export type SystemRegistryEntry = {
  slug: string;
  name: string;
  status: "live" | "documented" | "prototype";
  description: string;
  why: string;
  difficult: string;
  learned: string;
  image: string;
  previewHref: string;
  sourceHref?: string;
  tech: string[];
  how: string[];
  accessibility: string[];
  performance: string[];
  usage: string;
  diagram?: BuildTraceStep[];
  measurements?: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  debugRecording?: string;
  relatedReading?: Array<{
    title: string;
    href: string;
    note: string;
  }>;
};

export const currentPosition: CurrentPosition = {
  body: "I'm currently a Staff Engineer at Knowbuild, modernizing multi-tenant business software across frontend architecture, permissions, performance, and deployment systems. Outside product work, I build interaction engines, agent runtimes, and hardware experiments that make invisible rules tangible.",
  support:
    "Based in India. Available for senior product-engineering, frontend-systems, and selected design-engineering collaborations.",
};

export const proofMetrics: ProofMetric[] = [
  {
    value: "30%↓",
    label: "Query latency",
    context: "MongoDB indexing and housekeeping at Niva Bupa",
    evidenceNote:
      "Measured across representative policy-lookup traffic before and after index changes and cleanup jobs; exact operational data is withheld under healthcare-client confidentiality.",
    href: "/projects/niva-bupa#impact",
  },
  {
    value: "15+",
    label: "Critical vulnerabilities resolved",
    context: "XSS/CSRF remediation and penetration testing",
    evidenceNote:
      "Count comes from the remediation list closed before an external penetration-test pass; vulnerability names and reproduction details are sanitized for client security.",
    href: "/projects/niva-bupa#impact",
  },
  {
    value: "20→<5",
    label: "Minutes to rollback",
    context: "Blue-green deployment path across Docker and Kubernetes",
    evidenceNote:
      "Baseline was the manual rollback path; final measurement was a rehearsed blue-green rollback workflow through the container and ingress lane.",
    href: "/projects/niva-bupa#impact",
  },
  {
    value: "10k+",
    label: "Rows kept fluid",
    context: "Virtualized operational tables on low-end devices",
    evidenceNote:
      "Validated against representative 10k-row operational tables after virtualization and state ownership changes; client schema and row content are sanitized.",
    href: "/projects/knowbuild#impact",
  },
];

export const flagshipCaseStudies: FlagshipCaseStudy[] = [
  {
    id: "knowbuild",
    name: "Knowbuild",
    category: "B2B SaaS / CRM + ERP",
    summary:
      "Modernizing a Multi-Tenant CRM/ERP Without Stopping the Business.",
    problem:
      "The product had dense operational data, cross-tab state drift, and a UI stack that made every safe change expensive.",
    constraints: [
      "Brownfield rollout with minimal disruption",
      "Strict tenant and permission isolation",
      "10k+ row operational tables on modest hardware",
    ],
    decisions: [
      "Separated server state into TanStack Query and local UI state into Redux Toolkit",
      "Built an explicit permission module and subdomain-resolved tenant context",
      "Virtualized rendering and added performance budgets to the Vite build",
    ],
    results: [
      "~40% fewer redundant API calls",
      "10k+ rows remain smooth on low-end devices",
      "Safer repeatable deployments across local, staging, and production",
    ],
    image: "/proof-assets/evidence/knowbuild.webp",
    systemImage: "/proof-assets/evidence/proof-constellation.webp",
    systemLayers: [
      "Subdomain tenant resolver",
      "Permission decision flow",
      "Query cache ownership",
      "Virtualized 10k-row view",
    ],
    trace: [
      {
        label: "Problem",
        title: "State was everywhere",
        detail: "Server data and UI state behaved as one mutable surface.",
      },
      {
        label: "Failed path",
        title: "Patch the symptoms",
        detail:
          "Local fixes reduced visible bugs but preserved the underlying coupling.",
      },
      {
        label: "Decision",
        title: "Split by ownership",
        detail:
          "Each layer received a clear contract, cache, and failure boundary.",
      },
      {
        label: "Shipped",
        title: "Incremental modernization",
        detail:
          "New modules could land without a dangerous all-at-once rewrite.",
      },
      {
        label: "Lesson",
        title: "Brownfield speed comes from boundaries",
        detail:
          "The safest architecture is one the business can adopt in slices.",
      },
    ],
    href: "/projects/knowbuild",
  },
  {
    id: "niva-bupa",
    name: "Niva Bupa",
    category: "Healthcare / Performance + Security",
    summary: "Reducing Risk in a Live Healthcare Platform.",
    problem:
      "Policy lookups slowed at peak traffic while legacy authentication and release paths increased operational risk.",
    constraints: [
      "Healthcare data-protection requirements",
      "A monolith that could not pause for a rewrite",
      "External penetration testing and live traffic",
    ],
    decisions: [
      "Added strategic MongoDB indexes and scheduled housekeeping",
      "Introduced SSO, 2FA, IP whitelisting, and password rotation",
      "Containerized releases behind Kubernetes, Nginx, and a blue-green lane",
    ],
    results: [
      "30% lower peak query latency",
      "15+ critical vulnerabilities resolved",
      "Rollback reduced from 20 minutes to under 5",
    ],
    image: "/proof-assets/evidence/niva-bupa.webp",
    systemImage: "/proof-assets/evidence/build-trace.webp",
    systemLayers: [
      "Sanitized query plan",
      "Security control matrix",
      "Container image",
      "Blue-green ingress",
    ],
    trace: [
      {
        label: "Problem",
        title: "Slow and risky",
        detail:
          "Performance and release safety were coupled during peak traffic.",
      },
      {
        label: "Failed path",
        title: "Manual recovery",
        detail: "Rollback depended on a long, operator-heavy sequence.",
      },
      {
        label: "Decision",
        title: "Build a safe second rail",
        detail:
          "Security, containers, and ingress became one release contract.",
      },
      {
        label: "Shipped",
        title: "Measured hardening",
        detail: "The system passed external testing on its first run.",
      },
      {
        label: "Lesson",
        title: "Resilience is product work",
        detail: "A faster fallback changes what teams are willing to ship.",
      },
    ],
    href: "/projects/niva-bupa",
  },
  {
    id: "dnd-dynamic-tree",
    name: "dnd-dynamic-tree",
    category: "Open-source / Interaction infrastructure",
    summary: "Why Nested Drag-and-Drop Is a State-Modelling Problem.",
    problem:
      "Deep drag-and-drop trees look visual, but their real challenge is preserving identity, ancestry, and intent through change.",
    constraints: [
      "Unknown nesting depth",
      "Custom trigger and drag surfaces",
      "Reusable API rather than application-specific state",
    ],
    decisions: [
      "Modelled moves semantically instead of as visual index changes",
      "Separated projected drag state from committed tree state",
      "Published the behavior as a documented npm package",
    ],
    results: [
      "Installable from npm",
      "Nth-level nesting and automatic positioning",
      "Less hand-rolled boilerplate for complex React trees",
    ],
    image: "/proof-assets/evidence/dynamic-tree.webp",
    systemImage: "/proof-assets/systems/drag-tree.webp",
    systemLayers: [
      "Pointer or keyboard intent",
      "Projected destination",
      "Semantic move model",
      "Accessible announcement",
    ],
    trace: [
      {
        label: "Problem",
        title: "Indices kept lying",
        detail: "Visual order was being mistaken for structural identity.",
      },
      {
        label: "Failed path",
        title: "Splice and indent",
        detail: "The first model broke when parents crossed branches.",
      },
      {
        label: "Decision",
        title: "Store intent",
        detail: "Moves became node, parent, and sibling relationships.",
      },
      {
        label: "Shipped",
        title: "Package the contract",
        detail:
          "The result became a reusable npm library rather than a one-off widget.",
      },
      {
        label: "Lesson",
        title: "Interaction needs a domain model",
        detail: "Coordinates are evidence, not the final state.",
      },
    ],
    href: "/projects/dnd-dynamic-tree",
  },
];

export const systemsRegistry: SystemRegistryEntry[] = [
  {
    slug: "string-instrument",
    name: "String Instrument",
    status: "live",
    description:
      "A pointer and keyboard-playable instrument built from tension, displacement, and restrained audio feedback.",
    why: "It turns an invisible interaction rule into something you can touch: distance becomes tension, tension becomes sound, and release becomes visible feedback.",
    difficult:
      "The hard part was keeping a continuous physics/audio loop outside React while still honoring browser audio activation, keyboard input, reduced motion, and muted-first behavior.",
    learned:
      "Interactive proof works best when the runtime has one deep interface: pointer/keyboard events enter, bounded motion and audio decisions stay inside.",
    image: "/proof-assets/systems/string-instrument.webp",
    previewHref: "/#hero",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Canvas", "Web Audio", "Pointer Events"],
    how: [
      "Pointer displacement is normalized into per-string tension",
      "Tension maps to visual amplitude and note intensity while pitch stays inside the active chord table",
      "Keyboard controls trigger the same string path without requiring pointer precision",
      "Web Audio contexts are created only after a user gesture",
      "Each string returns through a damped spring rather than React state",
    ],
    accessibility: [
      "Sound starts muted and needs an explicit gesture",
      "Keyboard controls remain available for non-pointer operation",
      "Reduced-motion mode removes decorative oscillation and glow",
      "The instrument remains visually readable when audio is unavailable",
    ],
    performance: [
      "Mutable frame data avoids React renders during animation",
      "Audio buffers are cached instead of regenerated for every pluck",
      "Animation work stops when no string is moving or held",
      "Runtime CPU/frame numbers are intentionally not claimed until captured in a real browser session",
    ],
    usage: "Open the homepage and drag across the strings.",
    diagram: [
      {
        label: "Input",
        title: "Pointer / key",
        detail: "A gesture chooses a string and contact position.",
      },
      {
        label: "Tension",
        title: "Displacement",
        detail: "Distance from rest is clamped into a 0..1 force value.",
      },
      {
        label: "Tone",
        title: "Pitch + amplitude",
        detail:
          "The active chord supplies frequency; tension shapes gain and brightness.",
      },
      {
        label: "Gate",
        title: "Web Audio",
        detail: "The graph is silent until a real user activation unlocks it.",
      },
      {
        label: "Fallback",
        title: "Reduced motion",
        detail:
          "Motion and sound degrade separately without breaking the control.",
      },
    ],
    measurements: [
      {
        label: "Frame loop",
        value: "on demand",
        note: "The requestAnimationFrame loop stops when strings settle; verified from the component implementation, not a runtime CPU capture.",
      },
      {
        label: "Audio startup",
        value: "gesture gated",
        note: "AudioContext creation is deferred until interaction because browser autoplay policies require it.",
      },
      {
        label: "Browser timing",
        value: "pending",
        note: "No public ms/frame number is published yet; the next evidence pass should capture it in Chromium and record device details.",
      },
    ],
  },
  {
    slug: "procedural-mascot",
    name: "Procedural Mascot Engine",
    status: "live",
    description:
      "A canvas character that follows, wanders, reacts to page geometry, and exposes its own rig for debugging.",
    why: "The mascot is a product-facing proof of animation architecture: an expressive creature that can be interrupted, measured, downgraded, and debugged.",
    difficult:
      "It had to react to DOM geometry, page visibility, pointer intent, behavior states, and performance pressure without pushing per-frame state through React.",
    learned:
      "Continuous animation belongs behind a small imperative interface; React should configure and observe it, not own every frame.",
    image: "/proof-assets/systems/mascot-engine.webp",
    previewHref: "/creature-lab",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Canvas 2D", "Constraints", "Second-order dynamics"],
    how: [
      "A behavior-state machine chooses follow, wander, inspect, sprint, rest, and recovery modes",
      "Second-order dynamics smooth body motion toward a target without brittle timelines",
      "DOM obstacles are cached and queried through a spatial registry",
      "A fixed-step update loop advances simulation before the renderer reads it",
      "Animation state lives outside React because it changes every frame and is not UI state",
    ],
    accessibility: [
      "Pointer is optional",
      "Hidden-tab simulation pauses",
      "Reduced-motion mode lowers movement and detail",
      "The debug route exposes state in text as well as drawing",
    ],
    performance: [
      "One canvas instead of DOM joints",
      "No React frame-state",
      "Delta time is clamped after tab inactivity",
      "A performance governor downgrades quality after sustained slow frames",
    ],
    usage: "Visit Creature Lab and toggle the debug rig.",
    diagram: [
      {
        label: "Boundary",
        title: "Imperative engine",
        detail:
          "React mounts and configures the canvas; mutable per-frame state remains behind a small engine contract.",
        build: [
          "Define lifecycle and input methods",
          "Keep solver arrays outside component state",
          "Expose snapshots for diagnostics",
        ],
        checkpoint:
          "The mascot animates without triggering a React render on every frame.",
        files: ["MascotEngine.ts", "ProceduralMascotCanvas.tsx"],
      },
      {
        label: "Clock",
        title: "Fixed simulation step",
        detail:
          "Real frame time enters a bounded accumulator and advances the simulation in stable 1/60-second slices.",
        build: [
          "Clamp frame delta",
          "Bound catch-up steps",
          "Record dropped simulation time",
        ],
        checkpoint:
          "A deterministic scenario can drive the public tick method without requestAnimationFrame.",
        files: ["core/FixedStepLoop.ts"],
      },
      {
        label: "Observe",
        title: "Inputs become targets",
        detail:
          "Pointer, scroll, wander, visibility, and cached DOM geometry choose intent without writing body joints directly.",
        build: [
          "Normalize target sources",
          "Suppress pointer around controls",
          "Keep target choice separate from pose solving",
        ],
        checkpoint:
          "Follow and wander swap target sources while sharing the same motion pipeline.",
        files: ["behavior/TargetDirector.ts", "behavior/WanderPlanner.ts"],
      },
      {
        label: "Move",
        title: "Dynamics + constraints",
        detail:
          "Second-order filters shape response; spine, angle, and appendage constraints resolve a coherent body.",
        build: [
          "Filter root and facing",
          "Solve the body in bounded layers",
          "Render only solved state",
        ],
        checkpoint:
          "Reversing direction keeps the debug rig finite and readable.",
        files: ["motion/SecondOrderDynamics.ts", "motion/PoseController.ts"],
      },
      {
        label: "Decide",
        title: "Behavior state",
        detail:
          "Follow, wander, inspect, sprint, rest, and recovery select targets and motion recipes rather than animation clips.",
        build: [
          "Set minimum state durations",
          "Centralize transition decisions",
          "Allow explicit interruption",
        ],
        checkpoint:
          "The overlay explains the current state and why it may transition.",
        files: ["behavior/BehaviorMachine.ts", "MascotRuntime.ts"],
      },
      {
        label: "Budget",
        title: "Adaptive quality",
        detail:
          "A rolling frame-time window lowers secondary detail after sustained slow frames while preserving control and silhouette.",
        build: [
          "Measure simulation plus render",
          "Downgrade after a slow window",
          "Upgrade cautiously",
        ],
        checkpoint:
          "Quality can drop without changing target ownership or input response.",
        files: ["core/PerformanceGovernor.ts"],
      },
      {
        label: "Inspect",
        title: "Debug as product surface",
        detail:
          "Motion Lab makes behavior, targets, rig, obstacles, and frame statistics visible instead of forcing visual guesswork.",
        build: [
          "Draw stable debug conventions",
          "Add deterministic scenarios",
          "Record state alongside the picture",
        ],
        checkpoint:
          "A motion failure can be classified before changing tuning values.",
        files: ["motion-lab/page.tsx", "debug/DebugSnapshot.ts"],
      },
    ],
    measurements: [
      {
        label: "Automated tests",
        value: "131/131",
        note: "The documented mascot suite covers solvers, governor behavior, spatial grid, obstacle helpers, and bounded pools.",
      },
      {
        label: "Governor window",
        value: "90 frames",
        note: "Quality decisions are based on a rolling frame-time sample window, with downgrade after sustained >20ms average frames.",
      },
      {
        label: "Runtime frame capture",
        value: "not published",
        note: "The repo documents that browser p95/worst frame timing still requires a real-browser capture before public claims.",
      },
    ],
    debugRecording:
      "Open /motion-lab, enable Debug overlay, and play a deterministic scenario.",
    relatedReading: [
      {
        title: "Procedural Motion, Step by Step: From a Target to a Character",
        href: "/blog/procedural-motion-from-target-to-character",
        note: "A seven-layer tutorial with an interactive build sequence, code shapes, checkpoints, and the files behind each decision.",
      },
      {
        title: "The Debug View Is Part of the Product",
        href: "/blog/debug-view-part-of-product",
        note: "Why a procedural system needs a visible language for targets, constraints, and decisions.",
      },
    ],
  },
  {
    slug: "command-palette",
    name: "Signal Finder",
    status: "live",
    description:
      "A personal Ctrl/⌘ K index spanning pages, writing, references, screenings, questions, and systems.",
    why: "The site has many rooms; a command interface keeps discovery fast without duplicating navigation everywhere.",
    difficult:
      "The challenge was normalizing different content types into one search model without turning every page into a custom search adapter.",
    learned:
      "A small typed index gives callers leverage: new content becomes discoverable by satisfying the same searchable record shape.",
    image: "/proof-assets/systems/command-palette.webp",
    previewHref: "/?command=open",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["kbar", "Next Router", "Typed content index"],
    how: [
      "Normalizes content into one searchable model",
      "Weights top-level navigation above deep records",
      "Routes without a second navigation system",
    ],
    accessibility: [
      "Full keyboard operation",
      "Visible focus and active result",
      "Semantic labels and platform-aware shortcut hint",
    ],
    performance: [
      "The index is built once in the server layout",
      "No remote search round-trip",
      "Results are virtualized by the palette library",
    ],
    usage: "Press Ctrl K (or ⌘ K) anywhere on the site.",
  },
  {
    slug: "combo-trail",
    name: "Combo Trail",
    status: "live",
    description:
      "A restrained game-feel layer that turns meaningful navigation into readable feedback rather than confetti.",
    why: "It makes exploration feel responsive while keeping the portfolio's main reading path calm.",
    difficult:
      "The hard part was deciding which interactions deserved feedback and making the effect disappear under reduced motion.",
    learned:
      "Motion earns its keep when it confirms intent; decorative feedback needs a strict lifecycle.",
    image: "/proof-assets/systems/combo-trail.webp",
    previewHref: "/",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Framer Motion", "Event signals", "CSS"],
    how: [
      "Listens for intentional interaction events",
      "Accumulates a short-lived combo state",
      "Releases feedback through a bounded visual trail",
    ],
    accessibility: [
      "Never blocks content",
      "Ignored by assistive technology",
      "Disabled under reduced motion",
    ],
    performance: [
      "Short lifecycle",
      "No permanent DOM growth",
      "Transform and opacity only",
    ],
    usage: "Explore the homepage and follow the interaction trail.",
  },
  {
    slug: "dynamic-tree",
    name: "Dynamic Tree",
    status: "documented",
    description:
      "The installable nested drag-and-drop system behind the flagship open-source case study.",
    why: "Deep tree editing appears to be a pointer problem, but the reusable value is a stable semantic move contract.",
    difficult:
      "Array indices failed because visual order, ancestry, and identity change at different times during a drag.",
    learned:
      "Projection and committed state should live on opposite sides of the interaction seam; commit only the semantic move.",
    image: "/proof-assets/systems/drag-tree.webp",
    previewHref: "/projects/dnd-dynamic-tree",
    sourceHref: "https://github.com/shantanusoam/dnd-dynamic-tree",
    tech: ["React", "dnd-kit", "Storybook"],
    how: [
      "The move format records node, parent, and sibling position",
      "Index-based moves were rejected because indentation changes made stale indices look valid",
      "Projection previews a destination without mutating canonical state",
      "Committed state changes once through a tree reducer",
      "The consumer keeps rendering and store ownership",
    ],
    accessibility: [
      "Custom triggers can remain semantic controls",
      "State model supports keyboard descriptions",
      "Keyboard behavior can express move up, move down, nest, and unnest through the same semantic move",
      "Focus ownership stays with the consumer",
    ],
    performance: [
      "Projection is separated from canonical state",
      "Consumers can virtualize their own view",
      "Package avoids application-specific stores",
      "The minimal install path does not require global providers",
    ],
    usage: "npm install dnd-dynamic-tree",
    diagram: [
      {
        label: "Intent",
        title: "Pointer / keyboard",
        detail: "The user chooses a node and a target relationship.",
      },
      {
        label: "Project",
        title: "Preview",
        detail:
          "The UI shows a possible destination without rewriting the tree.",
      },
      {
        label: "Move",
        title: "Semantic command",
        detail:
          "{ nodeId, parentId, beforeId | afterId } becomes the operation.",
      },
      {
        label: "Commit",
        title: "Reducer",
        detail:
          "The reducer validates ancestry and writes one canonical tree update.",
      },
      {
        label: "Announce",
        title: "A11y",
        detail:
          "The same move can produce stable keyboard and screen-reader feedback.",
      },
    ],
    measurements: [
      {
        label: "Install",
        value: "npm package",
        note: "Public package and source are linked; consumers can inspect the interaction contract directly.",
      },
      {
        label: "State model",
        value: "single commit",
        note: "Canonical state updates once on drop or keyboard command; projection remains temporary.",
      },
      {
        label: "Demo",
        value: "embedded",
        note: "The project page includes a playable semantic-move demo with keyboard-style commands.",
      },
    ],
  },
  {
    slug: "signal-breaker",
    name: "Signal Breaker",
    status: "live",
    description:
      "The 404 recovery route as a compact brick-breaker with controllable rebounds, combos, timed power-ups, particles, and sound.",
    why: "A dead link is normally a dead end; this route turns recovery into a memorable proof of interaction logic.",
    difficult:
      "The challenge was keeping a game loop, audio, and page recovery lightweight enough for an error route.",
    learned:
      "Game mechanics need the same product constraints as any interface: pause, mute, keyboard input, and bounded work.",
    image: "/proof-assets/systems/signal-breaker.webp",
    previewHref: "/dead-channel-demo",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Canvas 2D", "Web Audio", "Clamped frame loop"],
    how: [
      "A plain model owns status, entities, score, timers, effects, and input",
      "The frame loop clamps time, consumes one-shot launch input, updates rules, plays cues, and renders",
      "Paddle contact position maps to an outgoing angle so the player can aim",
      "Combos and wide, fire, slow, and multi-ball powers are bounded by explicit timers or entity lifecycles",
      "React receives a throttled HUD snapshot instead of per-frame entity state",
    ],
    accessibility: [
      "Pointer, touch, A/D, arrow keys, and Space share the same input model",
      "Audio activates only after a gesture and has a persistent mute control",
      "Reduced-motion mode removes shake and particle bursts without changing the rules",
      "Hidden-tab time is discarded so returning does not advance an invisible backlog",
      "The home action remains available after every terminal state",
    ],
    performance: [
      "Canvas keeps the moving brick field outside the DOM",
      "Particles are capped at 120",
      "Frame delta is clamped to 33ms after stalls or tab switches",
      "The React HUD is synchronized at roughly 12.5Hz rather than every frame",
    ],
    usage: "Open any unknown route and start breaking the signal.",
    diagram: [
      {
        label: "Contract",
        title: "Ready to recovery",
        detail:
          "Define ready, playing, still-lost, won, and game-over states before adding effects.",
        build: [
          "Name every transition",
          "Keep restart and home visible",
          "Choose one readable objective",
        ],
        checkpoint:
          "The full game can be described without mentioning particles or sound.",
        files: ["game/types.ts", "Break404.tsx"],
      },
      {
        label: "Model",
        title: "Renderer-independent state",
        detail:
          "Balls, bricks, paddle, timers, score, effects, and input live in one plain model.",
        build: [
          "Create valid defaults",
          "Give entities stable IDs",
          "Preserve progress through resize",
        ],
        checkpoint: "The model can be created and resized without a canvas.",
        files: ["game/model.ts", "game/layout404.ts"],
      },
      {
        label: "Loop",
        title: "Time has one owner",
        detail:
          "The shell measures and clamps time; update owns rules; render only reads; React receives a slow HUD summary.",
        build: [
          "Clamp frame delta",
          "Latch one-shot launch input",
          "Throttle HUD synchronization",
        ],
        checkpoint: "Removing the HUD does not change gameplay.",
        files: ["Break404.tsx", "game/update.ts", "game/render.ts"],
      },
      {
        label: "Control",
        title: "Contact becomes aim",
        detail:
          "The ball's position across the paddle determines its return angle while speed stays bounded.",
        build: [
          "Detect circle versus AABB",
          "Resolve overlap",
          "Map paddle offset to angle",
        ],
        checkpoint:
          "Center and edge hits produce predictably different trajectories.",
        files: ["game/update.ts"],
      },
      {
        label: "Feel",
        title: "Bounded feedback",
        detail:
          "Combos, power-ups, particles, shake, and audio each have a cap, timer, or explicit lifecycle.",
        build: [
          "Emit one-shot cues",
          "Cap effect pools",
          "Keep polish removable",
        ],
        checkpoint: "Disabling every decorative effect leaves a complete game.",
        files: ["game/update.ts", "game/audio.ts", "game/config.ts"],
      },
      {
        label: "Proof",
        title: "Test rules, tune feel",
        detail:
          "Model transitions are asserted; tuning decisions are reviewed through repeated play and recorded edge cases.",
        build: [
          "Test win and life loss",
          "Test timed effects",
          "Centralize tuning values",
        ],
        checkpoint: "Tuning can change without reopening state ownership.",
        files: ["game/logic.test.ts", "game/config.ts"],
      },
    ],
    measurements: [
      {
        label: "Frame delta",
        value: "≤ 33ms",
        note: "The shell clamps elapsed time before update so a stalled or waking tab cannot create an unbounded simulation jump.",
      },
      {
        label: "Effect pool",
        value: "120 max",
        note: "Particle creation is capped against the current live pool and skipped entirely under reduced motion.",
      },
      {
        label: "HUD sync",
        value: "~12.5Hz",
        note: "React state is refreshed after an 80ms accumulator rather than for every canvas frame.",
      },
    ],
    relatedReading: [
      {
        title: "How I Built Signal Breaker: A Browser Game in Seven Layers",
        href: "/blog/building-signal-breaker-step-by-step",
        note: "The full build log, including an interactive sequence, collision response, game-feel boundaries, and proof checkpoints.",
      },
      {
        title: "Playful Interfaces Still Need Boring Budgets",
        href: "/blog/playful-interfaces-performance",
        note: "The performance and restraint principles behind playful work that still behaves like a product.",
      },
    ],
  },
  {
    slug: "pattern-registry",
    name: "Pattern Registry",
    status: "prototype",
    description:
      "Reusable interaction patterns promoted from hidden experiments into documented evidence.",
    why: "Experiments are more useful when their rules and trade-offs are discoverable after the novelty fades.",
    difficult:
      "The hard part is deciding which experiments deserve promotion and which should stay private research material.",
    learned:
      "A registry creates locality for future readers: behavior, access notes, performance notes, and source live together.",
    image: "/proof-assets/systems/pattern-registry.webp",
    previewHref: "/systems",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Next.js", "Typed data", "Progressive enhancement"],
    how: [
      "Pairs every preview with an explanation",
      "Records access and performance choices beside implementation",
      "Keeps experimental code discoverable without crowding the homepage",
    ],
    accessibility: [
      "Documentation works without the preview",
      "Each control has a text equivalent",
      "Motion is never required to understand a system",
    ],
    performance: [
      "Registry pages are statically generated",
      "Images are optimized WebP assets",
      "Interactive previews remain on their original routes",
    ],
    usage: "Browse /systems, then open a record for its engineering notes.",
  },
  {
    slug: "creature-rig",
    name: "Creature Rig",
    status: "prototype",
    description:
      "A debug-facing procedural-character surface for studying body targets, constraints, appendages, and gait decisions.",
    why: "The rig makes procedural animation decisions visible before the polished renderer hides them.",
    difficult:
      "Foot locking, gait timing, and joint constraints had to be readable at debug speed and still remain bounded.",
    learned:
      "If the simple rig does not explain the motion, polish will only make the problem harder to diagnose.",
    image: "/proof-assets/systems/creature-rig.webp",
    previewHref: "/octopod-lab",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["FABRIK", "Foot locking", "Canvas 2D"],
    how: [
      "Feet remain in world space until a threshold is crossed",
      "A gait planner limits simultaneous steps",
      "FABRIK resolves joints between body anchors and targets",
    ],
    accessibility: [
      "Debug labels explain motion decisions",
      "Touch and pointer share one input path",
      "Reduced motion lowers cadence",
    ],
    performance: [
      "All joints live in mutable runtime arrays",
      "Solver iterations are bounded",
      "Rendering only reads solved physics",
    ],
    usage: "Open Octopod Lab and turn on debug mode.",
    relatedReading: [
      {
        title: "Procedural Motion, Step by Step: From a Target to a Character",
        href: "/blog/procedural-motion-from-target-to-character",
        note: "Start with the engine boundary, then add stable time, target selection, dynamics, constraints, behavior, and adaptive quality.",
      },
    ],
  },
];

export const experienceEvidence = [
  {
    company: "Knowbuild",
    role: "Staff Engineer / Senior Software Developer",
    period: "2025 — now",
    proof:
      "Multi-tenant platform, RBAC, 40% fewer redundant API calls, 10k+ row virtualization",
    href: "/projects/knowbuild",
  },
  {
    company: "Niva Bupa",
    role: "Senior Software Engineer",
    period: "2025",
    proof:
      "30% lower query latency, 15+ critical fixes, sub-five-minute rollback",
    href: "/projects/niva-bupa",
  },
  {
    company: "Mobikasa",
    role: "Senior Frontend Developer",
    period: "2023 — 2025",
    proof:
      "Micro-frontends, nested builders, RTK architecture, reusable component system",
    href: "/projects/amala-earth",
  },
  {
    company: "The Tarzan Way",
    role: "Full-stack Developer",
    period: "2023",
    proof: "Travel platform, PWA, maps, payments, and a Lighthouse score of 91",
    href: "/#trail-map",
  },
  {
    company: "KAL Group",
    role: "Full-stack Developer",
    period: "2021 — 2023",
    proof:
      "HRMS, ticketing, e-commerce, maps, CRM, and real-time support systems",
    href: "/#trail-map",
  },
];

export const noteCoverBySlug: Record<string, string> = {
  "building-signal-breaker-step-by-step":
    "/proof-assets/systems/signal-breaker.webp",
  "procedural-motion-from-target-to-character":
    "/proof-assets/systems/mascot-engine.webp",
  "coding-agent-two-brains": "/proof-assets/notes/two-brains.webp",
  "watchdog-pattern-for-agents": "/proof-assets/notes/watchdog.webp",
  "portfolio-as-product": "/proof-assets/notes/portfolio-product.webp",
  "drag-drop-trees-and-state": "/proof-assets/systems/drag-tree.webp",
  "rbac-isnt-if-statements": "/proof-assets/evidence/proof-constellation.webp",
  "modernize-frontend-without-rewrite": "/proof-assets/evidence/knowbuild.webp",
  "playful-interfaces-performance": "/proof-assets/notes/performance.webp",
  "memory-for-learning-agent": "/proof-assets/notes/memory.webp",
  "hardware-prototypes-software-reliability":
    "/proof-assets/notes/hardware.webp",
  "debug-view-part-of-product": "/proof-assets/notes/debug.webp",
  "designing-for-changed-minds": "/proof-assets/notes/change.webp",
  "prototype-should-produce-evidence":
    "/proof-assets/evidence/build-trace.webp",
};
