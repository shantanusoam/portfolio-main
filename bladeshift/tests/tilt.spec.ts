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

  // First orientation sample calibrates neutral; verify the crosshair then
  // actually moves as beta/gamma deviate from that neutral, proving this is
  // continuous tracking and not a one-shot burst like sword mode.
  const dispatchOrientation = (beta: number, gamma: number) =>
    phone.evaluate(
      ({ beta, gamma }) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta, gamma, alpha: 0 })),
      { beta, gamma }
    );

  await dispatchOrientation(0, 0); // calibrates neutral at (0, 0)
  await phone.waitForTimeout(50);
  const centeredLeft = await phone.locator('#crosshair').evaluate((el) => el.style.left);

  await dispatchOrientation(20, 25);
  await phone.waitForTimeout(50);
  const movedLeft = await phone.locator('#crosshair').evaluate((el) => el.style.left);
  expect(movedLeft).not.toBe(centeredLeft);

  // Hold the cut button while sweeping orientation across a grid, same
  // density reasoning as the sword test but continuous instead of discrete.
  const holdBtn = phone.locator('#hold-to-cut');
  const box = await holdBtn.boundingBox();
  if (!box) throw new Error('hold-to-cut button has no bounding box');
  await phone.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await phone.mouse.down();

  // Sweep for several seconds, not just a couple hundred ms -- the first
  // fruit doesn't spawn until ~1.4s in, so a too-fast sweep can finish
  // before there's anything on screen to hit at all.
  const betas = [-30, -15, 0, 15, 30];
  const gammas = [-30, -15, 0, 15, 30];
  for (let lap = 0; lap < 2; lap++) {
    for (const beta of betas) {
      for (const gamma of gammas) {
        await dispatchOrientation(beta, gamma);
        await phone.waitForTimeout(160);
      }
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
