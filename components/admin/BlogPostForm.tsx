"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ArchiveArticle } from "@/lib/archive/types";

const CATEGORIES: ArchiveArticle["category"][] = [
  "Engineering",
  "AI Agents",
  "Interfaces",
  "Experiments",
  "Lessons",
];
const FORMATS: ArchiveArticle["format"][] = [
  "Essay",
  "Build Log",
  "Tutorial",
  "Field Note",
];

type Props =
  | { mode: "create"; initialPost?: undefined }
  | { mode: "edit"; initialPost: ArchiveArticle };

const inputClass =
  "w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-400";
const labelClass = "text-sm text-neutral-400";

export default function BlogPostForm({ mode, initialPost }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [dek, setDek] = useState(initialPost?.dek ?? "");
  const [category, setCategory] = useState<ArchiveArticle["category"]>(
    initialPost?.category ?? "Engineering",
  );
  const [format, setFormat] = useState<ArchiveArticle["format"]>(
    initialPost?.format ?? "Essay",
  );
  const [readingMinutes, setReadingMinutes] = useState(
    String(initialPost?.readingMinutes ?? 5),
  );
  const [publishedAt, setPublishedAt] = useState(
    initialPost?.publishedAt ?? new Date().toISOString().slice(0, 10),
  );
  const [featured, setFeatured] = useState(initialPost?.featured ?? false);
  const [accent, setAccent] = useState(initialPost?.accent ?? "");
  const [sections, setSections] = useState(
    JSON.stringify(initialPost?.sections ?? [], null, 2),
  );
  const [externalUrl, setExternalUrl] = useState(
    initialPost?.externalUrl ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      slug,
      title,
      dek,
      category,
      format,
      readingMinutes: Number(readingMinutes),
      publishedAt,
      featured,
      accent,
      sections,
      externalUrl: externalUrl.trim() || null,
    };

    const res = await fetch(
      mode === "create"
        ? "/api/admin/blog"
        : `/api/admin/blog/${initialPost.slug}`,
      {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className={labelClass} htmlFor="slug">
          Slug
        </label>
        <input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={mode === "edit"}
          placeholder="my-post-title"
          className={`${inputClass} disabled:opacity-50`}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="title">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="dek">
          Dek (short description)
        </label>
        <textarea
          id="dek"
          value={dek}
          onChange={(e) => setDek(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="category">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as ArchiveArticle["category"])
            }
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="format">
            Format
          </label>
          <select
            id="format"
            value={format}
            onChange={(e) =>
              setFormat(e.target.value as ArchiveArticle["format"])
            }
            className={inputClass}
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="readingMinutes">
            Reading minutes
          </label>
          <input
            id="readingMinutes"
            type="number"
            min={1}
            value={readingMinutes}
            onChange={(e) => setReadingMinutes(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="publishedAt">
            Published date
          </label>
          <input
            id="publishedAt"
            type="date"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="accent">
          Accent (short tag line)
        </label>
        <input
          id="accent"
          value={accent}
          onChange={(e) => setAccent(e.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
        />
        Featured
      </label>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="externalUrl">
          External URL (optional — set this if the full post lives on Hashnode,
          Dev.to, etc.)
        </label>
        <input
          id="externalUrl"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://yourblog.hashnode.dev/my-post"
          className={inputClass}
        />
        <p className="text-xs text-neutral-500">
          When set, the archive links straight out to this URL instead of
          rendering the sections below.
        </p>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="sections">
          Sections (JSON array)
        </label>
        <textarea
          id="sections"
          value={sections}
          onChange={(e) => setSections(e.target.value)}
          rows={16}
          spellCheck={false}
          className={`${inputClass} font-mono text-xs`}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
      >
        {submitting
          ? "Saving…"
          : mode === "create"
            ? "Create post"
            : "Save changes"}
      </button>
    </form>
  );
}
