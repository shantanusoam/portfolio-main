/**
 * Shared type contracts for the Strumrise vertical-ascent game — see
 * docs/mascot/STRUMRISE_DESIGN.md. Kept separate from the game's classes
 * (mirrors lib/mascot/types.ts's role for the homepage mascot) so config,
 * physics, generation, and scoring can share shapes without circular
 * imports.
 */

export type AscentGameState =
  | "inactive"
  | "transitioningIn"
  | "ready"
  | "playing"
  | "paused"
  | "fallingOut"
  | "gameOver"
  | "sectorComplete"
  | "victory"
  | "transitioningOut";

/**
 * The upgrade spec lists twelve platform kinds; this MVP implements three
 * (normal/bass/treble) as a documented smaller scope — see
 * docs/mascot/STRUMRISE_DESIGN.md "Scope reductions".
 */
export type StringPlatformKind = "normal" | "bass" | "treble";

export interface AscentPlayerState {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  velocityX: number;
  velocityY: number;
  groundedStringId: string | null;
  coyoteTimer: number;
  inputX: number;
  combo: number;
  lives: number;
  energy: number;
  invulnerableTimer: number;
}

export interface GeneratedPlatform {
  id: string;
  kind: StringPlatformKind;
  x: number;
  y: number;
  width: number;
  note: { midiNote: number; frequency: number };
  chordRole: number;
  difficulty: number;
  seed: number;
  active: boolean;
}

export interface LandingFeedbackEvent {
  platformId: string;
  kind: StringPlatformKind;
  x: number;
  y: number;
  combo: number;
  pointsAwarded: number;
}
