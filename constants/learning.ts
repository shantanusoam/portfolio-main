import { LearningTrack, LogSeedEntry } from '@/@types/learning.type';

// Add the next track here when it actually starts — same shape, next
// checkpoint number. This page is built to hold more than one at a time;
// it just only has one real entry so far.
export const learningTracks: LearningTrack[] = [
  {
    id: 'harness-engineering',
    checkpoint: '01',
    status: 'now',
    title: 'Harness Engineering & Agent Orchestration',
    summary: 'Building the runtime that runs the agent — not the agent itself.',
    description:
      'A one-day systems workshop: durable execution, sandboxed tool calls, context hydration, routing and handoffs, supervision, and human-in-the-loop approval. The whole day builds one mini agent runtime — the harness is the protagonist, the agent is a deliberately boring crash-test dummy.',
    tags: ['durable execution', 'sandboxing', 'memory', 'orchestration', 'human-in-the-loop'],
    logTags: {
      durability: 'durability',
      sandboxing: 'sandboxing',
      memory: 'memory',
      orchestration: 'orchestration',
      hitl: 'human-in-the-loop',
      general: 'general',
    },
    links: [
      { label: 'DBOS docs', href: 'https://docs.dbos.dev' },
      { label: 'Cloudflare — Code Mode', href: 'https://blog.cloudflare.com/code-mode/' },
      { label: 'CodeAct / smolagents paper', href: 'https://huggingface.co/papers/2402.01030' },
    ],
    mapping: [
      { module: 'Durable execution', builtAs: 'DBOS (Postgres-backed)', productionAnalog: 'Temporal, Inngest' },
      { module: 'Sandboxed tool / code execution', builtAs: 'isolated run primitive', productionAnalog: 'e2b, Firecracker' },
      { module: 'Memory & context hydration', builtAs: 'ContextHydrator + summarizer', productionAnalog: '—' },
      { module: 'Routing, handoffs & supervision', builtAs: 'Router / Supervisor', productionAnalog: 'LangGraph, Mastra' },
      { module: 'Human-in-the-loop approval', builtAs: 'DBOS.recv / DBOS.send', productionAnalog: '—' },
    ],
  },
];

export const logSeed: LogSeedEntry[] = [
  {
    trackId: 'harness-engineering',
    tag: 'durability',
    text: "If you can't replay it, resume it, and retry it safely, it isn't production-grade. Durability isn't “save the messages” — it's knowing which side effects already happened so a crash never repeats a sendReply.",
  },
  {
    trackId: 'harness-engineering',
    tag: 'sandboxing',
    text: "The sandbox isn't a bolt-on safety feature — it's why Code Mode exists in the first place. Once the model can write its own orchestration code, that code needs somewhere to run that isn't the host process.",
  },
  {
    trackId: 'harness-engineering',
    tag: 'memory',
    text: 'Context is a runtime decision, not a chat log. History, state, and context are three different things — stop conflating "everything that happened" with "what the model sees this turn."',
  },
  {
    trackId: 'harness-engineering',
    tag: 'memory',
    text: 'Compact by token budget, not turn count. Modern models batch many tool calls into a single turn, so "turns" stopped being a useful proxy for context size a while ago.',
  },
  {
    trackId: 'harness-engineering',
    tag: 'orchestration',
    text: 'Handoff vs. sub-agent, finally clear: a handoff transfers control (triage → billing takes over). A sub-agent is called like a function — the parent keeps control and synthesizes the result.',
  },
  {
    trackId: 'harness-engineering',
    tag: 'orchestration',
    text: 'Before reaching for multi-agent anything: a single capable model with good tools is a generalist, and most "swarm" architectures are solving a problem that isn’t there yet.',
  },
  {
    trackId: 'harness-engineering',
    tag: 'hitl',
    text: 'A human pause has to be first-class, durable workflow state — not await askUser() holding a process open. Suspend on DBOS.recv(topic), resume on DBOS.send(), even days later, even after a restart.',
  },
  {
    trackId: 'harness-engineering',
    tag: 'general',
    text: 'The mantra that reframes everything: agent systems are workflow systems. The LLM decides the next semantic step; the harness owns execution.',
  },
];
