/**
 * Playwright-shaped spec for prefers-reduced-motion behavior. See
 * tests/e2e/mascot-motion-lab.spec.ts for why this isn't runnable yet.
 */
import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ colorScheme: "light", reducedMotion: "reduce" });

  test("page remains functional under prefers-reduced-motion", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("motion lab reflects reduced-motion behavior via the debug snapshot", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.waitForTimeout(500);
    const snapshot = await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.snapshot());
    expect(snapshot?.behavior).toBeTruthy();
  });

  test("the accessibility override checkbox updates the running engine", async ({ page }) => {
    await page.goto("/motion-lab");
    await page.getByLabel("Reduced motion override").check();
    await page.waitForTimeout(2000);
    const snapshot = await page.evaluate(() => (window as any).__MASCOT_DEBUG__?.snapshot());
    expect(snapshot?.behavior).toBe("reducedMotion");
  });
});
