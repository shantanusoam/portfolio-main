import assert from "node:assert/strict";
import { test } from "node:test";
import {
  archiveArticles,
  inspirationEntries,
  raqEntries,
  talkEntries,
} from "@/lib/archive/data";
import { createCommandIndex } from "@/lib/archive/command-index";

function assertUnique(values: string[], label: string) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

test("archive articles have unique routes and readable sections", () => {
  assert.ok(archiveArticles.length >= 10);
  assertUnique(
    archiveArticles.map((article) => article.slug),
    "article slugs",
  );
  for (const article of archiveArticles) {
    assert.ok(article.sections.length >= 3);
    assert.ok(article.readingMinutes > 0);
    assertUnique(
      article.sections.map((section) => section.id),
      `${article.slug} section ids`,
    );
  }
});

test("reference wall has pinned anchors and safe source links", () => {
  assert.ok(inspirationEntries.filter((entry) => entry.pinned).length >= 3);
  assertUnique(
    inspirationEntries.map((entry) => entry.id),
    "inspiration ids",
  );
  for (const entry of inspirationEntries) {
    assert.match(entry.url, /^https:\/\//);
    assert.equal(entry.palette.length, 3);
  }
});

test("screening room covers short and long time budgets", () => {
  assertUnique(
    talkEntries.map((talk) => talk.id),
    "talk ids",
  );
  assert.ok(talkEntries.some((talk) => talk.durationMinutes <= 15));
  assert.ok(talkEntries.some((talk) => talk.durationMinutes > 60));
  for (const talk of talkEntries) {
    assert.match(talk.youtubeId, /^[A-Za-z0-9_-]{11}$/);
  }
});

test("rare questions remain deep-linkable", () => {
  assert.ok(raqEntries.length >= 16);
  assertUnique(
    raqEntries.map((entry) => entry.id),
    "RAQ ids",
  );
  assert.ok(raqEntries.every((entry) => entry.longAnswer.length >= 2));
});

test("command palette indexes every archive entry with unique destinations", () => {
  const commands = createCommandIndex();
  const expectedMinimum =
    archiveArticles.length +
    inspirationEntries.length +
    talkEntries.length +
    raqEntries.length;

  assert.ok(commands.length > expectedMinimum);
  assertUnique(
    commands.map((command) => command.id),
    "command ids",
  );
  assert.ok(commands.every((command) => command.href.startsWith("/")));
  assert.ok(
    archiveArticles.every((article) =>
      commands.some((command) => command.href === `/blog/${article.slug}`),
    ),
  );
});
