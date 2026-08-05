import { expect, test } from '@playwright/test';

test('tilt mode: orientation moves the cursor and holding the button cuts', async ({ browser }) => {
  const errors: string[] = [];

  const desktopContext = await browser.newContext();
  const desktop = await desktopContext.newPage();
  desktop.on('pageerror', (err) => errors.push(`[desktop] ${err}`));
  desktop.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[desktop] ${msg.text()}`);
  });

  await desktop.goto('/?seed=99');
  // Zen mode: continuous tilting hunting for a hit shouldn't be cut short by
  // Classic's 3-miss game over, same reasoning as the sword mode test.
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

  await phone.locator('[data-mode="tilt"]').click();
  await expect(phone.locator('#trackpad')).toHaveClass(/tilt-mode/);
  await expect(phone.locator('#hold-to-cut')).toBeVisible();

  const dispatchOrientation = (beta: number, gamma: number) =>
    phone.evaluate(
      ({ beta, gamma }) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta, gamma, alpha: 0 })),
      { beta, gamma }
    );

  // Calibration now averages over a ~250ms window (a single noisy sample was
  // the "recalibrating issues" bug report) rather than trusting one reading,
  // so it needs several samples spanning that window, not just one.
  async function holdOrientation(beta: number, gamma: number, samples: number, gapMs: number): Promise<void> {
    for (let i = 0; i < samples; i++) {
      await dispatchOrientation(beta, gamma);
      await phone.waitForTimeout(gapMs);
    }
  }

  await holdOrientation(0, 0, 10, 30); // ~300ms of near-zero samples calibrates neutral
  const centeredLeft = await phone.locator('#crosshair').evaluate((el) => el.style.left);

  // Drift-correction alone (no gyro events) should still visibly move the
  // cursor toward wherever the phone is actually pointed -- proving this is
  // continuous tracking, not a one-shot burst like sword mode.
  await holdOrientation(20, 25, 10, 20);
  const movedLeft = await phone.locator('#crosshair').evaluate((el) => el.style.left);
  expect(movedLeft).not.toBe(centeredLeft);

  // Hold the cut button while sweeping orientation across a grid. Each point
  // gets enough repeated samples for the complementary filter's drift
  // correction to actually converge close to that target, not just nudge
  // toward it once.
  const holdBtn = phone.locator('#hold-to-cut');
  const box = await holdBtn.boundingBox();
  if (!box) throw new Error('hold-to-cut button has no bounding box');
  await phone.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await phone.mouse.down();

  const betas = [-30, -15, 0, 15, 30];
  const gammas = [-30, -15, 0, 15, 30];
  for (const beta of betas) {
    for (const gamma of gammas) {
      await holdOrientation(beta, gamma, 18, 16);
    }
  }
  await phone.mouse.up();

  await desktop.waitForTimeout(500);
  const scoreText = await desktop.locator('.hud-score').textContent();
  const score = Number(scoreText ?? '0');
  expect(score).toBeGreaterThan(0);

  expect(errors, `console/page errors: ${errors.join('\n')}`).toEqual([]);

  await desktopContext.close();
  await phoneContext.close();
});
