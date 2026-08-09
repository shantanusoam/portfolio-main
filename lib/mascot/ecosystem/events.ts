import type { MascotEcosystemStatus } from "../types";

export const MASCOT_ECOSYSTEM_COMMAND_EVENT = "mascot:ecosystem-command";
export const MASCOT_ECOSYSTEM_STATUS_EVENT = "mascot:ecosystem-status";

export interface EcosystemCommandDetail {
  intent: "release" | "call";
  x: number;
  y: number;
}

export type EcosystemStatusEventDetail = MascotEcosystemStatus & {
  ready: boolean;
};
