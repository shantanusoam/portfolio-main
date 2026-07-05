import { StaticImageData } from 'next/image';

export type MissionSkillMap = Record<string, string[]>;

export type MissionType = {
  id: string;
  title: string;
  metadata?: string[];
  // null = no real screenshot/cover yet (used by placeholder missions) — renders
  // a CSS fallback instead of ever pointing at a nonexistent static asset.
  cover_image: StaticImageData | null;
  screenshots: StaticImageData[];
  description: string;
  url: string;
  features: string[];
  skills: MissionSkillMap;
  problem?: string;
  solution?: string;
  liveLink: string;
  codeLink: string;
  // Fighter-profile framing for the "Mission Select" cards
  class: string;
  specialMoves: string[];
  impact: string[];
  // Marks missions with no real case-study content yet — swap fields once available
  isPlaceholder?: boolean;
};
