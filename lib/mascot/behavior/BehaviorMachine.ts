import type { MascotBehavior, MotionRecipe } from "../types";

/**
 * Generic behavior state machine. Kept independent of MascotRuntime so it's
 * unit-testable in isolation — MascotEngine wires it to the real runtime as
 * the context type. Transition rules live in one place (the `decide`
 * callback), not scattered through the render loop.
 */

export interface BehaviorDefinition<TContext> {
  name: MascotBehavior;
  minimumDuration: number;
  maximumDuration?: number;
  motion: MotionRecipe;
  enter?(context: TContext): void;
  update?(context: TContext, dt: number): void;
  canExit?(context: TContext, elapsed: number): boolean;
  exit?(context: TContext): void;
}

export type BehaviorRegistry<TContext> = Partial<
  Record<MascotBehavior, BehaviorDefinition<TContext>>
>;

export interface BehaviorMachineOptions<TContext> {
  behaviors: BehaviorRegistry<TContext>;
  initial: MascotBehavior;
  /**
   * Called once minimumDuration has elapsed and canExit allows it (or once
   * maximumDuration is reached regardless). Return a different behavior to
   * transition, or null/undefined/the current behavior to stay.
   */
  decide: (
    current: MascotBehavior,
    context: TContext,
    elapsed: number,
  ) => MascotBehavior | null | undefined;
}

export class BehaviorMachine<TContext> {
  private current: MascotBehavior;
  private elapsed = 0;
  private readonly behaviors: BehaviorRegistry<TContext>;
  private readonly decide: BehaviorMachineOptions<TContext>["decide"];

  constructor(options: BehaviorMachineOptions<TContext>) {
    this.behaviors = options.behaviors;
    this.decide = options.decide;
    this.current = options.initial;
  }

  private definitionFor(name: MascotBehavior): BehaviorDefinition<TContext> {
    const definition = this.behaviors[name];
    if (!definition) {
      throw new Error(
        `BehaviorMachine: no definition registered for "${name}"`,
      );
    }
    return definition;
  }

  start(context: TContext): void {
    this.elapsed = 0;
    this.definitionFor(this.current).enter?.(context);
  }

  update(context: TContext, dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.elapsed += dt;

    const definition = this.definitionFor(this.current);
    definition.update?.(context, dt);

    const pastMinimum = this.elapsed >= definition.minimumDuration;
    const pastMaximum =
      definition.maximumDuration !== undefined &&
      this.elapsed >= definition.maximumDuration;
    const exitAllowed = definition.canExit
      ? definition.canExit(context, this.elapsed)
      : true;

    if (pastMaximum || (pastMinimum && exitAllowed)) {
      const next = this.decide(this.current, context, this.elapsed);
      if (next && next !== this.current && this.behaviors[next]) {
        this.transition(next, context);
      }
    }
  }

  /** Forces a transition regardless of minimumDuration — used for explicit triggers (click scatter, wake). */
  transition(next: MascotBehavior, context: TContext): void {
    if (!this.behaviors[next] || next === this.current) return;
    this.definitionFor(this.current).exit?.(context);
    this.current = next;
    this.elapsed = 0;
    this.definitionFor(this.current).enter?.(context);
  }

  getCurrent(): MascotBehavior {
    return this.current;
  }

  getElapsed(): number {
    return this.elapsed;
  }

  getMotionRecipe(): MotionRecipe {
    return this.definitionFor(this.current).motion;
  }
}
