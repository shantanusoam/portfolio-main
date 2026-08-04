import { RELAY_PORT, type ControllerToRelay, type RelayToController } from '../../src/networking/ControllerProtocol';

const statusEl = document.getElementById('status')!;
const joinForm = document.getElementById('join-form') as HTMLFormElement;
const roomInput = document.getElementById('room-input') as HTMLInputElement;
const trackpad = document.getElementById('trackpad')!;
const crosshair = document.getElementById('crosshair')!;

let ws: WebSocket | null = null;
let joinedRoom: string | null = null;
let sequence = 0;
let reconnectAttempt = 0;
let reconnectTimer: number | undefined;

const current = { x: 0.5, y: 0.5, active: false };
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
      trackpad.classList.remove('hidden');
      startSendLoop();
    } else if (msg.type === 'host-left') {
      setStatus('Game disconnected. Waiting for host…');
      trackpad.classList.add('hidden');
    } else if (msg.type === 'error') {
      setStatus(msg.message);
      trackpad.classList.add('hidden');
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
    send({ type: 'state', x: current.x, y: current.y, active: current.active, sequence: sequence++, clientTimestamp: Date.now() });
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

let activePointerId: number | null = null;

trackpad.addEventListener('pointerdown', (e) => {
  activePointerId = e.pointerId;
  trackpad.setPointerCapture(e.pointerId);
  current.active = true;
  trackpad.classList.add('active');
  updateFromPoint(e.clientX, e.clientY);
  navigator.vibrate?.(15);
});

trackpad.addEventListener('pointermove', (e) => {
  if (e.pointerId !== activePointerId) return;
  updateFromPoint(e.clientX, e.clientY);
});

function releasePointer(e: PointerEvent): void {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  current.active = false;
  trackpad.classList.remove('active');
}
trackpad.addEventListener('pointerup', releasePointer);
trackpad.addEventListener('pointercancel', releasePointer);

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
