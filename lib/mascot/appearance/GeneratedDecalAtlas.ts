/**
 * Loads one runtime decal atlas (a packed WebP sprite sheet + JSON sprite
 * rects, built by `scripts/mascot/build_visual_atlas.py`) and exposes its
 * sprites for `ProceduralPrint.ts` to draw as body-local decals — the
 * spec's "central requirement": generated art is never pasted in world
 * space, only ever as a sub-rect drawn at a `resolveLocalPoint`-resolved
 * position.
 *
 * Browser-only, fully async, and never blocks rendering: `isReady()` is
 * false until both the manifest and the image have finished loading, and
 * every caller treats "not ready yet" as "skip this frame's generated
 * decals, fall back to the existing procedural marks" — never a loading
 * spinner, never a layout shift, matches this codebase's "pause on
 * anything not ready" convention elsewhere (VisibilityController, etc.).
 */

export interface AtlasSpriteRect {
  id: string;
  sourceSheet: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AtlasManifest {
  atlasWidth: number;
  atlasHeight: number;
  sprites: AtlasSpriteRect[];
}

function isAtlasManifest(value: unknown): value is AtlasManifest {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Array.isArray(record.sprites);
}

export class GeneratedDecalAtlas {
  private image: HTMLImageElement | null = null;
  private manifest: AtlasManifest | null = null;
  private failed = false;
  private readonly bySheet = new Map<string, AtlasSpriteRect[]>();
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /** Fire-and-forget — safe to call once from a constructor; never throws. */
  load(): void {
    if (typeof window === "undefined" || typeof fetch !== "function") return;

    fetch(`${this.baseUrl}.json`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((json: unknown) => {
        if (!isAtlasManifest(json)) throw new Error("malformed atlas manifest");
        this.manifest = json;
        this.indexSprites(json.sprites);
      })
      .catch(() => {
        this.failed = true;
      });

    const image = new Image();
    image.onload = () => {
      this.image = image;
    };
    image.onerror = () => {
      this.failed = true;
    };
    image.src = `${this.baseUrl}.webp`;
  }

  private indexSprites(sprites: readonly AtlasSpriteRect[]): void {
    for (const sprite of sprites) {
      const bucket = this.bySheet.get(sprite.sourceSheet);
      if (bucket) bucket.push(sprite);
      else this.bySheet.set(sprite.sourceSheet, [sprite]);
    }
  }

  isReady(): boolean {
    return !this.failed && this.image !== null && this.manifest !== null;
  }

  getImage(): HTMLImageElement | null {
    return this.image;
  }

  /** Sprites belonging to one source sheet (e.g. "terrazzo-decals"). */
  getSpritesForSheet(sheetName: string): readonly AtlasSpriteRect[] {
    return this.bySheet.get(sheetName) ?? [];
  }
}
