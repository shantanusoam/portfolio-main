export type ComboSkill = {
  name: string;
  // 0-100, how confident/deep the skill is
  proficiency: number;
  // ids of constants/projects.ts entries that prove this skill — an empty
  // array means the skill has no backing project yet and renders "unlit"
  proofProjectIds: string[];
};

export type ComboGroup = {
  id: string;
  label: string;
  skills: ComboSkill[];
};
