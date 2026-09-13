/** Original eight-bar chip score; pure note data supports deterministic QA. */
export interface MusicScene {
  sector: number;
  combo: number;
  enemies: number;
  overdrive: boolean;
  quiet: boolean;
  boss: boolean;
}
export interface ChipNote {
  frequency: number;
  duration: number;
  gain: number;
  wave: "sine" | "square" | "triangle" | "sawtooth";
  target?: number;
}
const ROOTS = [50, 46, 53, 48, 50, 46, 53, 48];
const MELODY = [
  [74, 69, 72, 77, 76, 72, 69, 72],
  [74, 70, 77, 74, 72, 70, 65, 70],
  [72, 69, 77, 81, 79, 77, 72, 69],
  [72, 67, 76, 79, 77, 76, 72, 67],
  [74, 77, 81, 79, 77, 74, 72, 69],
  [70, 74, 77, 82, 81, 77, 74, 70],
  [69, 72, 77, 81, 84, 81, 79, 77],
  [79, 76, 72, 67, 69, 72, 73, 74],
];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export const DEFAULT_SCENE: MusicScene = {
  sector: 0,
  combo: 0,
  enemies: 0,
  overdrive: false,
  quiet: false,
  boss: false,
};
export const musicTempo = (scene: MusicScene): number =>
  scene.boss ? 132 : 112 + Math.min(4, scene.sector) * 2;
export function composeStep(step: number, scene: MusicScene): ChipNote[] {
  const notes: ChipNote[] = [];
  const beat = step % 16;
  const bar = Math.floor(step / 16) % 8;
  const root = ROOTS[bar];
  const energetic = scene.boss || scene.overdrive || scene.combo >= 5;
  const add = (
    midi: number,
    duration: number,
    gain: number,
    wave: ChipNote["wave"] = "triangle",
  ) => notes.push({ frequency: hz(midi), duration, gain, wave });
  if (scene.quiet) {
    if (beat % 4 === 0) add(root + [12, 19, 24, 19][beat / 4], 0.38, 0.35);
    return notes;
  }
  if (beat % 4 === 0) add(root + (beat === 12 ? 7 : 0), 0.24, 0.65);
  if (beat % 2 === 0)
    add(MELODY[bar][beat / 2], beat === 14 ? 0.25 : 0.16, 0.38, "square");
  if ((energetic && beat % 2 === 1) || (!energetic && [3, 11].includes(beat)))
    add(
      root + [12, 19, 24, 19][Math.floor(beat / 2) % 4],
      0.09,
      energetic ? 0.24 : 0.14,
    );
  if (beat % 8 === 0 || (energetic && beat === 10))
    notes.push({
      frequency: 145,
      target: 38,
      duration: 0.1,
      gain: 0.85,
      wave: "sine",
    });
  if (beat === 4 || beat === 12) {
    notes.push({
      frequency: 180,
      target: 65,
      duration: 0.07,
      gain: 0.38,
      wave: "triangle",
    });
    notes.push({
      frequency: 1800,
      target: 320,
      duration: 0.045,
      gain: 0.1,
      wave: "square",
    });
  } else if (beat % (energetic || scene.enemies > 3 ? 2 : 4) === 1)
    notes.push({
      frequency: 2600,
      target: 1300,
      duration: 0.025,
      gain: 0.06,
      wave: "square",
    });
  return notes;
}
