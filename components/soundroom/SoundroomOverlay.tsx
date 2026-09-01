"use client";

import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderOpen,
  Heart,
  ListMusic,
  Pause,
  Play,
  Radio,
  Repeat2,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import type { SessionMix, SoundroomEngine } from "@/lib/audio/SoundroomEngine";
import type { SoundroomOpenView } from "@/lib/audio/discovery";
import type {
  PlayerSnapshot,
  SoundroomFilter,
  SoundroomTrack,
  VisualizerMode,
} from "@/lib/audio/types";
import SoundroomArtwork from "./SoundroomArtwork";
import SoundroomVisualizer from "./SoundroomVisualizer";
import styles from "./Soundroom.module.css";

type SoundroomPanel = "radio" | "local" | "queue" | "tune";

const VISUALIZER_MODES: readonly VisualizerMode[] = [
  "strings",
  "wave",
  "spectrum",
  "water",
  "particles",
  "album",
  "none",
];

const FILTERS: readonly SoundroomFilter[] = [
  "clean",
  "night",
  "underwater",
  "telephone",
];

function panelForView(
  view: SoundroomOpenView,
  source: PlayerSnapshot["source"],
): SoundroomPanel {
  if (view === "local") return "local";
  if (view === "queue") return "queue";
  if (view === "tune") return "tune";
  return source === "local" ? "local" : "radio";
}

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  return `${Math.floor(value / 60)}:${Math.floor(value % 60)
    .toString()
    .padStart(2, "0")}`;
}

function run(promise: Promise<unknown>): void {
  promise.catch(() => undefined);
}

function TrackRow({
  track,
  snapshot,
  engine,
  local = false,
}: {
  track: SoundroomTrack;
  snapshot: PlayerSnapshot;
  engine: SoundroomEngine;
  local?: boolean;
}) {
  const active = snapshot.currentTrack?.id === track.id;
  const stats = snapshot.stats[track.id];
  return (
    <article className={styles.trackRow} data-active={active}>
      <button
        type="button"
        className={styles.trackPlayTarget}
        onClick={() =>
          run(engine.playTrack(track, { crossfade: snapshot.isPlaying }))
        }
        aria-label={`Play ${track.title} by ${track.artist}`}
      >
        <SoundroomArtwork track={track} compact />
        <span>
          <strong>{track.title}</strong>
          <small>
            {track.artist}
            {stats?.playCount ? ` · heard ${stats.playCount}×` : ""}
          </small>
        </span>
        <Play aria-hidden="true" />
      </button>
      <div className={styles.trackRowActions}>
        <button
          type="button"
          onClick={() => engine.playNext(track)}
          aria-label={`Play ${track.title} next`}
          title="Play next"
        >
          <ListMusic aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => engine.toggleFavorite(track.id)}
          aria-label={`${track.favorite ? "Remove" : "Add"} ${track.title} ${track.favorite ? "from" : "to"} favorites`}
          title={track.favorite ? "Unfavorite" : "Favorite"}
        >
          <Heart
            aria-hidden="true"
            fill={track.favorite ? "currentColor" : "none"}
          />
        </button>
        {local ? (
          <button
            type="button"
            onClick={() => run(engine.removeLocalTrack(track.id))}
            aria-label={`Remove ${track.title} from this browser`}
            title="Remove from this browser"
          >
            <Trash2 aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function Transport({
  engine,
  snapshot,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
}) {
  return (
    <div className={styles.roomTransport}>
      <button
        type="button"
        onClick={() => run(engine.previous())}
        aria-label="Previous track"
      >
        <ChevronLeft aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.roomPlay}
        onClick={() => run(engine.togglePlayback())}
        aria-label={snapshot.isPlaying ? "Pause" : "Play"}
      >
        {snapshot.isPlaying ? (
          <Pause aria-hidden="true" />
        ) : (
          <Play aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        onClick={() => run(engine.next())}
        aria-label="Next track"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  );
}

function RadioPanel({
  engine,
  snapshot,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
}) {
  const mixes: Array<{ id: SessionMix; label: string }> = [
    { id: "recent", label: "Late return" },
    { id: "favorites", label: "Kept signals" },
    { id: "unplayed", label: "Unheard" },
    { id: "most-played", label: "Deep grooves" },
    { id: "random-walk", label: "Random walk" },
  ];
  return (
    <div className={styles.panelBody}>
      <header className={styles.panelIntro}>
        <span>Portfolio radio</span>
        <p>
          Original browser-generated records plus anything licensed in the
          public shelf.
        </p>
      </header>
      <div className={styles.mixRail} aria-label="Session mixes">
        {mixes.map((mix) => (
          <button
            key={mix.id}
            type="button"
            onClick={() => run(engine.playMix(mix.id))}
          >
            {mix.label}
          </button>
        ))}
      </div>
      <div className={styles.trackList}>
        {snapshot.radioTracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            snapshot={snapshot}
            engine={engine}
          />
        ))}
      </div>
    </div>
  );
}

function LocalPanel({
  engine,
  snapshot,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const addFiles = (files: FileList | readonly File[]) => {
    run(engine.importLocalFiles(Array.from(files)));
  };
  const openFolder = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,.webm";
    input.setAttribute("webkitdirectory", "");
    input.addEventListener("change", () => {
      if (input.files) addFiles(input.files);
    });
    input.click();
  };
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className={styles.panelBody}>
      <div
        className={styles.localDrop}
        data-dragging={dragging}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,.webm"
          onChange={handleInput}
          className={styles.hiddenInput}
        />
        <span className={styles.dropGlyph}>
          <Upload aria-hidden="true" />
        </span>
        <div>
          <strong>Open your local record crate</strong>
          <p>Files stay on this device. Nothing is uploaded or measured.</p>
        </div>
        <div className={styles.localActions}>
          <button type="button" onClick={() => inputRef.current?.click()}>
            <Upload aria-hidden="true" /> Choose files
          </button>
          <button type="button" onClick={openFolder}>
            <FolderOpen aria-hidden="true" /> Choose folder
          </button>
        </div>
      </div>
      <div className={styles.trackList}>
        {snapshot.localTracks.length ? (
          snapshot.localTracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              snapshot={snapshot}
              engine={engine}
              local
            />
          ))
        ) : (
          <p className={styles.emptyCrate}>
            No records here yet. Try an MP3, M4A, WAV, OGG, or FLAC your browser
            can decode.
          </p>
        )}
      </div>
    </div>
  );
}

function QueuePanel({
  engine,
  snapshot,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  return (
    <div className={styles.panelBody}>
      <header className={styles.panelIntro}>
        <span>Listening order</span>
        <p>
          Drag records, or use the arrow controls when navigating by keyboard.
        </p>
      </header>
      <div className={styles.queueList}>
        {snapshot.queue.map((track, index) => (
          <article
            key={track.id}
            className={styles.queueRow}
            draggable
            onDragStart={() => setDraggingId(track.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggingId) engine.reorderQueue(draggingId, track.id);
              setDraggingId(null);
            }}
            data-current={track.id === snapshot.currentTrack?.id}
          >
            <button
              type="button"
              className={styles.queueTrack}
              onClick={() => run(engine.playTrack(track))}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>
                <strong>{track.title}</strong>
                <small>{track.artist}</small>
              </span>
            </button>
            <div className={styles.queueActions}>
              <button
                type="button"
                onClick={() => engine.moveQueueItem(track.id, -1)}
                disabled={index === 0}
                aria-label={`Move ${track.title} up`}
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => engine.moveQueueItem(track.id, 1)}
                disabled={index === snapshot.queue.length - 1}
                aria-label={`Move ${track.title} down`}
              >
                <ArrowDown aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => engine.removeFromQueue(track.id)}
                aria-label={`Remove ${track.title} from queue`}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
        {!snapshot.queue.length ? (
          <p className={styles.emptyCrate}>The listening order is empty.</p>
        ) : null}
      </div>
    </div>
  );
}

function TuneSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange(value: number): void;
}) {
  return (
    <label className={styles.tuneSlider}>
      <span>
        <strong>{label}</strong>
        <output>
          {Math.round(value)}
          {suffix}
        </output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function TunePanel({
  engine,
  snapshot,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
}) {
  return (
    <div className={`${styles.panelBody} ${styles.tunePanel}`}>
      <section>
        <header className={styles.panelIntro}>
          <span>Visual instrument</span>
          <p>
            Pick one atmosphere. Nothing turns into rainbow equalizer wallpaper.
          </p>
        </header>
        <div className={styles.optionGrid}>
          {VISUALIZER_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              data-active={snapshot.visualizerMode === mode}
              onClick={() => engine.setVisualizerMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>
      <section>
        <header className={styles.panelIntro}>
          <span>Music reactive</span>
          <p>The ecosystem receives influence, never instructions.</p>
        </header>
        <button
          className={styles.largeSwitch}
          type="button"
          role="switch"
          aria-checked={snapshot.reactiveEnabled}
          data-active={snapshot.reactiveEnabled}
          onClick={() => engine.setReactiveEnabled(!snapshot.reactiveEnabled)}
        >
          <Radio aria-hidden="true" /> Reactive world{" "}
          <span>{snapshot.reactiveEnabled ? "On" : "Off"}</span>
        </button>
        <TuneSlider
          label="Influence"
          value={snapshot.reactiveIntensity * 100}
          min={0}
          max={100}
          step={1}
          suffix="%"
          onChange={(value) => engine.setReactiveIntensity(value / 100)}
        />
      </section>
      <section>
        <header className={styles.panelIntro}>
          <span>Tune · local / owned audio</span>
          <p>Three broad musical shelves, intentionally bounded.</p>
        </header>
        <TuneSlider
          label="Bass"
          value={snapshot.equalizer.bass}
          min={-12}
          max={12}
          step={0.5}
          suffix=" dB"
          onChange={(value) => engine.setEqualizerBand("bass", value)}
        />
        <TuneSlider
          label="Mid"
          value={snapshot.equalizer.mid}
          min={-12}
          max={12}
          step={0.5}
          suffix=" dB"
          onChange={(value) => engine.setEqualizerBand("mid", value)}
        />
        <TuneSlider
          label="Treble"
          value={snapshot.equalizer.treble}
          min={-12}
          max={12}
          step={0.5}
          suffix=" dB"
          onChange={(value) => engine.setEqualizerBand("treble", value)}
        />
        <div className={styles.optionGrid}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              data-active={snapshot.equalizer.filter === filter}
              onClick={() => engine.setFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>
      <section>
        <header className={styles.panelIntro}>
          <span>Transitions</span>
          <p>Crossfade applies only to local and portfolio-owned sound.</p>
        </header>
        <div className={styles.optionGrid}>
          {[0, 2, 4, 6, 8].map((seconds) => (
            <button
              key={seconds}
              type="button"
              data-active={snapshot.crossfade === seconds}
              onClick={() => engine.setCrossfade(seconds)}
            >
              {seconds === 0 ? "Off" : `${seconds}s`}
            </button>
          ))}
        </div>
      </section>
      <section>
        <header className={styles.panelIntro}>
          <span>Wind down</span>
          <p>A private listening timer with an optional thirty-second fade.</p>
        </header>
        <div className={styles.optionGrid}>
          {[15, 30, 45, 60].map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => engine.startWindDown(minutes, true)}
            >
              {minutes} min
            </button>
          ))}
          {snapshot.windDown.endsAt ? (
            <button
              type="button"
              data-active
              onClick={() => engine.cancelWindDown()}
            >
              Cancel timer
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function SoundroomOverlay({
  engine,
  snapshot,
  openView,
  reducedMotion,
  onClose,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
  openView: SoundroomOpenView;
  reducedMotion: boolean;
  onClose(): void;
}) {
  const [panel, setPanel] = useState<SoundroomPanel>(() =>
    panelForView(openView, snapshot.source),
  );
  const [clock, setClock] = useState(Date.now());
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setPanel(panelForView(openView, snapshot.source));
  }, [openView, snapshot.source]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    if (!snapshot.windDown.endsAt) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [snapshot.windDown.endsAt]);

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "Tab") {
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLButtonElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    if (event.key === " ") {
      event.preventDefault();
      run(engine.togglePlayback());
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (event.shiftKey) run(engine.previous());
      else engine.seekBy(-5);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (event.shiftKey) run(engine.next());
      else engine.seekBy(5);
    }
    if (event.key.toLowerCase() === "m") engine.toggleMuted();
    if (event.key.toLowerCase() === "s") engine.setShuffle(!snapshot.shuffle);
    if (event.key.toLowerCase() === "r") engine.cycleRepeatMode();
  };

  const track = snapshot.currentTrack;
  const remaining = snapshot.windDown.endsAt
    ? Math.max(0, snapshot.windDown.endsAt - clock)
    : 0;

  return (
    <motion.div
      className={styles.roomBackdrop}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        layoutId="soundroom-object"
        className={styles.soundroom}
        role="dialog"
        aria-modal="true"
        aria-label="Soundroom local music experience"
        tabIndex={-1}
        onKeyDown={handleKeys}
        data-lenis-prevent
        data-mascot-obstacle="hard"
        style={
          {
            "--soundroom-accent": track?.accent ?? "#ff6946",
          } as CSSProperties
        }
      >
        <header className={styles.roomHeader}>
          <div className={styles.roomIdentity}>
            <span className={styles.roomMark}>
              <i />
              <i />
            </span>
            <div>
              <strong>SOUNDROOM</strong>
              <small>Local signal · no listening analytics</small>
            </div>
          </div>
          <div className={styles.headerSignals}>
            {snapshot.windDown.endsAt ? (
              <span>
                <Clock3 aria-hidden="true" /> {Math.ceil(remaining / 60_000)}m
              </span>
            ) : null}
            <span data-playing={snapshot.isPlaying}>
              {snapshot.isPlaying ? "signal live" : "room quiet"}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Soundroom"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className={styles.roomMain}>
          <section className={styles.listeningStage}>
            <div className={styles.visualStage}>
              <SoundroomVisualizer
                engine={engine}
                mode={snapshot.visualizerMode}
                playing={snapshot.isPlaying}
                reducedMotion={reducedMotion}
                accent={track?.accent ?? "#ff6946"}
              />
              <div
                className={styles.stageArtwork}
                data-mode={snapshot.visualizerMode}
              >
                <SoundroomArtwork track={track} />
              </div>
              <span className={styles.stageIndex}>
                {track
                  ? snapshot.queue.findIndex((item) => item.id === track.id) + 1
                  : "—"}
              </span>
            </div>

            <div className={styles.nowPlaying}>
              <div>
                <span>
                  {track?.source === "local"
                    ? "Local record"
                    : "Portfolio radio"}
                </span>
                <h2>{track?.title ?? "Choose a signal"}</h2>
                <p>
                  {track?.artist ?? "The room is waiting"}
                  {track?.album ? ` · ${track.album}` : ""}
                </p>
              </div>
              {track ? (
                <button
                  type="button"
                  className={styles.nowFavorite}
                  onClick={() => engine.toggleFavorite(track.id)}
                  aria-label={
                    track.favorite
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <Heart
                    aria-hidden="true"
                    fill={track.favorite ? "currentColor" : "none"}
                  />
                </button>
              ) : null}
            </div>

            <label className={styles.roomProgress}>
              <span>{formatTime(snapshot.position)}</span>
              <input
                type="range"
                min={0}
                max={Math.max(1, snapshot.duration)}
                step={0.1}
                value={Math.min(
                  snapshot.position,
                  Math.max(1, snapshot.duration),
                )}
                onChange={(event) => engine.seek(Number(event.target.value))}
                aria-label="Track position"
              />
              <span>{formatTime(snapshot.duration)}</span>
            </label>

            <div className={styles.transportLine}>
              <button
                type="button"
                data-active={snapshot.shuffle}
                onClick={() => engine.setShuffle(!snapshot.shuffle)}
                aria-label={`${snapshot.shuffle ? "Disable" : "Enable"} shuffle`}
              >
                <Shuffle aria-hidden="true" />
              </button>
              <Transport engine={engine} snapshot={snapshot} />
              <button
                type="button"
                data-active={snapshot.repeatMode !== "off"}
                onClick={() => engine.cycleRepeatMode()}
                aria-label={`Repeat mode: ${snapshot.repeatMode}`}
              >
                <Repeat2 aria-hidden="true" />
                <small>{snapshot.repeatMode === "track" ? "1" : ""}</small>
              </button>
            </div>

            <label className={styles.volumeLine}>
              <button
                type="button"
                onClick={() => engine.toggleMuted()}
                aria-label={snapshot.muted ? "Unmute" : "Mute"}
              >
                {snapshot.muted ? (
                  <VolumeX aria-hidden="true" />
                ) : (
                  <Volume2 aria-hidden="true" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={snapshot.volume}
                onChange={(event) =>
                  engine.setVolume(Number(event.target.value))
                }
                aria-label="Volume"
              />
            </label>
          </section>

          <section className={styles.recordCrate}>
            <nav className={styles.roomTabs} aria-label="Soundroom shelves">
              <button
                type="button"
                data-active={panel === "radio"}
                onClick={() => setPanel("radio")}
              >
                <Sparkles aria-hidden="true" /> Radio
              </button>
              <button
                type="button"
                data-active={panel === "local"}
                onClick={() => setPanel("local")}
              >
                <FolderOpen aria-hidden="true" /> Local
              </button>
              <button
                type="button"
                data-active={panel === "queue"}
                onClick={() => setPanel("queue")}
              >
                <ListMusic aria-hidden="true" /> Queue
              </button>
              <button
                type="button"
                data-active={panel === "tune"}
                onClick={() => setPanel("tune")}
              >
                <SlidersHorizontal aria-hidden="true" /> Tune
              </button>
            </nav>
            <div className={styles.panelViewport}>
              {panel === "radio" ? (
                <RadioPanel engine={engine} snapshot={snapshot} />
              ) : null}
              {panel === "local" ? (
                <LocalPanel engine={engine} snapshot={snapshot} />
              ) : null}
              {panel === "queue" ? (
                <QueuePanel engine={engine} snapshot={snapshot} />
              ) : null}
              {panel === "tune" ? (
                <TunePanel engine={engine} snapshot={snapshot} />
              ) : null}
            </div>
          </section>
        </main>

        <footer className={styles.roomFooter}>
          <span>
            <kbd>Space</kbd> play
          </span>
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd> seek
          </span>
          <span>
            <kbd>Shift</kbd> + arrows track
          </span>
          <span>
            <kbd>M</kbd> mute
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </footer>
        {snapshot.error ? (
          <div className={styles.roomError} role="status">
            {snapshot.error}
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
