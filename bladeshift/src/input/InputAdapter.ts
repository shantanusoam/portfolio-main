export type InputSource = 'pointer' | 'touch' | 'gamepad' | 'camera-hand' | 'phone' | 'replay';

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
  /** 0-1 confidence. Deterministic sources (pointer/gamepad/replay) report 1;
   * camera-hand reports the model's per-frame detection confidence. */
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
  /** May be async (camera permission, WebSocket connect). Callers that need
   * to react to failure (e.g. permission denied) should await the result;
   * fire-and-forget callers can ignore it and poll getStatus() instead. */
  start(): void | Promise<void>;
  stop(): void;
  /** Pull the latest frame. Called once per animation frame by InputRouter. */
  read(timestamp: number): BladeFrame;
  getStatus(): InputAdapterStatus;
}

export const EMPTY_FRAME = (timestamp: number): BladeFrame => ({ timestamp, pointers: [] });
