import { createServer } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import {
  RELAY_PORT,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  type ControllerToRelay,
  type HostToRelay,
  type RelayToController,
  type RelayToHost
} from '../src/networking/ControllerProtocol.ts';

interface Room {
  code: string;
  host: WebSocket | null;
  controller: WebSocket | null;
  createdAt: number;
  lastSequence: number;
}

const ROOM_TTL_MS = 30 * 60 * 1000;

function generateRoomCode(existing: ReadonlySet<string>): string {
  let code: string;
  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () => ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]).join('');
  } while (existing.has(code));
  return code;
}

function send(ws: WebSocket, msg: RelayToHost | RelayToController): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

const rooms = new Map<string, Room>();

// A plain http.Server underneath, rather than letting `ws` create its own,
// gives us a GET / health check for readiness probes (Playwright's webServer,
// process managers, uptime monitors) instead of a port that only speaks the
// WebSocket upgrade handshake.
const httpServer = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end(`ok — ${rooms.size} active room(s)`);
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  let role: 'host' | 'controller' | null = null;
  let room: Room | null = null;

  ws.on('message', (raw) => {
    let msg: HostToRelay | ControllerToRelay;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (msg.type) {
      case 'host-create': {
        role = 'host';
        const code = generateRoomCode(new Set(rooms.keys()));
        room = { code, host: ws, controller: null, createdAt: Date.now(), lastSequence: -1 };
        rooms.set(code, room);
        send(ws, { type: 'room-created', roomCode: code });
        break;
      }

      case 'join': {
        const target = rooms.get(msg.roomCode.toUpperCase());
        if (!target) {
          send(ws, { type: 'error', message: 'Room not found' });
          return;
        }
        role = 'controller';
        room = target;
        target.controller = ws;
        // Reset per-stream sequence tracking so a reconnecting controller's
        // fresh sequence-from-zero isn't dropped as "stale" against the old stream.
        target.lastSequence = -1;
        send(ws, { type: 'joined', roomCode: target.code });
        if (target.host) send(target.host, { type: 'controller-joined' });
        break;
      }

      case 'state': {
        if (role !== 'controller' || !room) return;
        if (msg.sequence <= room.lastSequence) return; // drop stale/out-of-order packets
        room.lastSequence = msg.sequence;
        if (room.host) {
          send(room.host, {
            type: 'controller-state',
            x: msg.x,
            y: msg.y,
            active: msg.active,
            sequence: msg.sequence,
            clientTimestamp: msg.clientTimestamp
          });
        }
        break;
      }

      case 'ping': {
        send(ws, { type: 'pong', sentAt: msg.sentAt, serverTimestamp: Date.now() });
        break;
      }
    }
  });

  ws.on('close', () => {
    if (!room) return;
    if (role === 'host' && room.host === ws) {
      room.host = null;
      if (room.controller) send(room.controller, { type: 'host-left' });
      rooms.delete(room.code);
    } else if (role === 'controller' && room.controller === ws) {
      room.controller = null;
      if (room.host) send(room.host, { type: 'controller-left' });
    }
  });
});

// Sweep rooms whose host vanished without a clean close (crash, dropped Wi-Fi)
// and never came back.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (!room.host && now - room.createdAt > ROOM_TTL_MS) rooms.delete(code);
  }
}, 60_000).unref();

httpServer.listen(RELAY_PORT, () => {
  console.log(`BladeShift relay listening on ws://0.0.0.0:${RELAY_PORT}`);
});
