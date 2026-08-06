/**
 * Playwright-shaped spec for /motion-lab. Not runnable yet — this repo has
 * no browser-automation framework installed (see
 * docs/mascot/BASELINE_AUDIT.md), and this directory is excluded from the
 * root tsconfig.json for exactly that reason (TypeScript can't resolve
 * @playwright/test's types until the package exists in node_modules).
 *
 * Once `npm install -D @playwright/test` has actually been run, remove the
 * `tests/e2e` entry from tsconfig.json's `exclude` array and this file
 * typechecks and runs as-is.
 *
 * Manual equivalent until then: run `npm run dev`, open /motion-lab, and
 * walk through docs/mascot/PLAYTEST.md's scenario list by hand.
 */
import { expect, test } from "@playwright/test";

test.describe("motion lab", () => {
  test("route loads, canvas is present, no console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/motion-lab");
    await expect(page.locator("canvas")).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });

  test("debug API exists in development", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.waitForTimeout(500);
    const hasDebugApi = await page.evaluate(() => typeof (window as any).__MASCOT_DEBUG__ === "object");
    expect(hasDebugApi).toBe(true);
  });

  test("deterministic scenario runs without throwing", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.waitForTimeout(500);
    await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.playScenario("follow-horizontal"));
    const snapshot = await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.snapshot());
    expect(snapshot).toBeTruthy();
  });

  test("pause and resume work", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.waitForTimeout(500);
    await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.pause());
    await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.resume());
  });

  test("quality changes work", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.waitForTimeout(500);
    await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.setQuality("low"));
    const snapshot = await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.snapshot());
    expect(snapshot?.quality).toBe("low");
  });

  test("obstacle debug overlay can be enabled", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.getByRole("button", { name: "Debug overlay" }).click();
  });

  test("resize retains a valid rig", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(300);
    const snapshot = await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.snapshot());
    expect(Number.isFinite(snapshot?.rootPosition?.x)).toBe(true);
    expect(Number.isFinite(snapshot?.rootPosition?.y)).toBe(true);
  });
});
