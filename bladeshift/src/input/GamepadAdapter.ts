import type { BladeFrame, BladePointer, InputAdapter, InputAdapterStatus, InputSource } from './InputAdapter';

const DEADZONE = 0.15;
const MOVE_SPEED = 1.4; // normalized units/sec at full stick deflection
const TRIGGER_INDEX = 7; // right trigger (R2/RT) on the standard gamepad mapping

/**
 * Left stick drives a virtual cursor (accelerated, not absolute).
 * Right trigger held = blade active.
 */
export class GamepadAdapter implements InputAdapter {
  readonly source: InputSource = 'gamepad';

  private started = false;
  private cursor = { x: 0.5, y: 0.5 };
  private wasActive = false;
  private lastTimestamp = 0;
  private connectedLabel = 'No gamepad';
  private connected = false;

  start(): void {
    this.started = true;
    this.lastTimestamp = performance.now();
    window.addEventListener('gamepadconnected', this.onConnected);
    window.addEventListener('gamepaddisconnected', this.onDisconnected);
  }

  stop(): void {
    this.started = false;
    window.removeEventListener('gamepadconnected', this.onConnected);
    window.removeEventListener('gamepaddisconnected', this.onDisconnected);
  }

  read(timestamp: number): BladeFrame {
    if (!this.started) return { timestamp, pointers: [] };

    const pad = navigator.getGamepads?.().find((g) => g && g.connected) ?? null;
    if (!pad) {
      this.connected = false;
      this.lastTimestamp = timestamp;
      return { timestamp, pointers: [] };
    }
    this.connected = true;
    this.connectedLabel = pad.id;

    const dt = Math.min(0.05, Math.max(0, (timestamp - this.lastTimestamp) / 1000));
    this.lastTimestamp = timestamp;

    const axX = applyDeadzone(pad.axes[0] ?? 0);
    const axY = applyDeadzone(pad.axes[1] ?? 0);
    this.cursor.x = clamp01(this.cursor.x + axX * MOVE_SPEED * dt);
    this.cursor.y = clamp01(this.cursor.y + axY * MOVE_SPEED * dt);

    const trigger = pad.buttons[TRIGGER_INDEX];
    const isActive = !!trigger && (trigger.pressed || trigger.value > 0.5);

    const pointers: BladePointer[] = [];
    if (isActive || this.wasActive) {
      const phase: BladePointer['phase'] = isActive && !this.wasActive ? 'start' : isActive ? 'move' : 'end';
      pointers.push({
        id: 'gamepad-0',
        x: this.cursor.x,
        y: this.cursor.y,
        timestamp,
        phase,
        source: this.source,
        active: isActive,
        confidence: 1
      });
    }
    this.wasActive = isActive;

    return { timestamp, pointers };
  }

  getStatus(): InputAdapterStatus {
    return {
      connected: this.connected,
      label: this.connected ? this.connectedLabel : 'No gamepad',
      detail: this.connected ? 'Left stick moves, hold RT to cut' : 'Connect a controller and press a button'
    };
  }

  private onConnected = (): void => {
    this.connected = true;
  };

  private onDisconnected = (): void => {
    this.connected = false;
    this.wasActive = false;
  };
}

function applyDeadzone(v: number): number {
  if (Math.abs(v) < DEADZONE) return 0;
  const sign = v > 0 ? 1 : -1;
  return sign * ((Math.abs(v) - DEADZONE) / (1 - DEADZONE));
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
