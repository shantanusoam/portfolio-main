import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MOBILE_STRING_CONTACT_MAX_WIDTH,
  shouldDisableMascotStringContacts,
} from "@/lib/mascot/input/MobileStringContacts";

test("narrow viewports disable mascot string contacts", () => {
  assert.equal(shouldDisableMascotStringContacts(360, () => ({ matches: false } as MediaQueryList)), true);
  assert.equal(
    shouldDisableMascotStringContacts(MOBILE_STRING_CONTACT_MAX_WIDTH, () => ({
      matches: false,
    } as MediaQueryList)),
    true,
  );
});

test("wide desktop viewports keep mascot string contacts on", () => {
  assert.equal(
    shouldDisableMascotStringContacts(1280, () => ({ matches: false } as MediaQueryList)),
    false,
  );
});

test("touch-primary media query disables contacts even on a wide canvas", () => {
  assert.equal(
    shouldDisableMascotStringContacts(1024, () => ({ matches: true } as MediaQueryList)),
    true,
  );
});

test("missing matchMedia falls back to width only", () => {
  assert.equal(shouldDisableMascotStringContacts(900, null), false);
  assert.equal(shouldDisableMascotStringContacts(500, null), true);
});
