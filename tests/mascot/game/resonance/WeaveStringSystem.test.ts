import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  WeaveStringSystem,
  resetWeaveStringIdsForTests,
} from "@/lib/mascot/game/resonance/WeaveStringSystem";
import { WEAVER_CONFIG } from "@/lib/mascot/game/resonance/WeaverConfig";

describe("WeaveStringSystem", () => {
  it("commits a valid preview string", () => {
    resetWeaveStringIdsForTests();
    const sys = new WeaveStringSystem({ maxActive: 3 });
    sys.beginPreview(0, 0);
    sys.updatePreview(120, 0);
    const woven = sys.commitPreview();
    assert.ok(woven);
    assert.equal(sys.getActiveCount(), 1);
    assert.ok(woven.frequency > 0);
  });

  it("rejects too-short weaves", () => {
    const sys = new WeaveStringSystem();
    sys.beginPreview(0, 0);
    sys.updatePreview(10, 0);
    assert.equal(sys.commitPreview(), null);
  });

  it("caps active strings", () => {
    const sys = new WeaveStringSystem({ maxActive: 2 });
    assert.ok(sys.createString(0, 0, 100, 0));
    assert.ok(sys.createString(0, 20, 100, 20));
    assert.equal(sys.createString(0, 40, 100, 40), null);
    assert.ok(sys.getActiveCount() <= WEAVER_CONFIG.maxActiveStrings);
  });

  it("expires strings over lifetime", () => {
    const sys = new WeaveStringSystem({ lifetime: 0.5 });
    sys.createString(0, 0, 100, 0);
    sys.update(0.6);
    assert.equal(sys.getActiveCount(), 0);
  });
});
