import type { CourseTutorialKit } from "../procedural-animation/CourseTutorial";
import type {
  CourseSource,
  DebugHint,
  TutorialStep,
} from "../procedural-animation/courseTutorials";

export type StringLabControl =
  | "audio"
  | "tension"
  | "damping"
  | "tone"
  | "drive"
  | "delay"
  | "feedback"
  | "reverb"
  | "output"
  | "chord"
  | "preset"
  | "strum"
  | "stop";

export interface StringControlLesson {
  control: StringLabControl;
  label: string;
  effect: string;
  tryThis: string;
}

export interface StringLessonTutorial {
  outcome: string;
  steps: readonly TutorialStep[];
  controls: readonly StringControlLesson[];
  verify: readonly string[];
  debug: readonly DebugHint[];
  sources: readonly CourseSource[];
}

export const STRING_COURSE_SETUP = {
  title: "Start with one canvas and one audio context",
  description:
    "The workshop uses Canvas 2D for the visible strings and the Web Audio API for sound. No audio library or sample pack is required: the finished guitar synthesizes every pluck in the browser.",
  commands: `npm create vite@latest browser-guitar -- --template vanilla-ts
cd browser-guitar
npm install
npm run dev`,
  files: [
    "index.html",
    "src/main.ts",
    "src/instrument.ts",
    "src/audio.ts",
    "src/effects.ts",
  ],
} as const;

export const STRING_COURSE_REPOSITORY_URL =
  "https://github.com/shantanusoam/portfolio-main/tree/main/public/course-files";

export const STRING_COURSE_KIT: CourseTutorialKit = {
  setup: STRING_COURSE_SETUP,
  starterHref: "/course-files/browser-guitar-starter.html",
  starterLabel: "Download zero-setup guitar starter",
  completeHref: "/course-files/browser-guitar-complete.html",
  completeLabel: "Open finished effects guitar",
  repositoryUrl: STRING_COURSE_REPOSITORY_URL,
  repositoryPath: "public/course-files/browser-guitar-*.html",
  repositoryNote:
    "A silent geometry starter and a finished six-string Web Audio instrument with an effects rack.",
  sourceHeading: "Compare your guitar with the live homepage instrument.",
  sourceDescription:
    "Every lesson is distilled from the portfolio’s shipped string interaction, synthesis, harmony, effects, and audio-lifecycle code. The course makes those boundaries explicit and buildable.",
};

export const STRING_TUTORIALS: Record<string, StringLessonTutorial> = {
  unlock: {
    outcome:
      "A reusable audio graph that stays silent until a real visitor gesture, resumes safely, and routes every future voice through one protected output.",
    steps: [
      {
        title: "Create the visual shell before audio",
        file: "index.html",
        action:
          "Give the canvas a keyboard-focusable group and place the activation status beside it. Sound must never be the only way to understand whether the instrument responded.",
        code: `<main>
  <p id="audio-status" aria-live="polite">Sound starts on your first pluck.</p>
  <canvas
    id="guitar"
    width="1000"
    height="320"
    tabindex="0"
    aria-label="Six-string browser guitar. Drag a string, sweep to strum, or press 1 through 6."
  ></canvas>
</main>`,
        expected:
          "The canvas can receive keyboard focus and screen-reader users hear a useful interaction description before audio exists.",
      },
      {
        title: "Create or resume one AudioContext from a gesture",
        file: "src/audio.ts",
        action:
          "Keep context creation inside a function called by pointer or keyboard input. Reuse the same context for every string instead of creating one context per note.",
        code: `let context: AudioContext | null = null;

export async function ensureAudio() {
  context ??= new AudioContext({ latencyHint: "interactive" });
  if (context.state === "suspended") await context.resume();
  return context;
}`,
        expected:
          "Loading the page creates no audio resources. The first real pluck changes the context to running; later plucks reuse it.",
      },
      {
        title: "Build a protected master output",
        file: "src/audio.ts",
        action:
          "Place a compressor before master gain so overlapping strings cannot sum into a harsh clip. Return an input bus that every future voice can share.",
        code: `let masterInput: GainNode | null = null;

export async function getMasterInput() {
  const ctx = await ensureAudio();
  if (masterInput) return masterInput;

  masterInput = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  const master = ctx.createGain();
  compressor.threshold.value = -20;
  compressor.ratio.value = 4;
  master.gain.value = 0.55;

  masterInput.connect(compressor).connect(master).connect(ctx.destination);
  return masterInput;
}`,
        expected:
          "Every string now has one safe destination. Six simultaneous notes are controlled by the same compressor and volume stage.",
      },
    ],
    controls: [
      {
        control: "audio",
        label: "Sound state",
        effect:
          "Shows whether the browser has created and resumed the shared AudioContext.",
        tryThis:
          "Reload the page, check that it says ‘sound starts on first pluck,’ then activate it once and confirm later notes do not ask again.",
      },
      {
        control: "output",
        label: "Output",
        effect:
          "Changes only the final master gain; it does not alter string force, tone, or the wet/dry balance.",
        tryThis: "Compare 25% and 70% while playing the same keyboard key.",
      },
    ],
    verify: [
      "No AudioContext is created during import, render, or page load.",
      "One gesture unlocks all six strings and subsequent notes reuse the context.",
      "Visible and aria-live status still report interaction when audio is unavailable.",
    ],
    debug: [
      {
        symptom: "The first pluck is silent.",
        fix: "Await context.resume() inside the pointerdown or keydown path before starting the buffer source.",
      },
      {
        symptom: "Several plucks become painfully loud.",
        fix: "Route every dry and wet branch through one compressor and master gain instead of connecting voices directly to destination.",
      },
    ],
    sources: [
      {
        label: "Gesture-safe activation",
        path: "lib/mascot/music/AudioGestureGate.ts",
        note: "Coalesces concurrent activation requests so one gesture cannot create two contexts.",
      },
      {
        label: "Protected output graph",
        path: "lib/mascot/music/AudioDirector.ts",
        note: "Owns compressor, master gain, mute smoothing, visibility handling, and cleanup.",
      },
      {
        label: "Audio architecture",
        path: "docs/mascot/AUDIO_ARCHITECTURE.md",
        note: "Documents gesture gating, graph order, scheduling, resource limits, and fallbacks.",
      },
    ],
  },

  geometry: {
    outcome:
      "Six sharp, responsive strings whose simulation stays in CSS pixels while the canvas backing buffer scales for high-density displays.",
    steps: [
      {
        title: "Model each string independently",
        file: "src/instrument.ts",
        action:
          "Store rest position separately from temporary displacement. Mutable motion data belongs outside UI rendering because it changes every frame.",
        code: `export type GuitarString = {
  restY: number;
  bend: number;
  velocity: number;
  anchorX: number;
  held: boolean;
};

export const strings: GuitarString[] = Array.from({ length: 6 }, (_, i) => ({
  restY: 62 + i * 39,
  bend: 0,
  velocity: 0,
  anchorX: 0.5,
  held: false,
}));`,
        expected:
          "Every row has its own bend, velocity, contact point, and held state. Changing one string does not mutate its neighbors.",
      },
      {
        title: "Keep drawing coordinates in CSS pixels",
        file: "src/main.ts",
        action:
          "Scale the backing buffer by devicePixelRatio, then reset the transform. Pointer math and drawing can now use the same coordinate space.",
        code: `const canvas = document.querySelector<HTMLCanvasElement>("#guitar")!;
const ctx = canvas.getContext("2d")!;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener("resize", resize);
resize();`,
        expected:
          "Strings stay crisp on Retina displays without doubling pointer coordinates or simulation speed.",
      },
      {
        title: "Draw a bent string with one quadratic curve",
        file: "src/instrument.ts",
        action:
          "Use the contact position as the curve control point. Thick lower strings and thin upper strings make pitch roles legible before sound plays.",
        code: `export function drawString(ctx: CanvasRenderingContext2D, string: GuitarString, index: number, width: number) {
  const controlX = string.anchorX * width;
  ctx.lineWidth = 2.6 - index * 0.32;
  ctx.strokeStyle = index < 2 ? "#e6c38f" : "#f5ead8";
  ctx.beginPath();
  ctx.moveTo(0, string.restY);
  ctx.quadraticCurveTo(controlX, string.restY + string.bend, width, string.restY);
  ctx.stroke();
}`,
        expected:
          "All six strings share fixed endpoints while the middle of each curve can bend at the visitor’s contact position.",
      },
    ],
    controls: [
      {
        control: "tension",
        label: "Tension",
        effect:
          "Changes how strongly visual displacement pulls back toward rest; it does not directly change the selected note.",
        tryThis:
          "Set tension low, pull at 20% of the width, then set it high and repeat at the same point.",
      },
      {
        control: "chord",
        label: "Chord",
        effect:
          "Changes the six frequencies assigned to the fixed string rows while preserving their geometry.",
        tryThis: "Switch C to A minor without moving the string positions.",
      },
    ],
    verify: [
      "The six rest positions remain evenly spaced after resizing.",
      "Pointer coordinates and drawn contact points use the same CSS-pixel space.",
      "Lower strings are visually heavier without requiring separate draw functions.",
    ],
    debug: [
      {
        symptom: "The canvas is sharp but pointer contact is offset.",
        fix: "Do not multiply pointer coordinates by devicePixelRatio after applying ctx.setTransform(dpr, ...).",
      },
      {
        symptom: "Every string bends when one is dragged.",
        fix: "Create six distinct objects inside Array.from; do not fill the array with one shared object reference.",
      },
    ],
    sources: [
      {
        label: "Live string geometry",
        path: "components/IntrectiveComponents/StringInstrument.tsx",
        note: "Uses one quadratic SVG path per string and mutates path geometry outside React’s render loop.",
      },
      {
        label: "Instrument presentation",
        path: "components/IntrectiveComponents/stringInstrument.module.css",
        note: "Defines gauge, interaction focus, chord rail, glow, responsive behavior, and reduced motion.",
      },
    ],
  },

  interaction: {
    outcome:
      "A pointer model that distinguishes a deliberate pull from a fast vertical strum and stays reliable even when the pointer leaves the canvas.",
    steps: [
      {
        title: "Convert events into local instrument coordinates",
        file: "src/instrument.ts",
        action:
          "Never use page coordinates directly. Convert client coordinates through the canvas rectangle and choose the closest string row.",
        code: `function pointFromEvent(event: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function nearestString(y: number) {
  return Math.max(0, Math.min(5, Math.round((y - 62) / 39)));
}`,
        expected:
          "The same string is selected at every page scroll position and responsive width.",
      },
      {
        title: "Capture one string for a slow pull",
        file: "src/instrument.ts",
        action:
          "Capture the pointer so release is still received outside the canvas. Clamp bend and anchor position to keep the curve readable.",
        code: `canvas.addEventListener("pointerdown", (event) => {
  const point = pointFromEvent(event);
  const index = nearestString(point.y);
  canvas.setPointerCapture(event.pointerId);
  active = { pointerId: event.pointerId, index, lastY: point.y, lastTime: event.timeStamp, mode: "pull" };
  const string = strings[index];
  string.held = true;
  string.anchorX = Math.min(0.92, Math.max(0.08, point.x / canvas.clientWidth));
  string.bend = Math.min(34, Math.max(-34, point.y - string.restY));
});`,
        expected:
          "A slow drag stays attached to its starting string and remains controllable outside the canvas boundary.",
      },
      {
        title: "Promote a fast sweep into strum mode",
        file: "src/instrument.ts",
        action:
          "Use vertical speed and total travel together. Trigger every crossed row so sparse pointer events cannot skip notes during a fast sweep.",
        code: `const point = pointFromEvent(event);
const dtMs = Math.max(event.timeStamp - active.lastTime, 1);
const speed = Math.abs(point.y - active.lastY) / dtMs;

if (active.mode === "pull" && Math.abs(point.y - strings[active.index].restY) > 30 && speed > 0.38) {
  strings[active.index].held = false;
  active.mode = "strum";
}

if (active.mode === "strum") {
  const next = nearestString(point.y);
  const direction = Math.sign(next - active.index);
  for (let i = active.index + direction; direction && (direction > 0 ? i <= next : i >= next); i += direction) {
    pluck(i, Math.min(1, 0.4 + speed * 0.6), point.x);
  }
  active.index = next;
}`,
        expected:
          "Slow movement bends one string; a decisive vertical sweep produces a complete ordered chord with no skipped middle rows.",
      },
    ],
    controls: [
      {
        control: "strum",
        label: "Strum",
        effect:
          "Runs the same six per-string pluck path used by pointer crossings, with a short musical offset between notes.",
        tryThis: "Compare the button with a fast downward pointer sweep.",
      },
      {
        control: "tension",
        label: "Tension",
        effect:
          "Makes a held string resist displacement more or less strongly after release.",
        tryThis: "Pull one string to the same distance at 25% and 85%.",
      },
    ],
    verify: [
      "Pointer capture prevents a held string from becoming stuck outside the canvas.",
      "A slow drag never accidentally triggers adjacent strings.",
      "A fast jump across several rows still plays every crossed string once.",
    ],
    debug: [
      {
        symptom: "Fast strums miss middle notes.",
        fix: "Iterate from the previous string index to the new index instead of plucking only the nearest final row.",
      },
      {
        symptom: "A string remains held after leaving the canvas.",
        fix: "Call setPointerCapture on pointerdown and handle pointercancel through the same cleanup path as pointerup.",
      },
    ],
    sources: [
      {
        label: "Pull and sweep classifier",
        path: "components/IntrectiveComponents/StringInstrument.tsx",
        note: "Separates pull and strum modes with travel and velocity thresholds and triggers every crossed string.",
      },
      {
        label: "Contact detector",
        path: "lib/mascot/music/StringContactDetector.ts",
        note: "Turns moving body/string crossings into bounded musical contact events with cooldowns.",
      },
    ],
  },

  motion: {
    outcome:
      "A stable, frame-rate-aware damped string that returns to rest, stops requesting frames when settled, and becomes static under reduced motion.",
    steps: [
      {
        title: "Release displacement into velocity",
        file: "src/instrument.ts",
        action:
          "On release, convert pull distance into bounded initial velocity. The string should inherit energy from the gesture rather than start a canned keyframe.",
        code: `function release(index: number, force: number) {
  const string = strings[index];
  string.held = false;
  const direction = Math.sign(string.bend || 1);
  string.velocity += direction * Math.min(9 + force * 12, 21);
  requestFrame();
}`,
        expected:
          "Short pulls produce a quiet visual response; deeper pulls begin with more speed but remain bounded.",
      },
      {
        title: "Integrate a damped spring with clamped delta time",
        file: "src/instrument.ts",
        action:
          "Treat tension as spring stiffness and damping as energy loss. Clamp long frames so returning from a background tab cannot explode the simulation.",
        code: `function updateString(string: GuitarString, dt: number, tension: number, damping: number) {
  if (string.held) return;
  const acceleration = -tension * string.bend - damping * string.velocity;
  string.velocity += acceleration * dt;
  string.bend += string.velocity * dt;
}

const dt = Math.min((time - previousTime) / 16.67, 2);`,
        expected:
          "The string oscillates around zero and loses energy smoothly instead of snapping or drifting.",
      },
      {
        title: "Run animation only while something moves",
        file: "src/main.ts",
        action:
          "Stop the RAF loop once all strings are below small bend and velocity thresholds. Restart it on pull, release, strum, or preset changes.",
        code: `function frame(time: number) {
  let moving = false;
  for (const string of strings) {
    updateString(string, dt, tension, damping);
    moving ||= string.held || Math.abs(string.bend) > 0.05 || Math.abs(string.velocity) > 0.05;
  }
  draw();
  frameId = moving ? requestAnimationFrame(frame) : null;
}

function requestFrame() {
  frameId ??= requestAnimationFrame(frame);
}`,
        expected:
          "The canvas becomes idle after the strings settle and immediately wakes on the next interaction.",
      },
    ],
    controls: [
      {
        control: "tension",
        label: "Tension",
        effect:
          "Raises the restoring force, making the string reverse direction sooner and feel tighter.",
        tryThis: "Hold damping at 70%, then compare tension at 20% and 90%.",
      },
      {
        control: "damping",
        label: "Damping",
        effect:
          "Removes energy from each oscillation; higher values settle sooner.",
        tryThis:
          "Set damping to 15%, release once, then repair the ringing at 75%.",
      },
      {
        control: "stop",
        label: "Stop voices",
        effect:
          "Cancels current visual energy and audio sources without rebuilding the instrument.",
        tryThis: "Strum, stop during the tail, then pluck one new string.",
      },
    ],
    verify: [
      "The same settings feel similar at 60 Hz and 120 Hz.",
      "A long inactive-tab frame cannot fling a string beyond its clamp.",
      "No RAF callback continues after every string has settled.",
    ],
    debug: [
      {
        symptom: "The string gains energy instead of losing it.",
        fix: "Ensure the damping term opposes velocity: subtract damping * velocity from acceleration.",
      },
      {
        symptom: "Motion jumps after returning to the tab.",
        fix: "Clamp dt and reset previousTime when restarting an idle frame loop.",
      },
    ],
    sources: [
      {
        label: "On-demand string loop",
        path: "components/IntrectiveComponents/StringInstrument.tsx",
        note: "Stops RAF when motion settles and keeps mutable bend/velocity outside React state.",
      },
      {
        label: "Reduced-motion treatment",
        path: "components/IntrectiveComponents/stringInstrument.module.css",
        note: "Removes hint animation and transition motion while retaining interaction cues.",
      },
    ],
  },

  synthesis: {
    outcome:
      "A recognizable plucked-string voice generated from a noise burst and delayed averaging—without loading a recorded guitar sample.",
    steps: [
      {
        title: "Seed one period with noise",
        file: "src/audio.ts",
        action:
          "Convert frequency into a delay period in samples. Fill only that first period with bipolar noise; later frames will recycle it.",
        code: `function renderPluck(ctx: AudioContext, frequency: number, decay: number) {
  const seconds = 2.4;
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const period = Math.max(2, Math.round(ctx.sampleRate / frequency));

  for (let i = 0; i < period; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  // feedback loop comes next
  return { buffer, data, period };
}`,
        expected:
          "The buffer begins as a short noisy excitation whose period already corresponds to the requested pitch.",
      },
      {
        title: "Feed delayed samples back through an average",
        file: "src/audio.ts",
        action:
          "Average adjacent delayed values and multiply by a decay factor below one. This low-pass feedback is the core Karplus–Strong string model.",
        code: `for (let i = period; i < data.length; i += 1) {
  const delayed = i - period;
  data[i] = decay * 0.5 * (data[delayed] + data[delayed + 1]);
}

return buffer;`,
        expected:
          "The noise becomes a pitched, naturally darkening pluck whose duration is controlled by feedback decay.",
      },
      {
        title: "Cache buffers and play a bounded source",
        file: "src/audio.ts",
        action:
          "Cache by rounded frequency and decay so repeated notes do not regenerate thousands of samples. Always schedule stop and disconnect cleanup.",
        code: `const cache = new Map<string, AudioBuffer>();

async function playString(frequency: number, force: number) {
  const ctx = await ensureAudio();
  const key = \`\${Math.round(frequency * 100)}:\${decay.toFixed(3)}\`;
  const buffer = cache.get(key) ?? renderPluck(ctx, frequency, decay);
  cache.set(key, buffer);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(await getMasterInput());
  source.start();
  source.stop(ctx.currentTime + buffer.duration);
  source.addEventListener("ended", () => source.disconnect(), { once: true });
}`,
        expected:
          "Repeated notes start quickly, decay on their own, and release their source node when finished.",
      },
    ],
    controls: [
      {
        control: "damping",
        label: "Damping",
        effect:
          "Also shortens the synthesized feedback decay, making the audible string more muted as the visual string settles faster.",
        tryThis: "Compare a bass note at 20% and 85% damping.",
      },
      {
        control: "tone",
        label: "Tone",
        effect:
          "Shapes brightness after synthesis; it does not change the Karplus–Strong fundamental frequency.",
        tryThis:
          "Keep damping fixed and sweep tone during repeated key 1 plucks.",
      },
    ],
    verify: [
      "The output is finite and decays rather than producing NaN or sustained noise.",
      "Doubling frequency roughly halves the feedback period.",
      "Repeated identical notes reuse a cached AudioBuffer.",
    ],
    debug: [
      {
        symptom: "The output is only a click or noise burst.",
        fix: "Fill later samples from i - period; do not leave the buffer after the first noisy period at zero.",
      },
      {
        symptom: "The note grows or never decays.",
        fix: "Keep the feedback decay below 1 and clamp the minimum period to at least two samples.",
      },
    ],
    sources: [
      {
        label: "Homepage pluck synthesis",
        path: "components/IntrectiveComponents/stringSynth.ts",
        note: "Implements the live instrument’s Karplus–Strong buffer, caching, envelope, filter, and stereo panning.",
      },
      {
        label: "Deterministic pluck renderer",
        path: "lib/mascot/music/MascotPluckVoice.ts",
        note: "Extracts bounded, testable synthesis math with deterministic noise and cache limits.",
      },
    ],
  },

  tuning: {
    outcome:
      "A musical data layer where note labels, frequencies, chord changes, and string geometry remain separate and testable.",
    steps: [
      {
        title: "Convert note numbers to frequency",
        file: "src/audio.ts",
        action:
          "Use equal temperament around A4 = 440 Hz. Keeping this as a pure function makes every tuning table verifiable without audio hardware.",
        code: `export function midiToFrequency(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

console.assert(Math.abs(midiToFrequency(69) - 440) < 0.001);
console.assert(Math.abs(midiToFrequency(60) - 261.63) < 0.02);`,
        expected:
          "MIDI 69 resolves to 440 Hz and middle C resolves near 261.63 Hz.",
      },
      {
        title: "Describe chords as six-string tables",
        file: "src/instrument.ts",
        action:
          "Keep labels with frequencies so visuals and assistive status can name the note that audio plays.",
        code: `export const CHORDS = [
  { name: "C major", short: "C", strings: [["C3", 130.81], ["G3", 196], ["C4", 261.63], ["E4", 329.63], ["G4", 392], ["C5", 523.25]] },
  { name: "A minor", short: "Am", strings: [["A2", 110], ["E3", 164.81], ["A3", 220], ["C4", 261.63], ["E4", 329.63], ["A4", 440]] },
  { name: "F major", short: "F", strings: [["F2", 87.31], ["C3", 130.81], ["F3", 174.61], ["A3", 220], ["C4", 261.63], ["F4", 349.23]] },
  { name: "G major", short: "G", strings: [["G2", 98], ["D3", 146.83], ["G3", 196], ["B3", 246.94], ["D4", 293.66], ["G4", 392]] },
] as const;`,
        expected:
          "Changing a chord swaps six pitches while the pointer and rendering systems continue using string indices 0–5.",
      },
      {
        title: "Map horizontal zones to harmony",
        file: "src/instrument.ts",
        action:
          "Turn normalized x position into a bounded chord index. A visitor can change harmony spatially without an extra modal control.",
        code: `function chordFromX(x: number, width: number) {
  const normalized = Math.min(0.9999, Math.max(0, x / width));
  return Math.floor(normalized * CHORDS.length);
}

function noteFor(stringIndex: number, x: number) {
  return CHORDS[chordFromX(x, canvas.clientWidth)].strings[stringIndex];
}`,
        expected:
          "The left quarter plays C, followed by Am, F, and G, with no out-of-range index at the right edge.",
      },
    ],
    controls: [
      {
        control: "chord",
        label: "Chord",
        effect:
          "Selects one six-frequency table. It changes pitch relationships without altering effect settings.",
        tryThis:
          "Strum C, Am, F, G in order and listen for a complete progression.",
      },
      {
        control: "strum",
        label: "Strum",
        effect:
          "Makes chord comparison repeatable by playing all six indices with the same force and timing rule.",
        tryThis:
          "Use one strum per chord rather than comparing unrelated single notes.",
      },
    ],
    verify: [
      "A4 equals 440 Hz and note conversion is pure.",
      "Every chord contains exactly six labeled frequencies.",
      "The far-right canvas edge resolves to the last chord, never an undefined entry.",
    ],
    debug: [
      {
        symptom: "The rightmost click crashes with an undefined chord.",
        fix: "Clamp normalized x below 1 or clamp the final integer index to CHORDS.length - 1.",
      },
      {
        symptom: "Visible note labels disagree with sound.",
        fix: "Read label and frequency from the same tuple at pluck time; do not maintain parallel arrays.",
      },
    ],
    sources: [
      {
        label: "Production chord table",
        path: "components/IntrectiveComponents/stringSynth.ts",
        note: "Exports the four six-note chords used by the homepage instrument.",
      },
      {
        label: "Harmony mapping",
        path: "lib/mascot/music/HarmonyMap.ts",
        note: "Resolves the same chord table and exposes MIDI/frequency mapping for generated contexts.",
      },
      {
        label: "Musical mapping notes",
        path: "docs/mascot/MUSICAL_MAPPING.md",
        note: "Explains how literal strings, body contacts, chords, strums, and game harmony relate.",
      },
    ],
  },

  strumming: {
    outcome:
      "A convincing chord gesture whose note order, timing, direction, and intensity are derived from the movement rather than fired simultaneously.",
    steps: [
      {
        title: "Use audio time, not visual time",
        file: "src/audio.ts",
        action:
          "Schedule notes against AudioContext.currentTime. requestAnimationFrame and event timestamps are not a stable musical clock.",
        code: `export async function strum(frequencies: readonly number[], direction: 1 | -1, force: number) {
  const ctx = await ensureAudio();
  const ordered = direction > 0 ? frequencies : [...frequencies].reverse();
  const start = ctx.currentTime + 0.012;

  ordered.forEach((frequency, index) => {
    playStringAt(frequency, force, start + index * 0.026);
  });
}`,
        expected:
          "The chord blooms over roughly 130 ms instead of sounding like six perfectly simultaneous clicks.",
      },
      {
        title: "Map gesture speed perceptually",
        file: "src/instrument.ts",
        action:
          "Normalize crossing speed and apply a concave curve. Quiet motion becomes audible without making fast motion dangerously loud.",
        code: `function intensityFromSpeed(pixelsPerSecond: number) {
  const normalized = Math.min(1, Math.max(0, pixelsPerSecond / 1200));
  return Math.max(0.12, Math.pow(normalized, 0.6));
}`,
        expected:
          "Slow deliberate sweeps remain audible while the loud end compresses into a controlled range.",
      },
      {
        title: "Recognize one strum without double-counting",
        file: "src/instrument.ts",
        action:
          "Collect distinct string crossings inside a short window and require matching direction. Clear consumed contacts after recognition.",
        code: `type Crossing = { stringIndex: number; direction: 1 | -1; time: number };
let crossings: Crossing[] = [];

function recordCrossing(next: Crossing) {
  crossings = [...crossings.filter((item) => next.time - item.time <= 0.5), next];
  const sameDirection = crossings.filter((item) => item.direction === next.direction);
  const distinct = new Set(sameDirection.map((item) => item.stringIndex));
  if (distinct.size >= 3) {
    crossings = [];
    return { direction: next.direction, stringCount: distinct.size };
  }
  return null;
}`,
        expected:
          "Three or more distinct crossings become one semantic strum; a resting overlap or repeated crossing of one row does not.",
      },
    ],
    controls: [
      {
        control: "strum",
        label: "Strum",
        effect:
          "Schedules six notes with a small gap so the chord has direction and attack shape.",
        tryThis:
          "Trigger it twice, then sweep upward manually to hear the reversed order.",
      },
      {
        control: "output",
        label: "Output",
        effect:
          "Controls the final combined chord after all voices and effects converge.",
        tryThis: "Set output to 40% before comparing dense effect presets.",
      },
    ],
    verify: [
      "Strum timing uses AudioContext.currentTime.",
      "Upward and downward gestures reverse note order.",
      "Repeated contacts on one string cannot satisfy the distinct-string threshold.",
    ],
    debug: [
      {
        symptom: "The chord sounds like a single harsh impact.",
        fix: "Stagger start times by roughly 20–35 ms and route the sum through a compressor.",
      },
      {
        symptom: "One jittery row creates fake strums.",
        fix: "Count distinct string indices and apply a per-string cooldown before recognition.",
      },
    ],
    sources: [
      {
        label: "Strum grouping",
        path: "lib/mascot/music/MusicalDirector.ts",
        note: "Groups distinct, same-direction string contacts inside a bounded time window.",
      },
      {
        label: "Audio scheduler",
        path: "lib/mascot/music/AudioScheduler.ts",
        note: "Schedules direct contacts and sequences against audio time with a bounded queue.",
      },
    ],
  },

  tone: {
    outcome:
      "A playable voice whose brightness, attack, decay, spatial position, and total level respond musically without changing the underlying pitch.",
    steps: [
      {
        title: "Shape brightness with a low-pass envelope",
        file: "src/audio.ts",
        action:
          "Start the filter brighter for a stronger pluck, then let it settle toward a darker cutoff. This models high frequencies decaying faster than the fundamental.",
        code: `const filter = ctx.createBiquadFilter();
filter.type = "lowpass";
const cutoff = Math.min(900 + tone * 5200 + force * 1600, ctx.sampleRate * 0.42);
filter.frequency.setValueAtTime(cutoff, when);
filter.frequency.setTargetAtTime(780 + tone * 900, when + 0.025, 0.42);
filter.Q.value = 0.55;`,
        expected:
          "A hard pluck has a bright transient that becomes warmer during the tail; pitch remains unchanged.",
      },
      {
        title: "Use a click-safe amplitude envelope",
        file: "src/audio.ts",
        action:
          "Never jump gain from zero to full. Start just above zero, ramp through a short attack, and decay exponentially back above zero.",
        code: `const envelope = ctx.createGain();
envelope.gain.setValueAtTime(0.0001, when);
envelope.gain.exponentialRampToValueAtTime(0.24 * force, when + 0.004);
envelope.gain.exponentialRampToValueAtTime(0.0001, when + 2.25);`,
        expected:
          "Notes begin immediately but without a digital click, then decay to silence predictably.",
      },
      {
        title: "Place the contact in stereo",
        file: "src/audio.ts",
        action:
          "Map horizontal contact to a restrained pan range. Avoid full hard-left/right placement, which can feel disconnected on headphones.",
        code: `const panner = ctx.createStereoPanner();
const normalizedX = Math.min(1, Math.max(0, contactX / canvas.clientWidth));
panner.pan.value = (normalizedX * 2 - 1) * 0.75;

source.connect(filter).connect(envelope).connect(panner).connect(graph.input);`,
        expected:
          "Left-side plucks lean left, right-side plucks lean right, and the center remains centered.",
      },
    ],
    controls: [
      {
        control: "tone",
        label: "Tone",
        effect:
          "Moves the filter’s bright starting cutoff and darker resting cutoff together.",
        tryThis:
          "Hold one chord and effect preset, then compare 15%, 50%, and 90%.",
      },
      {
        control: "output",
        label: "Output",
        effect:
          "Ramps final gain after the compressor, avoiding zipper noise when adjusted during a ringing chord.",
        tryThis:
          "Move output during a long reverb tail and listen for a smooth change.",
      },
    ],
    verify: [
      "Filter automation stays below a safe fraction of sampleRate.",
      "Gain automation never uses exponential ramps to exact zero.",
      "Pan is clamped inside ±0.75.",
    ],
    debug: [
      {
        symptom: "Each note begins with a sharp click.",
        fix: "Start gain at a tiny positive value and ramp over 3–6 ms instead of assigning the final level immediately.",
      },
      {
        symptom: "Tone control appears to change pitch.",
        fix: "Automate BiquadFilterNode.frequency, not source.playbackRate or the Karplus feedback period.",
      },
    ],
    sources: [
      {
        label: "Voice tone graph",
        path: "components/IntrectiveComponents/stringSynth.ts",
        note: "Applies a low-pass envelope, exponential gain envelope, and clamped stereo panning to each pluck.",
      },
      {
        label: "Musical event mapping",
        path: "lib/mascot/music/DefaultNoteMapping.ts",
        note: "Maps contact position and intensity into bounded musical brightness, pan, and articulation data.",
      },
    ],
  },

  effects: {
    outcome:
      "A parallel effects rack with controllable drive, tempo-like delay, synthetic reverb, feedback protection, and reusable musical presets.",
    steps: [
      {
        title: "Add drive without replacing the dry path",
        file: "src/effects.ts",
        action:
          "Use a WaveShaper curve for saturation and oversample it. Keep amount bounded and preserve a clean path so drive remains a color, not an all-or-nothing mode.",
        code: `function distortionCurve(amount: number) {
  const curve = new Float32Array(2048);
  const k = Math.max(0, amount) * 45;
  for (let i = 0; i < curve.length; i += 1) {
    const x = (i * 2) / (curve.length - 1) - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

drive.curve = distortionCurve(settings.drive);
drive.oversample = "2x";`,
        expected:
          "Low drive adds density; high drive adds controlled grit without changing note scheduling or string physics.",
      },
      {
        title: "Build a bounded feedback delay",
        file: "src/effects.ts",
        action:
          "Feed DelayNode output back through a GainNode, but clamp feedback below one. Route delay output to the wet bus and never around master protection.",
        code: `const delay = ctx.createDelay(1);
const feedback = ctx.createGain();
const delayWet = ctx.createGain();

delay.delayTime.value = Math.min(0.72, Math.max(0.04, settings.delay));
feedback.gain.value = Math.min(0.78, Math.max(0, settings.feedback));
delayWet.gain.value = settings.delayMix;

input.connect(delay).connect(feedback).connect(delay);
delay.connect(delayWet).connect(compressor);`,
        expected:
          "Each note produces decaying repeats; feedback cannot reach unity or escape the shared compressor/master output.",
      },
      {
        title: "Generate reverb and save musical presets",
        file: "src/effects.ts",
        action:
          "Create a short decaying-noise impulse locally, then change parameters through named presets. Presets are snapshots of one graph—not separate audio engines.",
        code: `function impulse(ctx: AudioContext, seconds = 1.8, decay = 2.4) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

export const PRESETS = {
  clean: { drive: 0.03, delayMix: 0.04, reverb: 0.08 },
  dream: { drive: 0.08, delayMix: 0.34, reverb: 0.48 },
  crunch: { drive: 0.72, delayMix: 0.11, reverb: 0.16 },
};`,
        expected:
          "Clean stays immediate, Dream gains spacious repeats, and Crunch changes harmonic density while all reuse the same strings and output graph.",
      },
    ],
    controls: [
      {
        control: "preset",
        label: "Preset",
        effect:
          "Updates several effect parameters as one musical starting point without replacing the graph or current chord.",
        tryThis:
          "Play the same downward strum through Clean, Dream, and Crunch.",
      },
      {
        control: "drive",
        label: "Drive",
        effect:
          "Raises nonlinear saturation before dry/wet branching, adding harmonics and perceived density.",
        tryThis: "Use a single mid string and move from 0% to 75%.",
      },
      {
        control: "delay",
        label: "Delay",
        effect:
          "Sets the repeat interval; it does not control how many repeats survive—that belongs to feedback.",
        tryThis: "Compare 90 ms slapback with a 420 ms echo.",
      },
      {
        control: "feedback",
        label: "Feedback",
        effect:
          "Controls how much delayed signal returns to the delay input, bounded below runaway gain.",
        tryThis: "Hold delay time fixed and compare 10% with 65%.",
      },
      {
        control: "reverb",
        label: "Reverb",
        effect:
          "Changes only the convolver’s wet send, moving the guitar from close/dry to spacious.",
        tryThis:
          "Strum once at 0%, then once at 55%; listen to the tail, not the attack.",
      },
    ],
    verify: [
      "Feedback is hard-clamped below 0.8.",
      "Dry, delay, and reverb paths all converge before master gain.",
      "Changing presets updates nodes in place and does not create another AudioContext.",
    ],
    debug: [
      {
        symptom: "Delay grows louder forever.",
        fix: "Clamp feedback gain well below 1 and keep the feedback loop entirely inside the protected effects graph.",
      },
      {
        symptom: "Reverb is silent.",
        fix: "Assign a non-null impulse buffer to the ConvolverNode and connect input → convolver → reverbGain → compressor.",
      },
      {
        symptom: "Drive makes the output much louder than clean.",
        fix: "Reduce post-drive level or add makeup compensation before comparing tone; saturation changes perceived loudness.",
      },
    ],
    sources: [
      {
        label: "Lightweight effects bus",
        path: "lib/mascot/music/EffectsBus.ts",
        note: "Uses a bounded feedback delay network as an optional wet send for medium/high quality.",
      },
      {
        label: "Output topology",
        path: "lib/mascot/music/AudioDirector.ts",
        note: "Ensures dry and wet signals meet before compressor, master gain, mute, and destination.",
      },
      {
        label: "Architecture decisions",
        path: "docs/mascot/AUDIO_ARCHITECTURE.md",
        note: "Explains why effects remain optional, bounded, and subordinate to output safety.",
      },
    ],
  },

  performance: {
    outcome:
      "A complete browser instrument with bounded polyphony, smooth live controls, reusable presets, visible state, and keyboard parity.",
    steps: [
      {
        title: "Bound simultaneous voices",
        file: "src/audio.ts",
        action:
          "Track active sources and stop the oldest quiet tail when the pool is full. A fast visitor should not create an unbounded pile of audio nodes.",
        code: `const active: AudioBufferSourceNode[] = [];
const MAX_VOICES = 12;

function register(source: AudioBufferSourceNode) {
  if (active.length >= MAX_VOICES) active.shift()?.stop();
  active.push(source);
  source.addEventListener("ended", () => {
    const index = active.indexOf(source);
    if (index >= 0) active.splice(index, 1);
    source.disconnect();
  }, { once: true });
}`,
        expected:
          "Rapid repeated strums remain responsive while active source count never exceeds the chosen ceiling.",
      },
      {
        title: "Smooth control changes on the audio clock",
        file: "src/effects.ts",
        action:
          "Ramp AudioParams instead of assigning abrupt values during a ringing note. UI state can update immediately while audio catches up over a few milliseconds.",
        code: `function smooth(param: AudioParam, value: number, ctx: AudioContext) {
  param.cancelScheduledValues(ctx.currentTime);
  param.setTargetAtTime(value, ctx.currentTime, 0.02);
}

smooth(master.gain, settings.output, ctx);
smooth(delay.delayTime, settings.delay, ctx);
smooth(feedback.gain, Math.min(settings.feedback, 0.78), ctx);`,
        expected:
          "Moving output, delay, or feedback while notes ring does not produce zipper clicks or discontinuities.",
      },
      {
        title: "Give every control an equivalent action",
        file: "src/main.ts",
        action:
          "Map keys 1–6 to strings, expose a real strum button, and announce note/chord state. Pointer finesse becomes one input path, not the only path.",
        code: `canvas.addEventListener("keydown", (event) => {
  const index = Number(event.key) - 1;
  if (index < 0 || index > 5 || event.repeat) return;
  event.preventDefault();
  const [label, frequency] = CHORDS[chordIndex].strings[index];
  pluck(index, 0.65, canvas.clientWidth / 2);
  status.textContent = \`Played \${label} in \${CHORDS[chordIndex].name}\`;
});

strumButton.addEventListener("click", () => strumCurrentChord());`,
        expected:
          "Keyboard users can play every string and the status region names the audible result.",
      },
    ],
    controls: [
      {
        control: "preset",
        label: "Preset",
        effect:
          "Provides a coherent starting point, then leaves every individual parameter editable.",
        tryThis:
          "Choose Dream, lower only reverb, and confirm the preset becomes Custom.",
      },
      {
        control: "output",
        label: "Output",
        effect:
          "Ramps the final master signal after compression; zero silences both dry notes and effect tails.",
        tryThis: "Mute with output, then restore it while no note is playing.",
      },
      {
        control: "stop",
        label: "Stop voices",
        effect:
          "Stops active sources, clears visual bend, and leaves the graph ready for the next gesture.",
        tryThis: "Create a Dream tail, stop it, then play one clean note.",
      },
    ],
    verify: [
      "Active audio sources never exceed the voice cap.",
      "Live AudioParam changes use short ramps rather than abrupt assignment.",
      "Pointer, keyboard, and button paths all call the same per-string pluck function.",
    ],
    debug: [
      {
        symptom: "Fast strumming slows the page over time.",
        fix: "Bound voices, cache synthesis buffers, disconnect ended nodes, and stop the visual RAF loop when settled.",
      },
      {
        symptom: "Sliders click during sustained effects tails.",
        fix: "Use setTargetAtTime or a short linearRampToValueAtTime on live AudioParams.",
      },
    ],
    sources: [
      {
        label: "Voice capacity",
        path: "lib/mascot/music/VoicePool.ts",
        note: "Implements deterministic free-slot and quiet/oldest voice stealing without Web Audio dependencies.",
      },
      {
        label: "Keyboard and pointer parity",
        path: "components/IntrectiveComponents/StringInstrument.tsx",
        note: "Routes keys 1–6 and pointer gestures through the same playable six-string state.",
      },
    ],
  },

  ship: {
    outcome:
      "A production-safe instrument that suspends offscreen work, tears down every resource, survives missing Web Audio, and preserves readable static feedback under reduced motion.",
    steps: [
      {
        title: "Handle hidden tabs without losing ownership",
        file: "src/audio.ts",
        action:
          "Suspend only a context your instrument previously activated, then resume it when visible. Do not auto-create audio during visibility changes.",
        code: `let activated = false;
let suspendedByVisibility = false;

document.addEventListener("visibilitychange", async () => {
  if (!context || !activated) return;
  if (document.hidden && context.state === "running") {
    suspendedByVisibility = true;
    await context.suspend();
  } else if (!document.hidden && suspendedByVisibility) {
    suspendedByVisibility = false;
    await context.resume();
  }
});`,
        expected:
          "A hidden tab releases audio processing, and a never-activated page remains silent when visibility changes.",
      },
      {
        title: "Separate reduced motion from sound preference",
        file: "src/main.ts",
        action:
          "Reduced motion should remove oscillation and glow without silently muting requested audio. Treat motion and sound as independent user choices.",
        code: `const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

function release(index: number, force: number) {
  const string = strings[index];
  string.held = false;
  if (reduceMotion.matches) {
    string.bend = 0;
    string.velocity = 0;
    draw();
  } else {
    string.velocity += Math.sign(string.bend || 1) * (9 + force * 12);
    requestFrame();
  }
  play(index, force);
}`,
        expected:
          "Reduced-motion visitors get an immediate static reset while explicit sound interaction still works.",
      },
      {
        title: "Destroy the entire instrument idempotently",
        file: "src/main.ts",
        action:
          "Cancel animation, stop sources, disconnect the graph, clear caches and close the context. Running cleanup twice must remain safe.",
        code: `let destroyed = false;

export async function destroy() {
  if (destroyed) return;
  destroyed = true;
  if (frameId) cancelAnimationFrame(frameId);
  stopAllVoices();
  bufferCache.clear();
  effects?.disconnect();
  if (context && context.state !== "closed") await context.close();
  context = null;
}

addEventListener("pagehide", () => void destroy(), { once: true });`,
        expected:
          "Navigation or teardown leaves no RAF, AudioContext, source node, event listener, or retained AudioBuffer behind.",
      },
    ],
    controls: [
      {
        control: "audio",
        label: "Sound state",
        effect:
          "Reports ready, running, suspended, or unavailable without pretending the browser granted audio access.",
        tryThis:
          "Load once without touching the instrument, then activate it with a keyboard note.",
      },
      {
        control: "stop",
        label: "Stop voices",
        effect:
          "Provides a local emergency release for sound and motion while preserving settings and focus.",
        tryThis:
          "Stop a long effect tail and confirm the next pluck uses the same preset.",
      },
      {
        control: "output",
        label: "Output",
        effect:
          "Lives after every dry and wet path so zero always silences the complete graph.",
        tryThis:
          "Set reverb high, then output to zero; no tail should bypass it.",
      },
    ],
    verify: [
      "No audio resource exists before an explicit visitor gesture.",
      "Reduced motion removes non-essential oscillation without disabling keyboard or sound controls.",
      "Teardown can run twice and leaves no active source, RAF, or AudioContext.",
      "Unsupported Web Audio keeps the visible instrument playable and reports a calm fallback.",
    ],
    debug: [
      {
        symptom: "Audio resumes by itself on page load or tab focus.",
        fix: "Resume only a previously activated context; visibility logic must never create the context.",
      },
      {
        symptom: "A reverb tail survives mute or teardown.",
        fix: "Place master gain after every dry/wet merge and explicitly disconnect effect nodes during destroy.",
      },
      {
        symptom: "Reduced motion makes the instrument appear broken.",
        fix: "Render the final rest state immediately and keep focus, note status, and sound behavior intact.",
      },
    ],
    sources: [
      {
        label: "Full audio lifecycle",
        path: "lib/mascot/music/AudioDirector.ts",
        note: "Handles activation, visibility suspension, smoothed mute/volume, support fallback, and idempotent destroy.",
      },
      {
        label: "Production instrument cleanup",
        path: "components/IntrectiveComponents/StringInstrument.tsx",
        note: "Cancels RAF and timers, closes its context, and retains visible/keyboard behavior.",
      },
      {
        label: "Verified architecture",
        path: "docs/mascot/AUDIO_ARCHITECTURE.md",
        note: "Records the production invariants and pure-test boundaries behind the final module.",
      },
    ],
  },
};
