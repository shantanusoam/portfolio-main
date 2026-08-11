import type {
  CharacterKinematics,
  CharacterPose,
  CharacterSpec,
} from "../types";
import { clamp } from "../math/Vec2";

interface SpringValue {
  value: number;
  velocity: number;
}

function updateSpring(
  spring: SpringValue,
  target: number,
  frequency: number,
  damping: number,
  dt: number,
): void {
  const angularFrequency = Math.PI * 2 * frequency;
  const acceleration =
    angularFrequency * angularFrequency * (target - spring.value) -
    2 * damping * angularFrequency * spring.velocity;
  spring.velocity += acceleration * dt;
  spring.value += spring.velocity * dt;
}

function deterministicUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Turns physical measurements into continuously blended expression signals.
 * It contains no named animation clips or renderer-specific decisions.
 */
export class PersonalityController {
  readonly pose: CharacterPose = {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    eyeOpen: 1,
    breathingOffset: 0,
    impact: 0,
    wobble: 0,
  };

  private readonly scaleX: SpringValue = { value: 1, velocity: 0 };
  private readonly scaleY: SpringValue = { value: 1, velocity: 0 };
  private readonly rotation: SpringValue = { value: 0, velocity: 0 };
  private impact = 0;
  private blinkElapsed = 0;
  private blinkInterval: number;
  private blinkCount = 0;

  constructor(private readonly seed: number) {
    this.blinkInterval = 3 + deterministicUnit(seed) * 2;
  }

  reactToLanding(strength: number, direction: number): void {
    const impulse = clamp(strength, 0.08, 1);
    this.impact = Math.max(this.impact, impulse);
    this.rotation.velocity += clamp(direction, -1, 1) * impulse * 3.8;
  }

  update(
    dt: number,
    elapsedTime: number,
    body: CharacterKinematics,
    spec: CharacterSpec,
    activeSteps: number,
    reducedMotion: boolean,
  ): void {
    const motionScale = reducedMotion ? 0.25 : 1;
    const horizontalSpeed =
      Math.abs(body.velocity.x) / Math.max(1, spec.dynamics.maxSpeed);
    const verticalSpeed =
      Math.abs(body.velocity.y) / Math.max(1, spec.dynamics.maxSpeed);
    const acceleration = Math.hypot(body.acceleration.x, body.acceleration.y);
    const accelerationSignal = clamp(
      acceleration / Math.max(1, spec.dynamics.maxAcceleration),
      0,
      1,
    );
    const velocityLength = Math.max(1, body.speed);
    const braking = clamp(
      -(
        body.acceleration.x * body.velocity.x +
        body.acceleration.y * body.velocity.y
      ) /
        velocityLength /
        Math.max(1, spec.dynamics.maxAcceleration),
      0,
      1,
    );
    const elasticity = spec.personality.elasticity * motionScale;
    const stepEnergy = clamp(activeSteps / 3, 0, 1);

    const targetScaleX =
      1 +
      horizontalSpeed * 0.2 * elasticity -
      verticalSpeed * 0.055 * elasticity +
      this.impact * 0.24 * elasticity -
      braking * 0.07 * elasticity;
    const targetScaleY =
      1 +
      verticalSpeed * 0.2 * elasticity -
      horizontalSpeed * 0.07 * elasticity -
      this.impact * 0.2 * elasticity +
      accelerationSignal * 0.025 * elasticity;

    updateSpring(this.scaleX, targetScaleX, 5.8, 0.48, dt);
    updateSpring(this.scaleY, targetScaleY, 5.2, 0.5, dt);
    updateSpring(
      this.rotation,
      body.facingAngle,
      4.4,
      0.45 + spec.personality.confidence * 0.18,
      dt,
    );

    this.impact *= Math.exp(-dt * 8.5);
    const blinkDuration = Math.max(0.04, spec.eyes.blink.duration);
    this.blinkElapsed += dt;
    const blinkTime = this.blinkElapsed - this.blinkInterval;
    const blink =
      blinkTime >= 0 && blinkTime < blinkDuration
        ? Math.sin((blinkTime / blinkDuration) * Math.PI) * motionScale
        : 0;
    if (blinkTime >= blinkDuration) {
      this.blinkElapsed = 0;
      this.blinkCount += 1;
      const range =
        spec.eyes.blink.maximumInterval - spec.eyes.blink.minimumInterval;
      this.blinkInterval =
        spec.eyes.blink.minimumInterval +
        deterministicUnit(this.seed + this.blinkCount * 71) *
          Math.max(0, range);
    }
    const speedSquint =
      clamp(
        horizontalSpeed * 0.2 + Math.max(0, -body.velocity.y) / 1800,
        0,
        0.28,
      ) * motionScale;
    const breathing =
      Math.sin(elapsedTime * Math.PI * 2 * spec.idle.breathingFrequency) *
      spec.idle.breathingAmount *
      (1 - body.normalizedSpeed) *
      motionScale;

    this.pose.scaleX = clamp(this.scaleX.value + breathing, 0.72, 1.38);
    this.pose.scaleY = clamp(this.scaleY.value - breathing * 0.65, 0.7, 1.4);
    this.pose.rotation = this.rotation.value;
    this.pose.eyeOpen = clamp(1 - blink - speedSquint, 0.05, 1);
    this.pose.breathingOffset = breathing;
    this.pose.impact = this.impact;
    this.pose.wobble =
      clamp(this.rotation.velocity * 0.08, -0.25, 0.25) +
      Math.sin(elapsedTime * 5.4) * stepEnergy * 0.012 * motionScale;
  }
}
