import { RELAY_PORT, type HostToRelay, type RelayToHost } from '../networking/ControllerProtocol';
import type { BladeFrame, BladePointer, InputAdapter, InputAdapterStatus, InputSource } from './InputAdapter';

type PhoneState = 'idle' | 'connecting' | 'waiting-for-phone' | 'connected' | 'relay-unreachable';

const STATUS_DETAIL: Record<PhoneState, string> = {
  idle: 'not started',
  connecting: 'connecting to relay…',
  'waiting-for-phone': 'waiting for phone to scan',
  connected: 'phone connected',
  'relay-unreachable': 'relay server unreachable — run `pnpm relay`'
};

/**
 * Desktop side of the phone-trackpad controller: connects to the relay as
 * "host", surfaces a room code for the QR/pairing UI, and turns incoming
 * controller-state packets into the same BladePointer stream every other
 * adapter produces.
 */
export class PhoneAdapter implements InputAdapter {
  readonly source: InputSource = 'phone';

  private ws: WebSocket | null = null;
  private roomCode: string | null = null;
  private state: PhoneState = 'idle';
  private started = false;
  private wasActive = false;
  private pending: BladePointer[] = [];
  private reconnectTimer: number | undefined;
  private reconnectAttempt = 0;

  onRoomCode: ((roomCode: string) => void) | null = null;

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.connect();
  }

  stop(): void {
    this.started = false;
    window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.roomCode = null;
    this.wasActive = false;
    this.state = 'idle';
  }

  read(timestamp: number): BladeFrame {
    const pointers = this.pending;
    this.pending = [];
    return { timestamp, pointers };
  }

  getRoomCode(): string | null {
    return this.roomCode;
  }

  getStatus(): InputAdapterStatus {
    return {
      connected: this.state === 'connected',
      label: 'Phone',
      detail: this.roomCode ? `${STATUS_DETAIL[this.state]} (${this.roomCode})` : STATUS_DETAIL[this.state]
    };
  }

  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.state = 'connecting';
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const socket = new WebSocket(`${protocol}://${window.location.hostname}:${RELAY_PORT}`);
      this.ws = socket;

      let settled = false;

      socket.addEventListener('open', () => {
        this.reconnectAttempt = 0;
        this.send({ type: 'host-create' });
      });

      socket.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data as string) as RelayToHost;
        this.handleMessage(msg);
        if (msg.type === 'room-created' && !settled) {
          settled = true;
          resolve();
        }
      });

      socket.addEventListener('close', () => {
        if (!settled) {
          settled = true;
          this.state = 'relay-unreachable';
          reject(new Error('Could not reach the relay server'));
        }
        if (this.started) this.scheduleReconnect();
      });

      socket.addEventListener('error', () => socket.close());
    });
  }

  private scheduleReconnect(): void {
    this.state = 'connecting';
    const delay = Math.min(5000, 1000 * Math.pow(1.5, this.reconnectAttempt));
    this.reconnectAttempt++;
    this.reconnectTimer = window.setTimeout(() => {
      if (this.started) void this.connect();
    }, delay);
  }

  private handleMessage(msg: RelayToHost): void {
    switch (msg.type) {
      case 'room-created':
        this.roomCode = msg.roomCode;
        this.state = 'waiting-for-phone';
        this.onRoomCode?.(msg.roomCode);
        break;
      case 'controller-joined':
        this.state = 'connected';
        break;
      case 'controller-left':
        this.state = 'waiting-for-phone';
        if (this.wasActive) {
          this.pending.push(this.makePointer(0.5, 0.5, performance.now(), 'cancel', false));
          this.wasActive = false;
        }
        break;
      case 'controller-state':
        this.applyControllerState(msg.x, msg.y, msg.active);
        break;
      case 'error':
        this.state = 'relay-unreachable';
        break;
    }
  }

  private applyControllerState(x: number, y: number, active: boolean): void {
    const timestamp = performance.now();
    if (active && !this.wasActive) {
      this.pending.push(this.makePointer(x, y, timestamp, 'start', true));
    } else if (active) {
      this.pending.push(this.makePointer(x, y, timestamp, 'move', true));
    } else if (this.wasActive) {
      this.pending.push(this.makePointer(x, y, timestamp, 'end', false));
    }
    this.wasActive = active;
  }

  private makePointer(x: number, y: number, timestamp: number, phase: BladePointer['phase'], active: boolean): BladePointer {
    return { id: 'phone-0', x, y, timestamp, phase, source: this.source, active, confidence: 1 };
  }

  private send(msg: HostToRelay): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }
}
