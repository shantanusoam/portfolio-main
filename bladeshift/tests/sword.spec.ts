import { expect, test } from '@playwright/test';

test('sword mode: aiming plus a device-motion swing produces a real slice', async ({ browser }) => {
  const errors: string[] = [];

  const desktopContext = await browser.newContext();
  const desktop = await desktopContext.newPage();
  desktop.on('pageerror', (err) => errors.push(`[desktop] ${err}`));
  desktop.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[desktop] ${msg.text()}`);
  });

  await desktop.goto('/?seed=4242');
  // Zen mode: no lives/bombs, so a string of missed fruits while the grid
  // sweep is still hunting for a hit can't end the run out from under it.
  await desktop.locator('[data-mode="zen"]').click();
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

  // Switch the controller into sword mode: touch now only aims, swings cut.
  await phone.locator('[data-mode="sword"]').click();
  await expect(phone.locator('#trackpad')).toHaveClass(/sword-mode/);

  const trackpad = phone.locator('#trackpad');
  const box = await trackpad.boundingBox();
  if (!box) throw new Error('phone trackpad has no bounding box');

  // A swing only slashes a short ~0.1-0.44 (normalized) segment, unlike the
  // pointer/trackpad tests which drag a continuous line across most of the
  // screen -- so this needs denser, systematic grid coverage rather than a
  // handful of scattered points to reliably intersect a spawned fruit.
  const cols = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9];
  const rows = [0.2, 0.35, 0.5, 0.65, 0.8];
  const points = rows.flatMap((row) => cols.map((col) => ({ col, row })));

  for (let i = 0; i < points.length; i++) {
    const { col, row } = points[i];
    // Aim (touch only -- must not itself register as a cut in sword mode).
    const ax = box.x + box.width * col;
    const ay = box.y + box.height * row;
    await phone.mouse.move(ax, ay);
    await phone.mouse.down();
    await phone.mouse.move(ax, ay + 4);
    await phone.mouse.up();
    await phone.waitForTimeout(20);

    // Simulate a real "swing" via a synthetic DeviceMotionEvent -- Chromium
    // has no real gyro in CI, but the handler only reads rotationRate off
    // the event object, so a constructed event exercises the exact same code
    // path a real swing would.
    const dir = i % 2 === 0 ? 1 : -1;
    await phone.evaluate((direction) => {
      window.dispatchEvent(
        new DeviceMotionEvent('devicemotion', {
          rotationRate: { alpha: 0, beta: 320 * direction, gamma: 260 },
          interval: 16
        })
      );
    }, dir);

    // Must clear the controller's own swing cooldown (350ms) or this
    // attempt gets silently ignored as a re-trigger of the same swing.
    await phone.waitForTimeout(420);
  }

  await desktop.waitForTimeout(600);
  const scoreText = await desktop.locator('.hud-score').textContent();
  const score = Number(scoreText ?? '0');
  expect(score).toBeGreaterThan(0);

  expect(errors, `console/page errors: ${errors.join('\n')}`).toEqual([]);

  await desktopContext.close();
  await phoneContext.close();
});
