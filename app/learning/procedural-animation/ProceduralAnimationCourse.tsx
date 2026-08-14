"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ChainPlayground, { type PlaygroundPreset } from "./ChainPlayground";
import styles from "./page.module.css";

interface Lesson {
  id: string;
  number: string;
  level: "Noob" | "Builder" | "Pro";
  title: string;
  promise: string;
  minutes: number;
  paragraphs: readonly string[];
  principle: string;
  psychology: string;
  exercise: string;
  code: string;
  preset: PlaygroundPreset;
  quiz: {
    question: string;
    options: readonly { label: string; correct: boolean; feedback: string }[];
  };
}

const basePreset: PlaygroundPreset = {
  joints: 18,
  segment: 8,
  angle: 18,
  damping: 0.82,
  response: 0.32,
  width: 19,
  debug: false,
};

const LESSONS: readonly Lesson[] = [
  {
    id: "intent",
    number: "01",
    level: "Noob",
    title: "Motion is a promise",
    promise: "Separate a target, a mover and a body before touching a single fin.",
    minutes: 6,
    paragraphs: [
      "Procedural animation is not random motion. It is a live relationship: an input establishes intent, a controller turns that intent into a believable root trajectory, and a rig lets the rest of the body respond. When those three jobs blur together, tuning one detail breaks three others.",
      "Begin with a dot. Give it a target and a maximum speed. If the dot cannot start, turn and stop clearly, adding a beautiful fish silhouette only hides the control problem. A professional rig makes the invisible intent readable before it makes the surface pretty.",
      "The most important product decision is ownership. On a portfolio, movement should not seize attention merely because a pointer exists. Let the character rest until a visitor explicitly invites interaction; then make that state visible and reversible.",
    ],
    principle: "Goal → steering → locomotion → rendering. Keep the layers replaceable.",
    psychology: "People readily infer agency from simple shapes when trajectories look goal-directed. That makes direct pursuit powerful—but also attention-hungry. Use it deliberately, not as ambient noise.",
    exercise: "Pause the lab, take pointer control, then move the target in one clean line. Can you predict where the head will stop?",
    code: `type Intent = { target: Vec2; active: boolean };
const steering = controller.solve(intent, body);
rig.update(dt, steering);
renderer.draw(rig);`,
    preset: { ...basePreset, joints: 6, width: 10, debug: true },
    quiz: {
      question: "What should you tune first when a creature feels erratic?",
      options: [
        { label: "The root trajectory", correct: true, feedback: "Yes. Make intent legible before adding anatomy." },
        { label: "More fins", correct: false, feedback: "Fins amplify motion; they do not repair a bad controller." },
        { label: "Random noise", correct: false, feedback: "Noise is texture, not intent." },
      ],
    },
  },
  {
    id: "vectors",
    number: "02",
    level: "Noob",
    title: "Vectors before vibes",
    promise: "Build position, velocity and acceleration into a predictable mover.",
    minutes: 8,
    paragraphs: [
      "Position says where the root is. Velocity says where it is going. Acceleration says how its velocity is changing. These are not academic decorations: stretch comes from speed, lean comes from turning acceleration, and anticipation comes from target velocity.",
      "A bare linear interpolation often looks acceptable at one frame rate and syrupy at another. Drive motion with delta time and cap physically meaningful quantities such as speed and steering force. The same parameters should describe the same temperament on a 60 Hz laptop and a 120 Hz phone.",
      "Never point the face at the target while the body is still sliding elsewhere. Derive orientation from actual velocity above a small threshold, then retain the previous heading at rest. This prevents the uncanny compass-needle spin around zero speed.",
    ],
    principle: "Integrate velocity over time; derive facing from motion, not wishful intent.",
    psychology: "Prediction is comfort. When acceleration and facing agree, the viewer can forecast the next instant; mismatched cues feel slippery or mechanical.",
    exercise: "Lower response, then raise damping. Find the slowest motion that still feels intentional rather than asleep.",
    code: `steering = clamp(target - position, maxForce);
velocity = clamp(velocity + steering * dt, maxSpeed);
position += velocity * dt;
if (length(velocity) > epsilon) heading = atan2(vy, vx);`,
    preset: { ...basePreset, joints: 7, angle: 12, damping: 0.55, response: 0.5, debug: true },
    quiz: {
      question: "Why retain heading when speed is nearly zero?",
      options: [
        { label: "To prevent unstable spinning", correct: true, feedback: "Correct. Direction is undefined at zero velocity." },
        { label: "To increase frame rate", correct: false, feedback: "It helps visual stability, not rendering cost." },
        { label: "To make links longer", correct: false, feedback: "Heading and link length are separate constraints." },
      ],
    },
  },
  {
    id: "damping",
    number: "03",
    level: "Noob",
    title: "Damping is personality",
    promise: "Turn the same controller into calm, playful or nervous motion.",
    minutes: 7,
    paragraphs: [
      "Response controls how eagerly a character commits; damping controls how much energy survives after the target changes. Low damping overshoots and rebounds. High damping arrives with restraint. Neither is universally better—the choice must match the character and context.",
      "Tune with step inputs: place the target far away, let the root settle, then reverse it. Curves that look fine during continuous pointer noise often reveal oscillation, sluggishness or hidden energy under a hard reversal.",
      "Use one dominant motion idea. A curious fish may overshoot slightly, but if its root, eyes, fins and glow all bounce independently, the signals compete. Secondary systems should inherit energy from the root and decay faster than the main action.",
    ],
    principle: "One energy source, several quieter echoes.",
    psychology: "Small, consistent overshoot reads as liveliness. Unbounded or unrelated oscillation reads as loss of control—and competes with the page’s actual information.",
    exercise: "Use Break it, then repair only damping. Notice what it fixes and what still requires angle or length limits.",
    code: `acceleration = stiffness * (target - position) - damping * velocity;
velocity += acceleration * dt;
position += velocity * dt;`,
    preset: { ...basePreset, damping: 0.34, response: 0.62, joints: 10 },
    quiz: {
      question: "Which parameter most directly removes lingering oscillation?",
      options: [
        { label: "Damping", correct: true, feedback: "Right. Damping dissipates energy." },
        { label: "Body color", correct: false, feedback: "Appearance can mask, but cannot solve, oscillation." },
        { label: "Joint count", correct: false, feedback: "More joints change resolution, not root energy." },
      ],
    },
  },
  {
    id: "chains",
    number: "04",
    level: "Builder",
    title: "Build the spine chain",
    promise: "Make a root-to-tail skeleton with exact link lengths.",
    minutes: 10,
    paragraphs: [
      "A chain is an ordered set of points. Pin the first point to the root, then place every following point exactly one segment length from its parent. This simple positional constraint gives you a stable backbone without authoring a timeline.",
      "Solve from head to tail because information flows from the controlled root into passive anatomy. Repeating the constraint pass improves convergence when other forces disturb the chain, but blindly adding iterations can waste time and make soft motion look rigid.",
      "Choose resolution from silhouette needs. Too few joints produce elbows; too many amplify numerical noise and cost. For a small 2D fish, a couple dozen joints are often plenty when the contour is smoothed separately.",
    ],
    principle: "Every child is exactly one rest length from its parent.",
    psychology: "Common fate—parts moving as one coherent unit—helps a viewer group points into a single creature. Broken spacing disrupts that perceptual unity immediately.",
    exercise: "Move from 5 to 24 joints while keeping overall length roughly constant. Find where extra resolution stops improving the silhouette.",
    code: `for (let i = 1; i < joints.length; i++) {
  const direction = normalize(joints[i] - joints[i - 1]);
  joints[i] = joints[i - 1] + direction * segmentLength;
}`,
    preset: { ...basePreset, joints: 18, segment: 8, angle: 55, debug: true },
    quiz: {
      question: "Why solve from head to tail for this fish?",
      options: [
        { label: "The head is controlled and motion propagates backward", correct: true, feedback: "Exactly—the dependency has a clear direction." },
        { label: "Canvas only draws left to right", correct: false, feedback: "Rendering order is unrelated." },
        { label: "It creates random motion", correct: false, feedback: "The solve is deterministic." },
      ],
    },
  },
  {
    id: "angles",
    number: "05",
    level: "Builder",
    title: "Stop the impossible fold",
    promise: "Use regional angle limits to trade stiffness for organic curvature.",
    minutes: 9,
    paragraphs: [
      "Distance constraints prevent stretching but do not prevent a chain from folding onto itself. Compare each segment angle with the previous one and clamp the shortest signed difference. The head should usually turn less than the tail.",
      "Regional constraints produce anatomy: tight anterior limits imply a firm skull and torso; looser posterior limits imply a flexible tail. A single global value works for a prototype, but a gradient produces a far more readable animal.",
      "Always clamp wrapped angles across the ±π seam. Subtracting raw angles can turn a tiny crossing at the left edge into an apparent full revolution and cause a violent flip.",
    ],
    principle: "Constrain change in direction, not absolute direction.",
    psychology: "Biological motion feels plausible when flexibility is distributed meaningfully. Viewers may not name the rule, but they notice when a ‘skull’ bends like rope.",
    exercise: "Set 60°, then 8°. The first folds; the second becomes rigid. Find a head-safe value that still lets the tail finish the turn.",
    code: `delta = wrapAngle(candidate - previous);
const limit = lerp(headLimit, tailLimit, regionT);
angle = previous + clamp(delta, -limit, limit);`,
    preset: { ...basePreset, joints: 20, angle: 16, debug: true },
    quiz: {
      question: "What does an angle limit solve that distance alone cannot?",
      options: [
        { label: "Self-folding and sharp kinks", correct: true, feedback: "Correct. Length says nothing about curvature." },
        { label: "Color contrast", correct: false, feedback: "That belongs to rendering." },
        { label: "Pointer ownership", correct: false, feedback: "That belongs to behavior and interaction state." },
      ],
    },
  },
  {
    id: "silhouette",
    number: "06",
    level: "Builder",
    title: "Grow a body from bones",
    promise: "Turn one spine into a stable silhouette, eyes and fins.",
    minutes: 11,
    paragraphs: [
      "At each spine point, estimate a tangent from its neighbors and rotate it ninety degrees to get a normal. A width profile moves left and right along that normal. Connect the two rails and you have a deforming body that cannot detach from its rig.",
      "Design the width curve as anatomy, not decoration: pinch the nose, establish a shoulder, hold a torso, then taper the tail. Smooth normals over time or along the chain so tiny spine noise does not create sparkling contour facets.",
      "Attach eyes and fins in local frames derived from the same spine. Independent world-space offsets are why features slide across procedural bodies during a turn. Every visible detail should answer: which bone owns me?",
    ],
    principle: "Skeleton first; all surface features live in its local frames.",
    psychology: "Stable feature attachment preserves object identity. When eyes or markings drift independently, the visual system reads layers sliding—not one living body.",
    exercise: "Change body width without changing the chain. Watch how morphology changes while motion logic remains intact.",
    code: `tangent = normalize(next - previous);
normal = vec2(-tangent.y, tangent.x);
left[i] = joint[i] + normal * width(i);
right[i] = joint[i] - normal * width(i);`,
    preset: { ...basePreset, width: 24, joints: 21, angle: 17, debug: false },
    quiz: {
      question: "Where should an eye anchor live?",
      options: [
        { label: "In a head-local frame derived from the spine", correct: true, feedback: "Yes. It then inherits position and rotation coherently." },
        { label: "At a fixed viewport coordinate", correct: false, feedback: "It would detach as the fish moves." },
        { label: "At the pointer", correct: false, feedback: "The pupil may track it; the eye socket should not." },
      ],
    },
  },
  {
    id: "secondary",
    number: "07",
    level: "Builder",
    title: "Secondary motion, not chaos",
    promise: "Add Verlet fins and tails that echo the root without stealing the scene.",
    minutes: 10,
    paragraphs: [
      "Secondary chains store the previous position of each point, infer velocity from the difference, then apply drag and constraints. Pin the base to a body joint and let the tip lag. The result is follow-through generated from current motion rather than a canned clip.",
      "Keep secondary amplitude proportional to actual speed or acceleration. A resting fish with loudly waving fins communicates wind, panic or a bug. At low speed, reduce curl and let drag settle the chain.",
      "Solve a small, bounded number of iterations and cap extreme frame deltas. Constraint systems can explode after a suspended tab resumes if they are asked to integrate several seconds at once.",
    ],
    principle: "Secondary motion receives energy; it does not invent the main action.",
    psychology: "Follow-through adds material cues—softness, weight, water resistance. Consistent decay lets the viewer infer what the creature is made of.",
    exercise: "Compare low damping with a tight angle limit. Then reverse it. Identify whether the bad feeling comes from stored energy or impossible curvature.",
    code: `velocity = (position - previous) * drag;
previous = position;
position += velocity + externalForce * dt * dt;
solveDistanceConstraints();`,
    preset: { ...basePreset, damping: 0.62, response: 0.42, angle: 21 },
    quiz: {
      question: "What should drive fin amplitude?",
      options: [
        { label: "Root motion energy", correct: true, feedback: "Right. The fin should echo the action." },
        { label: "Unbounded random values", correct: false, feedback: "That breaks material continuity." },
        { label: "Screen size only", correct: false, feedback: "Scale matters, but not as the motion source." },
      ],
    },
  },
  {
    id: "behavior",
    number: "08",
    level: "Pro",
    title: "Behavior needs consent",
    promise: "Design follow, rest and off as explicit product states.",
    minutes: 9,
    paragraphs: [
      "A physics system answers how to move; a behavior system answers whether and why. Use named states such as rest, wake, follow and avoid. Each state owns one target policy and one motion recipe, so the creature cannot simultaneously chase, wander and perch.",
      "Direct pursuit is perceptually strong. That is useful after a visitor chooses play, but distracting when it follows every accidental pointer move. Make activation deliberate, provide a second action and Escape to stop, and persist a full feature-off preference.",
      "On small touch screens, the character competes with content and the finger already occludes its target. Hiding a decorative follower can be the better experience. Reduced-motion preferences should lower or stop nonessential animation, not merely make particles fewer.",
    ],
    principle: "One owner per target; every continuous motion has a visible exit.",
    psychology: "Goal-directed pursuit creates a strong sense of animacy and attention. Control changes that intensity from interruption into play.",
    exercise: "Take pointer control, then pause. Ask whether the current UI makes the state and the way out obvious without documentation.",
    code: `switch (state) {
  case "rest": target = root; break;
  case "follow": target = pointer; break;
  case "avoid": target = safePoint; break;
}
// Follow starts only after an explicit hit on the creature.`,
    preset: { ...basePreset, damping: 0.9, response: 0.24, angle: 18 },
    quiz: {
      question: "What is the safest default for a persistent decorative follower?",
      options: [
        { label: "Rest until explicitly invited", correct: true, feedback: "Yes. Motion becomes a user-owned mode." },
        { label: "Chase every pointer movement", correct: false, feedback: "That maximizes involuntary attention capture." },
        { label: "Move faster so it ends sooner", correct: false, feedback: "Speed does not provide control." },
      ],
    },
  },
  {
    id: "timestep",
    number: "09",
    level: "Pro",
    title: "Make time boring",
    promise: "Ship frame-rate-independent motion with fixed steps and bounded work.",
    minutes: 12,
    paragraphs: [
      "Rendering happens whenever the browser can paint; simulation should advance in stable increments. Accumulate real frame time, consume fixed updates, and cap both the incoming delta and the number of catch-up steps. The cap intentionally drops time to protect the page from a spiral of death.",
      "Keep mutable physics outside React state. Pointer events write into a tiny input boundary, one requestAnimationFrame loop owns the simulation, and React only mounts or changes low-frequency controls. This avoids rerendering the component tree 60 times per second.",
      "Measure solver and render cost separately. Reduce DPR, particles and iteration counts under pressure while protecting silhouette and input response. A creature that stays responsive at lower visual detail feels better than a gorgeous one that blocks the page.",
    ],
    principle: "Stable time, bounded work, graceful quality reduction.",
    psychology: "Latency breaks agency. When input and response drift apart, the creature stops feeling like it belongs to the visitor’s action.",
    exercise: "Pause for a few seconds, resume, and verify that the chain does not teleport or explode. Then compare the rig overlay at 6 versus 28 joints.",
    code: `accumulator += min(frameDt, 0.05);
for (let steps = 0; accumulator >= fixedDt && steps < maxSteps; steps++) {
  update(fixedDt);
  accumulator -= fixedDt;
}
render();`,
    preset: { ...basePreset, joints: 24, segment: 6.5, damping: 0.84, debug: true },
    quiz: {
      question: "Why cap catch-up steps?",
      options: [
        { label: "To keep a slow frame from creating more slow frames", correct: true, feedback: "Correct—the spiral of death must be bounded." },
        { label: "To change body color", correct: false, feedback: "Rendering style is separate." },
        { label: "To make time physically exact", correct: false, feedback: "The cap trades lost simulation time for responsiveness." },
      ],
    },
  },
  {
    id: "ship",
    number: "10",
    level: "Pro",
    title: "Tune like a professional",
    promise: "Use a repeatable review loop instead of accumulating magic numbers.",
    minutes: 14,
    paragraphs: [
      "Tune from large relationships to small details: root response, stopping behavior, curvature, silhouette, secondary motion, then expression. Review the same scenarios every time—long pursuit, hard reversal, tiny target changes, viewport edges, pause/resume and reduced motion.",
      "Expose constraints in a debug overlay and label controls with units. Save named presets that communicate intent—calm, playful, heavy—instead of anonymous number dumps. A parameter earns its place only if you can explain the perceptual change it controls.",
      "Finally, review the character as part of the product. Check text contrast behind it, keyboard access, mobile occlusion, CPU cost, route ownership and a persistent off switch. World-class procedural animation is not the most motion; it is the clearest motion that the experience can afford.",
    ],
    principle: "Tune in dependency order; ship with observability and an exit.",
    psychology: "Coherent causes matter more than maximal detail. One readable intention with disciplined follow-through feels more alive than many unrelated effects.",
    exercise: "Create one calm preset: no folding, one modest overshoot, clean stop, readable body and a visible way to pause it. Mark the module complete when you can defend every parameter.",
    code: `review([
  "long pursue", "hard reverse", "micro move",
  "edge", "tab resume", "reduced motion", "feature off"
]);`,
    preset: { ...basePreset, joints: 21, segment: 7.2, angle: 17, damping: 0.88, response: 0.3, width: 21 },
    quiz: {
      question: "What is the correct tuning order?",
      options: [
        { label: "Root → constraints → silhouette → secondary detail", correct: true, feedback: "Exactly. Each stage depends on the previous one." },
        { label: "Glow → particles → root", correct: false, feedback: "That hides causes under effects." },
        { label: "Everything simultaneously", correct: false, feedback: "You lose the ability to attribute changes." },
      ],
    },
  },
] as const;

const PROGRESS_KEY = "procedural-animation-course-progress-v1";

export default function ProceduralAnimationCourse() {
  const [activeId, setActiveId] = useState(LESSONS[0].id);
  const [completed, setCompleted] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const activeIndex = Math.max(0, LESSONS.findIndex((lesson) => lesson.id === activeId));
  const lesson = LESSONS[activeIndex];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROGRESS_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validIds = new Set<string>(LESSONS.map((item) => item.id));
          setCompleted(
            parsed.filter(
              (id): id is string =>
                typeof id === "string" && validIds.has(id),
            ),
          );
        }
      }
    } catch {
      // Progress persistence is a convenience; the course works without it.
    }
  }, []);

  const progress = Math.round((completed.length / LESSONS.length) * 100);
  const selectedAnswer = answers[lesson.id];
  const answer = selectedAnswer === undefined ? null : lesson.quiz.options[selectedAnswer];
  const totalMinutes = useMemo(
    () => LESSONS.reduce((sum, item) => sum + item.minutes, 0),
    [],
  );

  const toggleComplete = () => {
    const next = completed.includes(lesson.id)
      ? completed.filter((id) => id !== lesson.id)
      : [...completed, lesson.id];
    setCompleted(next);
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  };

  const selectLesson = (id: string) => {
    setActiveId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.coursePage}>
      <header className={styles.courseHeader}>
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/learning">Learning log</Link>
          <span>/</span>
          <span>Procedural animation</span>
        </nav>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.kicker}>Interactive field course · {totalMinutes} minutes</p>
            <h1>Procedural animation, from noob to pro.</h1>
            <p className={styles.heroLede}>
              Build one living fish from a dot, then learn the constraints, perception and product decisions that make it feel intentional—not weird.
            </p>
          </div>
          <div className={styles.progressCard}>
            <div><span>Your progress</span><strong>{progress}%</strong></div>
            <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
            <small>{completed.length} of {LESSONS.length} modules checkpointed in this browser</small>
          </div>
        </div>
      </header>

      <div className={styles.courseLayout}>
        <aside className={styles.lessonRail}>
          <p>Course map</p>
          <nav aria-label="Course modules">
            {LESSONS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={item.id === lesson.id}
                data-complete={completed.includes(item.id)}
                onClick={() => selectLesson(item.id)}
              >
                <span>{completed.includes(item.id) ? "✓" : item.number}</span>
                <span><small>{item.level}</small>{item.title}</span>
              </button>
            ))}
          </nav>
          <Link className={styles.labLink} href="/creature-lab">Open full Creature Lab →</Link>
        </aside>

        <article className={styles.lessonArticle}>
          <header className={styles.lessonHeader}>
            <div className={styles.lessonMeta}>
              <span>Module {lesson.number}</span>
              <span>{lesson.level}</span>
              <span>{lesson.minutes} min</span>
            </div>
            <h2>{lesson.title}</h2>
            <p>{lesson.promise}</p>
          </header>

          <ChainPlayground preset={lesson.preset} title={lesson.title} />

          <div className={styles.articleBody}>
            {lesson.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}

            <div className={styles.calloutGrid}>
              <section><span>Engineering principle</span><p>{lesson.principle}</p></section>
              <section><span>Why it feels alive</span><p>{lesson.psychology}</p></section>
            </div>

            <section className={styles.exercise}>
              <span>Try this now</span>
              <p>{lesson.exercise}</p>
            </section>

            <section className={styles.codeBlock}>
              <div><span>Minimal mental model</span><button type="button" onClick={() => navigator.clipboard?.writeText(lesson.code)}>Copy</button></div>
              <pre><code>{lesson.code}</code></pre>
            </section>

            <section className={styles.quiz}>
              <span>Knowledge check</span>
              <h3>{lesson.quiz.question}</h3>
              <div>
                {lesson.quiz.options.map((option, index) => (
                  <button
                    type="button"
                    key={option.label}
                    data-selected={selectedAnswer === index}
                    data-correct={selectedAnswer === index ? option.correct : undefined}
                    onClick={() => setAnswers((current) => ({ ...current, [lesson.id]: index }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {answer ? <p data-correct={answer.correct}>{answer.feedback}</p> : null}
            </section>
          </div>

          <footer className={styles.lessonFooter}>
            <button type="button" className={styles.completeButton} data-complete={completed.includes(lesson.id)} onClick={toggleComplete}>
              {completed.includes(lesson.id) ? "✓ Checkpoint complete" : "Mark module complete"}
            </button>
            <div>
              <button type="button" disabled={activeIndex === 0} onClick={() => selectLesson(LESSONS[activeIndex - 1].id)}>← Previous</button>
              <button type="button" disabled={activeIndex === LESSONS.length - 1} onClick={() => selectLesson(LESSONS[activeIndex + 1].id)}>Next module →</button>
            </div>
          </footer>
        </article>
      </div>

      <section className={styles.sources}>
        <div><p className={styles.kicker}>Primary sources behind the course</p><h2>Read past the interface.</h2></div>
        <div className={styles.sourceGrid}>
          <a href="https://github.com/argonautcode/animal-proc-anim" target="_blank" rel="noreferrer"><strong>Argonaut Code</strong><span>Open-source constrained animal animation reference</span></a>
          <a href="https://www.red3d.com/cwr/papers/1999/gdc99steer.pdf" target="_blank" rel="noreferrer"><strong>Craig Reynolds</strong><span>Steering Behaviors for Autonomous Characters</span></a>
          <a href="https://perception.yale.edu/papers/09-Gao-Newman-Scholl-CogPsych.pdf" target="_blank" rel="noreferrer"><strong>Gao, Newman &amp; Scholl</strong><span>The psychophysics of chasing and perceived animacy</span></a>
          <a href="https://www.andreasaristidou.com/publications/papers/FABRIK.pdf" target="_blank" rel="noreferrer"><strong>Aristidou &amp; Lasenby</strong><span>FABRIK inverse-kinematics solver</span></a>
          <a href="https://cs.uef.fi/~radum/vwd/lectures/Jakobsen.pdf" target="_blank" rel="noreferrer"><strong>Thomas Jakobsen</strong><span>Verlet integration and positional constraints</span></a>
          <a href="https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html" target="_blank" rel="noreferrer"><strong>W3C WAI</strong><span>Pause, stop and hide guidance for moving content</span></a>
        </div>
      </section>
    </main>
  );
}
