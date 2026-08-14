import { z } from "zod";

export const learningStatusSchema = z.enum(["now", "next", "later", "done"]);

const learningLinkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: z.string().url().max(500),
});

const mappingRowSchema = z.object({
  module: z.string().trim().min(1).max(120),
  builtAs: z.string().trim().min(1).max(180),
  productionAnalog: z.string().trim().min(1).max(180),
});

export const learningTrackSchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  checkpoint: z.string().trim().min(1).max(12),
  status: learningStatusSchema.default("now"),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().min(3).max(300),
  description: z.string().trim().min(3).max(2_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  logTags: z
    .record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(80))
    .refine(
      (value) => Object.keys(value).length > 0,
      "At least one log tag is required",
    ),
  links: z.array(learningLinkSchema).max(20).default([]),
  mapping: z.array(mappingRowSchema).max(30).default([]),
});

export const learningTrackPatchSchema = learningTrackSchema
  .omit({ id: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "No changes supplied");

export const learningEntrySchema = z.object({
  tag: z.string().trim().min(1).max(50),
  text: z.string().trim().min(3).max(4_000),
});

export type LearningTrackInput = z.infer<typeof learningTrackSchema>;
export type LearningTrackPatch = z.infer<typeof learningTrackPatchSchema>;
