"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { LearningTrackWithEntries } from "@/@types/learning.type";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const fieldClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-emerald-400";

export default function LearningControlPanel({
  initialTracks,
}: {
  initialTracks: LearningTrackWithEntries[];
}) {
  const [tracks, setTracks] = useState(initialTracks);
  const [topic, setTopic] = useState("");
  const [summary, setSummary] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextCheckpoint = useMemo(() => {
    const values = tracks
      .map((track) => Number(track.checkpoint))
      .filter(Number.isFinite);
    return String((values.length ? Math.max(...values) : 0) + 1).padStart(
      2,
      "0",
    );
  }, [tracks]);

  async function refresh() {
    const response = await fetch("/api/admin/learning", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok)
      throw new Error(payload.error || "Could not refresh learning data");
    setTracks(payload.tracks);
  }

  async function request(path: string, init: RequestInit) {
    setError(null);
    const response = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(payload.error || `Request failed (${response.status})`);
    await refresh();
  }

  async function createTrack(event: FormEvent) {
    event.preventDefault();
    const id = slugify(topic);
    if (!id) return;
    setBusy("create");
    try {
      await request("/api/admin/learning", {
        method: "POST",
        body: JSON.stringify({
          id,
          checkpoint: nextCheckpoint,
          status: tracks.some((track) => track.status === "now")
            ? "next"
            : "now",
          title: topic.trim(),
          summary: summary.trim(),
          description: summary.trim(),
          tags: ["general"],
          logTags: { general: "general" },
          links: [],
          mapping: [],
        }),
      });
      setTopic("");
      setSummary("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create track",
      );
    } finally {
      setBusy(null);
    }
  }

  async function addEntry(trackId: string) {
    const text = drafts[trackId]?.trim();
    if (!text) return;
    setBusy(`entry:${trackId}`);
    try {
      await request(
        `/api/admin/learning/${encodeURIComponent(trackId)}/entries`,
        {
          method: "POST",
          body: JSON.stringify({ tag: tags[trackId] || "general", text }),
        },
      );
      setDrafts((current) => ({ ...current, [trackId]: "" }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not add entry",
      );
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(trackId: string, status: string) {
    setBusy(`status:${trackId}`);
    try {
      await request(`/api/admin/learning/${encodeURIComponent(trackId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update status",
      );
    } finally {
      setBusy(null);
    }
  }

  async function deleteEntry(id: number) {
    setBusy(`delete:${id}`);
    try {
      await request(`/api/admin/learning/entries/${id}`, { method: "DELETE" });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not delete entry",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={createTrack}
        className="grid gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-5 md:grid-cols-[1fr_1.4fr_auto]"
      >
        <input
          className={fieldClass}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          placeholder="New learning track"
          required
        />
        <input
          className={fieldClass}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="What are you building a mental model of?"
          minLength={3}
          required
        />
        <button
          type="submit"
          disabled={busy === "create"}
          className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-50"
        >
          Create {nextCheckpoint}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-5">
        {tracks.map((track) => (
          <section
            key={track.id}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                  Checkpoint {track.checkpoint} · {track.id}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{track.title}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-400">
                  {track.summary}
                </p>
              </div>
              <select
                className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
                value={track.status}
                disabled={busy === `status:${track.id}`}
                onChange={(event) =>
                  void updateStatus(track.id, event.target.value)
                }
              >
                {(["now", "next", "later", "done"] as const).map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[160px_1fr_auto]">
              <select
                className={fieldClass}
                value={tags[track.id] || "general"}
                onChange={(event) =>
                  setTags((current) => ({
                    ...current,
                    [track.id]: event.target.value,
                  }))
                }
              >
                {Object.entries(track.logTags).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <textarea
                className={fieldClass}
                rows={2}
                value={drafts[track.id] || ""}
                onChange={(event) =>
                  setDrafts((current) => ({
                    ...current,
                    [track.id]: event.target.value,
                  }))
                }
                placeholder="Checkpoint the distinction, consequence, and why it matters."
              />
              <button
                type="button"
                onClick={() => void addEntry(track.id)}
                disabled={busy === `entry:${track.id}`}
                className="self-stretch rounded-lg border border-neutral-700 px-4 text-sm font-medium hover:border-neutral-500 disabled:opacity-50"
              >
                Add note
              </button>
            </div>

            <ol className="mt-5 divide-y divide-neutral-800 border-t border-neutral-800">
              {track.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div>
                    <p className="text-sm leading-6 text-neutral-300">
                      {entry.text}
                    </p>
                    <p className="mt-1 text-xs text-neutral-600">
                      {track.logTags[entry.tag] || entry.tag} · CKPT-
                      {String(entry.id).padStart(3, "0")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void deleteEntry(entry.id)}
                    disabled={entry.seed || busy === `delete:${entry.id}`}
                    title={
                      entry.seed ? "Seed notes are preserved" : "Delete note"
                    }
                    className="text-xs text-neutral-600 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
