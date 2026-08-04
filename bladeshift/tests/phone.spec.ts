import { expect, test } from '@playwright/test';

test('phone controller pairs via room code and drives real slices through the relay', async ({ browser }) => {
  const errors: string[] = [];

  const desktopContext = await browser.newContext();
  const desktop = await desktopContext.newPage();
  desktop.on('pageerror', (err) => errors.push(`[desktop] ${err}`));
  desktop.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[desktop] ${msg.text()}`);
  });

  // Fixed seed so the phone-driven sweep hits reproducible spawn positions,
  // same reasoning as the pointer smoke test.
  await desktop.goto('/?seed=1234');
  await desktop.locator('[data-input="phone"]').click();

  const roomCodeLocator = desktop.locator('.pairing-room-code');
  await expect(roomCodeLocator).toBeVisible({ timeout: 10_000 });
  const roomCode = (await roomCodeLocator.textContent())?.trim();
  expect(roomCode).toMatch(/^[A-Z0-9]{4}$/);

  const phoneContext = await browser.newContext();
  const phone = await phoneContext.newPage();
  phone.on('pageerror', (err) => errors.push(`[phone] ${err}`));
  phone.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[phone] ${msg.text()}`);
  });

  await phone.goto(`/controller/?room=${roomCode}`);
  await expect(phone.locator('#status')).toHaveText(/Connected/, { timeout: 10_000 });
  await expect(desktop.locator('[data-phone-status]')).toHaveText('Phone connected!', { timeout: 10_000 });

  await desktop.locator('[data-action="start"]').click();
  await expect(desktop.locator('#menu-overlay')).toBeHidden();

  const trackpad = phone.locator('#trackpad');
  const box = await trackpad.boundingBox();
  if (!box) throw new Error('phone trackpad has no bounding box');

  for (let i = 0; i < 14; i++) {
    const startX = box.x + box.width * (0.1 + 0.05 * (i % 5));
    const startY = box.y + box.height * 0.15;
    const endX = box.x + box.width * (0.9 - 0.05 * (i % 5));
    const endY = box.y + box.height * 0.85;

    await phone.mouse.move(startX, startY);
    await phone.mouse.down();
    const steps = 6;
    for (let s = 1; s <= steps; s++) {
      await phone.mouse.move(startX + ((endX - startX) * s) / steps, startY + ((endY - startY) * s) / steps);
      await phone.waitForTimeout(10);
    }
    await phone.mouse.up();
    await phone.waitForTimeout(150);
  }

  await desktop.waitForTimeout(600);
  const scoreText = await desktop.locator('.hud-score').textContent();
  const score = Number(scoreText ?? '0');
  expect(score).toBeGreaterThan(0);

  expect(errors, `console/page errors: ${errors.join('\n')}`).toEqual([]);

  await desktopContext.close();
  await phoneContext.close();
});
