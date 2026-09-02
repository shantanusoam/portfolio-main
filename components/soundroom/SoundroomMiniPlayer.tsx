"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  Radio,
  SlidersHorizontal,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { SoundroomEngine } from "@/lib/audio/SoundroomEngine";
import type { PlayerSnapshot } from "@/lib/audio/types";
import type { SoundroomOpenView } from "@/lib/audio/discovery";
import SoundroomArtwork from "./SoundroomArtwork";
import styles from "./Soundroom.module.css";

function formatTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function run(promise: Promise<unknown>): void {
  promise.catch(() => undefined);
}

export default function SoundroomMiniPlayer({
  engine,
  snapshot,
  compact,
  onCompactChange,
  onOpen,
}: {
  engine: SoundroomEngine;
  snapshot: PlayerSnapshot;
  compact: boolean;
  onCompactChange(compact: boolean): void;
  onOpen(view: SoundroomOpenView): void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const track = snapshot.currentTrack;

  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setMenuOpen(false);
      onCompactChange(true);
      return;
    }
    if (event.target !== event.currentTarget) return;
    if (event.key === " ") {
      event.preventDefault();
      run(engine.togglePlayback());
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (event.shiftKey) run(engine.previous());
      else engine.seekBy(-5);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (event.shiftKey) run(engine.next());
      else engine.seekBy(5);
      return;
    }
    if (event.key.toLowerCase() === "m") engine.toggleMuted();
    if (event.key.toLowerCase() === "s") engine.setShuffle(!snapshot.shuffle);
    if (event.key.toLowerCase() === "r") engine.cycleRepeatMode();
  };

  const beginLongPress = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    longPressTimer.current = window.setTimeout(() => setMenuOpen(true), 520);
  };
  const endLongPress = () => {
    if (longPressTimer.current !== null)
      window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  if (compact) {
    return (
      <motion.button
        layoutId="soundroom-object"
        type="button"
        className={styles.compactPlayer}
        onClick={() => onCompactChange(false)}
        onDoubleClick={() => onOpen("room")}
        aria-label={`${snapshot.isPlaying ? "Playing" : "Open"} Soundroom${track ? `: ${track.title}` : ""}`}
        title="Soundroom"
        data-playing={snapshot.isPlaying}
        data-mascot-obstacle="hard"
      >
        <span
          className={styles.compactDisc}
          style={{ borderColor: track?.accent }}
        >
          <span />
        </span>
        <span className={styles.compactSignal} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </motion.button>
    );
  }

  return (
    <motion.div
      layoutId="soundroom-object"
      className={styles.miniPlayer}
      role="group"
      aria-label="Soundroom mini player"
      tabIndex={0}
      onKeyDown={handleKeys}
      onDoubleClick={() => onOpen("room")}
      onContextMenu={(event) => {
        event.preventDefault();
        setMenuOpen(true);
      }}
      onPointerDown={beginLongPress}
      onPointerUp={endLongPress}
      onPointerCancel={endLongPress}
      onPointerLeave={endLongPress}
      data-mascot-obstacle="hard"
    >
      <button
        type="button"
        className={styles.miniArtworkButton}
        onClick={() => onOpen("room")}
        aria-label="Open full Soundroom"
      >
        <SoundroomArtwork track={track} compact />
      </button>

      <div className={styles.miniCopy}>
        <button
          type="button"
          onClick={() => onOpen("room")}
          className={styles.trackTitleButton}
        >
          <strong>{track?.title ?? "Soundroom is quiet"}</strong>
          <span>{track?.artist ?? "Open a local record"}</span>
        </button>
        <label className={styles.miniProgress}>
          <span className={styles.srOnly}>Track position</span>
          <input
            type="range"
            min={0}
            max={Math.max(1, snapshot.duration)}
            step={0.1}
            value={Math.min(snapshot.position, Math.max(1, snapshot.duration))}
            onChange={(event) => engine.seek(Number(event.target.value))}
            style={
              {
                "--track-progress": `${snapshot.duration ? (snapshot.position / snapshot.duration) * 100 : 0}%`,
              } as CSSProperties
            }
          />
          <small>
            {formatTime(snapshot.position)} <span>/</span>{" "}
            {formatTime(snapshot.duration)}
          </small>
        </label>
      </div>

      <div className={styles.miniTransport}>
        <button
          type="button"
          onClick={() => run(engine.previous())}
          aria-label="Previous track"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.primaryTransport}
          onClick={() => run(engine.togglePlayback())}
          aria-label={snapshot.isPlaying ? "Pause" : "Play"}
          data-loading={snapshot.status === "loading"}
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

      <button
        type="button"
        className={styles.miniMute}
        onClick={() => engine.toggleMuted()}
        aria-label={snapshot.muted ? "Unmute" : "Mute"}
      >
        {snapshot.muted ? (
          <VolumeX aria-hidden="true" />
        ) : (
          <Volume2 aria-hidden="true" />
        )}
      </button>

      {menuOpen ? (
        <div className={styles.quickMenu} role="menu">
          <button type="button" role="menuitem" onClick={() => onOpen("room")}>
            <Maximize2 aria-hidden="true" /> Enter Soundroom
          </button>
          <button type="button" role="menuitem" onClick={() => onOpen("local")}>
            <Upload aria-hidden="true" /> Open local record crate
          </button>
          <button type="button" role="menuitem" onClick={() => onOpen("queue")}>
            <ListMusic aria-hidden="true" /> Queue
          </button>
          <button type="button" role="menuitem" onClick={() => onOpen("tune")}>
            <SlidersHorizontal aria-hidden="true" /> Tune the room
          </button>
          {track ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => engine.toggleFavorite(track.id)}
            >
              <Heart
                aria-hidden="true"
                fill={track.favorite ? "currentColor" : "none"}
              />
              {track.favorite ? "Unfavorite" : "Favorite"}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            onClick={() => engine.setReactiveEnabled(!snapshot.reactiveEnabled)}
          >
            <Radio aria-hidden="true" /> Reactive{" "}
            {snapshot.reactiveEnabled ? "off" : "on"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => onCompactChange(true)}
          >
            Collapse
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
