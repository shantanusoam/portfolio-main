import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  learningEntries,
  learningTracks as learningTracksTable,
} from "@/db/schema";
import { learningTracks as seedTracks, logSeed } from "@/constants/learning";
import { getDb } from "@/lib/db/client";
import { ensureControlPlaneSchema } from "@/lib/db/control-plane";
import type {
  LearningTrackWithEntries,
  LogEntry,
} from "@/@types/learning.type";
import type {
  LearningTrackInput,
  LearningTrackPatch,
} from "@/lib/learning/validation";

export class LearningStoreUnavailableError extends Error {
  constructor() {
    super("Learning database is unavailable");
    this.name = "LearningStoreUnavailableError";
  }
}

async function readyDb() {
  const ready = await ensureControlPlaneSchema();
  const db = getDb();
  if (!ready || !db) throw new LearningStoreUnavailableError();
  return db;
}

async function seedLearningData() {
  const db = await readyDb();

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext('portfolio_learning_seed_v1'))`,
    );

    for (const track of seedTracks) {
      await tx
        .insert(learningTracksTable)
        .values({
          ...track,
          links: track.links ?? [],
          mapping: track.mapping ?? [],
        })
        .onConflictDoNothing({ target: learningTracksTable.id });
    }

    const seedCount = await tx
      .select({ value: sql<number>`count(*)` })
      .from(learningEntries)
      .where(eq(learningEntries.seed, true));

    if (Number(seedCount[0]?.value ?? 0) === 0 && logSeed.length > 0) {
      await tx.insert(learningEntries).values(
        logSeed.map((entry) => ({
          ...entry,
          seed: true,
        })),
      );
    }
  });

  return db;
}

function toLogEntry(row: typeof learningEntries.$inferSelect): LogEntry {
  return {
    id: row.id,
    trackId: row.trackId,
    tag: row.tag,
    text: row.text,
    seed: row.seed,
    ts: row.seed ? null : row.createdAt.getTime(),
  };
}

export async function listLearningTracks(): Promise<
  LearningTrackWithEntries[]
> {
  const db = await seedLearningData();
  const [tracks, entries] = await Promise.all([
    db
      .select()
      .from(learningTracksTable)
      .orderBy(
        asc(learningTracksTable.checkpoint),
        asc(learningTracksTable.createdAt),
      ),
    db
      .select()
      .from(learningEntries)
      .orderBy(desc(learningEntries.createdAt), desc(learningEntries.id)),
  ]);

  const entriesByTrack = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const bucket = entriesByTrack.get(entry.trackId) ?? [];
    bucket.push(toLogEntry(entry));
    entriesByTrack.set(entry.trackId, bucket);
  }

  return tracks.map((track) => ({
    id: track.id,
    checkpoint: track.checkpoint,
    status: track.status as LearningTrackWithEntries["status"],
    title: track.title,
    summary: track.summary,
    description: track.description,
    tags: track.tags,
    logTags: track.logTags,
    links: track.links,
    mapping: track.mapping,
    entries: entriesByTrack.get(track.id) ?? [],
  }));
}

export async function getLearningTrack(id: string) {
  const tracks = await listLearningTracks();
  return tracks.find((track) => track.id === id) ?? null;
}

export async function createLearningTrack(input: LearningTrackInput) {
  const db = await readyDb();
  const inserted = await db
    .insert(learningTracksTable)
    .values(input)
    .onConflictDoNothing({ target: learningTracksTable.id })
    .returning({ id: learningTracksTable.id });

  return inserted[0] ?? null;
}

export async function updateLearningTrack(
  id: string,
  patch: LearningTrackPatch,
) {
  const db = await readyDb();
  const updated = await db
    .update(learningTracksTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(learningTracksTable.id, id))
    .returning({ id: learningTracksTable.id });

  return updated[0] ?? null;
}

export async function deleteLearningTrack(id: string) {
  const db = await readyDb();
  const deleted = await db
    .delete(learningTracksTable)
    .where(eq(learningTracksTable.id, id))
    .returning({ id: learningTracksTable.id });
  return deleted[0] ?? null;
}

export async function addLearningEntry(
  trackId: string,
  input: { tag: string; text: string },
) {
  const db = await readyDb();
  const track = await db
    .select({
      id: learningTracksTable.id,
      logTags: learningTracksTable.logTags,
    })
    .from(learningTracksTable)
    .where(eq(learningTracksTable.id, trackId))
    .limit(1);

  if (!track[0]) return null;

  if (!track[0].logTags[input.tag]) {
    await db
      .update(learningTracksTable)
      .set({
        logTags: { ...track[0].logTags, [input.tag]: input.tag },
        updatedAt: new Date(),
      })
      .where(eq(learningTracksTable.id, trackId));
  }

  const inserted = await db
    .insert(learningEntries)
    .values({ trackId, ...input, seed: false })
    .returning();

  return inserted[0] ? toLogEntry(inserted[0]) : null;
}

export async function deleteLearningEntry(id: number) {
  const db = await readyDb();
  const deleted = await db
    .delete(learningEntries)
    .where(and(eq(learningEntries.id, id), eq(learningEntries.seed, false)))
    .returning({ id: learningEntries.id });
  return deleted[0] ?? null;
}
