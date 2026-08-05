import type { HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { BladeFrame, BladePointer, InputAdapter, InputAdapterStatus, InputSource } from './InputAdapter';

// Self-hosted (public/mediapipe/) rather than fetched from jsdelivr/Google
// Storage at runtime: a phone on a restrictive mobile network or a network
// that blocks/throttles those hosts would otherwise hang forever on "loading
// hand-tracking model...". Same origin as the game, same HTTPS cert, no
// external dependency. See scripts/fetch-mediapipe-assets.sh to refresh these.
const WASM_BASE = '/mediapipe/wasm';
const MODEL_URL = '/mediapipe/hand_landmarker.task';

const DETECT_INTERVAL_MS = 45; // ~22Hz -- plenty for a cursor, cheap on the main thread
const PINCH_THRESHOLD = 0.07; // normalized thumb-tip/index-tip distance that counts as a pinch
const LOST_GRACE_MS = 150;

// Comfortable hand-movement box in mirrored (screen-facing) normalized space,
// remapped to the full 0-1 output range. Avoids needing a calibration wizard
// -- the user doesn't have to reach the physical edges of the camera frame.
const REGION = { xMin: 0.2, xMax: 0.8, yMin: 0.12, yMax: 0.78 };

type HandState = 'idle' | 'requesting-permission' | 'loading-model' | 'ready' | 'no-hand' | 'denied' | 'error';

const STATUS_DETAIL: Record<HandState, string> = {
  idle: 'not started',
  'requesting-permission': 'requesting camera permission…',
  'loading-model': 'loading hand-tracking model…',
  ready: 'tracking',
  'no-hand': 'no hand detected',
  denied: 'camera permission denied',
  error: 'camera error'
};

/**
 * Index-fingertip cursor via MediaPipe HandLandmarker, pinch (thumb+index)
 * to activate the blade. Runs on the main thread at a throttled rate rather
 * than in a worker -- simpler, and detection frequency here is nowhere near
 * a bottleneck at ~22Hz for a single hand.
 */
export class CameraHandAdapter implements InputAdapter {
  readonly source: InputSource = 'camera-hand';

  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private landmarker: HandLandmarker | null = null;
  private pending: BladePointer[] = [];
  private lastDetectAt = 0;
  private lastSeenAt = 0;
  private wasActive = false;
  private started = false;
  private state: HandState = 'idle';

  constructor() {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
  }

  /** Lets UI show a live mirrored self-view; returns null until start() succeeds. */
  getStream(): MediaStream | null {
    return this.stream;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    try {
      this.state = 'requesting-permission';
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      await new Promise<void>((resolve) => {
        if (this.video.readyState >= 2) resolve();
        else this.video.addEventListener('loadeddata', () => resolve(), { once: true });
      });

      this.state = 'loading-model';
      // Dynamically imported so the ~150KB wrapper only ships to players who
      // actually pick webcam mode, instead of bloating the main bundle.
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1
      });

      this.state = 'no-hand';
    } catch (err) {
      this.started = false;
      const isPermissionDenied = err instanceof DOMException && err.name === 'NotAllowedError';
      this.state = isPermissionDenied ? 'denied' : 'error';
      this.teardownStream();
      throw err;
    }
  }

  stop(): void {
    this.started = false;
    this.state = 'idle';
    this.wasActive = false;
    this.teardownStream();
    this.landmarker?.close();
    this.landmarker = null;
  }

  read(timestamp: number): BladeFrame {
    const pointers = this.pending;
    this.pending = [];

    if (this.landmarker && this.video.readyState >= 2 && timestamp - this.lastDetectAt >= DETECT_INTERVAL_MS) {
      this.lastDetectAt = timestamp;
      this.detect(timestamp);
    }

    return { timestamp, pointers };
  }

  getStatus(): InputAdapterStatus {
    return { connected: this.state === 'ready' || this.state === 'no-hand', label: 'Webcam', detail: STATUS_DETAIL[this.state] };
  }

  private detect(timestamp: number): void {
    if (!this.landmarker) return;
    const result: HandLandmarkerResult = this.landmarker.detectForVideo(this.video, timestamp);
    const landmarks = result.landmarks[0];

    if (!landmarks) {
      if (timestamp - this.lastSeenAt > LOST_GRACE_MS) {
        if (this.wasActive) {
          this.pending.push(this.makePointer(0.5, 0.5, timestamp, 'cancel', false, 0));
          this.wasActive = false;
        }
        this.state = 'no-hand';
      }
      return;
    }

    this.lastSeenAt = timestamp;
    this.state = 'ready';

    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    const active = pinchDist < PINCH_THRESHOLD;
    const confidence = result.handedness[0]?.[0]?.score ?? 0.7;

    const mirroredX = 1 - indexTip.x;
    const x = clamp01(mapRange(mirroredX, REGION.xMin, REGION.xMax, 0, 1));
    const y = clamp01(mapRange(indexTip.y, REGION.yMin, REGION.yMax, 0, 1));

    if (active && !this.wasActive) {
      this.pending.push(this.makePointer(x, y, timestamp, 'start', true, confidence));
    } else if (active) {
      this.pending.push(this.makePointer(x, y, timestamp, 'move', true, confidence));
    } else if (this.wasActive) {
      this.pending.push(this.makePointer(x, y, timestamp, 'end', false, confidence));
    }
    this.wasActive = active;
  }

  private makePointer(
    x: number,
    y: number,
    timestamp: number,
    phase: BladePointer['phase'],
    active: boolean,
    confidence: number
  ): BladePointer {
    return { id: 'camera-hand-0', x, y, timestamp, phase, source: this.source, active, confidence };
  }

  private teardownStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }
}

function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
