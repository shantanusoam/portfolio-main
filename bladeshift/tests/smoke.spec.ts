import { expect, test } from '@playwright/test';

test('boots, starts a Classic match, and slicing increases score with no console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Fixed seed makes spawn timing/positions reproducible, so the sweep
  // pattern below isn't at the mercy of random spawn luck.
  await page.goto('/?seed=1234');

  await expect(page.locator('#menu-overlay .bs-title')).toHaveText('BladeShift');
  await page.locator('[data-action="start"]').click();

  await expect(page.locator('#menu-overlay')).toBeHidden();
  await expect(page.locator('canvas')).toBeVisible();

  const canvas = page.locator('canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('canvas has no bounding box');

  // Sweep repeated diagonal strokes across the play field so odds are high
  // we intersect at least one spawned fruit within the sampling window.
  for (let i = 0; i < 14; i++) {
    const startX = box.x + box.width * (0.1 + 0.05 * (i % 5));
    const startY = box.y + box.height * 0.15;
    const endX = box.x + box.width * (0.9 - 0.05 * (i % 5));
    const endY = box.y + box.height * 0.85;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    const steps = 6;
    for (let s = 1; s <= steps; s++) {
      await page.mouse.move(
        startX + ((endX - startX) * s) / steps,
        startY + ((endY - startY) * s) / steps,
        { steps: 1 }
      );
      await page.waitForTimeout(10);
    }
    await page.mouse.up();
    await page.waitForTimeout(150);
  }

  await page.waitForTimeout(500);

  const scoreText = await page.locator('.hud-score').textContent();
  const score = Number(scoreText ?? '0');
  expect(score).toBeGreaterThan(0);

  expect(errors, `console/page errors: ${errors.join('\n')}`).toEqual([]);
});
