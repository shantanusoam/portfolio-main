"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { GameAudio, type AudioStatus } from "@/lib/space-impact/audio";
import { SECTORS } from "@/lib/space-impact/content/sectors";
import { nextSector } from "@/lib/space-impact/director";
import { InputController } from "@/lib/space-impact/input";
import {
  createGame,
  pauseGame,
  resumeGame,
  startGame,
} from "@/lib/space-impact/model";
import { updateGame } from "@/lib/space-impact/update";
import { createRuntime } from "@/lib/space-impact/runtime";
import type { Game, Mode, Profile } from "@/lib/space-impact/types";
import { getAtlas } from "@/lib/space-impact/pocket/atlas";
import { READABILITY_FLOOR } from "@/lib/space-impact/pocket/fit";
import {
  createPocketRenderer,
  type PocketRenderer,
} from "@/lib/space-impact/pocket/renderer";
import {
  emptyPocketSave,
  persistPocketGame,
  readPocketSave,
  writePocketSave,
  type PocketSave,
  type PocketSettings,
} from "@/lib/space-impact/pocket/save";
import styles from "./PocketEdition.module.css";

type Panel = "none" | "settings" | "help";

function profileOf(save: PocketSave): Profile {
  return {
    version: 1,
    settings: save.settings,
    secrets: [],
    highestSector: save.checkpoint?.sector ?? 0,
    best: save.best,
    checkpoint: save.checkpoint,
    ghost: null,
    completed: false,
  };
}

function Hearts({
  save,
  hull,
  maxHull,
}: {
  save: PocketSave;
  hull: number;
  maxHull: number;
}) {
  const [sources, setSources] = useState<{
    full: string;
    empty: string;
  } | null>(null);
  useEffect(() => {
    const atlas = getAtlas(
      save.settings.preset === "crt" ? "phosphor" : save.settings.palette,
    );
    setSources({
      full: atlas.heartFull.canvas.toDataURL(),
      empty: atlas.heartEmpty.canvas.toDataURL(),
    });
  }, [save.settings.palette, save.settings.preset]);
  if (!sources) return null;
  return (
    <span className={styles.hearts} aria-label={`Hull ${hull} of ${maxHull}`}>
      {Array.from({ length: maxHull }, (_, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={index}
          src={index < hull ? sources.full : sources.empty}
          alt=""
          width={21}
          height={18}
          className={styles.heart}
        />
      ))}
    </span>
  );
}

export default function PocketEdition() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const saveRef = useRef<PocketSave>(emptyPocketSave());
  const inputRef = useRef<InputController | null>(null);
  const audioRef = useRef<GameAudio | null>(null);
  const rendererRef = useRef<PocketRenderer | null>(null);
  const runtimeRef = useRef<ReturnType<typeof createRuntime> | null>(null);
  const holdRef = useRef(false);
  const audioGesture = useRef(0);
  const transmissionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [save, setSaveState] = useState<PocketSave>(emptyPocketSave);
  const [, setRevision] = useState(0);
  const [panel, setPanel] = useState<Panel>("none");
  const [floorWarning, setFloorWarning] = useState(false);
  // Let the breakup frames + sparks play before the game-over curtain lands.
  const [deathReveal, setDeathReveal] = useState(false);
  const [fps, setFps] = useState(0);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>("locked");
  const [storageWarning, setStorageWarning] = useState(false);
  const [transmission, setTransmission] = useState<string | null>(null);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  const applySettings = useCallback((settings: PocketSettings) => {
    saveRef.current = { ...saveRef.current, settings };
    setSaveState(saveRef.current);
    setStorageWarning(!writePocketSave(saveRef.current));
    audioRef.current?.configure(settings);
    rendererRef.current?.setPreset(settings.preset, settings.palette);
  }, []);

  const activateAudio = useCallback((feedback = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    // Keep activation synchronous with the click/pointer event.
    const gesture = audioGesture.current;
    audio.unlock().then((running) => {
      if (
        running &&
        feedback &&
        audioRef.current === audio &&
        gesture === audioGesture.current &&
        !document.hidden
      )
        audio.play("pickup");
    });
  }, []);
  const toggleSound = () => {
    const settings = saveRef.current.settings;
    if (settings.muted || audioRef.current?.status !== "running") {
      applySettings({ ...settings, muted: false });
      activateAudio(true);
    } else applySettings({ ...settings, muted: true });
  };
  const announce = useCallback((message: string | null) => {
    if (transmissionTimer.current) clearTimeout(transmissionTimer.current);
    setTransmission(message);
    transmissionTimer.current = setTimeout(() => setTransmission(null), 4200);
  }, []);
  useEffect(() => {
    const saved = readPocketSave();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      saved.settings.reducedMotion = true;
    saveRef.current = saved;
    setSaveState(saved);
    const game = createGame(
      profileOf(saved),
      "campaign",
      saved.checkpoint?.sector ?? 0,
      saved.checkpoint?.seed ?? 331042,
      saved.checkpoint,
    );
    gameRef.current = game;
    inputRef.current = new InputController(
      () => gameRef.current?.player ?? { x: 86, y: 135 },
    );
    audioRef.current = new GameAudio(saved.settings, setAudioStatus);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createPocketRenderer(canvas);
    rendererRef.current = renderer;

    const resize = () => {
      const stage = stageRef.current;
      if (!stage) return;
      // The fit applies to the stage's content box: reserved control
      // columns and insets are never offered to the world.
      const rect = stage.getBoundingClientRect();
      const pad = getComputedStyle(stage);
      const availWidth =
        rect.width -
        parseFloat(pad.paddingLeft || "0") -
        parseFloat(pad.paddingRight || "0");
      const availHeight =
        rect.height -
        parseFloat(pad.paddingTop || "0") -
        parseFloat(pad.paddingBottom || "0");
      const fit = renderer.resize(
        Math.max(120, availWidth),
        Math.max(90, availHeight),
        window.devicePixelRatio || 1,
      );
      const blocked = fit.floorFailed || fit.cssWidth < READABILITY_FLOOR - 0.5;
      setFloorWarning(blocked);
      if (blocked && gameRef.current && gameRef.current.status === "running") {
        pauseGame(gameRef.current);
        audioGesture.current++;
        audioRef.current?.suspendPlayback();
      }
      inputRef.current?.clear();
      runtimeRef.current?.reset();
      renderer.resetHistory();
      refresh();
    };
    const observer = new ResizeObserver(resize);
    if (stageRef.current) observer.observe(stageRef.current);
    window.addEventListener("orientationchange", resize);
    resize();

    let previousStatus = game.status;
    let lastHud = 0;
    let announcedSector = -1;
    const runtime = createRuntime(
      () => {
        const model = gameRef.current;
        const controls = inputRef.current;
        if (!model || !controls) return;
        controls.ceaseFire = holdRef.current;
        const input = controls.sample();
        (model as Game & { lastInput?: unknown }).lastInput = input;
        updateGame(model, input);
        // Stop music before terminal effects so their fanfare can finish.
        audioRef.current?.setActive(
          model.status === "running",
          Boolean(model.boss?.awakened),
        );
        const events = model.events.splice(0);
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
        if (events.some((event) => event.kind !== "sound")) {
          saveRef.current = persistPocketGame(saveRef.current, model);
          setStorageWarning(!writePocketSave(saveRef.current));
        }
        if (previousStatus !== model.status) {
          if (model.status === "running" && announcedSector !== model.sector) {
            announcedSector = model.sector;
            announce(SECTORS[model.sector]?.transmission ?? null);
          }
          controls.clear();
          previousStatus = model.status;
          refresh();
        }
      },
      () => {
        const now = performance.now();
        const model = gameRef.current;
        const controls = inputRef.current;
        if (!model || !controls) return;
        const input =
          ((model as Game & { lastInput?: unknown }).lastInput as ReturnType<
            InputController["sample"]
          >) ?? controls.sample();
        renderer.render(
          model,
          input,
          saveRef.current.settings,
          saveRef.current.settings.preset,
          saveRef.current.settings.palette,
          now,
        );
        const perf = renderer.perf();
        (window as unknown as { __pocketPerf?: unknown }).__pocketPerf = perf;
        (window as unknown as { __pocketGame?: unknown }).__pocketGame = model;
        // Keep the receiver readouts just beneath the world inside the thumb void.
        const stage = stageRef.current;
        const world = canvasRef.current;
        if (stage && world) {
          const stageTop = stage.getBoundingClientRect().top;
          const worldBottom = world.getBoundingClientRect().bottom;
          const panel = stage.querySelector<HTMLElement>(
            "." + styles.voidPanel,
          );
          if (panel)
            panel.style.top = `${Math.round(worldBottom - stageTop + 14)}px`;
        }
        if (now - lastHud >= 500) {
          lastHud = now;
          setFps(perf.fps);
        }
      },
    );
    runtimeRef.current = runtime;
    runtime.start();

    const keyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target?.closest("input, select, textarea") ||
        (target?.closest("button, a") &&
          ["Space", "Enter"].includes(event.code))
      )
        return;
      const model = gameRef.current;
      if (event.code === "Escape" && model?.status === "running") {
        pauseGame(model);
        audioGesture.current++;
        audioRef.current?.suspendPlayback();
        inputRef.current?.clear();
        refresh();
        return;
      }
      if (model?.status !== "running") return;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          event.code,
        )
      )
        event.preventDefault();
      inputRef.current?.keyDown(event.code);
      if (event.code === "Enter" || event.code === "KeyE")
        inputRef.current?.interact();
    };
    const keyUp = (event: KeyboardEvent) => inputRef.current?.keyUp(event.code);
    const interrupt = () => {
      audioGesture.current++;
      const model = gameRef.current;
      if (model && model.status === "running") pauseGame(model);
      inputRef.current?.clear();
      holdRef.current = false;
      audioRef.current?.suspendPlayback();
      runtimeRef.current?.reset();
      refresh();
    };
    const visibility = () => {
      if (document.hidden) interrupt();
      else runtime.reset();
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      if (transmissionTimer.current) clearTimeout(transmissionTimer.current);
      observer.disconnect();
      window.removeEventListener("orientationchange", resize);
      runtime.dispose();
      renderer.dispose();
      audioRef.current?.dispose();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", visibility);
      inputRef.current?.clear();
    };
  }, [refresh, announce]);

  const game = gameRef.current;

  const startRun = useCallback(
    (mode: Mode) => {
      activateAudio(true);
      const model = createGame(profileOf(saveRef.current), mode, 0, 331042);
      gameRef.current = model;
      inputRef.current?.clear();
      holdRef.current = false;
      startGame(model);
      runtimeRef.current?.reset();
      announce(SECTORS[model.sector]?.transmission ?? null);
      refresh();
    },
    [refresh, activateAudio, announce],
  );

  const continueRun = useCallback(() => {
    activateAudio();
    const model = gameRef.current;
    if (!model) return;
    resumeGame(model);
    inputRef.current?.clear();
    runtimeRef.current?.reset();
    refresh();
  }, [refresh, activateAudio]);

  const down = (event: ReactPointerEvent<HTMLElement>) => {
    const canvas = canvasRef.current;
    const model = gameRef.current;
    if (!canvas || !model || model.status !== "running" || panel !== "none")
      return;
    inputRef.current?.pointerDown(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (audioRef.current?.status !== "running") activateAudio();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: ReactPointerEvent<HTMLElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / 480;
    inputRef.current?.pointerMove(
      event.pointerId,
      { x: event.clientX, y: event.clientY },
      scale,
      saveRef.current.settings.control,
    );
  };
  const up = (event: ReactPointerEvent<HTMLElement>) => {
    inputRef.current?.pointerUp(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const sector = game ? SECTORS[game.sector] : null;
  const status = game?.status ?? "ready";

  useEffect(() => {
    if (status !== "dead") {
      setDeathReveal(false);
      return;
    }
    const timer = window.setTimeout(() => setDeathReveal(true), 2800);
    return () => window.clearTimeout(timer);
  }, [status]);
  const hudVisible = status !== "ready";
  const soundLabel = save.settings.muted
    ? "SOUND OFF"
    : audioStatus === "running"
      ? save.settings.music === 0 && save.settings.effects === 0
        ? "VOLUME 0"
        : "SOUND ON"
      : audioStatus === "unavailable"
        ? "RETRY SOUND"
        : "ENABLE SOUND";

  return (
    <section
      ref={rootRef}
      className={`${styles.root} ${
        save.settings.leftHanded ? styles.leftHanded : ""
      }`}
      data-screen={save.settings.preset}
      data-comfort={save.settings.highContrast || save.settings.lowEffects}
      aria-label="Lost Signal Pocket Edition"
    >
      <div className={styles.handset}>
        <header className={styles.topbar}>
          <span className={styles.brand}>
            LOST SIGNAL <small>POCKET EDITION</small>
          </span>
          <span className={styles.topActions}>
            <button
              type="button"
              className={styles.chip}
              onClick={toggleSound}
              aria-label={
                save.settings.muted
                  ? "Enable sound"
                  : audioStatus === "running"
                    ? "Mute sound"
                    : "Activate sound"
              }
              aria-pressed={!save.settings.muted && audioStatus === "running"}
            >
              {soundLabel}
            </button>
            <button
              type="button"
              className={styles.chip}
              aria-label="Vintage CRT display"
              aria-pressed={save.settings.preset === "crt"}
              onClick={() =>
                applySettings({
                  ...save.settings,
                  preset: save.settings.preset === "crt" ? "pocket" : "crt",
                })
              }
            >
              {save.settings.preset === "crt" ? "CRT" : "LCD"}
            </button>
            <button
              type="button"
              className={styles.chip}
              onClick={() => {
                if (game && status === "running") {
                  pauseGame(game);
                  audioGesture.current++;
                  audioRef.current?.suspendPlayback();
                }
                setPanel(panel === "settings" ? "none" : "settings");
              }}
            >
              MENU
            </button>
          </span>
        </header>

        <div className={styles.hud} aria-hidden={false}>
          {game && hudVisible ? (
            <Hearts
              save={save}
              hull={game.player.hull}
              maxHull={game.player.maxHull}
            />
          ) : (
            <span className={styles.hudPlaceholder}>HULL</span>
          )}
          <span className={styles.hudScore}>
            {game && hudVisible
              ? String(game.score).padStart(6, "0")
              : "000000"}
          </span>
          <span className={styles.hudSector}>
            {sector && hudVisible
              ? `${(game?.sector ?? 0) + 1}·${sector.name.toUpperCase()}`
              : "STANDBY"}
          </span>
          <span
            className={styles.meter}
            title={`Presentation ${Math.round(fps)} fps`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <i
                key={index}
                className={
                  fps >= (index + 1) * 12 ? styles.meterOn : styles.meterOff
                }
              />
            ))}
          </span>
        </div>

        <div
          ref={stageRef}
          className={styles.stage}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <div className={styles.screenGlass}>
            <canvas
              ref={canvasRef}
              className={styles.world}
              aria-label="Space Impact flight area"
            />
          </div>
          {status === "countdown" && (
            <div className={styles.countdown} role="status">
              {game && game.countdown > 0.6 ? "READY" : "GO"}
            </div>
          )}
          {transmission && status === "running" && (
            <div className={styles.transmission}>{transmission}</div>
          )}
          {game?.hint && status === "running" && !transmission && (
            <div className={styles.hint}>{game.hint}</div>
          )}
          {floorWarning && (
            <div className={styles.floorWarning} role="alert">
              <strong>Screen too small for a fair fight.</strong>
              <p>Rotate to landscape or enlarge this window to continue.</p>
            </div>
          )}
          <div className={styles.voidPanel} aria-hidden="true">
            <span>
              BEST{" "}
              {String(
                save.best[
                  `campaign${save.settings.assist ? ":assist" : ":standard"}`
                ] ?? 0,
              ).padStart(6, "0")}
            </span>
            <span>CHECKPOINT S{(save.checkpoint?.sector ?? 0) + 1}</span>
            <span>RELAY {Math.round(fps)}Hz</span>
          </div>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.actionSecondary}
            onPointerDown={(event) => {
              holdRef.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={() => {
              holdRef.current = false;
              inputRef.current?.interact();
            }}
            onPointerCancel={() => {
              holdRef.current = false;
            }}
            onLostPointerCapture={() => {
              holdRef.current = false;
            }}
            onClick={(event) => {
              if (event.detail === 0) inputRef.current?.interact();
            }}
          >
            HOLD·TALK
          </button>
          <button
            type="button"
            className={styles.actionPrimary}
            onPointerDown={(event) => {
              event.preventDefault();
              inputRef.current?.pulse();
            }}
            onClick={(event) => {
              if (event.detail === 0) inputRef.current?.pulse();
            }}
          >
            PULSE
          </button>
        </div>

        {!floorWarning && panel === "none" && status === "ready" && (
          <div className={styles.overlay}>
            <h1 className={styles.title}>LOST SIGNAL</h1>
            <p className={styles.subtitle}>
              Pocket Edition · a transmission worth following
            </p>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                autoFocus
                onClick={() => startRun("campaign")}
              >
                ▶ START TRANSMISSION
              </button>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => startRun("practice")}
              >
                PRACTICE FLIGHT
              </button>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setPanel("settings")}
              >
                SCREEN &amp; SOUND
              </button>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setPanel("help")}
              >
                HOW TO FLY
              </button>
            </div>
            <p className={styles.footnote}>
              Drag anywhere to steer · fire is automatic · PULSE clears the
              storm
            </p>
          </div>
        )}

        {!floorWarning && status === "paused" && panel === "none" && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>PAUSED</h2>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={continueRun}
              >
                ▶ RESUME
              </button>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setPanel("settings")}
              >
                SCREEN &amp; SOUND
              </button>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => startRun("campaign")}
              >
                RESTART SECTOR
              </button>
            </div>
          </div>
        )}

        {!floorWarning && status === "cleared" && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>SECTOR CLEAR</h2>
            <p className={styles.subtitle}>
              {sector?.bossName ?? "The Watcher"} went quiet. Score{" "}
              {game?.score ?? 0}.
            </p>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={() => {
                  if (game) nextSector(game);
                  continueRun();
                }}
              >
                ▶ FOLLOW THE SIGNAL
              </button>
            </div>
          </div>
        )}

        {!floorWarning && status === "dead" && deathReveal && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>SIGNAL LOST</h2>
            <p className={styles.subtitle}>
              Score {game?.score ?? 0} · checkpoint at sector{" "}
              {(save.checkpoint?.sector ?? 0) + 1}
            </p>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={() => startRun("campaign")}
              >
                ▶ RETRY
              </button>
              <button
                type="button"
                className={styles.menuButton}
                onClick={() => setPanel("settings")}
              >
                ASSIST OPTIONS
              </button>
            </div>
          </div>
        )}

        {!floorWarning && status === "victory" && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>THE REAL SIGNAL</h2>
            <p className={styles.subtitle}>
              The storm ends. Someone is answering. Score {game?.score ?? 0}.
            </p>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={() => startRun("campaign")}
              >
                ▶ FLY AGAIN
              </button>
            </div>
          </div>
        )}

        {!floorWarning && status === "console" && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>RELAY CONSOLE</h2>
            <p className={styles.subtitle}>
              The broken beacon hums an old frequency.
            </p>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={continueRun}
              >
                ▶ RETURN TO FLIGHT
              </button>
            </div>
          </div>
        )}

        {!floorWarning && panel === "settings" && (
          <div
            className={`${styles.overlay} ${styles.settingsOverlay}`}
            role="dialog"
            aria-label="Screen and sound"
          >
            <h2 className={styles.overlayTitle}>SCREEN &amp; SOUND</h2>
            <div className={styles.settingsGrid}>
              <fieldset>
                <legend>Screen preset</legend>
                {(["crt", "clean", "pocket", "worn"] as const).map((preset) => (
                  <label key={preset}>
                    <input
                      type="radio"
                      name="preset"
                      checked={save.settings.preset === preset}
                      onChange={() =>
                        applySettings({ ...save.settings, preset })
                      }
                    />
                    {preset === "crt"
                      ? "Vintage CRT · green phosphor"
                      : preset === "clean"
                        ? "Clean LCD"
                        : preset === "pocket"
                          ? "Pocket LCD"
                          : "Worn Screen"}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>LCD tint</legend>
                <p className={styles.settingNote}>
                  CRT uses green phosphor. These tints apply to the LCD presets.
                </p>
                {(["olive", "mint"] as const).map((palette) => (
                  <label key={palette}>
                    <input
                      type="radio"
                      name="palette"
                      disabled={save.settings.preset === "crt"}
                      checked={save.settings.palette === palette}
                      onChange={() =>
                        applySettings({ ...save.settings, palette })
                      }
                    />
                    {palette === "olive" ? "Olive backlit" : "Mint archival"}
                  </label>
                ))}
              </fieldset>
              <fieldset>
                <legend>Comfort</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={save.settings.reducedMotion}
                    onChange={(event) =>
                      applySettings({
                        ...save.settings,
                        reducedMotion: event.target.checked,
                      })
                    }
                  />
                  Reduced motion
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={save.settings.lowFlashes}
                    onChange={(event) =>
                      applySettings({
                        ...save.settings,
                        lowFlashes: event.target.checked,
                      })
                    }
                  />
                  Low flashes
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={save.settings.highContrast}
                    onChange={(event) =>
                      applySettings({
                        ...save.settings,
                        highContrast: event.target.checked,
                      })
                    }
                  />
                  High contrast
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={save.settings.assist}
                    onChange={(event) => {
                      applySettings({
                        ...save.settings,
                        assist: event.target.checked,
                      });
                      const model = gameRef.current;
                      if (model) model.assist = event.target.checked;
                    }}
                  />
                  Assistance (5 hull)
                </label>
              </fieldset>
              <fieldset>
                <legend>Sound</legend>
                <p className={styles.settingNote} role="status">
                  {save.settings.muted
                    ? "Muted. Enable sound to hear music and effects."
                    : audioStatus === "running"
                      ? "Audio active. Adjust music and effects below."
                      : audioStatus === "unavailable"
                        ? "Audio could not start. Tap Test sound to retry."
                        : "Tap Test sound or Start to activate audio."}
                </p>
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={() => {
                    applySettings({
                      ...saveRef.current.settings,
                      muted: false,
                    });
                    activateAudio(true);
                  }}
                >
                  TEST SOUND
                </button>
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={toggleSound}
                >
                  {soundLabel}
                </button>
                {save.settings.effects === 0 && (
                  <p className={styles.settingNote}>
                    Effects are at zero; raise the slider to hear the test.
                  </p>
                )}
                <label>
                  Music
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={save.settings.music}
                    onChange={(event) =>
                      applySettings({
                        ...save.settings,
                        music: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  Effects
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={save.settings.effects}
                    onChange={(event) =>
                      applySettings({
                        ...save.settings,
                        effects: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </fieldset>
            </div>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={() => {
                  setPanel("none");
                  if (status === "paused") continueRun();
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {!floorWarning && panel === "help" && (
          <div className={styles.overlay}>
            <h2 className={styles.overlayTitle}>HOW TO FLY</h2>
            <ul className={styles.helpList}>
              <li>
                Drag anywhere on the screen — the ship follows your thumb, never
                your tap point.
              </li>
              <li>
                Keyboard: arrows or WASD to steer, Space to pulse, E to
                interact, Esc to pause.
              </li>
              <li>
                Cannons fire on their own. <strong>HOLD·TALK</strong> silences
                them when the probe asks.
              </li>
              <li>
                <strong>PULSE</strong> clears nearby shots once the meter is
                charged. Graze danger to charge faster.
              </li>
              <li>
                A blinking window in a wreck is worth investigating. Fly close
                and interact.
              </li>
              <li>
                Everything works muted. Lights and motion carry the warnings.
              </li>
            </ul>
            <div className={styles.menuButtons}>
              <button
                type="button"
                className={styles.menuPrimary}
                onClick={() => setPanel("none")}
              >
                CLOSE
              </button>
            </div>
          </div>
        )}

        {storageWarning && (
          <p className={styles.storageWarning} role="status">
            Save storage is unavailable this session — progress lives in memory
            only.
          </p>
        )}
      </div>
      <p className={styles.colophon}>
        DRAG / WASD TO FLY · SPACE TO PULSE · ESC TO PAUSE
      </p>
    </section>
  );
}
