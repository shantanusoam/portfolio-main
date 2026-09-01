"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CourseTutorial from "../procedural-animation/CourseTutorial";
import sharedStyles from "../procedural-animation/page.module.css";
import StringLab, { type StringLabPreset } from "./StringLab";
import { STRING_COURSE_KIT, STRING_TUTORIALS } from "./courseTutorials";

interface Lesson {
  id: string;
  number: string;
  level: "Noob" | "Builder" | "Pro";
  title: string;
  promise: string;
  minutes: number;
  paragraphs: readonly string[];
  principle: string;
  listening: string;
  exercise: string;
  code: string;
  preset: StringLabPreset;
  quiz: {
    question: string;
    options: readonly { label: string; correct: boolean; feedback: string }[];
  };
}

const basePreset: StringLabPreset = {
  tension: 0.56,
  damping: 0.64,
  tone: 0.66,
  drive: 0.03,
  delay: 0.12,
  feedback: 0.12,
  reverb: 0.08,
  output: 0.54,
  chord: 0,
  preset: "clean",
};

const LESSONS: readonly Lesson[] = [
  {
    id: "unlock",
    number: "01",
    level: "Noob",
    title: "Unlock sound honestly",
    promise:
      "Create one gesture-gated audio context and one protected destination before generating a note.",
    minutes: 18,
    paragraphs: [
      "A browser instrument starts with permission, not synthesis. Browsers may suspend an AudioContext created outside a visitor gesture, so mounting a component and hoping sound works later is an unreliable architecture. Create or resume the context inside pointer or keyboard activation and reuse it for the session.",
      "The second boundary is output ownership. Every dry note and every effect return must converge before the final master gain. If a wet reverb path connects around mute, the interface can say ‘off’ while sound continues—a small routing error with a large trust cost.",
      "Visible feedback is independent. A visitor should see which string, note, and chord responded even when audio is unsupported, muted, or still locked.",
    ],
    principle:
      "One context, one protected output, and no sound resource before intent.",
    listening:
      "The first pluck may include context startup latency; later notes should feel immediate because the graph is reused.",
    exercise:
      "Reload, press key 3 once, then play it again. Observe the state change from locked to running without another permission step.",
    code: `gesture -> ensureAudio()
voice -> compressor -> master -> destination
dry + wet must meet before master`,
    preset: basePreset,
    quiz: {
      question: "Where should AudioContext creation happen?",
      options: [
        {
          label: "Inside a real pointer or keyboard gesture",
          correct: true,
          feedback:
            "Correct. Activation and intent happen in the same call path.",
        },
        {
          label: "At module import",
          correct: false,
          feedback: "That can violate autoplay policy before a visitor acts.",
        },
        {
          label: "Inside the drawing loop",
          correct: false,
          feedback: "Rendering must not create audio contexts.",
        },
      ],
    },
  },
  {
    id: "geometry",
    number: "02",
    level: "Noob",
    title: "Draw six real strings",
    promise:
      "Give each string a rest line, contact point, displacement, velocity, and readable gauge.",
    minutes: 20,
    paragraphs: [
      "A string is not a wavy line asset. It is a fixed pair of endpoints plus a temporary displacement at a contact position. A quadratic curve is enough to make that relationship visible and cheap to redraw.",
      "Keep the simulation in CSS pixels even when the canvas backing buffer is scaled for a high-density display. That makes drawing, hit testing, pointer coordinates, and spring constants speak the same unit system.",
      "Gauge is useful information: lower strings should look heavier and upper strings lighter. This creates a pitch hierarchy before the visitor hears anything.",
    ],
    principle: "Draw from state; never let drawing become the source of truth.",
    listening:
      "No listening task yet. Judge clarity: can you predict where a string will bend from its highlighted contact point?",
    exercise:
      "Pull string 1 near the left edge, then near the right. The endpoints should remain fixed while the curve follows contact.",
    code: `M(left, restY)
Q(contactX, restY + bend, right, restY)
gauge = bass ? thick : treble ? thin : medium`,
    preset: { ...basePreset, tension: 0.4, damping: 0.72 },
    quiz: {
      question: "Why keep simulation coordinates in CSS pixels?",
      options: [
        {
          label: "Pointer and drawing math stay in one coordinate space",
          correct: true,
          feedback: "Exactly. DPR changes sharpness, not the physics units.",
        },
        {
          label: "It changes guitar tuning",
          correct: false,
          feedback: "Visual scale and pitch tables are separate.",
        },
        {
          label: "It creates reverb",
          correct: false,
          feedback: "Reverb belongs to the audio graph.",
        },
      ],
    },
  },
  {
    id: "interaction",
    number: "03",
    level: "Noob",
    title: "Pull or strum—not both",
    promise:
      "Classify a slow held pull and a fast multi-string sweep without contradictory input.",
    minutes: 24,
    paragraphs: [
      "A pluck and a strum begin with the same pointerdown. The difference emerges from motion: a controlled pull remains attached to its starting row, while enough vertical travel at enough speed promotes the session into strum mode.",
      "Use both distance and velocity. Velocity alone makes tiny jitter count as a strum; distance alone makes a slow deliberate bend spill into adjacent notes. Pointer capture guarantees that a release outside the canvas still ends the session.",
      "Fast input events can leap over rows. Trigger every index between the previous and new nearest string rather than trusting the browser to deliver one move event per row.",
    ],
    principle:
      "Classify intent from the gesture history, then keep one owner for the session.",
    listening:
      "A slow drag should produce one release; a sweep should sound ordered and should never replay the held starting string accidentally.",
    exercise:
      "Pull string 4 slowly, then sweep through all six quickly. Repeat at the boundary until you can feel where the mode changes.",
    code: `if (travel > rowGap * 0.82 && speed > 0.38) mode = "strum";
if (mode === "pull") bend(startingString);
else pluckEveryCrossedRow(previous, next);`,
    preset: { ...basePreset, tension: 0.62, damping: 0.58 },
    quiz: {
      question: "Why combine travel and speed for strum detection?",
      options: [
        {
          label: "To reject jitter and slow deliberate pulls",
          correct: true,
          feedback: "Correct. The two signals disambiguate intent.",
        },
        {
          label: "To raise pitch",
          correct: false,
          feedback: "Pitch comes from the chord table.",
        },
        {
          label: "To increase canvas resolution",
          correct: false,
          feedback: "Input classification is independent of DPR.",
        },
      ],
    },
  },
  {
    id: "motion",
    number: "04",
    level: "Builder",
    title: "Make tension visible",
    promise:
      "Turn release energy into a stable damped spring that sleeps when the motion is finished.",
    minutes: 22,
    paragraphs: [
      "A physical-looking string needs only displacement, velocity, restoring force, and damping. Tension controls how quickly the bend reverses; damping controls how much energy survives each cycle. They are different axes, so tune them independently.",
      "Release should inherit the gesture’s bend and force. A canned CSS wiggle would look identical for every pull and disconnect the visible result from the visitor’s action.",
      "An ambient loop is unnecessary. Request frames while a string is held, moving, or glowing; stop when every value falls below a small threshold. Reduced motion can render the rest state immediately while keeping the interaction and sound available.",
    ],
    principle: "Interaction injects energy; the system only dissipates it.",
    listening:
      "For now listen and look together: higher damping should shorten both the visual motion and the synthesized tail in this workbench.",
    exercise:
      "Set damping to 10%, pluck once, then repair the overlong ring without touching tension.",
    code: `acceleration = -tension * bend - damping * velocity;
velocity += acceleration * dt;
bend += velocity * dt;`,
    preset: {
      ...basePreset,
      tension: 0.48,
      damping: 0.18,
      tone: 0.58,
    },
    quiz: {
      question: "Which control directly removes lingering oscillation?",
      options: [
        {
          label: "Damping",
          correct: true,
          feedback: "Yes. Damping dissipates stored energy.",
        },
        {
          label: "Chord",
          correct: false,
          feedback: "Chord changes frequency relationships, not motion energy.",
        },
        {
          label: "Pan",
          correct: false,
          feedback: "Pan changes spatial placement only.",
        },
      ],
    },
  },
  {
    id: "synthesis",
    number: "05",
    level: "Builder",
    title: "Synthesize the pluck",
    promise:
      "Create a convincing string voice from a noise burst and delayed averaging instead of a recorded sample.",
    minutes: 28,
    paragraphs: [
      "Karplus–Strong synthesis starts with an excitation: random samples for one period of the desired frequency. Each later sample averages two values one period behind and multiplies them by a decay below one. That small feedback rule turns noise into a pitched, darkening string.",
      "The feedback period sets pitch; the decay sets sustain and brightness loss. Keeping those responsibilities separate makes it possible to tune feel without silently detuning the instrument.",
      "Rendering a two-second buffer on every pluck is wasteful. Cache by the frequency and the synthesis parameter that changes the samples, impose a hard cache ceiling, and let per-note filter/envelope nodes supply cheaper variation.",
    ],
    principle:
      "Generate the expensive physical body once; shape each performance with cheap nodes.",
    listening:
      "Listen for a strong attack followed by a naturally darkening tail. Pure noise means the feedback loop is missing; an endless tone means decay is too high.",
    exercise:
      "Play bass string 1 repeatedly, then raise damping. Notice that pitch stays fixed while sustain shortens.",
    code: `period = round(sampleRate / frequency)
buffer[0..period] = noise
buffer[i] = decay * 0.5 * (buffer[i-period] + buffer[i-period+1])`,
    preset: {
      ...basePreset,
      damping: 0.3,
      tone: 0.72,
      output: 0.48,
    },
    quiz: {
      question: "What primarily determines pitch in Karplus–Strong?",
      options: [
        {
          label: "The feedback delay period",
          correct: true,
          feedback: "Correct. Period is derived from sampleRate / frequency.",
        },
        {
          label: "Canvas width",
          correct: false,
          feedback: "The course keeps visual length and pitch independent.",
        },
        {
          label: "Master volume",
          correct: false,
          feedback: "Master gain changes level, not frequency.",
        },
      ],
    },
  },
  {
    id: "tuning",
    number: "06",
    level: "Builder",
    title: "Turn rows into harmony",
    promise:
      "Map six stable string indices to named notes and switch complete chord tables without touching interaction code.",
    minutes: 20,
    paragraphs: [
      "Geometry knows only string index. Harmony maps that index to a note label and frequency inside the active chord. This boundary lets the same pull, keyboard, and strum mechanics play C major, A minor, F major, or G major without branching through the interaction engine.",
      "Store label and frequency together. Separate arrays eventually drift and create an accessibility bug where the status announces a different note than the one being synthesized.",
      "Spatial harmony is optional but useful: horizontal zones can select chords while vertical movement selects strings. Two axes become two musical dimensions without opening another panel.",
    ],
    principle: "String index is mechanics; note frequency is musical policy.",
    listening:
      "Use the repeatable Strum button to compare chords. C–Am–F–G should read as a coherent progression, not unrelated note clouds.",
    exercise:
      "Play one full strum in each chord, then return to C and verify the same row returns to the same note label.",
    code: `const [label, frequency] = CHORDS[chordIndex].strings[stringIndex];
play(frequency);
announce(label);`,
    preset: { ...basePreset, chord: 1, tone: 0.62 },
    quiz: {
      question: "Why store note label and frequency in one tuple?",
      options: [
        {
          label: "Sound and announced state cannot drift apart",
          correct: true,
          feedback: "Exactly. One source feeds audio and feedback.",
        },
        {
          label: "It increases reverb time",
          correct: false,
          feedback: "Effects are downstream of tuning.",
        },
        {
          label: "It removes pointer capture",
          correct: false,
          feedback: "Input lifecycle remains independent.",
        },
      ],
    },
  },
  {
    id: "strumming",
    number: "07",
    level: "Builder",
    title: "Give chords direction",
    promise:
      "Schedule a strum on the audio clock so note order, gesture speed, and direction become audible.",
    minutes: 22,
    paragraphs: [
      "Six notes fired at exactly the same instant behave like a keyboard block, not a picked chord. A 20–35 ms gap between strings creates an attack contour while keeping the total gesture tight.",
      "Schedule against AudioContext.currentTime. Visual timestamps and setTimeout can describe intent, but only the audio clock provides a stable destination for sound events.",
      "Raw pointer speed is not gain. Normalize it and apply a concave perceptual curve so quiet gestures remain audible while fast gestures approach the ceiling gradually.",
    ],
    principle: "Visual input detects the phrase; the audio clock performs it.",
    listening:
      "Compare the button strum with rapid tapping of keys 1–6. The scheduled chord should have a clear sweep rather than timing jitter.",
    exercise:
      "Strum downward, then sweep upward manually. Identify the direction from sound alone.",
    code: `const start = audio.currentTime + 0.012;
orderedStrings.forEach((note, i) => playAt(note, start + i * 0.026));`,
    preset: { ...basePreset, chord: 3, reverb: 0.14 },
    quiz: {
      question: "Which clock should schedule a chord?",
      options: [
        {
          label: "AudioContext.currentTime",
          correct: true,
          feedback: "Right. It is the clock the audio graph actually executes.",
        },
        {
          label: "requestAnimationFrame timestamp",
          correct: false,
          feedback: "RAF is useful for visuals, not sample scheduling.",
        },
        {
          label: "Date.now()",
          correct: false,
          feedback: "Wall-clock time is not the audio rendering timeline.",
        },
      ],
    },
  },
  {
    id: "tone",
    number: "08",
    level: "Pro",
    title: "Shape a believable voice",
    promise:
      "Add a bright attack, smooth amplitude envelope, stereo contact position, and safe combined dynamics.",
    minutes: 24,
    paragraphs: [
      "Physical strings lose high-frequency energy faster than their fundamental. Start a low-pass filter bright—modulated by pluck force—then let it settle toward a warmer cutoff. Tone changes timbre without detuning the buffer.",
      "Gain must begin and end slightly above zero for exponential ramps. A 3–6 ms attack is fast enough to feel immediate but prevents the discontinuity that creates a digital click.",
      "Contact position can become restrained stereo pan. Keep the range narrower than full left/right and let the shared compressor manage coincident peaks from chords and effect returns.",
    ],
    principle:
      "Pitch identifies the note; envelopes, filtering, and space identify the performance.",
    listening:
      "Use one repeated middle string. Adjust Tone only and listen to the attack, then Output only and listen for smooth level changes.",
    exercise:
      "Move tone from dark to bright while playing key 4 at the same force. Confirm note identity does not change.",
    code: `source -> lowpass(bright -> warm)
       -> gain(0.0001 -> attack -> decay)
       -> stereoPan(contactX)
       -> shared input`,
    preset: { ...basePreset, tone: 0.92, output: 0.5 },
    quiz: {
      question: "Why not ramp gain exponentially to exact zero?",
      options: [
        {
          label: "Exponential ramps require positive values",
          correct: true,
          feedback: "Correct. Use a tiny positive floor such as 0.0001.",
        },
        {
          label: "Zero changes the chord",
          correct: false,
          feedback: "It changes level, not harmony.",
        },
        {
          label: "Canvas cannot represent zero",
          correct: false,
          feedback: "This constraint belongs to AudioParam automation.",
        },
      ],
    },
  },
  {
    id: "effects",
    number: "09",
    level: "Pro",
    title: "Build the effects rack",
    promise:
      "Wire drive, bounded feedback delay, generated reverb, and musical presets without allowing a wet path to escape output safety.",
    minutes: 32,
    paragraphs: [
      "Drive uses nonlinear waveshaping to add harmonics. It belongs before the dry/wet split so delay and reverb receive the colored performance, but its amount must be bounded and level-compensated because saturation also raises perceived loudness.",
      "Delay time sets the repeat interval; feedback sets how much of each repeat re-enters the delay. They are separate controls, and feedback must remain below unity. Reverb can be created from a short decaying-noise impulse assigned to a ConvolverNode.",
      "A preset is a coherent snapshot of parameters, not a second engine. Clean, Dream, and Crunch all update the same graph in place; moving one slider afterward turns the state into Custom and teaches which parameter caused the change.",
    ],
    principle: "Effects are parallel color; master ownership remains singular.",
    listening:
      "Replay one C-major strum through Clean, Dream, and Crunch. Compare attack, repeat spacing, tail, and harmonic density separately.",
    exercise:
      "Choose Dream, lower reverb only, then shorten delay. Build a spacious sound whose repeats stay intelligible.",
    code: `input -> drive -> dry ----------------> compressor
                -> delay <-> feedback -> wet --/
                -> convolver -> reverb wet ----/
compressor -> master -> destination`,
    preset: {
      ...basePreset,
      tone: 0.54,
      drive: 0.08,
      delay: 0.38,
      feedback: 0.52,
      reverb: 0.48,
      output: 0.47,
      preset: "dream",
    },
    quiz: {
      question: "What prevents a delay from growing forever?",
      options: [
        {
          label: "Feedback gain clamped below one",
          correct: true,
          feedback: "Correct. Each loop must return less energy.",
        },
        {
          label: "A wider canvas",
          correct: false,
          feedback: "Rendering dimensions do not control audio energy.",
        },
        {
          label: "Changing the chord",
          correct: false,
          feedback: "Harmony changes notes, not feedback stability.",
        },
      ],
    },
  },
  {
    id: "performance",
    number: "10",
    level: "Pro",
    title: "Keep performance bounded",
    promise:
      "Limit voices and buffers, smooth live parameter changes, and give pointer, keyboard, and buttons the same musical path.",
    minutes: 22,
    paragraphs: [
      "Every AudioBufferSourceNode is one-shot. Fast strumming can create many overlapping tails, so a voice pool needs a hard ceiling and a deterministic stealing rule. Prefer a free slot, then a quiet old tail, then the oldest active voice.",
      "Live sliders should update AudioParams with a short ramp. Abrupt delay, feedback, or master-gain assignment during a ringing tail creates zipper noise even when the UI itself looks smooth.",
      "Keyboard keys 1–6, the Strum button, and pointer crossing should resolve through the same pluck function. Equivalent inputs are easier to test and prevent an accessible path from becoming a lower-quality imitation.",
    ],
    principle:
      "Bound allocations, share behavior, smooth the values that ring.",
    listening:
      "Create several rapid Dream strums and move Output. The result should remain controlled, with no clicks or growing slowdown.",
    exercise:
      "Strum eight times quickly, stop the tail, then play key 2. The new note should remain immediate and clean.",
    code: `if (voices.full) steal(oldestQuiet ?? oldest);
audioParam.setTargetAtTime(nextValue, audio.currentTime, 0.02);
pointer | keyboard | button -> pluck(stringIndex)`,
    preset: {
      ...basePreset,
      chord: 2,
      drive: 0.18,
      delay: 0.26,
      feedback: 0.38,
      reverb: 0.24,
      preset: "custom",
    },
    quiz: {
      question: "What should happen when the voice pool is full?",
      options: [
        {
          label: "Reuse a bounded slot with a deterministic steal rule",
          correct: true,
          feedback: "Exactly. Capacity stays fixed under any input rate.",
        },
        {
          label: "Create another AudioContext",
          correct: false,
          feedback: "Contexts are not a polyphony strategy.",
        },
        {
          label: "Let voices grow without limit",
          correct: false,
          feedback: "That turns visitor enthusiasm into a resource leak.",
        },
      ],
    },
  },
  {
    id: "ship",
    number: "11",
    level: "Pro",
    title: "Ship the instrument",
    promise:
      "Separate sound and motion preferences, suspend hidden work, survive unsupported audio, and destroy every resource cleanly.",
    minutes: 24,
    paragraphs: [
      "Reduced motion and muted sound are different preferences. A reduced-motion visitor may still want to play the guitar, so settle the string visually without suppressing an explicitly requested note. Likewise, muted audio should not remove visible contact feedback.",
      "When the tab becomes hidden, suspend a context that the visitor previously activated. Visibility changes must never create or unlock audio on their own. When Web Audio is unavailable, keep geometry, pointer input, keyboard focus, and status feedback alive.",
      "Cleanup is a feature: cancel RAF, stop voices, disconnect nodes, clear buffer caches, remove listeners, and close the context. Make destroy idempotent so navigation and framework teardown cannot race into exceptions.",
    ],
    principle: "A trustworthy instrument owns its silence and its teardown.",
    listening:
      "Raise reverb, strum once, then use Stop voices and Sound off. No wet tail should bypass either control.",
    exercise:
      "Use keyboard only: enable sound, choose G, play 1–6, stop voices, then turn sound off. Every state should remain visible.",
    code: `reducedMotion -> static visual response (audio unchanged)
hidden tab -> suspend previously activated context
destroy -> cancel + stop + disconnect + clear + close`,
    preset: {
      ...basePreset,
      chord: 3,
      reverb: 0.32,
      delay: 0.3,
      feedback: 0.42,
      preset: "custom",
    },
    quiz: {
      question: "Should reduced motion automatically mute the guitar?",
      options: [
        {
          label: "No—motion and sound are separate preferences",
          correct: true,
          feedback:
            "Correct. Remove oscillation while preserving explicit audio interaction.",
        },
        {
          label: "Yes—always",
          correct: false,
          feedback: "That silently changes a different sensory preference.",
        },
        {
          label: "Only for bass strings",
          correct: false,
          feedback: "The distinction is about preference ownership, not pitch.",
        },
      ],
    },
  },
] as const;

const PROGRESS_KEY = "string-instrument-course-progress-v1";
const STEP_PROGRESS_KEY = "string-instrument-course-step-progress-v1";

export default function StringInstrumentCourse() {
  const [activeId, setActiveId] = useState(LESSONS[0].id);
  const [completed, setCompleted] = useState<string[]>([]);
  const [completedStepKeys, setCompletedStepKeys] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const activeIndex = Math.max(
    0,
    LESSONS.findIndex((lesson) => lesson.id === activeId),
  );
  const lesson = LESSONS[activeIndex];
  const tutorial = STRING_TUTORIALS[lesson.id];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROGRESS_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validIds = new Set(LESSONS.map((item) => item.id));
          setCompleted(
            parsed.filter(
              (id): id is string => typeof id === "string" && validIds.has(id),
            ),
          );
        }
      }

      const savedSteps = window.localStorage.getItem(STEP_PROGRESS_KEY);
      if (savedSteps) {
        const parsed: unknown = JSON.parse(savedSteps);
        if (Array.isArray(parsed)) {
          const validStepKeys = new Set(
            LESSONS.flatMap((item) =>
              STRING_TUTORIALS[item.id].steps.map(
                (_, index) => `${item.id}:${index}`,
              ),
            ),
          );
          setCompletedStepKeys(
            parsed.filter(
              (key): key is string =>
                typeof key === "string" && validStepKeys.has(key),
            ),
          );
        }
      }
    } catch {
      // Progress persistence is optional.
    }

    const selectFromHash = () => {
      const id = window.location.hash.slice(1);
      if (LESSONS.some((item) => item.id === id)) setActiveId(id);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);

  const selectedAnswer = answers[lesson.id];
  const answer =
    selectedAnswer === undefined ? null : lesson.quiz.options[selectedAnswer];
  const totalMinutes = useMemo(
    () => LESSONS.reduce((sum, item) => sum + item.minutes, 0),
    [],
  );
  const totalBuildSteps = useMemo(
    () =>
      LESSONS.reduce(
        (sum, item) => sum + STRING_TUTORIALS[item.id].steps.length,
        0,
      ),
    [],
  );
  const progress = Math.round(
    ((completed.length + completedStepKeys.length) /
      (LESSONS.length + totalBuildSteps)) *
      100,
  );

  const toggleComplete = () => {
    const next = completed.includes(lesson.id)
      ? completed.filter((id) => id !== lesson.id)
      : [...completed, lesson.id];
    setCompleted(next);
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // Progress persistence is optional.
    }
  };

  const toggleStep = (stepKey: string) => {
    const next = completedStepKeys.includes(stepKey)
      ? completedStepKeys.filter((key) => key !== stepKey)
      : [...completedStepKeys, stepKey];
    setCompletedStepKeys(next);
    try {
      window.localStorage.setItem(STEP_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // Progress persistence is optional.
    }
  };

  const selectLesson = (id: string) => {
    setActiveId(id);
    window.history.pushState(null, "", `#${id}`);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <main
      className={`${sharedStyles.coursePage} ${sharedStyles.stringCoursePage}`}
    >
      <header className={sharedStyles.courseHeader}>
        <nav className={sharedStyles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/learning">Learning log</Link>
          <span>/</span>
          <span>String instrument</span>
        </nav>
        <div className={sharedStyles.heroGrid}>
          <div>
            <p className={sharedStyles.kicker}>
              Interactive audio course · {totalMinutes} minutes ·{" "}
              {totalBuildSteps} code steps
            </p>
            <h1>Build a browser guitar, from string to effects.</h1>
            <p className={sharedStyles.heroLede}>
              Draw, pull, tune and synthesize six strings with Canvas and Web
              Audio—then build drive, delay, reverb, presets, safe polyphony and
              production cleanup with code you can copy.
            </p>
          </div>
          <div className={sharedStyles.progressCard}>
            <div>
              <span>Your progress</span>
              <strong>{progress}%</strong>
            </div>
            <div
              className={sharedStyles.progressTrack}
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>
              {completedStepKeys.length} of {totalBuildSteps} build steps ·{" "}
              {completed.length} of {LESSONS.length} module checkpoints
            </small>
          </div>
        </div>
      </header>

      <div className={sharedStyles.courseLayout}>
        <aside className={sharedStyles.lessonRail}>
          <p>Course map</p>
          <nav aria-label="Course modules">
            {LESSONS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={item.id === lesson.id}
                data-complete={completed.includes(item.id)}
                aria-current={item.id === lesson.id ? "step" : undefined}
                onClick={() => selectLesson(item.id)}
              >
                <span>{completed.includes(item.id) ? "✓" : item.number}</span>
                <span>
                  <small>{item.level}</small>
                  {item.title}
                </span>
              </button>
            ))}
          </nav>
          <Link className={sharedStyles.labLink} href="/#hero">
            Play the homepage strings →
          </Link>
          <Link
            className={sharedStyles.labLink}
            href="/systems/string-instrument"
          >
            Inspect the production system →
          </Link>
        </aside>

        <article className={sharedStyles.lessonArticle}>
          <header className={sharedStyles.lessonHeader}>
            <div className={sharedStyles.lessonMeta}>
              <span>Module {lesson.number}</span>
              <span>{lesson.level}</span>
              <span>{lesson.minutes} min</span>
            </div>
            <h2>{lesson.title}</h2>
            <p>{lesson.promise}</p>
          </header>

          <StringLab
            preset={lesson.preset}
            title={lesson.title}
            controlLessons={tutorial.controls}
          />

          <CourseTutorial
            lessonId={lesson.id}
            tutorial={tutorial}
            showSetup={activeIndex === 0}
            completedStepKeys={completedStepKeys}
            onToggleStep={toggleStep}
            kit={STRING_COURSE_KIT}
          />

          <div className={sharedStyles.articleBody}>
            <div className={sharedStyles.conceptDivider}>
              <span>Now understand the system</span>
              <p>
                You have changed the live instrument and built the code. These
                notes explain the boundary, listening cue, and production
                trade-off behind the result.
              </p>
            </div>
            {lesson.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <div className={sharedStyles.calloutGrid}>
              <section>
                <span>Engineering principle</span>
                <p>{lesson.principle}</p>
              </section>
              <section>
                <span>What to listen for</span>
                <p>{lesson.listening}</p>
              </section>
            </div>

            <section className={sharedStyles.exercise}>
              <span>Try this now</span>
              <p>{lesson.exercise}</p>
            </section>

            <section className={sharedStyles.codeBlock}>
              <div>
                <span>Concept recap · signal map</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(lesson.code)}
                >
                  Copy
                </button>
              </div>
              <pre>
                <code>{lesson.code}</code>
              </pre>
            </section>

            <section className={sharedStyles.quiz}>
              <span>Knowledge check</span>
              <h3>{lesson.quiz.question}</h3>
              <div>
                {lesson.quiz.options.map((option, index) => (
                  <button
                    type="button"
                    key={option.label}
                    data-selected={selectedAnswer === index}
                    data-correct={
                      selectedAnswer === index ? option.correct : undefined
                    }
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [lesson.id]: index,
                      }))
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {answer ? (
                <p data-correct={answer.correct}>{answer.feedback}</p>
              ) : null}
            </section>
          </div>

          <footer className={sharedStyles.lessonFooter}>
            <button
              type="button"
              className={sharedStyles.completeButton}
              data-complete={completed.includes(lesson.id)}
              onClick={toggleComplete}
            >
              {completed.includes(lesson.id)
                ? "✓ Checkpoint complete"
                : "Mark module complete"}
            </button>
            <div>
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => selectLesson(LESSONS[activeIndex - 1].id)}
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={activeIndex === LESSONS.length - 1}
                onClick={() => selectLesson(LESSONS[activeIndex + 1].id)}
              >
                Next module →
              </button>
            </div>
          </footer>
        </article>
      </div>

      <section className={sharedStyles.sources}>
        <div>
          <p className={sharedStyles.kicker}>
            Primary sources behind the course
          </p>
          <h2>Read past the effects rack.</h2>
        </div>
        <div className={sharedStyles.sourceGrid}>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/AudioContext"
            target="_blank"
            rel="noreferrer"
          >
            <strong>MDN · AudioContext</strong>
            <span>Graph ownership, state, resume, suspend, and close</span>
          </a>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices"
            target="_blank"
            rel="noreferrer"
          >
            <strong>MDN · Web Audio best practices</strong>
            <span>
              Autoplay, user gestures, timing, and cross-browser safety
            </span>
          </a>
          <a
            href="https://www.w3.org/TR/webaudio/"
            target="_blank"
            rel="noreferrer"
          >
            <strong>W3C · Web Audio API</strong>
            <span>The processing model and normative AudioNode behavior</span>
          </a>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture"
            target="_blank"
            rel="noreferrer"
          >
            <strong>MDN · Pointer capture</strong>
            <span>Reliable drag ownership beyond the canvas boundary</span>
          </a>
        </div>
      </section>
    </main>
  );
}
