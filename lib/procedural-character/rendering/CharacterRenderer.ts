import type {
  CharacterKinematics,
  CharacterPerformanceSnapshot,
  CharacterPose,
  CharacterSpec,
  Vec2Like,
} from "../types";
import type { AppendageRuntime } from "../physics/Appendage";

export interface CharacterRenderState {
  readonly spec: CharacterSpec;
  readonly target: Vec2Like;
  readonly body: CharacterKinematics;
  readonly pose: CharacterPose;
  readonly appendages: readonly AppendageRuntime[];
  readonly performance: CharacterPerformanceSnapshot;
  elapsedTime: number;
  debug: boolean;
}

export interface CharacterRenderer {
  resize(width: number, height: number, devicePixelRatio: number): void;
  render(state: CharacterRenderState): void;
  destroy(): void;
}
