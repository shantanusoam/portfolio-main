import type { AscentGameState } from "./GameTypes";

/**
 * Dedicated Strumrise game-state controller — spec: "Game mode must not
 * reuse homepage behavior conditions in an uncontrolled way. Create a
 * dedicated controller." Deliberately does not reuse `BehaviorMachine`
 * (that class is tied to `MascotRuntime`'s wander/interest/obstacle
 * signals, none of which apply to game state).
 */

const TRANSITIONS: Record<AscentGameState, readonly AscentGameState[]> = {
  inactive: ["transitioningIn"],
  transitioningIn: ["ready", "transitioningOut"],
  ready: ["playing", "transitioningOut"],
  playing: ["paused", "fallingOut", "sectorComplete", "transitioningOut"],
  paused: ["playing", "transitioningOut"],
  fallingOut: ["gameOver"],
  gameOver: ["ready", "transitioningOut"],
  sectorComplete: ["victory", "playing"],
  victory: ["transitioningOut"],
  transitioningOut: ["inactive"],
};

export class AscentGameController {
  private state: AscentGameState = "inactive";
  private readonly listeners = new Set<(state: AscentGameState) => void>();

  getState(): AscentGameState {
    return this.state;
  }

  canTransition(to: AscentGameState): boolean {
    return TRANSITIONS[this.state].includes(to);
  }

  transition(to: AscentGameState): boolean {
    if (!this.canTransition(to)) return false;
    this.state = to;
    this.listeners.forEach((listener) => listener(to));
    return true;
  }

  onChange(listener: (state: AscentGameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.state = "inactive";
  }
}
