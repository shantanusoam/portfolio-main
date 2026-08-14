export type LearningStatus = "now" | "next" | "later" | "done";

export type LearningLink = {
  label: string;
  href: string;
};

export type MappingRow = {
  module: string;
  builtAs: string;
  productionAnalog: string;
};

export type LearningTrack = {
  id: string;
  checkpoint: string;
  status: LearningStatus;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  // Vocabulary for this track's log entries — tag key -> display label.
  logTags: Record<string, string>;
  links?: LearningLink[];
  mapping?: MappingRow[];
};

export type LogSeedEntry = {
  trackId: string;
  tag: string;
  text: string;
};

export type LogEntry = {
  id: number;
  trackId: string;
  tag: string;
  text: string;
  seed: boolean;
  ts: number | null;
};

export type LearningTrackWithEntries = LearningTrack & {
  entries: LogEntry[];
};
