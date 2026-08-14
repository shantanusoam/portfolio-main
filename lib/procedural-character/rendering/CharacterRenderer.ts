import type {
  CharacterKinematics,
  CharacterActionState,
  CharacterPerformanceSnapshot,
  CharacterPose,
  CharacterSpec,
  EnvironmentSurface,
  Vec2Like,
} from "../types";
import type { AppendageRuntime } from "../physics/Appendage";
import type { SoftBodyRuntime } from "../physics/SoftBody";

export interface CharacterRenderState {
  readonly spec: CharacterSpec;
  readonly target: Vec2Like;
  readonly body: CharacterKinematics;
  readonly softBody: SoftBodyRuntime | null;
  readonly pose: CharacterPose;
  readonly appendages: readonly AppendageRuntime[];
  readonly performance: CharacterPerformanceSnapshot;
  readonly action: CharacterActionState;
  environmentSurfaces: readonly EnvironmentSurface[];
  elapsedTime: number;
  debug: boolean;
}

export interface CharacterRenderer {
  resize(width: number, height: number, devicePixelRatio: number): void;
  render(state: CharacterRenderState): void;
  destroy(): void;
}
