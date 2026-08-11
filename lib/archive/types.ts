export type ArticleCategory =
  | "Engineering"
  | "AI Agents"
  | "Interfaces"
  | "Experiments"
  | "Lessons";

export type ArticleFormat = "Essay" | "Build Log" | "Tutorial" | "Field Note";

export interface ArticleSection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
  quote?: string;
  code?: {
    language: string;
    label: string;
    value: string;
  };
}

export interface ArchiveArticle {
  slug: string;
  title: string;
  dek: string;
  category: ArticleCategory;
  format: ArticleFormat;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  featured?: boolean;
  accent: string;
  sections: ArticleSection[];
  revisions: Array<{ date: string; note: string }>;
}

export type InspirationKind = "Web" | "Mobile" | "Hardware" | "Motion";

export interface InspirationEntry {
  id: string;
  name: string;
  kind: InspirationKind;
  url: string;
  note: string;
  tags: string[];
  pinned?: boolean;
  palette: [string, string, string];
  motif: "rails" | "orbital" | "console" | "editorial" | "stack" | "signal";
}

export type TalkTopic = "Systems" | "Design" | "Business" | "Craft" | "Life";
export type TalkDifficulty = "Open" | "Intermediate" | "Deep dive";

export interface TalkEntry {
  id: string;
  title: string;
  speaker: string;
  url: string;
  youtubeId: string;
  durationMinutes: number;
  displayDuration: string;
  topic: TalkTopic;
  difficulty: TalkDifficulty;
  evergreen: boolean;
  kind: "Talk" | "Clip" | "Conversation";
  why: string;
  leavesYouWith: string;
  takeaway: string;
  startAtSeconds?: number;
  endAtSeconds?: number;
}

export type RaqTopic =
  | "Work"
  | "Taste"
  | "Failure"
  | "Tools"
  | "Life"
  | "Internet";

export interface RaqEntry {
  id: string;
  question: string;
  topic: RaqTopic;
  askedAt: string;
  shortAnswer: string;
  longAnswer: string[];
}
