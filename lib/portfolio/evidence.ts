export type ProofMetric = {
  value: string;
  label: string;
  context: string;
  href: string;
};

export type BuildTraceStep = {
  label: string;
  title: string;
  detail: string;
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
  image: string;
  previewHref: string;
  sourceHref?: string;
  tech: string[];
  how: string[];
  accessibility: string[];
  performance: string[];
  usage: string;
};

export const proofMetrics: ProofMetric[] = [
  {
    value: "30%↓",
    label: "Query latency",
    context: "MongoDB indexing and housekeeping at Niva Bupa",
    href: "/projects/niva-bupa#impact",
  },
  {
    value: "15+",
    label: "Critical vulnerabilities resolved",
    context: "XSS/CSRF remediation and penetration testing",
    href: "/projects/niva-bupa#impact",
  },
  {
    value: "20→<5",
    label: "Minutes to rollback",
    context: "Blue-green deployment path across Docker and Kubernetes",
    href: "/projects/niva-bupa#impact",
  },
  {
    value: "10k+",
    label: "Rows kept fluid",
    context: "Virtualized operational tables on low-end devices",
    href: "/projects/knowbuild#impact",
  },
];

export const flagshipCaseStudies: FlagshipCaseStudy[] = [
  {
    id: "knowbuild",
    name: "Knowbuild",
    category: "B2B SaaS / CRM + ERP",
    summary:
      "Modernizing a legacy operating surface into a typed, multi-tenant system without stopping the business underneath it.",
    problem:
      "The product had dense operational data, cross-tab state drift, and a UI stack that made every safe change expensive.",
    constraints: [
      "Brownfield rollout with minimal disruption",
      "Strict tenant and permission isolation",
      "10k+ row operational tables on modest hardware",
    ],
    decisions: [
      "Separated server state into TanStack Query and local UI state into Redux Toolkit",
      "Built an explicit PermissionEngine and subdomain-resolved tenant context",
      "Virtualized rendering and added performance budgets to the Vite build",
    ],
    results: [
      "~40% fewer redundant API calls",
      "10k+ rows remain smooth on low-end devices",
      "Safer repeatable deployments across local, staging, and production",
    ],
    image: "/proof-assets/evidence/knowbuild.webp",
    systemImage: "/proof-assets/evidence/proof-constellation.webp",
    systemLayers: ["Tenant context", "Permission engine", "Query cache", "Virtualized view"],
    trace: [
      { label: "Problem", title: "State was everywhere", detail: "Server data and UI state behaved as one mutable surface." },
      { label: "Failed path", title: "Patch the symptoms", detail: "Local fixes reduced visible bugs but preserved the underlying coupling." },
      { label: "Decision", title: "Split by ownership", detail: "Each layer received a clear contract, cache, and failure boundary." },
      { label: "Shipped", title: "Incremental modernization", detail: "New modules could land without a dangerous all-at-once rewrite." },
      { label: "Lesson", title: "Brownfield speed comes from boundaries", detail: "The safest architecture is one the business can adopt in slices." },
    ],
    href: "/projects/knowbuild",
  },
  {
    id: "niva-bupa",
    name: "Niva Bupa",
    category: "Healthcare / Performance + Security",
    summary:
      "Hardening a live insurance platform while making database and deployment paths materially faster.",
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
    systemLayers: ["Indexed data", "Identity boundary", "Container image", "Blue-green ingress"],
    trace: [
      { label: "Problem", title: "Slow and risky", detail: "Performance and release safety were coupled during peak traffic." },
      { label: "Failed path", title: "Manual recovery", detail: "Rollback depended on a long, operator-heavy sequence." },
      { label: "Decision", title: "Build a safe second rail", detail: "Security, containers, and ingress became one release contract." },
      { label: "Shipped", title: "Measured hardening", detail: "The system passed external testing on its first run." },
      { label: "Lesson", title: "Resilience is product work", detail: "A faster fallback changes what teams are willing to ship." },
    ],
    href: "/projects/niva-bupa",
  },
  {
    id: "dnd-dynamic-tree",
    name: "dnd-dynamic-tree",
    category: "Open-source / Interaction infrastructure",
    summary:
      "Turning nested drag intent into a reusable package with stable tree contracts and composable triggers.",
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
    systemLayers: ["Pointer intent", "Projection", "Tree reducer", "Accessible announcement"],
    trace: [
      { label: "Problem", title: "Indices kept lying", detail: "Visual order was being mistaken for structural identity." },
      { label: "Failed path", title: "Splice and indent", detail: "The first model broke when parents crossed branches." },
      { label: "Decision", title: "Store intent", detail: "Moves became node, parent, and sibling relationships." },
      { label: "Shipped", title: "Package the contract", detail: "The result became a reusable npm library rather than a one-off widget." },
      { label: "Lesson", title: "Interaction needs a domain model", detail: "Coordinates are evidence, not the final state." },
    ],
    href: "/projects/dnd-dynamic-tree",
  },
];

export const systemsRegistry: SystemRegistryEntry[] = [
  {
    slug: "string-instrument",
    name: "String Instrument",
    status: "live",
    description: "A pointer and keyboard-playable instrument built from tension, displacement, and restrained audio feedback.",
    image: "/proof-assets/systems/string-instrument.webp",
    previewHref: "/#hero",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Canvas", "Web Audio", "Pointer Events"],
    how: ["Samples string displacement from pointer intent", "Maps tension to pitch and visual amplitude", "Returns each string with damped spring motion"],
    accessibility: ["Sound starts muted", "Keyboard controls remain available", "Reduced-motion mode removes decorative oscillation"],
    performance: ["Mutable frame data avoids React renders", "Audio nodes are created only after interaction", "Canvas scales to device density with a cap"],
    usage: "Open the homepage and drag across the strings.",
  },
  {
    slug: "procedural-mascot",
    name: "Procedural Mascot Engine",
    status: "live",
    description: "A canvas character that follows, wanders, reacts to page geometry, and exposes its own rig for debugging.",
    image: "/proof-assets/systems/mascot-engine.webp",
    previewHref: "/creature-lab",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Canvas 2D", "Constraints", "Second-order dynamics"],
    how: ["A target driver feeds damped body motion", "Appendage constraints resolve outside React", "DOM geometry is cached as world obstacles"],
    accessibility: ["Pointer is optional", "Hidden-tab simulation pauses", "Reduced-motion mode lowers movement and detail"],
    performance: ["One canvas instead of DOM joints", "No React frame-state", "Delta time is clamped after tab inactivity"],
    usage: "Visit Creature Lab and toggle the debug rig.",
  },
  {
    slug: "command-palette",
    name: "Signal Finder",
    status: "live",
    description: "A personal Ctrl/⌘ K index spanning pages, writing, references, screenings, questions, and systems.",
    image: "/proof-assets/systems/command-palette.webp",
    previewHref: "/?command=open",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["kbar", "Next Router", "Typed content index"],
    how: ["Normalizes content into one searchable model", "Weights top-level navigation above deep records", "Routes without a second navigation system"],
    accessibility: ["Full keyboard operation", "Visible focus and active result", "Semantic labels and platform-aware shortcut hint"],
    performance: ["The index is built once in the server layout", "No remote search round-trip", "Results are virtualized by the palette library"],
    usage: "Press Ctrl K (or ⌘ K) anywhere on the site.",
  },
  {
    slug: "combo-trail",
    name: "Combo Trail",
    status: "live",
    description: "A restrained game-feel layer that turns meaningful navigation into readable feedback rather than confetti.",
    image: "/proof-assets/systems/combo-trail.webp",
    previewHref: "/",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Framer Motion", "Event signals", "CSS"],
    how: ["Listens for intentional interaction events", "Accumulates a short-lived combo state", "Releases feedback through a bounded visual trail"],
    accessibility: ["Never blocks content", "Ignored by assistive technology", "Disabled under reduced motion"],
    performance: ["Short lifecycle", "No permanent DOM growth", "Transform and opacity only"],
    usage: "Explore the homepage and follow the interaction trail.",
  },
  {
    slug: "dynamic-tree",
    name: "Dynamic Tree",
    status: "documented",
    description: "The installable nested drag-and-drop system behind the flagship open-source case study.",
    image: "/proof-assets/systems/drag-tree.webp",
    previewHref: "/projects/dnd-dynamic-tree",
    sourceHref: "https://github.com/shantanusoam/dnd-dynamic-tree",
    tech: ["React", "dnd-kit", "Storybook"],
    how: ["Projects a destination during drag", "Commits one semantic move on drop", "Recalculates positions from stable identifiers"],
    accessibility: ["Custom triggers can remain semantic controls", "State model supports keyboard descriptions", "Focus ownership stays with the consumer"],
    performance: ["Projection is separated from canonical state", "Consumers can virtualize their own view", "Package avoids application-specific stores"],
    usage: "npm install dnd-dynamic-tree",
  },
  {
    slug: "signal-breaker",
    name: "Signal Breaker",
    status: "live",
    description: "The 404 recovery route as a compact brick-breaker with combos, chain reactions, powerups, waves, and sound.",
    image: "/proof-assets/systems/signal-breaker.webp",
    previewHref: "/dead-channel-demo",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Canvas 2D", "Web Audio", "Deterministic game loop"],
    how: ["A fixed world scales to any screen", "Brick types feed chain and reward systems", "Wave state controls difficulty without a hand-authored level file"],
    accessibility: ["Pointer, touch, A/D, and arrow input", "Sound is muted by default", "Visibility change automatically pauses play"],
    performance: ["Canvas keeps the brick field lightweight", "Particles are capped", "Frame delta is clamped"],
    usage: "Open any unknown route and start breaking the signal.",
  },
  {
    slug: "pattern-registry",
    name: "Pattern Registry",
    status: "prototype",
    description: "Reusable interaction patterns promoted from hidden experiments into documented evidence.",
    image: "/proof-assets/systems/pattern-registry.webp",
    previewHref: "/systems",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["Next.js", "Typed data", "Progressive enhancement"],
    how: ["Pairs every preview with an explanation", "Records access and performance choices beside implementation", "Keeps experimental code discoverable without crowding the homepage"],
    accessibility: ["Documentation works without the preview", "Each control has a text equivalent", "Motion is never required to understand a system"],
    performance: ["Registry pages are statically generated", "Images are optimized WebP assets", "Interactive previews remain on their original routes"],
    usage: "Browse /systems, then open a record for its engineering notes.",
  },
  {
    slug: "creature-rig",
    name: "Creature Rig",
    status: "prototype",
    description: "A debug-facing procedural-character surface for studying body targets, constraints, appendages, and gait decisions.",
    image: "/proof-assets/systems/creature-rig.webp",
    previewHref: "/octopod-lab",
    sourceHref: "https://github.com/shantanusoam/portfolio-main",
    tech: ["FABRIK", "Foot locking", "Canvas 2D"],
    how: ["Feet remain in world space until a threshold is crossed", "A gait planner limits simultaneous steps", "FABRIK resolves joints between body anchors and targets"],
    accessibility: ["Debug labels explain motion decisions", "Touch and pointer share one input path", "Reduced motion lowers cadence"],
    performance: ["All joints live in mutable runtime arrays", "Solver iterations are bounded", "Rendering only reads solved physics"],
    usage: "Open Octopod Lab and turn on debug mode.",
  },
];

export const experienceEvidence = [
  { company: "Knowbuild", role: "Staff Engineer / Senior Software Developer", period: "2025 — now", proof: "Multi-tenant platform, RBAC, 40% fewer redundant API calls, 10k+ row virtualization", href: "/projects/knowbuild" },
  { company: "Niva Bupa", role: "Senior Software Engineer", period: "2025", proof: "30% lower query latency, 15+ critical fixes, sub-five-minute rollback", href: "/projects/niva-bupa" },
  { company: "Mobikasa", role: "Senior Frontend Developer", period: "2023 — 2025", proof: "Micro-frontends, nested builders, RTK architecture, reusable component system", href: "/projects/amala-earth" },
  { company: "The Tarzan Way", role: "Full-stack Developer", period: "2023", proof: "Travel platform, PWA, maps, payments, and a Lighthouse score of 91", href: "/#trail-map" },
  { company: "KAL Group", role: "Full-stack Developer", period: "2021 — 2023", proof: "HRMS, ticketing, e-commerce, maps, CRM, and real-time support systems", href: "/#trail-map" },
];

export const noteCoverBySlug: Record<string, string> = {
  "coding-agent-two-brains": "/proof-assets/notes/two-brains.webp",
  "watchdog-pattern-for-agents": "/proof-assets/notes/watchdog.webp",
  "portfolio-as-product": "/proof-assets/notes/portfolio-product.webp",
  "drag-drop-trees-and-state": "/proof-assets/systems/drag-tree.webp",
  "playful-interfaces-performance": "/proof-assets/notes/performance.webp",
  "memory-for-learning-agent": "/proof-assets/notes/memory.webp",
  "hardware-prototypes-software-reliability": "/proof-assets/notes/hardware.webp",
  "debug-view-part-of-product": "/proof-assets/notes/debug.webp",
  "designing-for-changed-minds": "/proof-assets/notes/change.webp",
  "prototype-should-produce-evidence": "/proof-assets/evidence/build-trace.webp",
};
