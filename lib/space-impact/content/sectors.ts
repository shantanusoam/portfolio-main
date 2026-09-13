import type { Encounter, Formation, Pickup, Sector } from "../types";

const e = (
  at: number,
  kind: Encounter["kind"],
  lane: number,
  count = 1,
): Encounter => ({ at, kind, lane, count });
const BASE_SECTORS: Sector[] = [
  {
    id: "silent-orbit",
    name: "Silent Orbit",
    subtitle: "Someone left the lights on.",
    bossName: "The Watcher",
    color: "#82ead5",
    dark: "#07161c",
    duration: 78,
    transmission: "RECEIVER 01 / Follow the light. Do not trust the silence.",
    encounters: [
      e(1.5, "scout", 0.5, 4),
      e(8, "sentry", 0.5, 4),
      e(16, "prism", 0.5, 4),
      e(25, "diver", 0.5, 4),
      e(33, "armored", 0.5, 3),
      e(43, "sentry", 0.65, 3),
      e(51, "corridor", 0.52),
      e(57, "scout", 0.5, 3),
      e(65, "repair", 0.5),
      e(68, "sentry", 0.3, 2),
    ],
    features: [{ at: 40, kind: "window", y: 55 }],
  },
  {
    id: "glass-caverns",
    name: "Glass Caverns",
    subtitle: "Even the light has teeth.",
    bossName: "Prism Eel",
    color: "#b4a0fa",
    dark: "#17122a",
    duration: 100,
    transmission: "RECEIVER 02 / Reflections are not always echoes.",
    encounters: [
      e(3, "prism", 0.35, 3),
      e(10, "corridor", 0.6),
      e(18, "weapon", 0.5),
      e(23, "sentry", 0.2, 3),
      e(32, "prism", 0.7, 3),
      e(44, "diver", 0.5, 2),
      e(55, "corridor", 0.4),
      e(62, "prism", 0.45, 4),
      e(73, "repair", 0.5),
      e(80, "sentry", 0.6, 3),
      e(90, "diver", 0.3, 2),
    ],
    features: [{ at: 38, kind: "beacon", y: 190 }],
  },
  {
    id: "rust-cathedral",
    name: "Rust Cathedral",
    subtitle: "The machines kept building.",
    bossName: "The Foundry",
    color: "#f5b57c",
    dark: "#25170f",
    duration: 110,
    transmission: "RECEIVER 03 / Some things survive by refusing to fight.",
    encounters: [
      e(3, "armored", 0.3, 2),
      e(12, "corridor", 0.5),
      e(18, "weapon", 0.4),
      e(20, "feather", 0.35),
      e(26, "scout", 0.7, 4),
      e(34, "sentry", 0.2, 2),
      e(43, "feather", 0.65),
      e(48, "armored", 0.35, 2),
      e(66, "feather", 0.45),
      e(73, "corridor", 0.6),
      e(80, "repair", 0.4),
      e(87, "armored", 0.6, 3),
      e(99, "diver", 0.3, 3),
    ],
    features: [
      { at: 51, kind: "probe", y: 140 },
      { at: 72, kind: "portal", y: 120 },
    ],
  },
  {
    id: "pale-ocean",
    name: "The Pale Ocean",
    subtitle: "Listen to the water between stars.",
    bossName: "Choir Leviathan",
    color: "#8acfed",
    dark: "#071d2b",
    duration: 110,
    transmission:
      "RECEIVER 04 / There is a place smaller than a pixel. We called it home.",
    encounters: [
      e(3, "choir", 0.3, 3),
      e(15, "current", 0.5),
      e(22, "weapon", 0.4),
      e(29, "prism", 0.65, 3),
      e(39, "choir", 0.3, 3),
      e(49, "corridor", 0.55),
      e(58, "diver", 0.7, 3),
      e(72, "choir", 0.35, 2),
      e(82, "repair", 0.5),
      e(90, "current", 0.5),
      e(97, "sentry", 0.2, 3),
    ],
    features: [{ at: 67, kind: "planet", y: 60 }],
  },
  {
    id: "last-relay",
    name: "The Last Relay",
    subtitle: "The signal knows your name.",
    bossName: "The Archivist",
    color: "#f0a3b5",
    dark: "#211322",
    duration: 120,
    transmission: "RECEIVER 05 / We heard you coming. What will you say?",
    encounters: [
      e(3, "armored", 0.3, 2),
      e(13, "prism", 0.7, 3),
      e(23, "weapon", 0.5),
      e(29, "corridor", 0.55),
      e(38, "choir", 0.2, 3),
      e(49, "diver", 0.7, 3),
      e(59, "armored", 0.4, 2),
      e(70, "corridor", 0.4),
      e(79, "prism", 0.6, 4),
      e(89, "repair", 0.5),
      e(97, "sentry", 0.25, 3),
      e(108, "scout", 0.7, 4),
    ],
    features: [],
  },
];

const FORMATIONS: Formation[] = ["chevron", "wall", "weave", "pincer"];
const REWARDS: Pickup["kind"][] = ["shield", "charge", "overdrive", "drone"];
const supply = (at: number, drop: Pickup["kind"], lane = 0.5): Encounter => ({
  at,
  kind: "supply",
  lane,
  drop,
});
export const SECTORS: Sector[] = BASE_SECTORS.map((sector, index) => {
  let squad = 0;
  const encounters = sector.encounters
    .filter((wave) => wave.kind !== "weapon")
    .map((wave): Encounter => {
      if (["corridor", "current", "repair", "feather"].includes(wave.kind))
        return wave;
      const n = squad++;
      return {
        ...wave,
        count: Math.min(6, (wave.count ?? 1) + (index > 0 ? 1 : 0)),
        formation: FORMATIONS[n % 4],
        drop: REWARDS[n % 4],
      };
    });
  encounters.push(
    supply(2, index === 0 ? "split" : "seeker"),
    supply(8.5, "shield"),
    supply(12, "rail"),
    supply(21, "overdrive"),
    supply(26, "seeker"),
    supply(36, "drone"),
    supply(47, "pulse"),
    supply(sector.duration - 9, "charge"),
  );
  return { ...sector, encounters: encounters.sort((a, b) => a.at - b.at) };
});
