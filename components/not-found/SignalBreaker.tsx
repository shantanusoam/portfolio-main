"use client";

import Link from "next/link";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import styles from "./signalBreaker.module.css";

const WORLD_WIDTH = 960;
const WORLD_HEIGHT = 560;
const PADDLE_Y = 514;
const BRICK_COLUMNS = 10;
const BRICK_ROWS = 6;

type GameMode = "ready" | "playing" | "paused" | "gameover";
type PowerKind = "multi" | "wide" | "pierce" | "slow";

type Ball = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  radius: number;
};

type Brick = {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  kind: "normal" | "armor" | "bomb" | "cache";
  flash: number;
};

type PowerUp = {
  x: number;
  y: number;
  vy: number;
  kind: PowerKind;
  alive: boolean;
  rotation: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type Runtime = {
  balls: Ball[];
  bricks: Brick[];
  powerUps: PowerUp[];
  particles: Particle[];
  paddleX: number;
  paddleTargetX: number;
  paddleWidth: number;
  lives: number;
  score: number;
  combo: number;
  comboClock: number;
  wave: number;
  waveDelay: number;
  wideTimer: number;
  pierceTimer: number;
  shake: number;
  keyboardAxis: number;
  audio?: AudioContext;
};

const powerLabels: Record<PowerKind, string> = {
  multi: "M",
  wide: "W",
  pierce: "P",
  slow: "S",
};

function makeBall(x = WORLD_WIDTH / 2, y = PADDLE_Y - 24): Ball {
  const direction = Math.random() > 0.5 ? 1 : -1;
  return {
    x,
    y,
    previousX: x,
    previousY: y,
    vx: direction * (175 + Math.random() * 65),
    vy: -(355 + Math.random() * 45),
    radius: 7,
  };
}

function createBricks(wave: number): Brick[] {
  const gap = 7;
  const side = 42;
  const top = 70;
  const width =
    (WORLD_WIDTH - side * 2 - gap * (BRICK_COLUMNS - 1)) / BRICK_COLUMNS;
  const height = 31;
  const bricks: Brick[] = [];

  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let column = 0; column < BRICK_COLUMNS; column += 1) {
      const roll = Math.random();
      const armorChance = Math.min(0.12 + wave * 0.035 + row * 0.02, 0.42);
      const kind =
        roll < 0.07
          ? "bomb"
          : roll < 0.14
            ? "cache"
            : roll < 0.14 + armorChance
              ? "armor"
              : "normal";
      const hp = kind === "armor" ? Math.min(2 + Math.floor(wave / 3), 4) : 1;
      bricks.push({
        x: side + column * (width + gap),
        y: top + row * (height + gap),
        width,
        height,
        hp,
        maxHp: hp,
        alive: true,
        kind,
        flash: 0,
      });
    }
  }

  return bricks;
}

function createRuntime(): Runtime {
  return {
    balls: [makeBall()],
    bricks: createBricks(1),
    powerUps: [],
    particles: [],
    paddleX: WORLD_WIDTH / 2,
    paddleTargetX: WORLD_WIDTH / 2,
    paddleWidth: 132,
    lives: 3,
    score: 0,
    combo: 0,
    comboClock: 0,
    wave: 1,
    waveDelay: 0,
    wideTimer: 0,
    pierceTimer: 0,
    shake: 0,
    keyboardAxis: 0,
  };
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

export default function SignalBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runtimeRef = useRef<Runtime>(createRuntime());
  const frameRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const modeRef = useRef<GameMode>("ready");
  const mutedRef = useRef(true);
  const [mode, setMode] = useState<GameMode>("ready");
  const [muted, setMuted] = useState(true);
  const [summary, setSummary] = useState({ score: 0, wave: 1 });
  const [best, setBest] = useState(0);

  const changeMode = useCallback((next: GameMode) => {
    modeRef.current = next;
    setMode(next);
  }, []);

  const tone = useCallback((frequency: number, duration = 0.04) => {
    if (mutedRef.current) return;
    const runtime = runtimeRef.current;
    const AudioConstructor = window.AudioContext;
    const audio = runtime.audio ?? new AudioConstructor();
    runtime.audio = audio;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + duration,
    );
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }, []);

  const burst = useCallback(
    (x: number, y: number, color: string, amount = 9, force = 120) => {
      const particles = runtimeRef.current.particles;
      for (let index = 0; index < amount; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = force * (0.35 + Math.random() * 0.8);
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.45 + Math.random() * 0.35,
          size: 1.5 + Math.random() * 3,
          color,
        });
      }
      if (particles.length > 220) particles.splice(0, particles.length - 220);
    },
    [],
  );

  const dropPower = useCallback((brick: Brick, guaranteed = false) => {
    if (!guaranteed && Math.random() > 0.13) return;
    const kinds: PowerKind[] = ["multi", "wide", "pierce", "slow"];
    runtimeRef.current.powerUps.push({
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      vy: 112,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      alive: true,
      rotation: 0,
    });
  }, []);

  const destroyBrick = useCallback(
    (brick: Brick, chain = false) => {
      if (!brick.alive) return;
      const runtime = runtimeRef.current;
      brick.alive = false;
      const multiplier = 1 + Math.floor(runtime.combo / 5) * 0.5;
      runtime.score += Math.round(
        (brick.kind === "armor" ? 180 : 100) * multiplier,
      );
      runtime.combo += 1;
      runtime.comboClock = 1.7;
      runtime.shake = Math.max(runtime.shake, brick.kind === "bomb" ? 7 : 2.5);
      burst(
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        brick.kind === "cache" ? "#7df5a5" : "#ff6638",
        brick.kind === "bomb" ? 18 : 8,
        brick.kind === "bomb" ? 190 : 110,
      );
      if (brick.kind === "cache") dropPower(brick, true);
      else dropPower(brick, false);

      if (brick.kind === "bomb" && !chain) {
        const centerX = brick.x + brick.width / 2;
        const centerY = brick.y + brick.height / 2;
        runtime.bricks.forEach((candidate) => {
          const dx = candidate.x + candidate.width / 2 - centerX;
          const dy = candidate.y + candidate.height / 2 - centerY;
          if (candidate.alive && Math.hypot(dx, dy) < 116) {
            destroyBrick(candidate, true);
          }
        });
      }
    },
    [burst, dropPower],
  );

  const applyPower = useCallback(
    (kind: PowerKind) => {
      const runtime = runtimeRef.current;
      if (kind === "multi") {
        const additions = runtime.balls.flatMap((ball) => [
          { ...ball, vx: ball.vx * 0.78 - 145, vy: ball.vy * 0.96 },
          { ...ball, vx: ball.vx * 0.78 + 145, vy: ball.vy * 0.96 },
        ]);
        runtime.balls.push(
          ...additions.slice(0, Math.max(0, 6 - runtime.balls.length)),
        );
      } else if (kind === "wide") {
        runtime.wideTimer = 10;
        runtime.paddleWidth = 190;
      } else if (kind === "pierce") {
        runtime.pierceTimer = 8;
      } else {
        runtime.balls.forEach((ball) => {
          ball.vx *= 0.78;
          ball.vy *= 0.78;
        });
      }
      runtime.score += 250;
      burst(runtime.paddleX, PADDLE_Y, "#7df5a5", 14, 150);
      tone(kind === "multi" ? 720 : 580, 0.09);
    },
    [burst, tone],
  );

  const finishGame = useCallback(() => {
    const runtime = runtimeRef.current;
    const nextBest = Math.max(best, runtime.score);
    setSummary({ score: runtime.score, wave: runtime.wave });
    setBest(nextBest);
    try {
      window.localStorage.setItem("signal-breaker-best", String(nextBest));
    } catch {
      // Private browsing can disable storage; the current run still works.
    }
    changeMode("gameover");
    tone(92, 0.22);
  }, [best, changeMode, tone]);

  const update = useCallback(
    (delta: number) => {
      const runtime = runtimeRef.current;
      const speed = 520;
      runtime.paddleTargetX += runtime.keyboardAxis * speed * delta;
      const halfPaddle = runtime.paddleWidth / 2;
      runtime.paddleTargetX = Math.max(
        halfPaddle + 14,
        Math.min(WORLD_WIDTH - halfPaddle - 14, runtime.paddleTargetX),
      );
      runtime.paddleX +=
        (runtime.paddleTargetX - runtime.paddleX) * Math.min(1, delta * 16);
      runtime.comboClock = Math.max(0, runtime.comboClock - delta);
      if (runtime.comboClock === 0) runtime.combo = 0;
      runtime.wideTimer = Math.max(0, runtime.wideTimer - delta);
      runtime.pierceTimer = Math.max(0, runtime.pierceTimer - delta);
      runtime.shake = Math.max(0, runtime.shake - delta * 22);
      if (runtime.wideTimer === 0)
        runtime.paddleWidth +=
          (132 - runtime.paddleWidth) * Math.min(1, delta * 7);

      runtime.bricks.forEach((brick) => {
        brick.flash = Math.max(0, brick.flash - delta * 5);
      });

      runtime.balls.forEach((ball) => {
        ball.previousX = ball.x;
        ball.previousY = ball.y;
        ball.x += ball.vx * delta;
        ball.y += ball.vy * delta;

        if (ball.x - ball.radius < 15) {
          ball.x = 15 + ball.radius;
          ball.vx = Math.abs(ball.vx);
          tone(170);
        } else if (ball.x + ball.radius > WORLD_WIDTH - 15) {
          ball.x = WORLD_WIDTH - 15 - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          tone(170);
        }
        if (ball.y - ball.radius < 46) {
          ball.y = 46 + ball.radius;
          ball.vy = Math.abs(ball.vy);
          tone(190);
        }

        const paddleLeft = runtime.paddleX - runtime.paddleWidth / 2;
        const paddleRight = runtime.paddleX + runtime.paddleWidth / 2;
        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= PADDLE_Y &&
          ball.previousY + ball.radius < PADDLE_Y + 12 &&
          ball.x >= paddleLeft - ball.radius &&
          ball.x <= paddleRight + ball.radius
        ) {
          const hit = (ball.x - runtime.paddleX) / (runtime.paddleWidth / 2);
          const magnitude = Math.min(
            640,
            Math.hypot(ball.vx, ball.vy) * 1.025 + 5,
          );
          const angle = hit * 1.02;
          ball.vx = Math.sin(angle) * magnitude;
          ball.vy = -Math.max(290, Math.cos(angle) * magnitude);
          ball.y = PADDLE_Y - ball.radius - 1;
          burst(ball.x, PADDLE_Y, "#eee9df", 5, 70);
          tone(260 + Math.abs(hit) * 120);
        }

        for (const brick of runtime.bricks) {
          if (!brick.alive) continue;
          const closestX = Math.max(
            brick.x,
            Math.min(ball.x, brick.x + brick.width),
          );
          const closestY = Math.max(
            brick.y,
            Math.min(ball.y, brick.y + brick.height),
          );
          const dx = ball.x - closestX;
          const dy = ball.y - closestY;
          if (dx * dx + dy * dy > ball.radius * ball.radius) continue;

          brick.hp -= 1;
          brick.flash = 1;
          if (brick.hp <= 0) destroyBrick(brick);
          else {
            runtime.score += 35;
            runtime.shake = Math.max(runtime.shake, 2);
            burst(ball.x, ball.y, "#eee9df", 4, 70);
          }

          if (runtime.pierceTimer <= 0) {
            const fromSide =
              ball.previousX < brick.x ||
              ball.previousX > brick.x + brick.width;
            if (fromSide) ball.vx *= -1;
            else ball.vy *= -1;
          }
          tone(brick.kind === "armor" ? 115 : 330 + runtime.combo * 8);
          break;
        }
      });

      runtime.balls = runtime.balls.filter(
        (ball) => ball.y - ball.radius < WORLD_HEIGHT + 24,
      );
      if (runtime.balls.length === 0) {
        runtime.lives -= 1;
        runtime.combo = 0;
        runtime.shake = 10;
        if (runtime.lives <= 0) {
          finishGame();
          return;
        }
        runtime.balls.push(makeBall(runtime.paddleX));
      }

      runtime.powerUps.forEach((power) => {
        power.y += power.vy * delta;
        power.rotation += delta * 2.6;
        const half = runtime.paddleWidth / 2;
        if (
          power.y > PADDLE_Y - 12 &&
          power.y < PADDLE_Y + 24 &&
          power.x > runtime.paddleX - half &&
          power.x < runtime.paddleX + half
        ) {
          power.alive = false;
          applyPower(power.kind);
        }
        if (power.y > WORLD_HEIGHT + 20) power.alive = false;
      });
      runtime.powerUps = runtime.powerUps.filter((power) => power.alive);

      runtime.particles.forEach((particle) => {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += 120 * delta;
        particle.life -= delta;
      });
      runtime.particles = runtime.particles.filter(
        (particle) => particle.life > 0,
      );

      if (runtime.bricks.every((brick) => !brick.alive)) {
        runtime.waveDelay += delta;
        if (runtime.waveDelay > 0.9) {
          runtime.wave += 1;
          runtime.waveDelay = 0;
          runtime.bricks = createBricks(runtime.wave);
          runtime.score += 1000 * runtime.wave;
          runtime.balls.forEach((ball) => {
            ball.vx *= 1.06;
            ball.vy *= 1.06;
          });
          setSummary({ score: runtime.score, wave: runtime.wave });
          burst(WORLD_WIDTH / 2, 220, "#ff6638", 45, 260);
          tone(860, 0.16);
        }
      }
    },
    [applyPower, burst, destroyBrick, finishGame, tone],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const runtime = runtimeRef.current;
    const scaleX = canvas.width / WORLD_WIDTH;
    const scaleY = canvas.height / WORLD_HEIGHT;
    context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    context.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const shakeX = runtime.shake ? (Math.random() - 0.5) * runtime.shake : 0;
    const shakeY = runtime.shake ? (Math.random() - 0.5) * runtime.shake : 0;
    context.save();
    context.translate(shakeX, shakeY);

    const gradient = context.createRadialGradient(480, 180, 30, 480, 260, 560);
    gradient.addColorStop(0, "rgba(255,93,47,0.085)");
    gradient.addColorStop(1, "rgba(5,5,5,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    context.strokeStyle = "rgba(238,233,223,0.055)";
    context.lineWidth = 1;
    for (let x = 16; x < WORLD_WIDTH; x += 32) {
      context.beginPath();
      context.moveTo(x, 46);
      context.lineTo(x, WORLD_HEIGHT - 14);
      context.stroke();
    }
    for (let y = 46; y < WORLD_HEIGHT; y += 32) {
      context.beginPath();
      context.moveTo(15, y);
      context.lineTo(WORLD_WIDTH - 15, y);
      context.stroke();
    }

    context.fillStyle = "rgba(238,233,223,0.55)";
    context.font = "10px monospace";
    context.textBaseline = "middle";
    context.fillText(`SCORE ${String(runtime.score).padStart(7, "0")}`, 22, 25);
    context.fillText(`WAVE ${String(runtime.wave).padStart(2, "0")}`, 245, 25);
    context.fillText(
      `LIVES ${"◆".repeat(runtime.lives)}${"◇".repeat(
        Math.max(0, 3 - runtime.lives),
      )}`,
      382,
      25,
    );
    const multiplier = 1 + Math.floor(runtime.combo / 5) * 0.5;
    context.fillStyle =
      runtime.combo >= 5 ? "#ff6638" : "rgba(238,233,223,0.4)";
    context.textAlign = "right";
    context.fillText(
      runtime.combo > 1
        ? `COMBO ${runtime.combo} / ×${multiplier.toFixed(1)}`
        : "KEEP THE SIGNAL ALIVE",
      WORLD_WIDTH - 22,
      25,
    );
    context.textAlign = "left";

    runtime.bricks.forEach((brick) => {
      if (!brick.alive) return;
      const alpha = 0.2 + 0.8 * (brick.hp / brick.maxHp);
      const color =
        brick.kind === "bomb"
          ? "255,93,47"
          : brick.kind === "cache"
            ? "125,245,165"
            : brick.kind === "armor"
              ? "174,166,154"
              : "238,233,223";
      roundedRect(context, brick.x, brick.y, brick.width, brick.height, 3);
      context.fillStyle = `rgba(${color},${
        0.08 + alpha * 0.16 + brick.flash * 0.32
      })`;
      context.fill();
      context.strokeStyle = `rgba(${color},${0.22 + alpha * 0.52})`;
      context.stroke();
      if (brick.kind === "armor") {
        context.fillStyle = `rgba(${color},0.65)`;
        for (let hp = 0; hp < brick.hp; hp += 1) {
          context.fillRect(
            brick.x + 8 + hp * 8,
            brick.y + brick.height - 6,
            5,
            1,
          );
        }
      } else if (brick.kind === "bomb") {
        context.fillStyle = "#ff6638";
        context.fillRect(
          brick.x + brick.width / 2 - 5,
          brick.y + brick.height / 2 - 1,
          10,
          2,
        );
        context.fillRect(
          brick.x + brick.width / 2 - 1,
          brick.y + brick.height / 2 - 5,
          2,
          10,
        );
      } else if (brick.kind === "cache") {
        context.strokeStyle = "#7df5a5";
        context.strokeRect(
          brick.x + brick.width / 2 - 5,
          brick.y + brick.height / 2 - 5,
          10,
          10,
        );
      }
    });

    runtime.powerUps.forEach((power) => {
      context.save();
      context.translate(power.x, power.y);
      context.rotate(power.rotation);
      roundedRect(context, -12, -12, 24, 24, 4);
      context.fillStyle = "rgba(125,245,165,0.16)";
      context.fill();
      context.strokeStyle = "#7df5a5";
      context.stroke();
      context.rotate(-power.rotation);
      context.fillStyle = "#7df5a5";
      context.font = "bold 11px monospace";
      context.textAlign = "center";
      context.fillText(powerLabels[power.kind], 0, 1);
      context.restore();
    });

    const paddleGradient = context.createLinearGradient(
      runtime.paddleX - runtime.paddleWidth / 2,
      0,
      runtime.paddleX + runtime.paddleWidth / 2,
      0,
    );
    paddleGradient.addColorStop(0, "#ff5d2f");
    paddleGradient.addColorStop(0.5, "#eee9df");
    paddleGradient.addColorStop(1, "#ff5d2f");
    roundedRect(
      context,
      runtime.paddleX - runtime.paddleWidth / 2,
      PADDLE_Y,
      runtime.paddleWidth,
      12,
      6,
    );
    context.fillStyle = paddleGradient;
    context.fill();
    context.shadowColor = runtime.pierceTimer > 0 ? "#ff5d2f" : "transparent";
    context.shadowBlur = runtime.pierceTimer > 0 ? 18 : 0;

    runtime.balls.forEach((ball) => {
      context.beginPath();
      context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      context.fillStyle = runtime.pierceTimer > 0 ? "#ff7043" : "#eee9df";
      context.shadowColor =
        runtime.pierceTimer > 0 ? "#ff5d2f" : "rgba(238,233,223,0.55)";
      context.shadowBlur = runtime.pierceTimer > 0 ? 16 : 8;
      context.fill();
    });
    context.shadowBlur = 0;

    runtime.particles.forEach((particle) => {
      context.globalAlpha = Math.min(1, particle.life * 2);
      context.fillStyle = particle.color;
      context.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    context.globalAlpha = 1;

    if (runtime.waveDelay > 0) {
      context.fillStyle = "rgba(5,5,5,0.66)";
      context.fillRect(0, 190, WORLD_WIDTH, 110);
      context.fillStyle = "#eee9df";
      context.font = "600 34px Georgia, serif";
      context.textAlign = "center";
      context.fillText(
        `WAVE ${String(runtime.wave).padStart(2, "0")} CLEARED`,
        WORLD_WIDTH / 2,
        230,
      );
      context.fillStyle = "#ff6638";
      context.font = "10px monospace";
      context.fillText("RECALIBRATING THE DEAD CHANNEL", WORLD_WIDTH / 2, 265);
    }

    context.restore();
  }, []);

  useEffect(() => {
    try {
      setBest(Number(window.localStorage.getItem("signal-breaker-best")) || 0);
    } catch {
      setBest(0);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * density));
      canvas.height = Math.max(1, Math.round(rect.height * density));
      render();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [render]);

  useEffect(() => {
    const loop = (time: number) => {
      const delta = Math.min(
        (time - (previousTimeRef.current ?? time)) / 1000,
        1 / 30,
      );
      previousTimeRef.current = time;
      if (modeRef.current === "playing") update(delta);
      render();
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      runtimeRef.current.audio?.close().catch(() => undefined);
    };
  }, [render, update]);

  const start = useCallback(
    (reset = false) => {
      if (
        reset ||
        modeRef.current === "ready" ||
        modeRef.current === "gameover"
      ) {
        runtimeRef.current.audio?.close().catch(() => undefined);
        runtimeRef.current = createRuntime();
        setSummary({ score: 0, wave: 1 });
      }
      previousTimeRef.current = undefined;
      changeMode("playing");
      tone(440, 0.08);
    },
    [changeMode, tone],
  );

  const togglePause = useCallback(() => {
    if (modeRef.current === "playing") changeMode("paused");
    else if (modeRef.current === "paused") start(false);
  }, [changeMode, start]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        runtimeRef.current.keyboardAxis = -1;
        event.preventDefault();
      }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
        runtimeRef.current.keyboardAxis = 1;
        event.preventDefault();
      }
      if (event.key === " " && modeRef.current !== "playing") {
        start(modeRef.current === "gameover");
        event.preventDefault();
      }
      if (
        event.key.toLowerCase() === "p" &&
        (modeRef.current === "playing" || modeRef.current === "paused")
      ) {
        togglePause();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "a" ||
        event.key.toLowerCase() === "d"
      ) {
        runtimeRef.current.keyboardAxis = 0;
      }
    };
    const onVisibility = () => {
      if (document.hidden && modeRef.current === "playing")
        changeMode("paused");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [changeMode, start, togglePause]);

  const movePaddle = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    runtimeRef.current.paddleTargetX =
      ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
  };

  const toggleSound = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (!next) tone(520, 0.06);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span className={styles.mark}>S</span>
          <span>Signal Archive / Dead channel</span>
        </Link>
        <nav aria-label="404 recovery">
          <Link href="/">Portfolio</Link>
          <Link href="/blog">Archive</Link>
        </nav>
      </header>

      <section className={styles.intro}>
        <div>
          <p className={styles.kicker}>
            Error 404 / Playable recovery protocol
          </p>
          <h1>You found the dead channel.</h1>
        </div>
        <p>
          Break the corrupted signal into something useful. Bomb bricks chain,
          green caches drop upgrades, and every five-hit streak increases the
          multiplier.
        </p>
      </section>

      <section className={styles.gameShell} aria-label="Signal Breaker game">
        <div className={styles.gameTopbar}>
          <span>Signal Breaker / Build 404</span>
          <span>Best {String(best).padStart(7, "0")}</span>
          <div className={styles.gameActions}>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? "Turn game sound on" : "Mute game sound"}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              type="button"
              onClick={togglePause}
              disabled={mode === "ready" || mode === "gameover"}
              aria-label={mode === "paused" ? "Resume game" : "Pause game"}
            >
              {mode === "paused" ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        </div>
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            onPointerMove={movePaddle}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              movePaddle(event);
              if (modeRef.current === "ready") start(true);
            }}
          />

          {mode !== "playing" ? (
            <div className={styles.overlay}>
              <p>
                {mode === "gameover"
                  ? "Signal lost"
                  : mode === "paused"
                    ? "Transmission paused"
                    : "Ready when you are"}
              </p>
              <h2>
                {mode === "gameover"
                  ? `${summary.score.toLocaleString()} points / wave ${
                      summary.wave
                    }`
                  : mode === "paused"
                    ? "Hold the line."
                    : "Move. Aim. Chain reactions."}
              </h2>
              <button type="button" onClick={() => start(mode !== "paused")}>
                {mode === "paused" ? (
                  <Play size={16} />
                ) : (
                  <RotateCcw size={16} />
                )}
                {mode === "gameover"
                  ? "Run it back"
                  : mode === "paused"
                    ? "Resume"
                    : "Start breaking"}
              </button>
            </div>
          ) : null}
        </div>
        <footer className={styles.gameFooter}>
          <span>Move: pointer / touch / A D / ← →</span>
          <span>Pause: P</span>
          <span>Powerups: M multiball · W wide · P pierce · S slow</span>
        </footer>
      </section>

      <div className={styles.escapeRow}>
        <p>Enough side quest?</p>
        <Link href="/">Return to the living site ↗</Link>
      </div>
    </main>
  );
}
