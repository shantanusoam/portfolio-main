import type { FlyingEntity } from './GameState';

const MIN_BLADE_SPEED = 0.35; // normalized units/sec (viewport-relative) required to register a cut

export interface BladeSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dtSeconds: number;
}

export interface SliceHit {
  entity: FlyingEntity;
  /** Unit vector perpendicular to the blade's travel direction, used to separate the two halves. */
  normal: { x: number; y: number };
  bladeAngle: number;
  bladeSpeed: number;
}

/** Shortest distance from a point to a line segment. */
function pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

export class SliceSystem {
  /** Tests one blade stroke segment (world px) against all live entities and returns every hit. */
  testSegment(segment: BladeSegment, entities: readonly FlyingEntity[]): SliceHit[] {
    const dx = segment.x2 - segment.x1;
    const dy = segment.y2 - segment.y1;
    const travelLength = Math.hypot(dx, dy);
    if (travelLength === 0 || segment.dtSeconds <= 0) return [];

    const speed = travelLength / segment.dtSeconds;

    const hits: SliceHit[] = [];
    for (const entity of entities) {
      if (entity.sliced) continue;
      const dist = pointToSegmentDistance(entity.x, entity.y, segment.x1, segment.y1, segment.x2, segment.y2);
      if (dist > entity.radius) continue;

      hits.push({
        entity,
        normal: { x: -dy / travelLength, y: dx / travelLength },
        bladeAngle: Math.atan2(dy, dx),
        bladeSpeed: speed
      });
    }
    return hits;
  }

  meetsMinimumSpeed(normalizedSpeed: number): boolean {
    return normalizedSpeed >= MIN_BLADE_SPEED;
  }
}
