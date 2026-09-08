"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Music2,
  BookOpen,
  Check,
  ChevronRight,
  HelpCircle,
  Crosshair,
  Expand,
  Download,
  Heart,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Settings2,
  Shield,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { GameAudio } from "@/lib/space-impact/audio";
import { WIDTH, WEAPONS } from "@/lib/space-impact/config";
import { SECTORS } from "@/lib/space-impact/content/sectors";
import { RELAY_SEQUENCE, SECRETS } from "@/lib/space-impact/content/secrets";
import {
  declineRelay,
  nextSector,
  submitCode,
} from "@/lib/space-impact/director";
import { InputController } from "@/lib/space-impact/input";
import {
  createGame,
  pauseGame,
  resumeGame,
  startGame,
} from "@/lib/space-impact/model";
import { hashSeed } from "@/lib/space-impact/random";
import { renderGame } from "@/lib/space-impact/render";
import { createFlightCard } from "@/lib/space-impact/share";
import { createRuntime } from "@/lib/space-impact/runtime";
import {
  emptyProfile,
  persistGame,
  readProfile,
  updateSettings,
  writeProfile,
} from "@/lib/space-impact/storage";
import { updateGame } from "@/lib/space-impact/update";
import type {
  Game,
  Mode,
  Profile,
  Settings,
  Status,
} from "@/lib/space-impact/types";
import styles from "./SpaceImpact.module.css";

type Panel = "settings" | "journal" | "sectors" | "receiver" | null;
const statusLabel: Record<Status, string> = {
  ready: "Awaiting transmission",
  running: "Signal connected",
  paused: "Transmission held",
  countdown: "Establishing connection",
  cleared: "Sector recovered",
  dead: "Signal lost",
  victory: "Transmission complete",
  console: "Incoming transmission",
};
const endings = {
  home: {
    title: "A light to come home to.",
    copy: "The relay falls quiet. Far beyond the wreckage, a small blue world is still turning. You point the ship toward it. Somewhere behind you, three voices wait to be heard.",
  },
  signal: {
    title: "You were never alone.",
    copy: "The archive opens. A thousand lost voices become a constellation. They were not asking to be rescued. They were asking to be remembered. You carry their light home.",
  },
  challenge: {
    title: "Three minutes. One signal.",
    copy: "Your run has been recorded on this device. The same daily signal is waiting if you want another attempt.",
  },
};

export default function SpaceImpact() {
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const profileRef = useRef<Profile>(emptyProfile());
  const inputRef = useRef<InputController | null>(null);
  const audioRef = useRef<GameAudio | null>(null);
  const runtimeRef = useRef<ReturnType<typeof createRuntime> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastDrawRef = useRef(0);
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [, setRevision] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [loaded, setLoaded] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [assetAttempt, setAssetAttempt] = useState(0);
  const backdropRef = useRef<HTMLImageElement | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [code, setCode] = useState("");
  const [codeFeedback, setCodeFeedback] = useState("");
  const [revealedHints, setRevealedHints] = useState<string[]>([]);
  const [touchActive, setTouchActive] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const save = useCallback((value: Profile) => {
    profileRef.current = value;
    setProfile(value);
    setStorageWarning(!writeProfile(value));
  }, []);

  useEffect(() => {
    const current = readProfile();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      current.settings.reducedMotion = true;
    profileRef.current = current;
    setProfile(current);
    const game = createGame(current);
    gameRef.current = game;
    inputRef.current = new InputController(
      () => gameRef.current?.player ?? { x: 86, y: 135 },
    );
    audioRef.current = new GameAudio(current.settings);
    setLoaded(true);
    refresh();
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let scale = 1;
    let previousStatus = game.status;
    let lastHud = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      scale = canvas.width / WIDTH;
      inputRef.current?.clear();
      setTouchActive(false);
      const active = gameRef.current;
      if (active) {
        pauseGame(active);
        refresh();
      }
      runtimeRef.current?.reset();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const runtime = createRuntime(
      () => {
        const model = gameRef.current;
        const controls = inputRef.current;
        if (!model || !controls) return;
        updateGame(model, controls.sample());
        const events = model.events.splice(0);
        // Important sounds first; excess repetitive events are discarded, never queued across a pause.
        const sounds = events
          .filter((event) => event.kind === "sound")
          .sort(
            (a, b) => Number(a.sound === "shot") - Number(b.sound === "shot"),
          );
        sounds
          .slice(0, 6)
          .forEach(
            (event) => event.sound && audioRef.current?.play(event.sound),
          );
        if (events.some((event) => event.kind !== "sound"))
          save(persistGame(profileRef.current, model));
        if (previousStatus !== model.status) {
          controls.clear();
          setTouchActive(false);
          previousStatus = model.status;
          refresh();
        }
      },
      () => {
        const model = gameRef.current;
        if (!model) return;
        const now = performance.now();
        const settings = profileRef.current.settings;
        if (!settings.lowEffects || now - lastDrawRef.current >= 32) {
          context.setTransform(scale, 0, 0, scale, 0, 0);
          renderGame(context, model, settings, backdropRef.current);
          lastDrawRef.current = now;
        }
        audioRef.current?.setActive(
          model.status === "running",
          Boolean(model.boss),
        );
        if (now - lastHud >= 90) {
          lastHud = now;
          refresh();
        }
      },
    );
    runtimeRef.current = runtime;
    runtime.start();
    const interrupt = () => {
      const model = gameRef.current;
      if (model) pauseGame(model);
      inputRef.current?.clear();
      setTouchActive(false);
      audioRef.current?.setActive(false);
      runtime.reset();
      refresh();
    };
    const visibility = () => {
      if (document.hidden) interrupt();
      else runtime.reset();
    };
    window.addEventListener("blur", interrupt);
    window.addEventListener("orientationchange", interrupt);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      runtime.dispose();
      audioRef.current?.dispose();
      window.removeEventListener("blur", interrupt);
      window.removeEventListener("orientationchange", interrupt);
      document.removeEventListener("visibilitychange", visibility);
      inputRef.current?.clear();
    };
  }, [refresh, save]);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) {
        backdropRef.current = image;
        setAssetError(false);
      }
    };
    image.onerror = () => {
      if (!cancelled) setAssetError(true);
    };
    image.src = "/space-impact/orbit.webp";
    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [assetAttempt]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (panel && dialog && !dialog.open) dialog.showModal();
    if (!panel && dialog?.open) dialog.close();
  }, [panel]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const model = gameRef.current;
      const target = event.target as HTMLElement;
      if (
        !model ||
        panel ||
        target.closest(
          "input, textarea, select, button, a, [contenteditable=true]",
        ) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (event.code === "Escape" || event.code === "KeyP") {
        event.preventDefault();
        if (event.repeat) return;
        if (model.status === "running" || model.status === "countdown")
          pauseGame(model);
        else if (model.status === "paused") {
          resumeGame(model);
          audioRef.current?.unlock();
        }
        inputRef.current?.clear();
        runtimeRef.current?.reset();
        refresh();
        return;
      }
      if (model.status !== "running") return;
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "Space",
          "KeyE",
          "KeyF",
        ].includes(event.code)
      ) {
        event.preventDefault();
        if (!event.repeat || !["Space", "KeyE"].includes(event.code))
          inputRef.current?.keyDown(event.code);
      }
    };
    const up = (event: KeyboardEvent) => inputRef.current?.keyUp(event.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [panel, refresh]);

  const begin = (mode: Mode = "campaign", sector = 0, resume = false) => {
    const p = profileRef.current;
    const checkpoint = resume ? p.checkpoint : null;
    const seed =
      mode === "challenge"
        ? hashSeed("lost-signal-1:" + new Date().toISOString().slice(0, 10))
        : checkpoint?.seed ?? 331042;
    const game = createGame(
      p,
      mode,
      checkpoint?.sector ?? sector,
      seed,
      checkpoint,
    );
    gameRef.current = game;
    startGame(game);
    inputRef.current?.clear();
    runtimeRef.current?.reset();
    setPanel(null);
    setShareMessage("");
    audioRef.current?.unlock();
    refresh();
    // Move keyboard focus away from the start button so Space becomes a gameplay action.
    canvasRef.current?.focus({ preventScroll: true });
  };
  const openPanel = (kind: Panel) => {
    if (gameRef.current) pauseGame(gameRef.current);
    inputRef.current?.clear();
    setTouchActive(false);
    setCode("");
    setCodeFeedback("");
    setPanel(kind);
    refresh();
  };
  const settings = (patch: Partial<Settings>) => {
    const next = updateSettings(profileRef.current, patch);
    save(next);
    audioRef.current?.configure(next.settings);
  };
  const toTitle = () => {
    const old = gameRef.current;
    if (old) save(persistGame(profileRef.current, old));
    gameRef.current = createGame(profileRef.current);
    inputRef.current?.clear();
    runtimeRef.current?.reset();
    setCode("");
    refresh();
  };
  const togglePause = () => {
    const game = gameRef.current;
    if (!game) return;
    if (game.status === "paused") {
      resumeGame(game);
      audioRef.current?.unlock();
      canvasRef.current?.focus({ preventScroll: true });
    } else pauseGame(game);
    inputRef.current?.clear();
    runtimeRef.current?.reset();
    refresh();
  };
  const down = (event: PointerEvent<HTMLElement>) => {
    if (gameRef.current?.status !== "running" || panel) return;
    if (
      inputRef.current?.pointerDown(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      })
    ) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setTouchActive(true);
      event.currentTarget.focus({ preventScroll: true });
    }
  };
  const move = (event: PointerEvent<HTMLElement>) => {
    const scale =
      (canvasRef.current?.getBoundingClientRect().width || WIDTH) / WIDTH;
    inputRef.current?.pointerMove(
      event.pointerId,
      { x: event.clientX, y: event.clientY },
      scale,
      profileRef.current.settings.control,
    );
  };
  const up = (event: PointerEvent<HTMLElement>) => {
    inputRef.current?.pointerUp(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setTouchActive(false);
    }
  };
  const cancel = (event: PointerEvent<HTMLElement>) => {
    up(event);
    inputRef.current?.clear();
    if (gameRef.current) pauseGame(gameRef.current);
    refresh();
  };
  const transmit = () => {
    if (panel === "receiver") {
      if (code === "3310") {
        const value = profileRef.current;
        save({
          ...value,
          secrets: Array.from(new Set([...value.secrets, "lcd" as const])),
          settings: { ...value.settings, skin: "lcd" },
        });
        audioRef.current?.configure(profileRef.current.settings);
        if (gameRef.current && !gameRef.current.secrets.includes("lcd"))
          gameRef.current.secrets.push("lcd");
        setCodeFeedback("3310 connected. LCD display unlocked.");
      } else
        setCodeFeedback("Only static. The recovered numbers were 33 / 10.");
    } else if (gameRef.current && submitCode(gameRef.current, code)) {
      inputRef.current?.clear();
      runtimeRef.current?.reset();
      setCode("");
      setCodeFeedback("");
      audioRef.current?.unlock();
      refresh();
    } else
      setCodeFeedback("No response. Try the sequence in the transmission.");
  };
  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen?.();
    } catch {
      setShareMessage("Fullscreen is unavailable. You can keep playing here.");
    }
  };
  const downloadCard = async () => {
    const game = gameRef.current;
    if (!game) return;
    try {
      const blob = await createFlightCard(game);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "lost-signal-flight.png";
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareMessage("Flight card ready. Carry the signal with you.");
    } catch {
      setShareMessage(
        "The flight card could not be created. Your score is still saved.",
      );
    }
  };
  const share = async () => {
    const game = gameRef.current;
    if (!game) return;
    const text =
      "Lost Signal — " +
      game.score.toLocaleString() +
      " points, " +
      SECTORS[game.sector].name +
      ". Follow the transmission.";
    const url = window.location.origin + "/arcade/space-impact";
    try {
      if (navigator.share)
        await navigator.share({ title: "Lost Signal", text, url });
      else {
        await navigator.clipboard.writeText(text + " " + url);
        setShareMessage("Run copied. Send it to a fellow pilot.");
      }
    } catch {
      setShareMessage("Your run is saved on this device.");
    }
  };
  const game = gameRef.current;
  const state = game?.status ?? "ready";
  const sector = SECTORS[game?.sector ?? 0];
  const running = state === "running" || state === "countdown";
  const title = state === "ready";
  const weapon = WEAPONS[game?.player.weapon ?? "pulse"];
  const ending = endings[game?.ending ?? "home"];
  const pointerEvents = {
    onPointerDown: down,
    onPointerMove: move,
    onPointerUp: up,
    onPointerCancel: cancel,
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
      if (inputRef.current?.pointerUp(event.pointerId)) {
        inputRef.current.clear();
        setTouchActive(false);
        if (gameRef.current) pauseGame(gameRef.current);
        refresh();
      }
    },
  };
  const keypad = (relay = false) => (
    <div className={styles.receiver}>
      <output aria-label="Transmission code" className={styles.code}>
        {relay
          ? code
              .split("")
              .map((n) => RELAY_SEQUENCE[Number(n) - 1])
              .join("  ") || "—  —  —"
          : code || "— — — —"}
      </output>
      <div className={styles.keypad} data-relay={relay}>
        {(relay
          ? ["1", "2", "3"]
          : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
        ).map((n) => (
          <button
            type="button"
            key={n}
            onClick={() =>
              setCode((value) => (value + n).slice(-(relay ? 3 : 4)))
            }
          >
            {relay ? RELAY_SEQUENCE[Number(n) - 1] : n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCode("")}
          aria-label="Clear code"
        >
          <RotateCcw size={18} />
        </button>
        <button type="button" onClick={transmit} aria-label="Transmit code">
          <ArrowRight size={18} />
        </button>
      </div>
      {codeFeedback && <p role="status">{codeFeedback}</p>}
    </div>
  );

  return (
    <main
      ref={rootRef}
      className={styles.game}
      data-skin={profile.settings.skin}
      data-left-handed={profile.settings.leftHanded}
      data-state={state}
    >
      <header className={styles.header}>
        <Link href="/#maker-lab" className={styles.back}>
          <ArrowLeft size={16} />
          <span>Portfolio</span>
        </Link>
        <span className={styles.wordmark}>
          SS<span>/</span> LOST SIGNAL
        </span>
        <div className={styles.headerActions}>
          <button
            type="button"
            aria-label={profile.settings.muted ? "Unmute audio" : "Mute audio"}
            onClick={() => {
              settings({ muted: !profile.settings.muted });
              audioRef.current?.unlock();
            }}
          >
            {profile.settings.muted ? (
              <VolumeX size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>
          <button type="button" aria-label="Fullscreen" onClick={fullscreen}>
            <Expand size={18} />
          </button>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => openPanel("settings")}
          >
            <Settings2 size={18} />
          </button>
        </div>
      </header>

      <div className={styles.cabinet}>
        <div className={styles.instrumentBar}>
          <div className={styles.sectorLabel}>
            <span>
              {title ? "SPACE IMPACT" : "SECTOR 0" + ((game?.sector ?? 0) + 1)}
            </span>
            <strong>
              {title ? "A transmission from the outer dark" : sector.name}
            </strong>
          </div>
          <div className={styles.telemetry}>
            <span className={styles.score}>
              {String(game?.score ?? 0).padStart(6, "0")}
              <small> SCORE</small>
            </span>
            <div
              className={styles.hull}
              aria-label={(game?.player.hull ?? 3) + " hull remaining"}
            >
              {Array.from({ length: game?.player.maxHull ?? 3 }, (_, i) => (
                <Heart
                  key={i}
                  size={15}
                  fill={i < (game?.player.hull ?? 3) ? "currentColor" : "none"}
                  opacity={i < (game?.player.hull ?? 3) ? 1 : 0.28}
                />
              ))}
            </div>
            {!title && (
              <button
                type="button"
                aria-label={state === "paused" ? "Resume game" : "Pause game"}
                onClick={togglePause}
                disabled={!running && state !== "paused"}
              >
                {state === "paused" ? <Play size={18} /> : <Pause size={18} />}
              </button>
            )}
          </div>
        </div>

        <div className={styles.viewport}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            tabIndex={0}
            aria-label="Lost Signal playfield. Move with arrow keys or WASD, Space to pulse, E to inspect, F to hold fire, P to pause."
            {...pointerEvents}
          />
          {!loaded && (
            <div className={styles.boot} role="status">
              Tuning the receiver…
            </div>
          )}
          {running && game?.boss && !game.bossDefeated && (
            <div className={styles.bossHud}>
              <span>
                {sector.bossName}
                {game.boss.truePhase ? " / The real signal" : ""}
                <small>PHASE {game.boss.phase}</small>
              </span>
              <div>
                <i
                  style={{
                    width: clampPercent(game.boss.hp / game.boss.maxHp),
                  }}
                />
              </div>
            </div>
          )}
          {state === "running" && game?.message && (
            <div className={styles.transmission} key={game.message.title}>
              <Radio size={14} />
              <div>
                <strong>{game.message.title}</strong>
                <span>{game.message.text}</span>
              </div>
            </div>
          )}
          {state === "running" && game?.hint && (
            <div className={styles.contextHint}>{game.hint}</div>
          )}
          {state === "countdown" && (
            <div className={styles.countdown} aria-live="polite">
              <span>RECONNECTING</span>
              <strong>{Math.max(1, Math.ceil(game?.countdown ?? 1))}</strong>
            </div>
          )}

          {loaded && !running && (
            <div className={styles.overlay} data-state={state}>
              {title ? (
                <div className={styles.titleScreen}>
                  <span className={styles.eyebrow}>
                    AN ORIGINAL POCKET SPACE ADVENTURE
                  </span>
                  <h1>
                    LOST
                    <br />
                    <span>SIGNAL</span>
                    <i aria-hidden="true">_</i>
                  </h1>
                  <p>
                    One small ship.
                    <br />
                    Something enormous is listening.
                  </p>
                  <div className={styles.titleActions}>
                    <button
                      type="button"
                      className={styles.primary}
                      onClick={() => begin()}
                    >
                      <Play size={16} fill="currentColor" />
                      Begin transmission
                    </button>
                    {profile.checkpoint && (
                      <button
                        type="button"
                        className={styles.resume}
                        onClick={() => begin("campaign", 0, true)}
                      >
                        Continue · 0{profile.checkpoint.sector + 1}
                        <ChevronRight size={15} />
                      </button>
                    )}
                  </div>
                  <span className={styles.titleHint}>
                    Drag to move · weapons fire automatically
                  </span>
                </div>
              ) : state === "console" ? (
                <div className={styles.consolePanel}>
                  <Radio size={22} />
                  <h2>
                    {game?.console === "relay"
                      ? "The relay is listening."
                      : "Destination not found."}
                  </h2>
                  <p>
                    {game?.console === "relay"
                      ? "Answer the three voices: △  ○  ◇"
                      : "The beacon reports error 404. Can you recover its route?"}
                  </p>
                  {keypad(game?.console === "relay")}
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => {
                      if (!game) return;
                      if (game.console === "relay") declineRelay(game);
                      else {
                        game.console = null;
                        game.status = "countdown";
                        game.countdown = 2;
                      }
                      setCode("");
                      refresh();
                    }}
                  >
                    {game?.console === "relay"
                      ? "Turn toward home"
                      : "Leave the beacon"}
                  </button>
                </div>
              ) : (
                <div className={styles.statusPanel}>
                  <span className={styles.eyebrow}>
                    {state === "victory"
                      ? "END OF TRANSMISSION"
                      : statusLabel[state].toUpperCase()}
                  </span>
                  <h2>
                    {state === "paused"
                      ? "The stars can wait."
                      : state === "dead"
                        ? "Your echo remains."
                        : state === "cleared"
                          ? sector.name + ", recovered."
                          : ending.title}
                  </h2>
                  <p>
                    {state === "paused"
                      ? "Take a breath. Your ship is safe here."
                      : state === "dead"
                        ? "A new route. A little more patience. One more attempt."
                        : state === "cleared"
                          ? game?.mode === "practice"
                            ? "Pattern understood. Ready to try the whole journey?"
                            : "The next voice is a little clearer. One hull segment restored on departure."
                          : ending.copy}
                  </p>
                  {(state === "dead" ||
                    state === "victory" ||
                    state === "cleared") && (
                    <div className={styles.resultStats}>
                      <span>
                        <strong>{game?.score.toLocaleString()}</strong>Score
                      </span>
                      <span>
                        <strong>{game?.grazes ?? 0}</strong>Near misses
                      </span>
                      <span>
                        <strong>{game?.secrets.length ?? 0}/8</strong>Signals
                        found
                      </span>
                    </div>
                  )}
                  <div className={styles.actionRow}>
                    {state === "paused" && (
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={togglePause}
                      >
                        <Play size={16} />
                        Resume
                      </button>
                    )}
                    {state === "dead" && (
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() =>
                          begin(
                            game?.mode,
                            game?.mode === "practice" ? game.sector : 0,
                            game?.mode === "campaign" &&
                              Boolean(profile.checkpoint),
                          )
                        }
                      >
                        <RotateCcw size={16} />
                        {game?.mode === "campaign"
                          ? "Retry sector"
                          : "Try again"}
                      </button>
                    )}
                    {state === "cleared" && game?.mode !== "practice" && (
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={() => {
                          if (game) nextSector(game);
                          inputRef.current?.clear();
                          runtimeRef.current?.reset();
                          audioRef.current?.unlock();
                          canvasRef.current?.focus({ preventScroll: true });
                          refresh();
                        }}
                      >
                        Follow the signal
                        <ArrowRight size={16} />
                      </button>
                    )}
                    {state === "victory" && (
                      <button
                        type="button"
                        className={styles.primary}
                        onClick={share}
                      >
                        Share your run
                        <ArrowRight size={16} />
                      </button>
                    )}
                    {(state === "victory" || state === "dead") && (
                      <button
                        type="button"
                        className={styles.secondary}
                        onClick={downloadCard}
                      >
                        <Download size={16} /> Save flight card
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={toTitle}
                    >
                      Return to receiver
                    </button>
                  </div>
                  {state === "victory" && game?.companion && (
                    <p>
                      Your little companion blinks once. This time, you know
                      what it means.
                    </p>
                  )}
                  {game?.assist && (
                    <span className={styles.assistLabel}>
                      Assisted flight · scores saved separately
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          <div className={styles.cornerTL} aria-hidden="true" />
          <div className={styles.cornerBR} aria-hidden="true" />
        </div>

        <div className={styles.lowerBar}>
          <span>
            <i className={styles.connectionLight} data-active={running} />
            {statusLabel[state]}
          </span>
          <span>
            {!title
              ? weapon.name + " / L" + (game?.player.level ?? 1)
              : "5 SECTORS / 8 HIDDEN SIGNALS"}
          </span>
          <span className={styles.version}>VOL. 01 — SHANTANU SOAM</span>
        </div>

        {running ? (
          <div className={styles.controlDeck} data-active={touchActive}>
            <div
              className={styles.touchpad}
              tabIndex={0}
              role="group"
              aria-label="Drag here to steer the ship"
              {...pointerEvents}
            >
              <Crosshair size={30} strokeWidth={1} />
              <span>
                {touchActive
                  ? "CONNECTED"
                  : profile.settings.control === "stick"
                    ? "VIRTUAL STICK"
                    : "DRAG TO STEER"}
              </span>
              <small>Your thumb stays out of the stars.</small>
            </div>
            <div className={styles.specialControls}>
              <button
                type="button"
                className={styles.pulseButton}
                data-ready={(game?.player.charge ?? 0) >= 100}
                disabled={
                  (game?.player.charge ?? 0) < 100 || state !== "running"
                }
                onClick={() => {
                  inputRef.current?.pulse();
                  canvasRef.current?.focus({ preventScroll: true });
                }}
              >
                <Zap size={22} />
                <span>
                  PHASE PULSE
                  <small>{Math.floor(game?.player.charge ?? 0)} / 100</small>
                </span>
                <i
                  style={{
                    width: clampPercent((game?.player.charge ?? 0) / 100),
                  }}
                />
              </button>
              <div className={styles.smallControls}>
                <button
                  type="button"
                  aria-pressed={inputRef.current?.ceaseFire ?? false}
                  onClick={() => {
                    if (inputRef.current)
                      inputRef.current.ceaseFire = !inputRef.current.ceaseFire;
                    refresh();
                  }}
                >
                  <Shield size={15} />
                  {inputRef.current?.ceaseFire ? "Firing off" : "Hold fire"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    inputRef.current?.interact();
                    canvasRef.current?.focus({ preventScroll: true });
                  }}
                  disabled={!game?.hint || state !== "running"}
                >
                  <Radio size={15} />
                  Inspect
                </button>
              </div>
            </div>
            <div className={styles.keyboardHelp}>
              <span>
                <kbd>W A S D</kbd> / drag to move
              </span>
              <span>
                <kbd>SPACE</kbd> pulse
              </span>
              <span>
                <kbd>E</kbd> inspect · <kbd>F</kbd> hold fire
              </span>
            </div>
          </div>
        ) : (
          <nav className={styles.dock} aria-label="Arcade menu">
            <button type="button" onClick={() => openPanel("sectors")}>
              <Crosshair size={17} />
              <span>Flight paths</span>
            </button>
            <button type="button" onClick={() => openPanel("journal")}>
              <BookOpen size={17} />
              <span>Signal archive</span>
              <small>{profile.secrets.length}/8</small>
            </button>
            <button type="button" onClick={() => openPanel("receiver")}>
              <Radio size={17} />
              <span>Receiver</span>
            </button>
            <button type="button" onClick={() => openPanel("settings")}>
              <Settings2 size={17} />
              <span>Settings</span>
            </button>
          </nav>
        )}
      </div>

      <footer className={styles.footer}>
        <span>Made for the curious.</span>
        <span>
          Best on this device:{" "}
          {(
            profile.best[
              "campaign" + (profile.settings.assist ? ":assist" : ":standard")
            ] ?? 0
          ).toLocaleString()}
        </span>
      </footer>
      {(storageWarning || assetError || shareMessage) && (
        <div className={styles.notice} role="status">
          {storageWarning ? (
            "This browser cannot save progress. You can still play."
          ) : assetError ? (
            <>
              <span>The distant backdrop could not load.</span>
              <button
                type="button"
                onClick={() => setAssetAttempt((n) => n + 1)}
              >
                Retry
              </button>
            </>
          ) : (
            shareMessage
          )}
        </div>
      )}

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        onCancel={() => setPanel(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}
        aria-labelledby="signal-panel-title"
      >
        <div className={styles.dialogContent}>
          <header className={styles.dialogHeader}>
            <span className={styles.eyebrow}>LOST SIGNAL / RECEIVER</span>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => setPanel(null)}
            >
              <X size={20} />
            </button>
          </header>
          <h2 id="signal-panel-title">
            {panel === "settings"
              ? "Tune your flight."
              : panel === "journal"
                ? "Signals in the static."
                : panel === "sectors"
                  ? "Choose a flight path."
                  : "Is anybody there?"}
          </h2>
          {panel === "settings" && (
            <div className={styles.settings}>
              <label className={styles.range}>
                <span>
                  <Music2 size={16} />
                  Music
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={profile.settings.music}
                  onChange={(event) =>
                    settings({ music: Number(event.target.value) })
                  }
                />
              </label>
              <label className={styles.range}>
                <span>
                  <Volume2 size={16} />
                  Effects
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={profile.settings.effects}
                  onChange={(event) =>
                    settings({ effects: Number(event.target.value) })
                  }
                />
              </label>
              <label className={styles.select}>
                <span>Steering</span>
                <select
                  value={profile.settings.control}
                  onChange={(event) =>
                    settings({
                      control: event.target.value as Settings["control"],
                    })
                  }
                >
                  <option value="drag">Relative drag</option>
                  <option value="stick">Virtual stick</option>
                </select>
              </label>
              <label className={styles.select}>
                <span>Display</span>
                <select
                  value={profile.settings.skin}
                  onChange={(event) =>
                    settings({ skin: event.target.value as Settings["skin"] })
                  }
                >
                  <option value="color">Remastered color</option>
                  <option
                    value="lcd"
                    disabled={!profile.secrets.includes("lcd")}
                  >
                    LCD green
                    {!profile.secrets.includes("lcd")
                      ? " · unknown frequency"
                      : ""}
                  </option>
                </select>
              </label>
              {(
                [
                  [
                    "assist",
                    "Assisted flight",
                    "Five hull segments and gentler attacks. Applies to your next flight.",
                  ],
                  [
                    "leftHanded",
                    "Left-handed controls",
                    "Move the pulse controls to the other side.",
                  ],
                  [
                    "reducedMotion",
                    "Reduce motion",
                    "No shake or moving background stars.",
                  ],
                  [
                    "lowFlashes",
                    "Reduce flashes",
                    "Keep attack warnings; soften full-screen effects.",
                  ],
                  [
                    "highContrast",
                    "High-contrast projectiles",
                    "Brighter hostile shots and a visible ship hitbox.",
                  ],
                  [
                    "lowEffects",
                    "Battery saver",
                    "Fewer decorative effects; render at 30 FPS.",
                  ],
                ] as const
              ).map(([key, label, description]) => (
                <label className={styles.toggle} key={key}>
                  <span>
                    <strong>{label}</strong>
                    <small>{description}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={profile.settings[key]}
                    onChange={(event) =>
                      settings({ [key]: event.target.checked })
                    }
                  />
                </label>
              ))}
            </div>
          )}
          {panel === "journal" && (
            <div className={styles.journal}>
              <p>
                {profile.secrets.length} of 8 signals recovered. Curiosity
                leaves a trace.
              </p>
              {SECRETS.map((secret, index) => {
                const found = profile.secrets.includes(secret.id);
                const hint = revealedHints.includes(secret.id);
                return (
                  <article key={secret.id} data-found={found}>
                    <span className={styles.journalNumber}>
                      {found ? (
                        <Check size={16} />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <div>
                      <h3>{found ? secret.name : "Unknown signal"}</h3>
                      <p>{found ? secret.reward : secret.clue}</p>
                      {!found && (
                        <button
                          type="button"
                          className={styles.hintButton}
                          onClick={() =>
                            setRevealedHints((items) => [...items, secret.id])
                          }
                        >
                          <HelpCircle size={14} />
                          {hint ? secret.hint : "Reveal a hint"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
              {profile.secrets.includes("cluck") && (
                <Link className={styles.secondary} href="/?arcade=cluck">
                  Open the Cluckstorm cartridge
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
          {panel === "sectors" && (
            <div className={styles.flightPaths}>
              <button
                type="button"
                className={styles.modeCard}
                onClick={() => begin("arcade")}
              >
                <span>
                  <strong>Arcade flight</strong>
                  <small>The whole journey. One ship. A fresh score.</small>
                </span>
                <ArrowRight size={20} />
              </button>
              <button
                type="button"
                className={styles.modeCard}
                onClick={() => begin("challenge")}
              >
                <span>
                  <strong>Daily transmission</strong>
                  <small>
                    Three minutes. Today&apos;s shared seed. Local scores.
                  </small>
                </span>
                <ArrowRight size={20} />
              </button>
              <h3>Boss practice</h3>
              {SECTORS.map((item, index) => (
                <button
                  type="button"
                  className={styles.sectorCard}
                  key={item.id}
                  disabled={index > profile.highestSector}
                  onClick={() => begin("practice", index)}
                >
                  <span className={styles.sectorIndex}>0{index + 1}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {index <= profile.highestSector
                        ? item.bossName
                        : "Follow the campaign signal to unlock."}
                    </small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          )}
          {panel === "receiver" && (
            <>
              <p className={styles.receiverCopy}>
                An old frequency is still alive. The recovered numbers were{" "}
                <strong>33 / 10</strong>.
              </p>
              {keypad()}
            </>
          )}
        </div>
      </dialog>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {state === "running" ? game?.hint || "" : statusLabel[state]}
      </span>
    </main>
  );
}

function clampPercent(value: number): string {
  return Math.max(0, Math.min(100, value * 100)) + "%";
}
