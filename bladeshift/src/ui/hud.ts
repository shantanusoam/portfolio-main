import type Phaser from 'phaser';
import type { InputRouter } from '../input/InputRouter';

export interface HudCallbacks {
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

/** Listens on the persistent game.events bus (not a per-scene emitter) so it
 * survives GameScene restarts without needing to be recreated each match. */
export function attachHud(root: HTMLElement, game: Phaser.Game, router: InputRouter, callbacks: HudCallbacks) {
  const hudTop = document.createElement('div');
  hudTop.className = 'hud-top';
  hudTop.innerHTML = `
    <div class="hud-score">0</div>
    <div class="hud-lives"></div>
  `;
  const scoreEl = hudTop.querySelector('.hud-score') as HTMLElement;
  const livesEl = hudTop.querySelector('.hud-lives') as HTMLElement;

  const comboEl = document.createElement('div');
  comboEl.className = 'hud-combo';

  const debugToggle = document.createElement('button');
  debugToggle.className = 'debug-toggle';
  debugToggle.textContent = 'debug (`)';

  const debugPanel = document.createElement('div');
  debugPanel.className = 'debug-panel hidden';

  const gameOverOverlay = document.createElement('div');
  gameOverOverlay.id = 'gameover-overlay';
  gameOverOverlay.className = 'overlay hidden';
  gameOverOverlay.innerHTML = `
    <h1 class="bs-title">Sliced!</h1>
    <div class="bs-stats">
      <div>Score<b class="go-score">0</b></div>
      <div>Best combo<b class="go-combo">0</b></div>
    </div>
    <div class="bs-row">
      <button class="bs-btn primary" data-action="again">Play Again</button>
      <button class="bs-btn" data-action="menu">Menu</button>
    </div>
  `;

  root.append(hudTop, comboEl, debugPanel, debugToggle, gameOverOverlay);

  let comboFadeTimer: number | undefined;
  let lives = 3;
  let mode: 'classic' | 'zen' = 'classic';

  function renderLives(): void {
    livesEl.innerHTML = '';
    if (mode === 'zen') return;
    for (let i = 0; i < 3; i++) {
      const heart = document.createElement('span');
      heart.className = 'hud-life' + (i < lives ? '' : ' lost');
      heart.textContent = '♥';
      livesEl.appendChild(heart);
    }
  }

  game.events.on('hud:ready', (data: { mode: 'classic' | 'zen'; lives: number; seed: number }) => {
    mode = data.mode;
    lives = data.lives;
    scoreEl.textContent = '0';
    comboEl.classList.remove('show');
    gameOverOverlay.classList.add('hidden');
    renderLives();
  });

  game.events.on('hud:score', (data: { score: number; gained: number; combo: number; comboBroken: boolean; lives: number }) => {
    scoreEl.textContent = String(data.score);
    lives = data.lives;
    renderLives();
    if (data.combo > 1) {
      comboEl.textContent = `${data.combo}x combo  +${data.gained}`;
      comboEl.classList.add('show');
      window.clearTimeout(comboFadeTimer);
      comboFadeTimer = window.setTimeout(() => comboEl.classList.remove('show'), 700);
    }
  });

  game.events.on('hud:lives', (data: { lives: number }) => {
    lives = data.lives;
    renderLives();
  });

  game.events.on('hud:gameover', (data: { score: number; bestCombo: number }) => {
    (gameOverOverlay.querySelector('.go-score') as HTMLElement).textContent = String(data.score);
    (gameOverOverlay.querySelector('.go-combo') as HTMLElement).textContent = String(data.bestCombo);
    gameOverOverlay.classList.remove('hidden');
  });

  gameOverOverlay.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).dataset.action;
    if (action === 'again') callbacks.onPlayAgain();
    if (action === 'menu') callbacks.onBackToMenu();
  });

  let debugVisible = false;
  function setDebugVisible(v: boolean): void {
    debugVisible = v;
    debugPanel.classList.toggle('hidden', !v);
  }
  debugToggle.addEventListener('click', () => setDebugVisible(!debugVisible));
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === '`') setDebugVisible(!debugVisible);
  };
  window.addEventListener('keydown', keyHandler);

  let rafId = 0;
  function tickDebug(): void {
    if (debugVisible) {
      const statuses = router.getStatuses();
      const lines = Object.entries(statuses).map(([source, status]) => {
        const dot = status?.connected ? '●' : '○';
        return `${dot} <b>${source}</b> ${status?.label ?? ''}${status?.detail ? ` — ${status.detail}` : ''}`;
      });
      debugPanel.innerHTML = lines.join('<br/>') || 'no adapters registered';
    }
    rafId = requestAnimationFrame(tickDebug);
  }
  tickDebug();

  return {
    destroy(): void {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', keyHandler);
      hudTop.remove();
      comboEl.remove();
      debugPanel.remove();
      debugToggle.remove();
      gameOverOverlay.remove();
    }
  };
}
