/** Shared message shapes between the phone controller page, the relay
 * server, and the desktop PhoneAdapter. Pure types/values only -- no DOM or
 * Node APIs -- so this file can be imported from both environments. */

export type HostToRelay = { type: 'host-create' } | { type: 'ping'; sentAt: number };

export type RelayToHost =
  | { type: 'room-created'; roomCode: string }
  | { type: 'controller-joined' }
  | { type: 'controller-left' }
  | { type: 'controller-state'; x: number; y: number; active: boolean; sequence: number; clientTimestamp: number }
  | { type: 'pong'; sentAt: number; serverTimestamp: number }
  | { type: 'error'; message: string };

export type ControllerToRelay =
  | { type: 'join'; roomCode: string }
  | { type: 'state'; x: number; y: number; active: boolean; sequence: number; clientTimestamp: number }
  | { type: 'ping'; sentAt: number };

export type RelayToController =
  | { type: 'joined'; roomCode: string }
  | { type: 'host-left' }
  | { type: 'pong'; sentAt: number; serverTimestamp: number }
  | { type: 'error'; message: string };

export const RELAY_PORT = 8787;

/** Excludes visually ambiguous characters (0/O, 1/I/L) so codes are easy to read and type. */
export const ROOM_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;
