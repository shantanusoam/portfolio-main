import { MissionType } from '@/@types/mission.type';

import maan from '@/public/maan.png';
import vampire from '@/public/vampire.png';
import vampire2 from '@/public/vampire2.png';
import cryptoCatCover from '@/public/cryptocat.png';
import cryptoCatScreenshot2 from '@/public/cryptocat2.png';
import cryptoCatScreenshot1 from '@/public/cryptocat1.png';
import cryptoCatScreenshot0 from '@/public/cryptocat0.jpg';
import SeriousScreenshot7 from '@/public/serious0.png';

import SeriousScreenshot0 from '@/public/serious1.png';
import SeriousScreenshot1 from '@/public/serious2.png';
import SeriousScreenshot2 from '@/public/serious3.png';
import SeriousScreenshot3 from '@/public/serious4.png';
import SeriousScreenshot5 from '@/public/serious5.png';
import SeriousScreenshot6 from '@/public/serious6.png';
import SeriousScreenshot4 from '@/public/serious7.png';
import DndCover from '@/public/dnd-kit-folder.png';
import Dndscreenshot from '@/public/dnd-drag.png';

import ArnomisCover from '@/public/arnomis0.png';
import ArnomisScreenshot0 from '@/public/arnomis2.png';

import BemoCover from '@/public/BemoCover.png';
import BemoScreenshot0 from '@/public/Bemo.png';

export const projects: MissionType[] = [

  {
    id: 'dnd-dynamic-tree',
    title: 'dnd-dynamic-tree',
    metadata: ['NPM Library'],
    cover_image: DndCover,
    screenshots: [DndCover, Dndscreenshot],
    description:
      'An installable nested drag-and-drop tree package for React, built around semantic moves instead of visual array indexes.',
    url: '/projects/dnd-dynamic-tree',
    features: [
      'Custom trigger and custom drag surfaces without forcing a specific tree renderer.',
      'Nth-level nesting where identity, ancestry, and sibling order stay separate.',
      'Projected drag state for previewing a destination before committing canonical state.',
      'Semantic move format: node, parent, and sibling position instead of raw array splices.',
      'Keyboard-style move commands can reuse the same state model as pointer dragging.',
      'Minimal install path for React teams that already own their stores and rendering.',
    ],
    skills: {
      Frontend: ['Storybook', 'React'],
      Bundler: ['Webpack', 'Vite', 'babel', 'tsconfig', 'rollup'],
    },
    liveLink: 'https://www.npmjs.com/package/dnd-dynamic-tree',
    codeLink: 'https://github.com/shantanusoam/dnd-dynamic-tree',
    class: 'NPM Package Architect',
    specialMoves: [
      'Semantic move model: node + parent + sibling position',
      'Projection layer separate from committed tree state',
      'Custom trigger + custom drag elements',
    ],
    impact: [
      'Published and installable via npm for any React project',
      'Removes hand-rolled boilerplate for nth-level drag-and-drop menus',
      'Turns nested DnD from an index-shuffling problem into a reusable interaction model',
    ],
    caseStudy: {
      headline: 'Why Nested Drag-and-Drop Is a State-Modelling Problem',
      context:
        'The package started from a familiar UI need: let people reorganize arbitrarily deep menu and folder trees without writing a bespoke drag layer for every product. The work mattered because nested builders fail quietly when visual order is mistaken for structural truth.',
      ownership:
        'Solo open-source project. I controlled the interaction model, package interface, examples, documentation, and release shape.',
      constraints: [
        'Unknown tree depth and unknown consumer rendering strategy.',
        'Consumers needed custom drag handles and custom item markup.',
        'The package could not own application state, routing, or persistence.',
        'Keyboard and assistive-technology behavior needed a model that could be described without pointer coordinates.',
      ],
      failedApproach:
        'The rejected approach was index-based: flatten the visible tree, splice the active item into a new position, then infer the parent from indentation. It worked in shallow demos and failed as soon as a parent crossed branches, because stale indexes looked valid while ancestry had already changed.',
      engineeringDecisions: [
        'Represent a drop as a semantic move: active node, destination parent, and before/after sibling position.',
        'Keep projected drag state temporary so cancellation does not mutate the canonical tree.',
        'Let consumers own the rendered item while the package owns the move calculation.',
        'Expose a small installable interface instead of an application-specific state manager.',
      ],
      architecture: {
        title: 'Semantic move flow',
        description:
          'Pointer or keyboard intent produces a projected destination. Only the final command crosses the package interface: move this node under this parent before or after this sibling.',
        nodes: [
          'User intent',
          'Projected destination',
          'Semantic move',
          'Tree reducer',
          'Consumer render',
        ],
      },
      outcome: [
        'Published as a public npm package and GitHub repository.',
        'Supports nth-level nesting with custom trigger and drag surfaces.',
        'Gives consumers a reusable state model for menus, folders, and nested builders.',
      ],
      measurement: [
        'Public availability is verifiable through npm and GitHub.',
        'The embedded demo exercises the same node/parent/sibling-position vocabulary used by the case study.',
        'Adoption metrics are not claimed publicly because package usage telemetry is not under my control.',
      ],
      tradeoffs: [
        'The semantic model is safer than index splicing, but consumers must understand node identity and parent relationships.',
        'Keeping store ownership with the consumer improves adoption, but it means the package cannot optimize every rendering strategy.',
        'Projection makes cancellation cleaner, but it adds one temporary state layer to reason about.',
      ],
      reflection:
        'If rebuilding it today, I would start with keyboard behavior and screen-reader announcements first, then make pointer dragging another adapter over the same move interface.',
      artifact: 'dynamic-tree-demo',
    },
  },
  {
    id: 'maan',
    title: 'MAAN',
    metadata: ['Utility'],
    cover_image: maan,
    screenshots: [maan, maan],
    description:
      'An AI-assisted journal with an expressive companion and a playful Hello Kitty theme.',
    url: '/projects/maan',
    features: [
      'The application allows users to log in and manage journal entries.',
      'The entries are analyzed and given an AI-generated sentiment value, summary, and color.',
      'Conversational search across the full journal history using an LLM.',
      'Get Graph Based results of user sentimental score throughout whole month',
      'End-End Encryption With Encrypted notes and in app storage',
    ],
    skills: {
      Backend: ['NestJS', 'TypeScript', 'Prisma', 'LangChain', 'PlanetScale'],
      Frontend: ['NextJS', 'Tailwind CSS'],
      Others: ['Open-AI'],
    },
    liveLink: 'https://maan-ten.vercel.app/',
    codeLink: 'https://github.com/shantanusoam/maan',
    class: 'AI-Augmented Full-stack Engineer',
    specialMoves: [
      'LLM-generated sentiment, summary, and mood color per entry',
      'Conversational search across an entire journal history',
      'End-to-end encrypted notes and in-app storage',
    ],
    impact: [
      'Encrypted storage protects genuinely sensitive personal data',
      'Sentiment trends visualized across a full month at a glance',
    ],
  },

  {
    id: 'cryptocat',
    title: 'Crypto Cat',
    metadata: ['NFT Marketplace'],
    cover_image: cryptoCatCover,
    screenshots: [
      cryptoCatScreenshot0,
      cryptoCatScreenshot1,
      cryptoCatScreenshot2,
    ],
    url: '/projects/cryptocat',
    description: 'A cat-themed NFT marketplace built as a self-directed Web3 experiment.',
    features: [
      'No libraries used. No gimmicks. Just plain old HTML, CSS and JS.',
      'Amazing sprite animations.',
    ],
    problem: 'Challenged myself to make a Crypto app during boom.',
    solution: 'Achieved this by using Web3 blockchain Solidity',
    skills: { Frontend: ['Web3', 'blockchain ', 'Next.js', 'Solidity'] },
    liveLink: 'https://fvampire.netlify.app/',
    codeLink: 'https://github.com/shantanusoam/CryptoCat/tree/master',
    class: 'Web3 Systems Engineer',
    specialMoves: [
      'Solidity smart contracts for an NFT marketplace',
      'Hand-built sprite animation with zero UI frameworks',
    ],
    impact: [
      'Shipped as a self-directed challenge during peak NFT-market volatility',
      'No dependency on any frontend library — plain HTML/CSS/JS at the core',
    ],
  },
  {
    id: 'serious',
    title: 'Seriousblack',
    url: '/projects/serious',
    cover_image: SeriousScreenshot0,
    screenshots: [
      SeriousScreenshot0,
      SeriousScreenshot7,
      SeriousScreenshot1,
      SeriousScreenshot2,
      SeriousScreenshot3,
      SeriousScreenshot4,
      SeriousScreenshot5,
      SeriousScreenshot6,
    ],
    description: 'A modern StackOverflow clone.',
    metadata: ['Social'],
    features: [
      'A recommendation system for posts',
      'Badge & Reputation System',
      ' Views and Voting Mechanism',
      ' Filter and Pagination for almost all pages',
      'Global database data-fetching',
      ' AI generated answers to questions',
    ],
    skills: {
      Backend: ['Nextjs', 'OPEN-Ai', 'Socket.IO'],
      Frontend: ['Nextjs', 'Redux'],
    },
    liveLink: 'https://dev-overflow-lilac.vercel.app/',
    codeLink: 'https://github.com/shantanusoam/serious-black',
    sourceAvailability: 'private',
    class: 'Social Platform Engineer',
    specialMoves: [
      'Post recommendation engine',
      'Badge and reputation system with voting mechanics',
      'AI-generated answers layered onto real Q&A threads',
    ],
    impact: [
      'Filtering and pagination across nearly every page in the app',
      'Real-time-feeling social platform built solo, StackOverflow-scale features',
    ],
  },
  {
    id: 'vampire',
    title: 'Vampire',
    metadata: ['Entertainment', 'Utility'],
    cover_image: vampire,
    screenshots: [vampire2],
    description: 'Filmpire a Movie recommending Website',
    url: '/projects/vampire',
    features: [
      'Search and discover movies, actors, categories, and related recommendations.',
    ],
    skills: {
      Frontend: ['Reactjs', ' Redux,', ' Material UI', 'Alan AI'],
      Others: ['Open-AI'],
    },
    liveLink: 'https://fvampire.netlify.app/',
    codeLink: 'https://github.com/shantanusoam/Vampire',
    class: 'Frontend Integration Engineer',
    specialMoves: [
      'Voice-driven search via Alan AI',
      'Multi-criteria discovery across movies, stars, and categories',
    ],
    impact: [
      'Voice interaction layered on top of a standard search/filter flow',
    ],
  },
  {
    id: 'arnomis',
    title: 'arnomis',
    url: '/projects/arnomis',
    cover_image: ArnomisCover,
    screenshots: [ArnomisScreenshot0],
    description:
      'arnomis project, a comprehensive solution for tracking product prices on Amazon.',
    metadata: ['Utility'],
    features: [
      'This project is designed to scrape product details from Amazon, store the data in a MongoDB database, and send email notifications to users when there are changes in the product details. The project includes a web application with a user-friendly interface that allows users to search for products, view product details, and subscribe to product updates.',
    ],
    skills: {
      Backend: ['Mongoose', 'Nodemailer'],
      Frontend: ['Next', 'Tailwind ', 'TypeScript'],
    },
    liveLink: 'https://github.com/shantanusoam/arnomis',
    codeLink: 'https://github.com/shantanusoam/arnomis',
    class: 'Automation & Data Pipeline Engineer',
    specialMoves: [
      'Amazon product scraping pipeline',
      'MongoDB-backed change tracking',
      'Automated email notifications on price changes',
    ],
    impact: [
      'Fully automated scrape-to-notify pipeline, no manual monitoring required',
    ],
  },
  {
    id: 'BEMO',
    title: 'BEMO',
    url: '/projects/bemo',
    cover_image: BemoCover,
    screenshots: [BemoCover, BemoScreenshot0],
    description:
      'A project and task management app for organizing ongoing work.',
    metadata: ['Utility'],
    features: [
      'Manage projects and nested tasks while tracking progress across each project.',
    ],
    skills: {
      Backend: ['prisma', 'Next'],
      Frontend: ['Next', 'Tailwind ', 'TypeScript'],
    },
    liveLink: 'https://github.com/shantanusoam/BeMO--TaskManager--',
    codeLink: 'https://github.com/shantanusoam/BeMO--TaskManager--',
    class: 'Product Engineer',
    specialMoves: [
      'Multi-project task tracking',
      'Per-project progress tracking',
    ],
    impact: [
      'Built to manage the developer\'s own real, ongoing project workload',
    ],
  },

  // Real case study — no public screenshot exists (confidential enterprise
  // healthcare system), so cover_image stays null and renders the
  // "no public screenshot" fallback rather than a placeholder state.
  {
    id: 'niva-bupa',
    title: 'Niva Bupa Health Insurance',
    metadata: ['Healthcare', 'Performance & Security'],
    cover_image: null,
    screenshots: [],
    description:
      'A risk-reduction and performance pass on a live healthcare insurance platform: database latency, portal security, and safer deployment recovery, delivered through a client engagement via Cognizant/Shephertz.',
    url: '/projects/niva-bupa',
    features: [
      'Sanitized query-plan work: removed obsolete build artifacts, added strategic MongoDB indexes, and scheduled nightly housekeeping on legacy clusters.',
      'Security control matrix covering SSO, two-factor authentication, IP whitelisting, 45-day password rotation, and portal remediation.',
      'Vulnerability audit and fixes for XSS and CSRF vectors in agent portals, followed by external penetration-test validation.',
      'Blue-green deployment path with Docker, Kubernetes, and Nginx ingress for safer promotion and rollback.',
      'Rollback timeline reduced from operator-heavy manual steps to a rehearsed sub-five-minute recovery path.',
    ],
    skills: {
      Backend: ['MongoDB', 'Docker', 'Kubernetes', 'Nginx'],
      Security: ['SSO', '2FA', 'XSS/CSRF remediation', 'Penetration testing'],
    },
    liveLink: 'https://www.nivabupa.com',
    codeLink: 'https://www.nivabupa.com',
    sourceAvailability: 'client',
    class: 'Performance + Security Engineer',
    specialMoves: [
      'Sanitized MongoDB query-plan repair',
      'Security control matrix across identity and portal risks',
      'Blue-green deployment and rollback timeline',
    ],
    impact: [
      'Reduced query latency by over 30% during peak policy-lookup traffic',
      'Resolved 15+ critical vulnerabilities and achieved 100% healthcare data-protection compliance',
      'Cut deployment rollback time from 20 minutes to under 5 minutes',
    ],
    caseStudy: {
      headline: 'Reducing Risk in a Live Healthcare Platform',
      context:
        'The product supported healthcare-insurance workflows where slow policy lookup and risky releases had direct operational cost. The work mattered because reliability, security, and release confidence were part of the customer experience, not back-office concerns.',
      ownership:
        'Senior Software Engineer on a client delivery team via Cognizant/Shephertz. I owned focused performance and security remediation tasks, containerization support, and rollback-flow improvements within the larger client-governed platform.',
      constraints: [
        'Live healthcare environment with confidentiality and data-protection requirements.',
        'Legacy MongoDB and portal code that could not pause for a rewrite.',
        'External penetration testing created a hard validation bar.',
        'Release changes needed rollback safety because traffic could not be interrupted casually.',
      ],
      failedApproach:
        'The deliberately rejected path was chasing individual slow screens without reading the query shape. That would have made isolated pages feel better while leaving peak policy-lookup traffic exposed to the same collection scans and cleanup debt.',
      engineeringDecisions: [
        'Used query-plan evidence to choose targeted indexes rather than broad schema churn.',
        'Paired portal remediation with a visible security control matrix so fixes could be audited.',
        'Introduced Docker/Kubernetes/Nginx release mechanics as one rollback interface instead of a pile of manual commands.',
        'Kept diagrams and public examples sanitized because production traffic and vulnerability details are client-confidential.',
      ],
      architecture: {
        title: 'Risk-reduction release lane',
        description:
          'Policy lookup performance, identity controls, portal remediation, and blue-green ingress were treated as one operational risk surface.',
        nodes: [
          'Policy lookup traffic',
          'Sanitized query plan',
          'Security controls',
          'Container image',
          'Blue-green ingress',
          'Rollback lane',
        ],
      },
      outcome: [
        'Peak policy-lookup query latency reduced by more than 30%.',
        '15+ critical vulnerabilities remediated before external validation.',
        'Rollback time reduced from roughly 20 minutes to under 5 minutes.',
      ],
      measurement: [
        'Latency was measured before and after index/cleanup changes on representative policy-lookup traffic; raw client data is not public.',
        'Security count comes from the remediation list closed during the audit; exploit detail is withheld.',
        'Rollback timing compares the previous manual recovery path with the rehearsed blue-green path.',
      ],
      tradeoffs: [
        'Targeted indexing reduced latency quickly, but increased the need to document index ownership and cleanup jobs.',
        'Stronger identity controls improved risk posture, but added operational support paths for lockouts and access changes.',
        'Blue-green release mechanics made rollback safer, but introduced container and ingress complexity for the delivery team.',
      ],
      reflection:
        'If rebuilding it today, I would put performance budgets, query-plan review, and rollback rehearsal into the delivery checklist from the start instead of treating them as a late hardening phase.',
      artifact: 'niva-risk-release',
    },
  },
  // Real case study — confidential B2B SaaS platform, no public screenshot.
  {
    id: 'knowbuild',
    title: 'Knowbuild',
    metadata: ['B2B SaaS', 'CRM/ERP'],
    cover_image: null,
    screenshots: [],
    description:
      'Brownfield modernization of a legacy CRM/ERP into a multi-tenant SaaS operating system for B2B SMEs, moving frontend architecture, permissions, performance, and deployment systems forward without stopping day-to-day business.',
    url: '/projects/knowbuild',
    features: [
      'Tenant-resolution flow with subdomain-based isolation (company.app.com), explicit tenant context, and guarded cross-tenant assumptions.',
      'RBAC decision flow with resource-level rules, inheritance, and dynamic checks integrated into routing guards.',
      'API-request comparison work that reduced redundant server calls and clarified server-state ownership.',
      'Re-architected state management to TanStack Query (server state) + Redux Toolkit (UI state).',
      'Virtualized 10k-row operational tables, keeping scroll and selection responsive on low-end devices.',
      'CI/CD automation via atomic bash + rsync pipelines across local/staging/prod wildcard-subdomain environments.',
    ],
    skills: {
      Frontend: ['React', 'TypeScript', 'Tailwind', 'shadcn/ui', 'TanStack Query', 'Redux Toolkit', 'Vite'],
      Architecture: ['Multi-tenant isolation', 'RBAC'],
    },
    liveLink: 'https://www.knowbuild.com',
    codeLink: 'https://www.knowbuild.com',
    sourceAvailability: 'client',
    class: 'Systems Architect',
    specialMoves: [
      'Tenant-resolution diagram and permission decision flow',
      'TanStack Query + Redux Toolkit ownership split',
      'Virtualized 10k-row operational surfaces',
    ],
    impact: [
      '~40% fewer redundant API calls, no more cross-tab state inconsistency',
      '10k+ row tables stay smooth on low-end devices',
      'Modernization shipped incrementally while the business kept using the product',
    ],
    caseStudy: {
      headline: 'Modernizing a Multi-Tenant CRM/ERP Without Stopping the Business',
      context:
        'Knowbuild is a multi-tenant CRM/ERP surface for B2B teams. The work mattered because every architecture decision had to preserve active business workflows while making future change safer.',
      ownership:
        'Staff Engineer / Senior Software Developer. I owned frontend architecture decisions, tenant-aware UI flows, permission integration, state-management migration, table performance work, and deployment automation in collaboration with product and backend stakeholders.',
      constraints: [
        'Brownfield product with existing users and legacy Bootstrap/SCSS/Axios patterns.',
        'Multi-tenant isolation and permission mistakes could expose the wrong workflow or data.',
        'Operational tables needed to handle 10k+ rows on modest hardware.',
        'The migration had to land incrementally rather than through a full rewrite freeze.',
      ],
      failedApproach:
        'The rejected path was a screen-by-screen UI rewrite that left state ownership vague. It made individual pages look newer but did not solve cross-tab drift, redundant requests, tenant assumptions, or permission debugging.',
      engineeringDecisions: [
        'Put tenant resolution behind an explicit flow before feature code asks for tenant-scoped data.',
        'Split server state into TanStack Query and local UI state into Redux Toolkit so cache invalidation and view state stopped fighting.',
        'Moved permission checks into a reusable decision path with route guards and resource rules instead of scattered conditional rendering.',
        'Virtualized dense tables and treated low-end hardware as a real target, not an edge case.',
        'Kept deployment automation boring and repeatable through atomic shell/rsync flows across local, staging, and production environments.',
      ],
      architecture: {
        title: 'Tenant and permission request path',
        description:
          'A request resolves tenant context first, runs route/resource permission checks, then lets server-state modules fetch and cache the scoped result before a virtualized view renders it.',
        nodes: [
          'Subdomain',
          'Tenant context',
          'Route guard',
          'Resource rule',
          'Query cache',
          'Virtualized view',
        ],
      },
      outcome: [
        '~40% fewer redundant API calls in representative workflows after server-state ownership changes.',
        '10k+ row tables stayed usable on low-end devices through virtualization.',
        'Multi-tenant and permission behavior became easier to debug because the decision path was explicit.',
      ],
      measurement: [
        'API-request reduction was measured by comparing representative workflow request counts before and after TanStack Query ownership changes.',
        '10k-row behavior was tested against representative operational tables with sanitized data.',
        'Tenant and permission evidence is described structurally; customer-specific identifiers and workflows are withheld.',
      ],
      tradeoffs: [
        'TanStack Query improved server-state locality, but required sharper invalidation discipline.',
        'A central permission decision flow made debugging easier, but mistakes in its interface could affect many routes.',
        'Virtualization kept large tables responsive, but complicated row measurement, keyboard focus, and sticky controls.',
      ],
      reflection:
        'If rebuilding it today, I would define the tenant-resolution and permission interfaces even earlier, then migrate screens behind those seams one workflow at a time.',
      artifact: 'knowbuild-tenant-flow',
    },
  },
  // Real case study — the Amala Earth e-commerce/CMS platform built during
  // the Mobikasa engagement (constants/experiences.ts). No public repo.
  {
    id: 'amala-earth',
    title: 'Amala Earth',
    metadata: ['E-commerce', 'CMS'],
    cover_image: null,
    screenshots: [],
    description:
      'A comprehensive CMS and e-commerce platform replicating Shopify\'s functionality, built with a Micro Frontend Architecture — including a nested drag-and-drop variant builder and an application-wide website builder.',
    url: '/projects/amala-earth',
    features: [
      'N-nested drag-and-drop variant builder with real-time editing/deletion features.',
      'Application-wide website builder for dynamic layouts via drag-and-drop nested elements.',
      'Reusable component library (ShadCN, Tailwind, CVA, Framer Motion) — dynamic tables, comboboxes, tooltips, trees, timelines, multi-image selectors.',
      'State management simplified via RTK and RTK Query across the application.',
    ],
    skills: {
      Frontend: ['Next.js', 'Redux Toolkit', 'ShadCN', 'Tailwind CVA', 'Framer Motion'],
      Architecture: ['Micro Frontend'],
    },
    liveLink: 'https://amala.earth',
    codeLink: 'https://amala.earth',
    sourceAvailability: 'client',
    class: 'E-commerce Platform Engineer',
    specialMoves: [
      'Nested drag-and-drop variant builder',
      'App-wide drag-and-drop website builder',
      'Reusable component library w/ custom renderer',
    ],
    impact: [
      '25% reduction in code complexity, 10% productivity increase via RTK/RTK Query',
      '10% productivity boost and 15% less code duplication from the component library',
    ],
  },
  // Real case study — bundles selected freelance/contract work rather than
  // one single deployed product, so liveLink/codeLink have no single canonical
  // destination and are intentionally omitted.
  {
    id: 'freelance-engagements',
    title: 'Freelance & Contract Engagements',
    metadata: ['Freelance', 'React Native + Motion'],
    cover_image: null,
    screenshots: [],
    description:
      'Selected freelance and contract work spanning an AI-powered React Native app and design-forward, heavily animated web platforms built for clients.',
    url: '/projects/freelance-engagements',
    features: [
      'AI Recipe Creation & Learning app (React Native/Expo): re-architected for maintainability, built an atomic component library, set up Storybook with Chromatic, resolved native iOS/Android build issues, integrated AI-powered recipe and learning features.',
      'Next.js interactive showcase platform (Awwwards-style): reusable motion primitives for scroll storytelling and micro-interactions, Core Web Vitals optimized via code splitting, lazy loading, and animation throttling.',
      'Animated marketing site built with React, Next.js, GSAP, and Framer Motion — scroll interactions and storytelling that drove new business inquiries.',
    ],
    skills: {
      Mobile: ['React Native', 'Expo'],
      Frontend: ['Next.js', 'GSAP', 'Framer Motion'],
      Tooling: ['Storybook', 'Chromatic'],
    },
    sourceAvailability: 'client',
    class: 'Full-stack Engineer (React Native / Creative Web)',
    specialMoves: [
      'AI-powered React Native app rearchitecture',
      'Reusable scroll-storytelling motion primitives',
      'Core Web Vitals optimization under animation load',
    ],
    impact: [
      'Shipped versioned native releases after resolving iOS/Android build issues',
      'Animated showcase work directly drove new business inquiries',
    ],
  },
  // Real case study — the electronics/IoT hobby work, which is also what
  // proves the Arduino/Raspberry Pi skills lit in the Maker Combo and backs
  // the Maker Lab's telemetry-experiment listing.
  {
    id: 'hardware-prototypes',
    title: 'AI/ML Hardware Prototypes',
    metadata: ['Robotics', 'Edge AI'],
    cover_image: null,
    screenshots: [],
    description:
      'Sensor-driven robotic prototypes built on Arduino and Raspberry Pi, pairing real-time control logic with edge AI — weighing on-device inference against cloud inference for latency, reliability, and system-level tradeoffs.',
    url: '/projects/hardware-prototypes',
    features: [
      'Sensor-driven prototypes integrating ultrasonic, motion, temperature, and environmental sensors with real-time control logic (Python/JS) and telemetry.',
      'Autonomous decision-making pipelines built on top of live sensor/actuator feedback loops.',
      'Explored edge-AI patterns combining on-device processing with cloud inference to optimize latency, responsiveness, and reliability.',
    ],
    skills: {
      Hardware: ['Arduino', 'Raspberry Pi'],
      Software: ['Python', 'JavaScript', 'Edge AI'],
    },
    sourceAvailability: 'private',
    class: 'Robotics & Edge AI Engineer',
    specialMoves: [
      'Sensor-driven real-time control logic',
      'Autonomous decision-making from live telemetry',
      'On-device vs. cloud inference tradeoff tuning',
    ],
    impact: [
      'Working sensor-to-decision pipelines across ultrasonic, motion, and environmental sensors',
      'Direct hands-on grounding for the Maker Lab section of this very site',
    ],
  },
];
