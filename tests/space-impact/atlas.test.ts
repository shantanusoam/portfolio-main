import assert from "node:assert/strict";
import test from "node:test";
import { getAtlas } from "../../lib/space-impact/pocket/atlas";
import {
  MINT_PALETTE,
  PHOSPHOR_PALETTE,
  POCKET_PALETTE,
  toneRGB,
} from "../../lib/space-impact/pocket/palette";
// Inspect the bytes actually baked by the atlas; this is not browser evidence.
class PixelCanvas {
  width = 0;
  height = 0;
  pixels = new Uint8ClampedArray();
  getContext() {
    return {
      createImageData: (w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
      }),
      putImageData: (image: { data: Uint8ClampedArray }) => {
        this.pixels = image.data;
      },
      fillRect: () => undefined,
      fillStyle: "",
    };
  }
}
test("sprite pixels follow every selected palette, including emissive CRT cores", (t) => {
  const old = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    value: { createElement: () => new PixelCanvas() },
    configurable: true,
  });
  t.after(() => {
    if (old) Object.defineProperty(globalThis, "document", old);
    else Reflect.deleteProperty(globalThis, "document");
  });
  const colors = [POCKET_PALETTE, MINT_PALETTE, PHOSPHOR_PALETTE];
  (["olive", "mint", "phosphor"] as const).forEach((name, index) => {
    const atlas = getAtlas(name);
    const canvas = atlas.shipIdle[0].canvas as unknown as PixelCanvas;
    const seen = new Set<string>();
    for (let i = 0; i < canvas.pixels.length; i += 4)
      if (canvas.pixels[i + 3])
        seen.add(Array.from(canvas.pixels.slice(i, i + 3)).join(","));
    assert.ok(seen.has(toneRGB(colors[index][1]).join(",")));
    const allowed = new Set(
      Object.values(colors[index]).map((hex) => toneRGB(hex).join(",")),
    );
    assert.ok(Array.from(seen).every((color) => allowed.has(color)));
    assert.equal(getAtlas(name), atlas);
  });
});
