import { z } from "zod";
import { callAdminApi } from "@/lib/mcp/admin-client";
import type { LearningTrackWithEntries } from "@/@types/learning.type";

const categorySchema = z.enum([
  "Engineering",
  "AI Agents",
  "Interfaces",
  "Experiments",
  "Lessons",
]);
const formatSchema = z.enum(["Essay", "Build Log", "Tutorial", "Field Note"]);

export const articleSectionSchema = z.object({
  id: z
    .string()
    .optional()
    .describe(
      "Optional kebab-case anchor. It is derived from the heading when omitted.",
    ),
  heading: z
    .string()
    .min(3)
    .max(180)
    .describe("Concrete, numbered when sequential, and never generic filler."),
  paragraphs: z
    .array(z.string().min(30).max(2_000))
    .min(1)
    .max(5)
    .describe(
      "First-person systems writing: name the product question, ownership boundary, tradeoff, and observable consequence. Avoid hype and empty claims.",
    ),
  list: z.array(z.string().min(3).max(300)).max(10).optional(),
  quote: z
    .string()
    .min(10)
    .max(400)
    .optional()
    .describe("A compact operating principle, not a motivational slogan."),
  code: z
    .object({
      language: z.string().min(1).max(30),
      label: z.string().min(3).max(100),
      value: z.string().min(3).max(8_000),
    })
    .optional(),
});

export const createBlogPostShape = {
  roughThought: z
    .string()
    .min(10)
    .max(8_000)
    .describe(
      "The owner's raw thought. Preserve its actual insight; do not replace it with generic advice.",
    ),
  title: z
    .string()
    .min(8)
    .max(140)
    .describe(
      "Specific and evidence-led, usually naming the system and the useful tension.",
    ),
  dek: z
    .string()
    .min(20)
    .max(300)
    .describe(
      "One sentence: what was built or learned, how, and why the distinction matters.",
    ),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  category: categorySchema.default("Engineering"),
  format: formatSchema.default("Field Note"),
  featured: z.boolean().default(false),
  accent: z
    .string()
    .min(3)
    .max(100)
    .optional()
    .describe("Two to four lowercase system concepts separated by ' / '."),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sections: z
    .array(articleSectionSchema)
    .min(2)
    .max(12)
    .describe(
      "Build a truthful arc from contract/problem, through architecture and mechanics, to accessibility/recovery and evidence. Match the existing archive's concrete first-person tone.",
    ),
};

export const addLearningEntryShape = {
  topic: z.string().min(3).max(180).describe("Human-readable learning topic."),
  trackId: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional()
    .describe("Existing track id; derived from topic when omitted."),
  tag: z
    .string()
    .min(1)
    .max(50)
    .describe(
      "Short concept key such as durability, motion, perception, or general.",
    ),
  text: z
    .string()
    .min(10)
    .max(4_000)
    .describe(
      "A compact checkpoint with the distinction, consequence, and why it matters—not a vague progress update.",
    ),
  track: z
    .object({
      title: z.string().min(3).max(180).optional(),
      checkpoint: z.string().min(1).max(12).optional(),
      status: z.enum(["now", "next", "later", "done"]).optional(),
      summary: z.string().min(3).max(300).optional(),
      description: z.string().min(3).max(2_000).optional(),
      tags: z.array(z.string().min(1).max(80)).max(20).optional(),
    })
    .optional()
    .describe("Metadata used only if this tool needs to create the track."),
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export async function createBlogPost(
  input: z.infer<z.ZodObject<typeof createBlogPostShape>>,
  token: string,
) {
  const sections = input.sections.map((section, index) => ({
    ...section,
    id: section.id || slugify(section.heading) || `section-${index + 1}`,
  }));
  const words =
    wordCount(input.dek) +
    sections.reduce(
      (total, section) =>
        total +
        section.paragraphs.reduce(
          (sum, paragraph) => sum + wordCount(paragraph),
          0,
        ) +
        (section.list ?? []).reduce((sum, item) => sum + wordCount(item), 0),
      0,
    );
  const slug = input.slug || slugify(input.title);
  if (!slug)
    throw new Error("The title could not be converted into a valid slug");

  return callAdminApi<{ ok: true; slug: string }>({
    path: "/api/admin/blog",
    method: "POST",
    token,
    body: {
      slug,
      title: input.title.trim(),
      dek: input.dek.trim(),
      category: input.category,
      format: input.format,
      readingMinutes: Math.max(3, Math.ceil(words / 220)),
      publishedAt: input.publishedAt || new Date().toISOString().slice(0, 10),
      featured: input.featured,
      accent: input.accent || "systems / craft / evidence",
      sections,
    },
  });
}

export async function addLearningEntry(
  input: z.infer<z.ZodObject<typeof addLearningEntryShape>>,
  token: string,
) {
  const listing = await callAdminApi<{ tracks: LearningTrackWithEntries[] }>({
    path: "/api/admin/learning",
    token,
  });
  const trackId = input.trackId || slugify(input.topic);
  if (!trackId)
    throw new Error("The topic could not be converted into a track id");

  let createdTrack = false;
  if (!listing.tracks.some((track) => track.id === trackId)) {
    const numericCheckpoints = listing.tracks
      .map((track) => Number(track.checkpoint))
      .filter(Number.isFinite);
    const nextCheckpoint = String(
      (numericCheckpoints.length ? Math.max(...numericCheckpoints) : 0) + 1,
    ).padStart(2, "0");
    const tag = slugify(input.tag) || "general";
    await callAdminApi({
      path: "/api/admin/learning",
      method: "POST",
      token,
      body: {
        id: trackId,
        checkpoint: input.track?.checkpoint || nextCheckpoint,
        status:
          input.track?.status ||
          (listing.tracks.some((track) => track.status === "now")
            ? "next"
            : "now"),
        title: input.track?.title || input.topic,
        summary:
          input.track?.summary ||
          `Building a working mental model of ${input.topic}.`,
        description:
          input.track?.description ||
          `A live field log for the concepts, experiments, and production consequences behind ${input.topic}.`,
        tags: input.track?.tags || [tag],
        logTags:
          tag === "general"
            ? { general: "general" }
            : { [tag]: tag, general: "general" },
        links: [],
        mapping: [],
      },
    });
    createdTrack = true;
  }

  const entry = await callAdminApi<{ ok: true; entry: unknown }>({
    path: `/api/admin/learning/${encodeURIComponent(trackId)}/entries`,
    method: "POST",
    token,
    body: { tag: slugify(input.tag) || "general", text: input.text },
  });
  return { ok: true, trackId, createdTrack, entry: entry.entry };
}
