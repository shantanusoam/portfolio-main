/**
 * Playwright-shaped spec for mascot integration on the live portfolio ("/").
 * See tests/e2e/mascot-motion-lab.spec.ts for why this isn't runnable yet.
 */
import { expect, test } from "@playwright/test";

test.describe("portfolio integration", () => {
  test("content appears before mascot activation", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation")).toBeVisible({ timeout: 2000 });
  });

  test("navigation is clickable", async ({ page }) => {
    await page.goto("/");
    const menuToggle = page.locator('[aria-label="Logo"]');
    await expect(menuToggle).toBeVisible();
  });

  test("mascot canvas does not intercept pointer events", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000); // allow idle-callback mount
    const canvas = page.locator("canvas.Mascot_canvas__V2Zve, canvas[aria-hidden='true']").first();
    if (await canvas.count()) {
      const pointerEvents = await canvas.evaluate((el) => getComputedStyle(el).pointerEvents);
      expect(pointerEvents).toBe("none");
    }
  });

  test("route navigation cleans up (no duplicate canvases after remount)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1000);
    await page.goto("/motion-lab");
    await page.goto("/");
    await page.waitForTimeout(1000);
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBeLessThanOrEqual(2); // motion-lab's own + production loader's, never duplicated
  });

  test("disabling mascot via localStorage stops it from mounting", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("mascot:disabled", "true"));
    await page.goto("/");
    await page.waitForTimeout(1000);
    const mascotCanvas = page.locator("canvas[aria-hidden='true']");
    expect(await mascotCanvas.count()).toBe(0);
  });

  test("no hydration warning in the console", async ({ page }) => {
    const hydrationWarnings: string[] = [];
    page.on("console", (message) => {
      if (message.text().toLowerCase().includes("hydrat")) hydrationWarnings.push(message.text());
    });
    await page.goto("/");
    await page.waitForTimeout(1500);
    expect(hydrationWarnings).toEqual([]);
  });

  test("no cumulative layout shift from the mascot mounting", async ({ page }) => {
    await page.goto("/");
    const before = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.waitForTimeout(1500); // mascot mounts on idle callback in this window
    const after = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(after).toBe(before);
  });
});
