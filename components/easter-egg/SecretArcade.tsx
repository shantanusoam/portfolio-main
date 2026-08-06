"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Gamepad2,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import styles from "./SecretArcade.module.css";
import { type AudioEngine, createAudioEngine } from "./game/audio";
import {
  GAME_ASSET_COUNT,
  loadGameAssets,
  type GameAssets,
} from "./game/assets";
import { getBossDisplayName } from "./game/bosses";
import {
  POWER_LABELS,
  DIFFICULTY_PRESETS,
  ENEMY_SKIN_NAMES,
  SHIP_SKIN_NAMES,
  WAVES_PER_SECTOR,
  WEAPON_COLORS,
  WEAPON_MAX_LEVEL,
  WEAPON_NAMES,
  getSectorForWave,
  getWaveInSector,
} from "./game/config";
import { createModel } from "./game/model";
import { spawnPowerUp, spawnWeaponPickup } from "./game/powerups";
import { renderGame } from "./game/render";
import { readBestScore, readMuted, writeMuted } from "./game/storage";
import type {
  GameDifficulty,
  EnemySkin,
  GameModel,
  GameStatus,
  HudState,
  ShipSkin,
  WeaponType,
} from "./game/types";
import { activateSuper, getActiveBoss, getMultiplier, getRank, updateGame } from "./game/update";
import { clamp, formatNumber } from "./game/utils";

const SECRET_WORDS = ["cluck", "shipit", "arcade", "soam", "build"];
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

const MOVE_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyA",
  "KeyD",
  "KeyS",
  "KeyW",
  "Space",
];

const DEBUG_WEAPON_KEYS: Record<string, WeaponType> = {
  Digit1: "pulse",
  Digit2: "rapid",
  Digit3: "spread",
  Digit4: "laser",
  Digit5: "missile",
  Digit6: "bomb",
};

function computeHud(model: GameModel): HudState {
  const boss = getActiveBoss(model);
  const bossPhaseMax = boss?.kind === "boss" ? 3 : boss?.kind === "miniBoss" ? 2 : 0;
  const bossPhase = boss
    ? boss.kind === "miniBoss"
      ? boss.hp < boss.maxHp * 0.4
        ? 2
        : 1
      : boss.bossPhase || 1
    : 0;

  return {
    banner: model.banner,
    best: Math.round(model.best),
    bossHp: boss ? Math.max(0, boss.hp) : 0,
    bossMaxHp: boss?.maxHp || 0,
    bossName: boss ? getBossDisplayName(boss) : "",
    bossPhase,
    bossPhaseMax,
    combo: model.combo,
    comboPulseId: model.comboPulseId,
    droneCount: model.player.drones.length,
    enemySkin: model.enemySkin,
    difficulty: model.difficulty,
    hull: model.player.hull,
    hullMax: model.player.hullMax,
    invincibleTimer: model.player.powerInvincibleTimer,
    lives: model.player.lives,
    magnetTimer: model.player.magnetTimer,
    multiplier: getMultiplier(model),
    rank: getRank(model.score),
    score: Math.round(model.score),
    sector: model.sector,
    shipSkin: model.shipSkin,
    shieldHp: model.player.shieldHp,
    shieldMax: model.player.shieldMax,
    status: model.status,
    timewarpTimer: model.timewarpTimer,
    super: model.player.super,
    superReady: model.player.super >= 100,
    wave: model.wave,
    waveInSector: getWaveInSector(model.wave),
    wavesPerSector: WAVES_PER_SECTOR,
    weapon: model.player.weapon,
    weaponLevel: model.player.weaponLevel,
  };
}

export default function SecretArcade() {
  const assetsRef = useRef<GameAssets>({});
  const audioRef = useRef<AudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const gameRef = useRef<GameModel | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const konamiRef = useRef<string[]>([]);
  const lastFrameRef = useRef(0);
  const lastHudSyncRef = useRef(0);
  const wordBufferRef = useRef("");
  const reducedMotionRef = useRef(false);

  const [assetCount, setAssetCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [unlockFlash, setUnlockFlash] = useState("");
  const [muted, setMuted] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [enemySkin, setEnemySkin] = useState<EnemySkin>("topdown");
  const [shipSkin, setShipSkin] = useState<ShipSkin>("circuit");
  const [hud, setHud] = useState<HudState>({
    banner: null,
    best: 0,
    bossHp: 0,
    bossMaxHp: 0,
    bossName: "",
    bossPhase: 0,
    bossPhaseMax: 0,
    combo: 0,
    comboPulseId: 0,
    droneCount: 0,
    enemySkin: "topdown",
    difficulty: "easy",
    hull: 100,
    hullMax: 100,
    invincibleTimer: 0,
    lives: 3,
    magnetTimer: 0,
    multiplier: 1,
    rank: "Egg Cadet",
    score: 0,
    sector: 1,
    shipSkin: "circuit",
    shieldHp: 0,
    shieldMax: 60,
    status: "ready",
    timewarpTimer: 0,
    super: 0,
    superReady: false,
    wave: 0,
    waveInSector: 1,
    wavesPerSector: WAVES_PER_SECTOR,
    weapon: "pulse",
    weaponLevel: 1,
  });

  const [comboPulsing, setComboPulsing] = useState(false);
  const comboPulseIdRef = useRef(0);

  const syncHud = useCallback((model: GameModel) => {
    setHud(computeHud(model));
  }, []);

  useEffect(() => {
    if (hud.comboPulseId === comboPulseIdRef.current) return;
    comboPulseIdRef.current = hud.comboPulseId;
    setComboPulsing(true);
    const timeout = window.setTimeout(() => setComboPulsing(false), 420);
    return () => window.clearTimeout(timeout);
  }, [hud.comboPulseId]);

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const parent = canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect?.width || window.innerWidth || 900));
    const height = Math.max(420, Math.floor(rect?.height || window.innerHeight || 720));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (gameRef.current) {
      const model = gameRef.current;
      model.width = width;
      model.height = height;
      model.dpr = dpr;
      model.player.x = clamp(model.player.x, 24, width - 24);
      model.player.y = clamp(model.player.y, height * 0.42, height - 34);
    }

    return { dpr, height, width };
  }, []);

  const resetGame = useCallback(
    (running = false) => {
      const dimensions = sizeCanvas();
      const model = createModel(
        dimensions?.width || 900,
        dimensions?.height || 720,
        readBestScore(),
        difficulty,
        shipSkin,
        enemySkin,
      );
      model.dpr = dimensions?.dpr || 1;
      model.status = running ? "running" : "ready";
      gameRef.current = model;
      keysRef.current.clear();
      syncHud(model);
    },
    [difficulty, enemySkin, shipSkin, sizeCanvas, syncHud],
  );

  const startGame = useCallback(() => {
    resetGame(true);
  }, [resetGame]);

  const togglePause = useCallback(() => {
    const model = gameRef.current;
    if (!model || model.status === "ready" || model.status === "ended") return;
    model.status = model.status === "paused" ? "running" : "paused";
    keysRef.current.clear();
    syncHud(model);
  }, [syncHud]);

  const trySuper = useCallback(() => {
    const model = gameRef.current;
    if (!model || model.status !== "running") return;
    if (activateSuper(model)) syncHud(model);
  }, [syncHud]);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      audioRef.current?.setMuted(next);
      writeMuted(next);
      return next;
    });
  }, []);

  const openArcade = useCallback((source: string) => {
    setOpen(true);
    setUnlockFlash(source === "konami" ? "Konami coop unlocked" : "Secret coop unlocked");
    window.setTimeout(() => setUnlockFlash(""), 1800);
  }, []);

  const closeArcade = useCallback(() => {
    setOpen(false);
    keysRef.current.clear();
  }, []);

  useEffect(() => {
    setHud((current) => ({ ...current, best: readBestScore() }));
    const initialMuted = readMuted();
    setMuted(initialMuted);
    audioRef.current = createAudioEngine(initialMuted);
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }, []);

  useEffect(() => {
    audioRef.current?.setAmbience(open && hud.status === "running");
  }, [hud.status, open]);

  useEffect(() => {
    if (!open || Object.keys(assetsRef.current).length > 0) return;
    let cancelled = false;

    loadGameAssets().then((assets) => {
      if (cancelled) return;
      assetsRef.current = assets;
      setAssetCount(Object.keys(assets).length);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    resetGame(false);

    const handleResize = () => sizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, resetGame, sizeCanvas]);

  useEffect(() => {
    if (!open) return;
    const handleVisibility = () => {
      if (document.hidden) {
        const model = gameRef.current;
        if (model && model.status === "running") {
          model.status = "paused";
          syncHud(model);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [open, syncHud]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTextInput) return;

      if (open) {
        if (MOVE_KEYS.includes(event.code)) {
          event.preventDefault();
        }

        if (event.code === "Escape") {
          closeArcade();
          return;
        }
        if (event.code === "KeyP") {
          togglePause();
          return;
        }
        if (event.code === "Space" && hud.status === "running") {
          trySuper();
          return;
        }
        if ((event.code === "Space" || event.code === "Enter") && (hud.status === "ready" || hud.status === "ended")) {
          startGame();
          return;
        }
        if ((event.code === "Space" || event.code === "Enter") && hud.status === "paused") {
          togglePause();
          return;
        }

        const model = gameRef.current;
        if (model && model.status === "running") {
          const debugWeapon = DEBUG_WEAPON_KEYS[event.code];
          if (debugWeapon) {
            spawnWeaponPickup(model, model.player.x, model.player.y - 90, debugWeapon);
          } else if (event.code === "KeyM") {
            spawnPowerUp(model, model.player.x, model.player.y - 90);
          } else if (event.code === "KeyN") {
            model.enemies = [];
            model.waveCooldown = Math.min(model.waveCooldown, 0.05);
          } else if (event.code === "KeyB") {
            const sector = getSectorForWave(model.wave || 1);
            model.wave = sector.id * WAVES_PER_SECTOR - 1;
            model.enemies = [];
            model.waveCooldown = Math.min(model.waveCooldown, 0.05);
          }
        }

        keysRef.current.add(event.code);
        return;
      }

      konamiRef.current = [...konamiRef.current, event.code].slice(-KONAMI.length);
      const hasKonami = KONAMI.every((code, index) => konamiRef.current[index] === code);
      if (hasKonami) {
        openArcade("konami");
        konamiRef.current = [];
        return;
      }

      if (event.key.length === 1) {
        wordBufferRef.current = `${wordBufferRef.current}${event.key.toLowerCase()}`.slice(-16);
        if (SECRET_WORDS.some((word) => wordBufferRef.current.endsWith(word))) {
          openArcade("word");
          wordBufferRef.current = "";
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [closeArcade, hud.status, open, openArcade, startGame, togglePause, trySuper]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const renderingContext = context;

    function tick(time: number) {
      const model = gameRef.current;
      if (!model) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const previous = lastFrameRef.current || time;
      const dt = clamp((time - previous) / 1000, 0, 0.033);
      lastFrameRef.current = time;

      updateGame(model, keysRef.current, dt);
      renderGame(renderingContext, model, assetsRef.current, {
        reducedMotion: reducedMotionRef.current,
      });

      if (model.sfxQueue.length) {
        const sounds = model.sfxQueue.splice(0, 4);
        sounds.forEach((kind) => audioRef.current?.play(kind));
      }

      if (time - lastHudSyncRef.current > 80 || model.status !== hud.status) {
        lastHudSyncRef.current = time;
        syncHud(model);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    lastFrameRef.current = 0;
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
    };
  }, [hud.status, open, syncHud]);

  const updatePointer = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const model = gameRef.current;
    if (!canvas || !model) return;
    const rect = canvas.getBoundingClientRect();
    model.pointer.x = event.clientX - rect.left;
    model.pointer.y = event.clientY - rect.top;
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const model = gameRef.current;
      if (!model) return;
      model.pointer.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePointer(event);
      if (model.status === "ready" || model.status === "ended") {
        startGame();
      } else if (model.status === "paused") {
        model.status = "running";
        syncHud(model);
      }
    },
    [startGame, syncHud, updatePointer],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const model = gameRef.current;
    if (model) model.pointer.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const statusText: Record<GameStatus, string> = {
    ended: "Run archived",
    paused: "Paused",
    ready: "Private coop waiting",
    running: `Sector ${hud.sector} · Wave ${hud.waveInSector}/${hud.wavesPerSector}`,
  };
  const menuTitle =
    hud.status === "ended" ? "The flock got through" : hud.status === "paused" ? "Paused" : "Cluckstorm";
  const menuCopy =
    hud.status === "ended"
      ? `Rank achieved: ${hud.rank}. Restart with your weapon memory fresh — the flock only gets angrier.`
      : hud.status === "paused"
        ? "Catch your breath. The eggs can wait."
        : "A hidden vertical shooter with goofy alien space-birds, six weapons, smart formations, and boss waves across 5 sectors.";

  const weaponPips = Array.from({ length: WEAPON_MAX_LEVEL }, (_, index) => index < hud.weaponLevel);
  const activePowers: string[] = [];
  if (hud.magnetTimer > 0) activePowers.push(`${POWER_LABELS.magnet} ${Math.ceil(hud.magnetTimer)}s`);
  if (hud.invincibleTimer > 0) activePowers.push(`${POWER_LABELS.invincible} ${Math.ceil(hud.invincibleTimer)}s`);
  if (hud.timewarpTimer > 0) activePowers.push(`${POWER_LABELS.timewarp} ${Math.ceil(hud.timewarpTimer)}s`);
  if (hud.droneCount > 0) activePowers.push(`${POWER_LABELS.drone} x${hud.droneCount}`);

  return (
    <>
      <button
        className={styles.secretTrigger}
        type="button"
        aria-label="Open private arcade"
        title="Private arcade"
        onClick={() => openArcade("button")}
      >
        <Gamepad2 size={17} aria-hidden="true" />
      </button>

      {unlockFlash && <div className={styles.flash}>{unlockFlash}</div>}

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.backdrop} aria-hidden="true" />
          <section className={styles.panel} aria-label="Cluckstorm private arcade">
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onPointerDown={handlePointerDown}
              onPointerMove={updatePointer}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            <header className={styles.hud}>
              <div className={styles.identity}>
                <span className={styles.eyebrow}>Secret arcade / original shooter</span>
                <h2 className={styles.title}>Cluckstorm</h2>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span>Score</span>
                  <strong>{formatNumber(hud.score)}</strong>
                </div>
                <div className={styles.stat}>
                  <span>Best</span>
                  <strong>{formatNumber(hud.best)}</strong>
                </div>
                <div className={comboPulsing ? `${styles.stat} ${styles.statPulse}` : styles.stat}>
                  <span>Combo</span>
                  <strong>{hud.combo}x</strong>
                </div>
                <div className={styles.stat}>
                  <span>Mult</span>
                  <strong>{hud.multiplier.toFixed(1)}x</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={toggleMuted}
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={hud.status === "paused" ? "Resume" : "Pause"}
                  onClick={togglePause}
                >
                  {hud.status === "paused" ? <Play size={17} /> : <Pause size={17} />}
                </button>
                <button className={styles.iconButton} type="button" aria-label="Close arcade" onClick={closeArcade}>
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className={styles.sideHud}>
              <div className={styles.livesPill}>
                <Heart size={11} fill="#ff6bdb" aria-hidden="true" />
                {hud.lives}
              </div>
              <div className={styles.pill}>
                {WEAPON_NAMES[hud.weapon]}
                <span className={styles.pipRow}>
                  {weaponPips.map((filled, index) => (
                    <i
                      key={index}
                      className={filled ? styles.pipOn : styles.pipOff}
                      style={filled ? { background: WEAPON_COLORS[hud.weapon] } : undefined}
                    />
                  ))}
                </span>
              </div>
              <div className={styles.pill}>
                <div className={styles.miniBar} aria-label="Hull integrity">
                  <i style={{ background: "#ff6bdb", width: `${clamp((hud.hull / hud.hullMax) * 100, 0, 100)}%` }} />
                </div>
              </div>
              {hud.shieldHp > 0 && (
                <div className={styles.pill}>
                  <div className={styles.miniBar} aria-label="Shield charge">
                    <i style={{ background: "#65eaff", width: `${clamp((hud.shieldHp / hud.shieldMax) * 100, 0, 100)}%` }} />
                  </div>
                </div>
              )}
              <div className={styles.pill}>{hud.rank}</div>
              <div className={styles.pill}>{DIFFICULTY_PRESETS[hud.difficulty].label}</div>
              <div className={styles.pill}>{SHIP_SKIN_NAMES[hud.shipSkin]}</div>
              <div className={styles.pill}>{ENEMY_SKIN_NAMES[hud.enemySkin]}</div>
              {activePowers.map((label) => (
                <div key={label} className={styles.pillActive}>
                  {label}
                </div>
              ))}
            </div>

            {hud.bossMaxHp > 0 && (
              <div className={styles.bossMeter}>
                <span>
                  {hud.bossName} · Phase {hud.bossPhase}/{hud.bossPhaseMax}
                </span>
                <div>
                  <i style={{ transform: `scaleX(${hud.bossHp / hud.bossMaxHp})` }} />
                </div>
              </div>
            )}

            <div className={styles.superWrap}>
              <button
                type="button"
                className={hud.superReady ? styles.superButtonReady : styles.superButton}
                onClick={trySuper}
                aria-label="Activate Cluckocalypse super ability"
                disabled={hud.status !== "running"}
              >
                <Zap size={18} aria-hidden="true" />
                <span className={styles.superBar}>
                  <i style={{ width: `${clamp(hud.super, 0, 100)}%` }} />
                </span>
              </button>
            </div>

            <footer className={styles.bottomBar}>
              <span>{statusText[hud.status]}</span>
              <span>Move: WASD / arrows / drag · SPACE super · P pause</span>
              <span className={styles.assetChip}>
                <Volume2 size={13} aria-hidden="true" />
                Assets {assetCount}/{GAME_ASSET_COUNT}
              </span>
            </footer>

            {hud.status !== "running" && (
              <div className={styles.menuOverlay}>
                <div className={styles.menuCard}>
                  <span className={styles.eyebrow}>Funny vertical shooter</span>
                  <h3>{menuTitle}</h3>
                  <p>{menuCopy}</p>
                  {hud.status === "ready" && (
                    <p className={styles.controlsHint}>
                      5 sectors, 6 weapons, mini-bosses, and 3 boss types. Grazing bullets and combos charge your
                      Cluckocalypse super.
                    </p>
                  )}
                  {hud.status === "ready" && (
                    <div className={styles.difficultyRow} aria-label="Difficulty">
                      {(["easy", "hard"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            difficulty === option
                              ? styles.difficultyButtonActive
                              : styles.difficultyButton
                          }
                          onClick={() => setDifficulty(option)}
                        >
                          {DIFFICULTY_PRESETS[option].label}
                        </button>
                      ))}
                    </div>
                  )}
                  {hud.status === "ready" && (
                    <div className={styles.skinRow} aria-label="Ship skin">
                      {(Object.keys(SHIP_SKIN_NAMES) as ShipSkin[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            shipSkin === option
                              ? styles.difficultyButtonActive
                              : styles.difficultyButton
                          }
                          onClick={() => setShipSkin(option)}
                        >
                          {SHIP_SKIN_NAMES[option]}
                        </button>
                      ))}
                    </div>
                  )}
                  {hud.status === "ready" && (
                    <div className={styles.difficultyRow} aria-label="Enemy skin">
                      {(Object.keys(ENEMY_SKIN_NAMES) as EnemySkin[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            enemySkin === option
                              ? styles.difficultyButtonActive
                              : styles.difficultyButton
                          }
                          onClick={() => setEnemySkin(option)}
                        >
                          {ENEMY_SKIN_NAMES[option]}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={styles.actionRow}>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={hud.status === "paused" ? togglePause : startGame}
                    >
                      <Play size={16} aria-hidden="true" />
                      {hud.status === "ended" ? "Restart" : hud.status === "paused" ? "Resume" : "Start"}
                    </button>
                    {hud.status === "ended" && (
                      <button className={styles.ghostButton} type="button" onClick={() => resetGame(false)}>
                        <RotateCcw size={16} aria-hidden="true" />
                        Reset view
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
