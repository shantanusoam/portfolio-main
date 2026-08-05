import { RELAY_PORT, type ControllerToRelay, type RelayToController } from '../../src/networking/ControllerProtocol';

const statusEl = document.getElementById('status')!;
const joinForm = document.getElementById('join-form') as HTMLFormElement;
const roomInput = document.getElementById('room-input') as HTMLInputElement;
const modeToggle = document.getElementById('mode-toggle')!;
const trackpad = document.getElementById('trackpad')!;
const crosshair = document.getElementById('crosshair')!;
const swingFlash = document.getElementById('swing-flash')!;
const enableMotionBtn = document.getElementById('enable-motion') as HTMLButtonElement;
const recalibrateBtn = document.getElementById('recalibrate') as HTMLButtonElement;
const holdToCutBtn = document.getElementById('hold-to-cut') as HTMLButtonElement;
const hint = document.getElementById('hint')!;

let ws: WebSocket | null = null;
let joinedRoom: string | null = null;
let sequence = 0;
let reconnectAttempt = 0;
let reconnectTimer: number | undefined;

type ControlMode = 'trackpad' | 'sword' | 'tilt';
let controlMode: ControlMode = 'trackpad';

/** Aim position, driven by touch in both modes. Only "active" (cut-capable)
 * in trackpad mode -- in sword mode it's just where the next swing lands. */
const current = { x: 0.5, y: 0.5, active: false };
/** True while a synthetic swing burst is being transmitted -- pauses the
 * regular send loop so its stale `current` state can't interleave. */
let swingInProgress = false;
let sendLoopId = 0;

function setStatus(text: string): void {
  statusEl.textContent = text;
}

function relayUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.hostname}:${RELAY_PORT}`;
}

function connect(roomCode: string): void {
  joinedRoom = roomCode;
  setStatus(`Connecting to ${roomCode}…`);

  const socket = new WebSocket(relayUrl());
  ws = socket;

  socket.addEventListener('open', () => {
    reconnectAttempt = 0;
    send({ type: 'join', roomCode });
  });

  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data) as RelayToController;
    if (msg.type === 'joined') {
      setStatus(`Connected — room ${msg.roomCode}`);
      joinForm.classList.add('hidden');
      modeToggle.classList.remove('hidden');
      trackpad.classList.remove('hidden');
      startSendLoop();
    } else if (msg.type === 'host-left') {
      setStatus('Game disconnected. Waiting for host…');
      trackpad.classList.add('hidden');
      modeToggle.classList.add('hidden');
    } else if (msg.type === 'error') {
      setStatus(msg.message);
      trackpad.classList.add('hidden');
      modeToggle.classList.add('hidden');
      joinForm.classList.remove('hidden');
    }
  });

  socket.addEventListener('close', () => {
    stopSendLoop();
    if (joinedRoom) scheduleReconnect(joinedRoom);
  });

  socket.addEventListener('error', () => socket.close());
}

function scheduleReconnect(roomCode: string): void {
  setStatus('Connection lost — reconnecting…');
  trackpad.classList.add('hidden');
  modeToggle.classList.add('hidden');
  window.clearTimeout(reconnectTimer);
  const delay = Math.min(5000, 1000 * Math.pow(1.5, reconnectAttempt));
  reconnectAttempt++;
  reconnectTimer = window.setTimeout(() => connect(roomCode), delay);
}

function send(msg: ControllerToRelay): void {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function startSendLoop(): void {
  stopSendLoop();
  const tick = () => {
    // A swing burst sends its own precisely-timed points directly (see
    // playSwingBurst) -- skip so this loop's stale `current` state can't
    // interleave between them and prematurely end the synthetic stroke.
    if (!swingInProgress) {
      send({ type: 'state', x: current.x, y: current.y, active: current.active, sequence: sequence++, clientTimestamp: Date.now() });
    }
    sendLoopId = requestAnimationFrame(tick);
  };
  sendLoopId = requestAnimationFrame(tick);
}

function stopSendLoop(): void {
  cancelAnimationFrame(sendLoopId);
}

function updateFromPoint(clientX: number, clientY: number): void {
  const rect = trackpad.getBoundingClientRect();
  current.x = clamp01((clientX - rect.left) / rect.width);
  current.y = clamp01((clientY - rect.top) / rect.height);
  crosshair.style.left = `${current.x * 100}%`;
  crosshair.style.top = `${current.y * 100}%`;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Mode switching -------------------------------------------------------

modeToggle.querySelectorAll<HTMLButtonElement>('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode as ControlMode));
});

function setMode(nextMode: ControlMode): void {
  if (nextMode === controlMode) return;
  controlMode = nextMode;
  current.active = false;
  swingInProgress = false;
  activePointerId = null;

  modeToggle.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('selected'));
  modeToggle.querySelector(`[data-mode="${nextMode}"]`)?.classList.add('selected');
  trackpad.classList.toggle('sword-mode', nextMode === 'sword');
  trackpad.classList.toggle('tilt-mode', nextMode === 'tilt');
  trackpad.classList.remove('active', 'cutting');
  enableMotionBtn.classList.add('hidden');
  recalibrateBtn.classList.add('hidden');
  holdToCutBtn.classList.add('hidden');

  if (nextMode === 'sword') {
    hint.textContent = 'Touch to aim · swing the phone to cut';
    ensureSensorAccess(attachMotionListener);
  } else if (nextMode === 'tilt') {
    hint.textContent = 'Move the phone to aim · hold the button to cut';
    holdToCutBtn.classList.remove('hidden');
    recalibrateBtn.classList.remove('hidden');
    beginTiltCalibration();
    ensureSensorAccess(() => {
      attachOrientationListener();
      attachMotionListener();
    });
  } else {
    hint.textContent = 'Drag to move the blade · press to cut';
  }
}

// --- Trackpad-mode touch (also used for aiming in sword mode) ------------

let activePointerId: number | null = null;

trackpad.addEventListener('pointerdown', (e) => {
  if ((e.target as HTMLElement).closest('#enable-motion, #recalibrate, #hold-to-cut')) return;
  if (controlMode === 'tilt') return; // orientation drives the cursor, not touch
  activePointerId = e.pointerId;
  trackpad.setPointerCapture(e.pointerId);
  updateFromPoint(e.clientX, e.clientY);
  if (controlMode === 'trackpad') {
    current.active = true;
    trackpad.classList.add('active');
    navigator.vibrate?.(15);
  }
});

trackpad.addEventListener('pointermove', (e) => {
  if (e.pointerId !== activePointerId) return;
  updateFromPoint(e.clientX, e.clientY);
});

function releasePointer(e: PointerEvent): void {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  if (controlMode === 'trackpad') {
    current.active = false;
    trackpad.classList.remove('active');
  }
}
trackpad.addEventListener('pointerup', releasePointer);
trackpad.addEventListener('pointercancel', releasePointer);

// --- Tilt mode: hold-to-cut button ----------------------------------------

holdToCutBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  holdToCutBtn.setPointerCapture(e.pointerId);
  current.active = true;
  holdToCutBtn.classList.add('cutting');
  trackpad.classList.add('cutting');
  navigator.vibrate?.(15);
});

function releaseHoldToCut(e: PointerEvent): void {
  e.stopPropagation();
  current.active = false;
  holdToCutBtn.classList.remove('cutting');
  trackpad.classList.remove('cutting');
}
holdToCutBtn.addEventListener('pointerup', releaseHoldToCut);
holdToCutBtn.addEventListener('pointercancel', releaseHoldToCut);

// --- Sword mode: swing detection via device motion ------------------------
//
// A phone's accelerometer/gyro can't recover true position (drift makes real
// 6DOF sword tracking unreliable), so this is a gesture controller, not real
// tracking: touch aims a cursor, a fast rotation ("swing") synthesizes a
// short, fast two-point stroke through that cursor -- reusing the exact same
// `state` protocol as trackpad mode, so nothing downstream (relay,
// PhoneAdapter, SliceSystem) needs to know sword mode exists.

const SWING_THRESHOLD = 180; // deg/s combined pitch+roll rate to count as a swing
const SWING_MAX = 600; // deg/s that maps to full swing power
const SWING_COOLDOWN_MS = 350;
const FRAME_MS = 16;

let lastSwingAt = -Infinity;
let motionListenerAttached = false;

// --- Shared sensor permission handling ------------------------------------
//
// iOS gates DeviceMotionEvent and DeviceOrientationEvent behind separate
// requestPermission() calls, but both must be triggered from a real user
// gesture (a click) -- neither can be requested proactively on page load.
// Android/desktop expose no such gate; the listener just attaches directly.
// One "Enable Motion" tap covers whichever sensor the current mode needs.

function ensureSensorAccess(attach: () => void): void {
  const NeedsPermission = (api: unknown): api is { requestPermission: () => Promise<'granted' | 'denied'> } =>
    typeof (api as { requestPermission?: unknown })?.requestPermission === 'function';

  const motionApi = window.DeviceMotionEvent as unknown;
  const orientationApi = window.DeviceOrientationEvent as unknown;
  const needsPrompt = NeedsPermission(motionApi) || NeedsPermission(orientationApi);

  if (!window.DeviceMotionEvent && !window.DeviceOrientationEvent) {
    hint.textContent = 'This browser has no motion sensor access -- try Trackpad mode instead.';
    return;
  }

  if (!needsPrompt) {
    attach();
    return;
  }

  enableMotionBtn.classList.remove('hidden');
  enableMotionBtn.onclick = async () => {
    try {
      if (NeedsPermission(motionApi) && (await motionApi.requestPermission()) !== 'granted') {
        hint.textContent = 'Motion permission denied -- this mode needs it.';
        return;
      }
      if (NeedsPermission(orientationApi) && (await orientationApi.requestPermission()) !== 'granted') {
        hint.textContent = 'Orientation permission denied -- this mode needs it.';
        return;
      }
      enableMotionBtn.classList.add('hidden');
      attach();
    } catch {
      hint.textContent = 'Could not request motion permission on this browser.';
    }
  };
}

function attachMotionListener(): void {
  if (motionListenerAttached) return;
  motionListenerAttached = true;
  window.addEventListener('devicemotion', onDeviceMotion);
}

function onDeviceMotion(event: DeviceMotionEvent): void {
  if (controlMode === 'sword') {
    onSwingMotion(event);
  } else if (controlMode === 'tilt') {
    onTiltGyro(event);
  }
}

function onSwingMotion(event: DeviceMotionEvent): void {
  const rate = event.rotationRate;
  if (!rate) return;

  const beta = rate.beta ?? 0; // pitch (up/down swing component)
  const gamma = rate.gamma ?? 0; // roll (left/right swing component)
  const magnitude = Math.hypot(beta, gamma);

  const now = performance.now();
  if (magnitude < SWING_THRESHOLD || now - lastSwingAt < SWING_COOLDOWN_MS) return;
  lastSwingAt = now;

  const dirX = gamma / magnitude;
  const dirY = beta / magnitude;
  const power = clamp01((magnitude - SWING_THRESHOLD) / (SWING_MAX - SWING_THRESHOLD));

  triggerSwing(dirX, dirY, power);
}

function triggerSwing(dirX: number, dirY: number, power: number): void {
  const halfLen = 0.05 + power * 0.17;
  const cx = current.x;
  const cy = current.y;
  const ax = clamp01(cx - dirX * halfLen);
  const ay = clamp01(cy - dirY * halfLen);
  const bx = clamp01(cx + dirX * halfLen);
  const by = clamp01(cy + dirY * halfLen);

  flashSwing(power);
  navigator.vibrate?.(power > 0.6 ? [12, 24, 12] : 18);

  void playSwingBurst(ax, ay, bx, by);
}

async function playSwingBurst(ax: number, ay: number, bx: number, by: number): Promise<void> {
  // Sent directly rather than through the rAF-driven send loop: rAF can be
  // throttled hard on a backgrounded/inactive tab (or just an unlucky
  // scheduling gap), which would silently drop these time-critical points
  // instead of merely delaying them.
  swingInProgress = true;
  send({ type: 'state', x: ax, y: ay, active: true, sequence: sequence++, clientTimestamp: Date.now() });
  await sleep(FRAME_MS);
  send({ type: 'state', x: bx, y: by, active: true, sequence: sequence++, clientTimestamp: Date.now() });
  await sleep(FRAME_MS);
  send({ type: 'state', x: bx, y: by, active: false, sequence: sequence++, clientTimestamp: Date.now() });
  swingInProgress = false;
}

function flashSwing(power: number): void {
  swingFlash.style.setProperty('--swing-power', String(0.5 + power * 0.5));
  swingFlash.classList.remove('show');
  void swingFlash.offsetWidth; // restart animation on rapid consecutive swings
  swingFlash.classList.add('show');
}

// --- Tilt mode: continuous, low-latency orientation-driven cursor ---------
//
// A naive implementation would just map DeviceOrientationEvent's absolute
// beta/gamma straight to cursor position every event. That felt laggy in
// practice: `deviceorientation` is a *fused* reading (the browser's own
// sensor fusion, batched/throttled more conservatively than raw sensors on
// many phones) and every additional smoothing pass downstream (this file's
// CSS transition, InputRouter's phone-source smoothing) stacks more delay
// on top of it.
//
// This uses a complementary filter instead -- the standard technique for
// exactly this kind of orientation tracking (also how most "phone as a
// pointer/wand" implementations work): integrate the gyroscope's angular
// *velocity* (`devicemotion.rotationRate`, typically higher-frequency and
// lower-latency than the fused orientation reading) every motion sample for
// immediate responsiveness, then gently pull that integrated position back
// toward the absolute orientation reading on every orientation sample so
// gyro drift never accumulates. Short-term: gyro. Long-term: orientation.

const TILT_RANGE_DEG = 35; // degrees off neutral that maps to the full 0-1 range
const DRIFT_CORRECTION = 0.08; // per-orientation-sample pull toward the absolute reading
const CALIBRATION_WINDOW_MS = 250; // average samples over this window instead of trusting one

let orientationListenerAttached = false;
let tiltCalibrated = false;
let calibrating = false;
let calibrationStartAt = 0;
let calibrationSumBeta = 0;
let calibrationSumGamma = 0;
let calibrationCount = 0;
let neutralBeta = 0;
let neutralGamma = 0;
let cursorX = 0.5;
let cursorY = 0.5;
let lastGyroSampleAt = 0;

function attachOrientationListener(): void {
  if (orientationListenerAttached) return;
  orientationListenerAttached = true;
  window.addEventListener('deviceorientation', onDeviceOrientation);
}

function beginTiltCalibration(): void {
  calibrating = true;
  tiltCalibrated = false;
  calibrationStartAt = performance.now();
  calibrationSumBeta = 0;
  calibrationSumGamma = 0;
  calibrationCount = 0;
  cursorX = 0.5;
  cursorY = 0.5;
}

function onTiltGyro(event: DeviceMotionEvent): void {
  const rate = event.rotationRate;
  if (!rate || !tiltCalibrated) {
    lastGyroSampleAt = performance.now();
    return;
  }

  const now = performance.now();
  const dt = lastGyroSampleAt ? Math.min(0.05, (now - lastGyroSampleAt) / 1000) : 0;
  lastGyroSampleAt = now;
  if (dt <= 0) return;

  const dGamma = (rate.gamma ?? 0) * dt;
  const dBeta = (rate.beta ?? 0) * dt;
  cursorX = clamp01(cursorX + (dGamma / TILT_RANGE_DEG) * 0.5);
  cursorY = clamp01(cursorY + (dBeta / TILT_RANGE_DEG) * 0.5);
  applyCursor();
}

function onDeviceOrientation(event: DeviceOrientationEvent): void {
  if (controlMode !== 'tilt') return;
  const beta = event.beta;
  const gamma = event.gamma;
  if (beta === null || gamma === null) return;

  if (calibrating) {
    calibrationSumBeta += beta;
    calibrationSumGamma += gamma;
    calibrationCount++;
    if (performance.now() - calibrationStartAt >= CALIBRATION_WINDOW_MS && calibrationCount > 0) {
      neutralBeta = calibrationSumBeta / calibrationCount;
      neutralGamma = calibrationSumGamma / calibrationCount;
      calibrating = false;
      tiltCalibrated = true;
    }
    return;
  }

  if (!tiltCalibrated) {
    beginTiltCalibration();
    return;
  }

  // Slow pull toward the absolute-orientation-derived position -- this is
  // the filter's drift correction, deliberately gentle so it corrects
  // long-term error without fighting the gyro's short-term responsiveness.
  const targetX = clamp01(0.5 + clampSigned((gamma - neutralGamma) / TILT_RANGE_DEG) * 0.5);
  const targetY = clamp01(0.5 + clampSigned((beta - neutralBeta) / TILT_RANGE_DEG) * 0.5);
  cursorX += (targetX - cursorX) * DRIFT_CORRECTION;
  cursorY += (targetY - cursorY) * DRIFT_CORRECTION;
  applyCursor();
}

function applyCursor(): void {
  current.x = cursorX;
  current.y = cursorY;
  crosshair.style.left = `${cursorX * 100}%`;
  crosshair.style.top = `${cursorY * 100}%`;
}

function clampSigned(v: number): number {
  return v < -1 ? -1 : v > 1 ? 1 : v;
}

recalibrateBtn.addEventListener('click', () => {
  beginTiltCalibration();
  navigator.vibrate?.(15);
});

// --- Boot -------------------------------------------------------------

joinForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = roomInput.value.trim().toUpperCase();
  if (code.length === 4) connect(code);
});

const roomFromUrl = new URLSearchParams(window.location.search).get('room');
if (roomFromUrl && roomFromUrl.length === 4) {
  connect(roomFromUrl.toUpperCase());
} else {
  setStatus('Enter room code');
  joinForm.classList.remove('hidden');
}
