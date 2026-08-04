import { expect, test } from '@playwright/test';

test('webcam mode requests camera, loads the hand-tracking model, and shows a live preview', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.locator('[data-input="camera-hand"]').click();
  await page.locator('[data-action="enable-camera"]').click();

  // Camera permission is auto-granted by the fake-media launch flags, but
  // downloading + initializing the MediaPipe wasm runtime and model over the
  // network can take a few seconds even on a fast connection.
  await expect(page.locator('#webcam-preview')).toBeVisible({ timeout: 20_000 });

  const hasStream = await page.locator('#webcam-preview').evaluate((el: HTMLVideoElement) => el.srcObject !== null);
  expect(hasStream).toBe(true);

  // The fake device feeds a synthetic pattern with no real hand in it, so the
  // adapter should settle into "no hand detected" -- not an error state.
  await expect(page.locator('[data-webcam-status]')).toHaveText(/no hand detected|tracking/, { timeout: 10_000 });

  expect(errors, `console/page errors: ${errors.join('\n')}`).toEqual([]);
});
