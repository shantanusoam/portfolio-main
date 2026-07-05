import { MissionType } from '@/@types/mission.type';

import maan from '@/public/maan.png';
import vampire from '@/public/vampire.png';
import vampire2 from '@/public/vampire2.png';
import cryptocat_cover from '@/public/cryptocat.png';
import cryptocat_screenshot2 from '@/public/cryptocat2.png';
import cryptocat_screenshot1 from '@/public/cryptocat1.png';
import cryptocat_screenshot0 from '@/public/cryptocat0.jpg';
import serious_cover from '@/public/serious1.png';
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

import arnomis_cover from '@/public/arnomis0.png';
import arnomis_screenshot0 from '@/public/arnomis2.png';

import Bemo_cover from '@/public/BemoCover.png';
import Bemo_screenshot0 from '@/public/Bemo.png';

export const projects: MissionType[] = [

  {
    id: 'dnd-dynamic-tree',
    title: 'dnd-dynamic-tree',
    metadata: ['NPM Library'],
    cover_image: DndCover,
    screenshots: [DndCover, Dndscreenshot],
    description:
      'dnd NPM Library for nth level D&D with Custom trigger, Custom drag, auto-positioning',
    url: '/projects/dnd-dynamic-tree',
    features: [
      'Custom trigger element',
      'Custom drag Element.',
      'Multi nth level submenu support',
      'Automatic State update and Postion generation',
      'Auto positioning of each dnd-item',
      'Enhanced user interactions with auto-positioning for each DnD item, utilizing comprehensive DnD-kit helpers.',
    ],
    skills: {
      Frontend: ['Storybook', 'React'],
      Bundler: ['Webpack', 'Vite', 'babel', 'tsconfig', 'rollup'],
    },
    liveLink: 'https://www.npmjs.com/package/dnd-dynamic-tree',
    codeLink: 'https://github.com/shantanusoam/dnd-dynamic-tree',
    class: 'NPM Package Architect',
    specialMoves: [
      'Custom trigger + custom drag elements',
      'Multi nth-level submenu support',
      'Automatic state and position generation',
    ],
    impact: [
      'Published and installable via npm for any React project',
      'Removes hand-rolled boilerplate for nth-level drag-and-drop menus',
    ],
  },
  {
    id: 'maan',
    title: 'MAAN',
    metadata: ['Utility'],
    cover_image: maan,
    screenshots: [maan, maan],
    description:
      'A Journal Entry App With Integrated AI - and a Freind (Themed Hello Kitty 😸)',
    url: '/projects/maan',
    features: [
      'The application allows users to log in and manage journal entries.',
      'The entries are analyzed and given an AI-generated sentiment value, summary, and color.',
      'U can also ask and search from whole entry arabatereley while asking casually using LLM',
      'Get Graph Based results of user sentimental score throughout whole month',
      'End-End Encryption With Encrypted notes and in app storage',
    ],
    skills: {
      Backend: ['NestJS', 'TypeScript', 'Prisma', 'Longchain', 'PlanetScale'],
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
    cover_image: cryptocat_cover,
    screenshots: [
      cryptocat_screenshot0,
      cryptocat_screenshot1,
      cryptocat_screenshot2,
    ],
    url: '/projects/cryptocat',
    description: 'NFT Marketplace for sellings cat like.',
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
    cover_image: serious_cover,
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
    codeLink: 'https://github.com/shantanusoam/CryptoCat/tree/master',
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
      'The application allows users to Search diffrent Movies, stars, category and much more.',
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
    cover_image: arnomis_cover,
    screenshots: [arnomis_screenshot0],
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
    cover_image: Bemo_cover,
    screenshots: [Bemo_cover, Bemo_screenshot0],
    description:
      'A task Managment App to manage projects that i been working on',
    metadata: ['Utility'],
    features: [
      'A task Managment App to manage projects and task in those project while tracking progress of each project',
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
      'A performance and security overhaul of a healthcare insurer\'s core systems — legacy MongoDB clusters, agent-portal authentication, and deployment infrastructure — engaged via Cognizant/Shephertz.',
    url: '/projects/niva-bupa',
    features: [
      'Cleaned obsolete build artifacts, added strategic indexes, and scheduled nightly housekeeping jobs on legacy MongoDB clusters.',
      'Implemented SSO and two-factor authentication with IP whitelisting and 45-day password rotation.',
      'Led a vulnerability audit patching XSS and CSRF vectors in agent portals, passing external penetration tests on the first run.',
      'Containerized a monolithic React codebase with Docker, orchestrated via Kubernetes and Nginx ingress, enabling blue-green deployments.',
    ],
    skills: {
      Backend: ['MongoDB', 'Docker', 'Kubernetes', 'Nginx'],
      Security: ['SSO', '2FA', 'XSS/CSRF remediation', 'Penetration testing'],
    },
    liveLink: 'https://www.nivabupa.com',
    codeLink: 'https://www.nivabupa.com',
    class: 'Performance + Security Engineer',
    specialMoves: [
      'MongoDB indexing & nightly housekeeping',
      'SSO + 2FA + IP whitelisting',
      'Blue-green deployments via Docker/Kubernetes',
    ],
    impact: [
      'Reduced query latency by over 30% during peak policy-lookup traffic',
      'Resolved 15+ critical vulnerabilities and achieved 100% healthcare data-protection compliance',
      'Cut deployment rollback time from 20 minutes to under 5 minutes',
    ],
  },
  // Real case study — confidential B2B SaaS platform, no public screenshot.
  {
    id: 'knowbuild',
    title: 'Knowbuild',
    metadata: ['B2B SaaS', 'CRM/ERP'],
    cover_image: null,
    screenshots: [],
    description:
      'Brownfield modernization of a legacy CRM/ERP into a multi-tenant SaaS operating system for B2B SMEs, rebuilt from Bootstrap/SCSS/Axios into React + TypeScript + Tailwind + shadcn/ui with minimal business disruption.',
    url: '/projects/knowbuild',
    features: [
      'Multi-tenant architecture with subdomain-based isolation (company.app.com) and secure tenant context resolution.',
      'Custom RBAC PermissionEngine with resource-level rules, inheritance, and dynamic checks integrated into routing guards.',
      'Re-architected state management to TanStack Query (server state) + Redux Toolkit (UI state).',
      'Virtualization (@tanstack/react-virtual) for tables with 10k+ rows, keeping scrolling smooth on low-end devices.',
      'CI/CD automation via atomic bash + rsync pipelines across local/staging/prod wildcard-subdomain environments.',
    ],
    skills: {
      Frontend: ['React', 'TypeScript', 'Tailwind', 'shadcn/ui', 'TanStack Query', 'Redux Toolkit', 'Vite'],
      Architecture: ['Multi-tenant isolation', 'RBAC'],
    },
    liveLink: 'https://www.knowbuild.com',
    codeLink: 'https://www.knowbuild.com',
    class: 'Systems Architect',
    specialMoves: [
      'Multi-tenant subdomain isolation',
      'Custom RBAC PermissionEngine',
      'TanStack Query + RTK re-architecture',
    ],
    impact: [
      '~40% fewer redundant API calls, no more cross-tab state inconsistency',
      '10k+ row tables stay smooth on low-end devices',
    ],
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
  // destination and are left as '#'.
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
    liveLink: '#',
    codeLink: '#',
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
    liveLink: '#',
    codeLink: '#',
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
