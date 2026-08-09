/**
 * Playwright-shaped spec for mobile viewports. See
 * tests/e2e/mascot-motion-lab.spec.ts for why this isn't runnable yet.
 */
import { expect, test } from "@playwright/test";

const VIEWPORTS = [
  { name: "portrait", width: 430, height: 932 },
  { name: "landscape", width: 932, height: 430 },
  { name: "small mobile", width: 360, height: 800 },
];

for (const viewport of VIEWPORTS) {
  test.describe(`mobile - ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height }, hasTouch: true });

    test("no horizontal overflow", async ({ page }) => {
      await page.goto("/");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasOverflow).toBe(false);
    });

    test("hard controls (nav) remain usable", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("navigation")).toBeVisible();
    });

    test("touch/pointer input does not throw", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(1000);
      await page.touchscreen.tap(viewport.width / 2, viewport.height / 2);
    });

    test("resize while running does not crash", async ({ page }) => {
      await page.goto("/motion-lab");
      await page.waitForTimeout(500);
      await page.setViewportSize({ width: viewport.height, height: viewport.width });
      await page.waitForTimeout(300);
      const snapshot = await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.snapshot());
      expect(Number.isFinite(snapshot?.rootPosition?.x)).toBe(true);
    });
  });
}
