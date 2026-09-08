import {
  archiveArticles,
  inspirationEntries,
  raqEntries,
  talkEntries,
} from "./data";
import { systemsRegistry } from "@/lib/portfolio/evidence";

export type CommandEntryKind =
  | "page"
  | "article"
  | "reference"
  | "screening"
  | "question"
  | "system";

export interface CommandEntry {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  keywords: string;
  section: string;
  kind: CommandEntryKind;
  action?: {
    type: "open-soundroom";
    view: "mini" | "room" | "local" | "queue" | "tune";
  };
}

const pageEntries: CommandEntry[] = [
  {
    id: "arcade-lost-signal",
    name: "Play Lost Signal",
    subtitle: "Space Impact · five sectors and eight hidden signals",
    href: "/arcade/space-impact",
    keywords: "space impact arcade game lost signal mobile ship shooter",
    section: "Systems Lab",
    kind: "system",
  },
  {
    id: "system-enter-gpu",
    name: "Enter GPU",
    subtitle:
      "GPU Anatomy · inspect the current, pressure, wake and light passes",
    href: "/gpu",
    keywords:
      "gpu webgpu vgpu anatomy microscope living ocean fluid shaders source maker lab",
    section: "Systems Lab",
    kind: "system",
  },
  {
    id: "soundroom-open",
    name: "Soundroom",
    subtitle: "Enter the hidden local listening room",
    href: "/",
    keywords: "music soundroom play something personal radio hidden player",
    section: "Soundroom",
    kind: "system",
    action: { type: "open-soundroom", view: "room" },
  },
  {
    id: "soundroom-local",
    name: "Open local record crate",
    subtitle: "Play files privately from this device",
    href: "/",
    keywords: "local library audio files mp3 m4a wav flac private",
    section: "Soundroom",
    kind: "system",
    action: { type: "open-soundroom", view: "local" },
  },
  {
    id: "soundroom-now-playing",
    name: "What am I listening to?",
    subtitle: "Reveal the mini player and current signal",
    href: "/",
    keywords: "now playing current song audio",
    section: "Soundroom",
    kind: "system",
    action: { type: "open-soundroom", view: "mini" },
  },
  {
    id: "soundroom-tune",
    name: "Tune the Soundroom",
    subtitle: "Strings, water, EQ and reactive intensity",
    href: "/",
    keywords: "visualizer strings water spectrum tune equalizer effects",
    section: "Soundroom",
    kind: "system",
    action: { type: "open-soundroom", view: "tune" },
  },
  {
    id: "page-home",
    name: "Portfolio home",
    subtitle: "Return to the main signal",
    href: "/",
    keywords: "home portfolio shantanu",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-proof",
    name: "Proof at a glance",
    subtitle: "Verified outcomes and the work behind them",
    href: "/#proof",
    keywords: "proof metrics outcomes impact",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-about",
    name: "About the studio",
    subtitle: "Approach, principles, and working style",
    href: "/#about",
    keywords: "about profile philosophy studio",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-experience",
    name: "Experience trail",
    subtitle: "A map of work and responsibilities",
    href: "/#trail-map",
    keywords: "experience work career trail",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-projects",
    name: "Project missions",
    subtitle: "The original interactive project selection",
    href: "/#mission-select",
    keywords: "projects work missions portfolio",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-case-studies",
    name: "Flagship case studies",
    subtitle: "Three systems with decisions and build traces",
    href: "/#case-studies",
    keywords: "projects work case studies",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-pattern-library",
    name: "Pattern Library",
    subtitle: "Skills demonstrated through working evidence",
    href: "/#pattern-library",
    keywords: "skills patterns evidence stack",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-signal-room",
    name: "Signal Room",
    subtitle: "Interactive copy and interface experiment",
    href: "/#signal-room",
    keywords: "signal room copy lab interactive",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-lab",
    name: "Systems Lab",
    subtitle: "Playable experiments with engineering notes",
    href: "/systems",
    keywords: "maker lab experiments hardware",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-learning",
    name: "Learning Log",
    subtitle: "Tracks, checkpoints, and hands-on systems courses",
    href: "/learning",
    keywords:
      "learning log tracks guides procedural animation web audio guitar course",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-learning-strings",
    name: "Browser Guitar & Web Audio Course",
    subtitle: "11 modules · 33 hands-on code steps",
    href: "/learning/string-instrument",
    keywords:
      "learning course guitar strings music canvas web audio karplus strong effects drive delay reverb",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-maker-lab",
    name: "Maker Lab",
    subtitle: "Original experiments, prototypes, and playful tools",
    href: "/#maker-lab",
    keywords: "maker lab experiments prototypes",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-hobbies",
    name: "Hobbies and field notes",
    subtitle: "Side quests beyond product engineering",
    href: "/#field-notes",
    keywords: "hobbies field notes interests side quests",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "page-contact",
    name: "Open a line",
    subtitle: "Contact and collaboration",
    href: "/#contact",
    keywords: "contact email hire collaborate",
    section: "Navigate",
    kind: "page",
  },
  {
    id: "room-blog",
    name: "Blog / Dispatches",
    subtitle: `${archiveArticles.length} essays, build logs and field notes`,
    href: "/blog",
    keywords: "blog writing articles dispatches",
    section: "Archive rooms",
    kind: "page",
  },
  {
    id: "room-inspo",
    name: "Inspo / Reference wall",
    subtitle: `${inspirationEntries.length} annotated interfaces and objects`,
    href: "/inspo",
    keywords: "inspiration reference wall interfaces design",
    section: "Archive rooms",
    kind: "page",
  },
  {
    id: "room-worth-your-time",
    name: "Worth Your Time / Screening room",
    subtitle: `${talkEntries.length} talks indexed by time and topic`,
    href: "/worth-your-time",
    keywords: "talks videos watch screening learning",
    section: "Archive rooms",
    kind: "page",
  },
  {
    id: "room-raq",
    name: "RAQ / Rare questions",
    subtitle: `${raqEntries.length} answers under redaction`,
    href: "/raq",
    keywords: "rare questions answers faq",
    section: "Archive rooms",
    kind: "page",
  },
];

export function createCommandIndex(): CommandEntry[] {
  return [
    ...pageEntries,
    ...systemsRegistry.map(
      (entry): CommandEntry => ({
        id: `system-${entry.slug}`,
        name: entry.name,
        subtitle: `${entry.status} · ${entry.tech.join(" / ")}`,
        href: `/systems/${entry.slug}`,
        keywords: `${entry.description} ${entry.tech.join(" ")}`,
        section: "Systems Lab",
        kind: "system",
      }),
    ),
    ...archiveArticles.map(
      (article): CommandEntry => ({
        id: `article-${article.slug}`,
        name: article.title,
        subtitle: `${article.format} · ${article.category} · ${article.readingMinutes} min`,
        href: `/blog/${article.slug}`,
        keywords: `${article.dek} ${article.category} ${article.format} ${article.accent}`,
        section: "Dispatches",
        kind: "article",
      }),
    ),
    ...inspirationEntries.map(
      (entry): CommandEntry => ({
        id: `reference-${entry.id}`,
        name: entry.name,
        subtitle: `${entry.kind} · ${entry.tags.join(" / ")}`,
        href: `/inspo#${entry.id}`,
        keywords: `${entry.note} ${entry.kind} ${entry.tags.join(" ")}`,
        section: "Reference wall",
        kind: "reference",
      }),
    ),
    ...talkEntries.map(
      (talk): CommandEntry => ({
        id: `screening-${talk.id}`,
        name: talk.title,
        subtitle: `${talk.speaker} · ${talk.displayDuration} · ${talk.topic}`,
        href: `/worth-your-time#${talk.id}`,
        keywords: `${talk.why} ${talk.takeaway} ${talk.speaker} ${talk.topic}`,
        section: "Screening room",
        kind: "screening",
      }),
    ),
    ...raqEntries.map(
      (entry): CommandEntry => ({
        id: `question-${entry.id}`,
        name: entry.question,
        subtitle: `${entry.topic} · ${entry.askedAt}`,
        href: `/raq#${entry.id}`,
        keywords: `${entry.shortAnswer} ${entry.topic}`,
        section: "Rare questions",
        kind: "question",
      }),
    ),
  ];
}
