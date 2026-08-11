"use client";

import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarResults,
  KBarSearch,
  useKBar,
  useMatches,
  type Action,
  type ActionImpl,
} from "kbar";
import {
  ArrowRight,
  BookOpen,
  Compass,
  MessageCircle,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  CommandEntry,
  CommandEntryKind,
} from "@/lib/archive/command-index";
import styles from "./commandPalette.module.css";

const sectionPriority: Record<string, number> = {
  Navigate: 90,
  "Archive rooms": 80,
  Dispatches: 70,
  "Reference wall": 60,
  "Screening room": 50,
  "Rare questions": 40,
};

const kindIcon: Record<CommandEntryKind, ReactNode> = {
  page: <Compass size={15} aria-hidden="true" />,
  article: <BookOpen size={15} aria-hidden="true" />,
  reference: <Sparkles size={15} aria-hidden="true" />,
  screening: <Play size={15} aria-hidden="true" />,
  question: <MessageCircle size={15} aria-hidden="true" />,
};

function CommandResults() {
  const { results } = useMatches();

  return (
    <div className={styles.results}>
      {results.length > 0 ? (
        <KBarResults
          items={results}
          maxHeight={440}
          onRender={({ item, active }) => {
            if (typeof item === "string") {
              return <div className={styles.groupLabel}>{item}</div>;
            }
            return <CommandResult action={item} active={active} />;
          }}
        />
      ) : (
        <div className={styles.empty}>
          <span>Signal not found.</span>
          <p>Try a room, project, person, topic, or question.</p>
        </div>
      )}
    </div>
  );
}

function CommandResult({
  action,
  active,
}: {
  action: ActionImpl;
  active: boolean;
}) {
  return (
    <div className={`${styles.result} ${active ? styles.resultActive : ""}`}>
      <span className={styles.resultIcon}>{action.icon}</span>
      <span className={styles.resultCopy}>
        <strong>{action.name}</strong>
        {action.subtitle ? <small>{action.subtitle}</small> : null}
      </span>
      {action.shortcut?.length ? (
        <span className={styles.resultShortcut}>
          {action.shortcut.map((shortcut) => (
            <kbd key={shortcut}>{shortcut}</kbd>
          ))}
        </span>
      ) : (
        <ArrowRight
          className={styles.resultArrow}
          size={14}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function CommandDialog({ count }: { count: number }) {
  return (
    <KBarPortal>
      <KBarPositioner className={styles.positioner}>
        <KBarAnimator className={styles.animator}>
          <header className={styles.paletteHeader}>
            <span className={styles.paletteMark}>SA</span>
            <div>
              <strong>Signal finder</strong>
              <span>Search the whole body of work</span>
            </div>
            <span className={styles.liveSignal}>{count} paths live</span>
          </header>
          <div className={styles.searchRow}>
            <Search size={18} aria-hidden="true" />
            <KBarSearch
              className={styles.searchInput}
              defaultPlaceholder="Type a command, title, topic, or question…"
              aria-label="Search the portfolio and Signal Archive"
            />
            <kbd>Esc</kbd>
          </div>
          <CommandResults />
          <footer className={styles.paletteFooter}>
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> move
            </span>
            <span>
              <kbd>↵</kbd> open
            </span>
            <span className={styles.footerSignal}>
              <span /> Built for curious detours
            </span>
          </footer>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
}

export function CommandPaletteProvider({
  children,
  entries,
}: {
  children: ReactNode;
  entries: CommandEntry[];
}) {
  const router = useRouter();
  const actions = useMemo<Action[]>(
    () =>
      entries.map((entry) => ({
        id: entry.id,
        name: entry.name,
        subtitle: entry.subtitle,
        keywords: entry.keywords,
        section: {
          name: entry.section,
          priority: sectionPriority[entry.section] ?? 0,
        },
        icon: kindIcon[entry.kind],
        perform: () => router.push(entry.href),
      })),
    [entries, router],
  );

  return (
    <KBarProvider
      actions={actions}
      options={{
        toggleShortcut: "$mod+k",
        animations: { enterMs: 180, exitMs: 120 },
      }}
    >
      {children}
      <CommandDialog count={entries.length} />
    </KBarProvider>
  );
}

export function CommandPaletteTrigger({
  variant = "archive",
}: {
  variant?: "archive" | "home";
}) {
  const { query } = useKBar();
  const [modifier, setModifier] = useState("Ctrl");

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setModifier("⌘");
  }, []);

  return (
    <button
      className={`${styles.trigger} ${
        variant === "home" ? styles.triggerHome : styles.triggerArchive
      }`}
      onClick={() => query.toggle()}
      type="button"
      aria-label="Open command palette"
      aria-keyshortcuts="Meta+K Control+K"
    >
      <Search size={13} aria-hidden="true" />
      <span className={styles.triggerLabel}>Find</span>
      <kbd>{modifier} K</kbd>
    </button>
  );
}
