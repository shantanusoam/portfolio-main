/**
 * Uniform-bucket spatial index for cached obstacle rectangles. Only worth
 * using once obstacle count justifies it (spec); rebuild() is O(items),
 * called from refresh cycles, never from the animation loop.
 */

export interface SpatialGridConfig {
  cellSize: number;
}

interface SpatialItem {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export class SpatialGrid<T extends SpatialItem> {
  private readonly cellSize: number;
  private cells = new Map<string, T[]>();

  constructor(config: SpatialGridConfig) {
    this.cellSize = Math.max(1, config.cellSize);
  }

  private cellKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  clear(): void {
    this.cells = new Map();
  }

  rebuild(items: readonly T[]): void {
    const cells = new Map<string, T[]>();
    for (const item of items) {
      const minCx = Math.floor(item.left / this.cellSize);
      const maxCx = Math.floor(item.right / this.cellSize);
      const minCy = Math.floor(item.top / this.cellSize);
      const maxCy = Math.floor(item.bottom / this.cellSize);

      for (let cx = minCx; cx <= maxCx; cx += 1) {
        for (let cy = minCy; cy <= maxCy; cy += 1) {
          const key = this.cellKey(cx, cy);
          let bucket = cells.get(key);
          if (!bucket) {
            bucket = [];
            cells.set(key, bucket);
          }
          bucket.push(item);
        }
      }
    }
    this.cells = cells;
  }

  queryNearby(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const seen = new Set<string>();

    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCy = Math.floor((y - radius) / this.cellSize);
    const maxCy = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx += 1) {
      for (let cy = minCy; cy <= maxCy; cy += 1) {
        const bucket = this.cells.get(this.cellKey(cx, cy));
        if (!bucket) continue;
        for (const item of bucket) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            results.push(item);
          }
        }
      }
    }

    return results;
  }
}
