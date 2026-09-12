import { clamp, HEIGHT, WIDTH } from "./config";
import { emptyInput } from "./model";
import type { Input, Point } from "./types";

/** Own exactly one movement pointer. Buttons never acquire this pointer. */
export class InputController {
  private pointerId: number | null = null;
  private anchor: Point = { x: 0, y: 0 };
  private origin: Point = { x: 0, y: 0 };
  private target: Point | null = null;
  private axes: Point = { x: 0, y: 0 };
  private keys = new Set<string>();
  private pulseQueued = false;
  private interactQueued = false;
  private cycleQueued = false;
  ceaseFire = false;
  private readonly player: () => Point;

  constructor(player: () => Point) {
    this.player = player;
  }

  pointerDown(id: number, point: Point): boolean {
    if (this.pointerId !== null) return false;
    this.pointerId = id;
    this.anchor = point;
    this.origin = { ...this.player() };
    this.target = { ...this.origin };
    return true;
  }

  pointerMove(
    id: number,
    point: Point,
    scale: number,
    mode: "drag" | "stick",
  ): void {
    if (id !== this.pointerId) return;
    const dx = point.x - this.anchor.x;
    const dy = point.y - this.anchor.y;
    if (mode === "stick") {
      this.target = null;
      this.axes = { x: clamp(dx / 42, -1, 1), y: clamp(dy / 42, -1, 1) };
    } else
      this.target = {
        x: clamp(this.origin.x + dx / Math.max(0.1, scale), 17, WIDTH - 25),
        y: clamp(this.origin.y + dy / Math.max(0.1, scale), 18, HEIGHT - 18),
      };
  }

  pointerUp(id: number): boolean {
    if (id === this.pointerId) {
      this.pointerId = null;
      this.target = null;
      this.axes = { x: 0, y: 0 };
      return true;
    }
    return false;
  }

  keyDown(key: string): void {
    if (key === "KeyQ" && !this.keys.has(key)) this.cycleQueued = true;
    this.keys.add(key);
    if (key === "Space") this.pulseQueued = true;
    if (key === "KeyE") this.interactQueued = true;
  }

  keyUp(key: string): void {
    this.keys.delete(key);
  }

  pulse(): void {
    this.pulseQueued = true;
  }

  interact(): void {
    this.interactQueued = true;
  }

  cycleWeapon(): void { this.cycleQueued = true; }

  clear(): void {
    this.keys.clear();
    this.pointerId = null;
    this.target = null;
    this.axes = { x: 0, y: 0 };
    this.pulseQueued = false;
    this.interactQueued = false;
    this.cycleQueued = false;
    this.ceaseFire = false;
  }

  sample(): Input {
    const has = (a: string, b: string) => this.keys.has(a) || this.keys.has(b);
    const input = {
      ...emptyInput(),
      x:
        Number(has("ArrowRight", "KeyD")) - Number(has("ArrowLeft", "KeyA")) ||
        this.axes.x,
      y:
        Number(has("ArrowDown", "KeyS")) - Number(has("ArrowUp", "KeyW")) ||
        this.axes.y,
      target: this.target,
      pulse: this.pulseQueued,
      interact: this.interactQueued,
      cycleWeapon: this.cycleQueued,
      ceaseFire: this.ceaseFire || this.keys.has("KeyF"),
    };
    this.pulseQueued = false;
    this.interactQueued = false;
    this.cycleQueued = false;
    return input;
  }
}
