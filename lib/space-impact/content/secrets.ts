import type { Secret } from "../types";

export const SECRETS: {
  id: Secret;
  name: string;
  clue: string;
  hint: string;
  reward: string;
}[] = [
  {
    id: "lcd",
    name: "3310 Transmission",
    clue: "Two numbers survived: 33 / 10.",
    hint: "The receiver on the title screen accepts four digits.",
    reward: "An old green screen. A familiar future. LCD display unlocked.",
  },
  {
    id: "window",
    name: "The Window That Blinked",
    clue: "One window in Silent Orbit is still awake.",
    hint: "At 40 seconds, aim at the high window while it glows.",
    reward: "Fragment I: We did not leave. We became the signal.",
  },
  {
    id: "404",
    name: "Sector Not Found",
    clue: "The broken beacon cannot find its destination.",
    hint: "In Glass Caverns, approach the beacon and transmit 404.",
    reward: "Fragment II: The archive remembers every voice.",
  },
  {
    id: "cluck",
    name: "Cluckstorm Breach",
    clue: "Three feathers. In a place without birds.",
    hint: "In Rust Cathedral, collect all three gold feathers and approach the portal.",
    reward: "An impossible flock. Cluckstorm cartridge recovered.",
  },
  {
    id: "patient",
    name: "The Patient Pilot",
    clue: "The small probe asks for silence.",
    hint: "In Rust Cathedral, hold fire and stay close to the neutral probe for five seconds.",
    reward:
      "Fragment III: Listen before you answer. A little friend joins you.",
  },
  {
    id: "blue-dot",
    name: "Pale Blue Dot",
    clue: "Beyond the Pale Ocean, a blue light waits.",
    hint: "Approach the tiny planet and inspect it. Take a breath.",
    reward: "All our roads began on a little light like this.",
  },
  {
    id: "ghost",
    name: "Ghost of Your Last Run",
    clue: "Something remembers where you fell.",
    hint: "Replay the sector where you died. Approach your flickering echo.",
    reward:
      "Your previous flight, briefly returned. Try a wider route next time.",
  },
  {
    id: "signal",
    name: "The Real Signal",
    clue: "Three fragments. One question left to answer.",
    hint: "Find the window, broken beacon, and patient probe. At the final relay, repeat the three visible symbols.",
    reward:
      "The signal was never a distress call. It was an invitation. Constellation ship livery unlocked.",
  },
];
export const SECRET_IDS = SECRETS.map((item) => item.id);
export const FRAGMENTS: Secret[] = ["window", "404", "patient"];
export const RELAY_SEQUENCE = ["△", "○", "◇"];
