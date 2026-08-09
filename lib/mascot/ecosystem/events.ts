import type { MascotEcosystemStatus } from "../types";

export const MASCOT_ECOSYSTEM_COMMAND_EVENT = "mascot:ecosystem-command";
export const MASCOT_ECOSYSTEM_STATUS_EVENT = "mascot:ecosystem-status";
export const MASCOT_ECOSYSTEM_POINTER_HINT_EVENT =
  "mascot:ecosystem-pointer-hint";

export interface EcosystemCommandDetail {
  intent: "release" | "call";
  x: number;
  y: number;
}

export interface EcosystemPointerHintDetail {
  overEgg: boolean;
}

export type EcosystemStatusEventDetail = MascotEcosystemStatus & {
  ready: boolean;
};
