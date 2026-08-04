export type InputSource = 'pointer' | 'touch' | 'gamepad' | 'replay';

export type BladePhase = 'start' | 'move' | 'end' | 'cancel';

export interface BladePointer {
  id: string;
  /** Normalized viewport coordinates, 0-1. */
  x: number;
  y: number;
  timestamp: number;
  phase: BladePhase;
  source: InputSource;
  active: boolean;
  /** 0-1 confidence. Deterministic sources (pointer/gamepad/replay) report 1. */
  confidence: number;
  pressure?: number;
}

export interface BladeFrame {
  timestamp: number;
  pointers: readonly BladePointer[];
}

export interface InputAdapterStatus {
  connected: boolean;
  label: string;
  detail?: string;
}

export interface InputAdapter {
  readonly source: InputSource;
  start(): void;
  stop(): void;
  /** Pull the latest frame. Called once per animation frame by InputRouter. */
  read(timestamp: number): BladeFrame;
  getStatus(): InputAdapterStatus;
}

export const EMPTY_FRAME = (timestamp: number): BladeFrame => ({ timestamp, pointers: [] });
