import type { GameMode } from '../sim/GameState';

export interface MenuCallbacks {
  onStart: (mode: GameMode) => void;
}

export function attachMenu(root: HTMLElement, callbacks: MenuCallbacks) {
  const el = document.createElement('div');
  el.id = 'menu-overlay';
  el.className = 'overlay';
  el.innerHTML = `
    <h1 class="bs-title">BladeShift</h1>
    <p class="bs-subtitle">Any movement can become a blade. Swipe, drag, or grab a controller and start slicing.</p>

    <div class="bs-section-label">Mode</div>
    <div class="bs-row" data-group="mode">
      <button class="bs-btn selected" data-mode="classic">Classic — 3 lives, bombs end the run</button>
      <button class="bs-btn" data-mode="zen">Zen — no bombs, endless</button>
    </div>

    <div class="bs-section-label">Controls</div>
    <div class="bs-row">
      <span class="bs-btn selected" style="cursor:default">Touch / Mouse</span>
      <span class="bs-btn" data-gamepad-status style="cursor:default">Gamepad — not detected</span>
      <span class="bs-btn disabled-hint" style="cursor:default;opacity:.35">Webcam — coming soon</span>
      <span class="bs-btn disabled-hint" style="cursor:default;opacity:.35">Phone — coming soon</span>
    </div>

    <button class="bs-btn primary" data-action="start" style="margin-top:14px">Start Slicing</button>
    <p class="bs-subtitle" style="font-size:.75rem;opacity:.5">Press \` any time in-game to see live input debug info.</p>
  `;
  root.appendChild(el);

  let mode: GameMode = 'classic';

  el.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode as GameMode;
      el.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  el.querySelector('[data-action="start"]')!.addEventListener('click', () => {
    callbacks.onStart(mode);
  });

  const gamepadStatus = el.querySelector('[data-gamepad-status]') as HTMLElement;
  function refreshGamepad(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const connected = Array.from(pads).some((p) => p && p.connected);
    gamepadStatus.textContent = connected ? 'Gamepad — connected' : 'Gamepad — not detected';
    gamepadStatus.classList.toggle('selected', connected);
  }
  window.addEventListener('gamepadconnected', refreshGamepad);
  window.addEventListener('gamepaddisconnected', refreshGamepad);
  refreshGamepad();

  return {
    show(): void {
      el.classList.remove('hidden');
    },
    hide(): void {
      el.classList.add('hidden');
    },
    destroy(): void {
      window.removeEventListener('gamepadconnected', refreshGamepad);
      window.removeEventListener('gamepaddisconnected', refreshGamepad);
      el.remove();
    }
  };
}
