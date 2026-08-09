import QRCode from 'qrcode';
import type { CameraHandAdapter } from '../input/CameraHandAdapter';
import type { InputRouter } from '../input/InputRouter';
import type { InputSource } from '../input/InputAdapter';
import type { PhoneAdapter } from '../input/PhoneAdapter';
import type { GameMode } from '../sim/GameState';

export interface MenuCallbacks {
  onStart: (mode: GameMode) => void;
}

export interface MenuDeps {
  router: InputRouter;
  cameraAdapter: CameraHandAdapter;
  phoneAdapter: PhoneAdapter;
}

function controllerUrl(roomCode: string): string {
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${window.location.hostname}${port}/controller/?room=${roomCode}`;
}

export function attachMenu(root: HTMLElement, deps: MenuDeps, callbacks: MenuCallbacks) {
  const { router, cameraAdapter, phoneAdapter } = deps;

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
    <div class="bs-row" data-group="input">
      <button class="bs-btn selected" data-input="pointer">Touch / Mouse</button>
      <button class="bs-btn" data-input="gamepad" data-gamepad-status>Gamepad — not detected</button>
      <button class="bs-btn" data-input="camera-hand">Webcam</button>
      <button class="bs-btn" data-input="phone">Phone</button>
    </div>

    <div id="pairing-panel" class="pairing-panel hidden"></div>

    <button class="bs-btn primary" data-action="start" style="margin-top:14px">Start Slicing</button>
    <p class="bs-subtitle" style="font-size:.75rem;opacity:.5">Press \` any time in-game to see live input debug info.</p>
  `;
  root.appendChild(el);

  let mode: GameMode = 'classic';
  let selectedInput: InputSource = 'pointer';
  const pairingPanel = el.querySelector('#pairing-panel') as HTMLElement;
  let statusPollId = 0;

  el.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode as GameMode;
      el.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  el.querySelectorAll<HTMLButtonElement>('[data-input]').forEach((btn) => {
    btn.addEventListener('click', () => selectInput(btn.dataset.input as InputSource));
  });

  function selectInput(source: InputSource): void {
    if (source === selectedInput) return;
    // Release the camera / close the phone socket when leaving that mode.
    if (selectedInput === 'camera-hand') router.stop('camera-hand');
    if (selectedInput === 'phone') router.stop('phone');

    selectedInput = source;
    el.querySelectorAll('[data-input]').forEach((b) => b.classList.remove('selected'));
    el.querySelector(`[data-input="${source}"]`)?.classList.add('selected');

    renderPairingPanel(source);
  }

  function renderPairingPanel(source: InputSource): void {
    cancelAnimationFrame(statusPollId);
    if (source === 'camera-hand') {
      pairingPanel.classList.remove('hidden');
      renderWebcamPanel();
    } else if (source === 'phone') {
      pairingPanel.classList.remove('hidden');
      renderPhonePanel();
    } else {
      pairingPanel.classList.add('hidden');
      pairingPanel.innerHTML = '';
    }
  }

  function renderWebcamPanel(): void {
    pairingPanel.innerHTML = `
      <div class="pairing-card">
        <button class="bs-btn primary" data-action="enable-camera">Enable Camera</button>
        <p class="pairing-hint">Pinch your thumb and index finger together to cut.</p>
      </div>
    `;

    pairingPanel.querySelector('[data-action="enable-camera"]')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'Requesting camera…';
      try {
        await router.start('camera-hand');
        showWebcamPreview();
      } catch {
        pairingPanel.innerHTML = `
          <div class="pairing-card pairing-error">
            <p>Camera access was denied or unavailable.</p>
            <p class="pairing-hint">You can still play with Touch / Mouse -- select it above.</p>
            <button class="bs-btn" data-action="enable-camera">Try Again</button>
          </div>
        `;
        pairingPanel.querySelector('[data-action="enable-camera"]')?.addEventListener('click', () => renderWebcamPanel(), {
          once: true
        });
      }
    });
  }

  function showWebcamPreview(): void {
    pairingPanel.innerHTML = `
      <div class="pairing-card">
        <video id="webcam-preview" autoplay muted playsinline></video>
        <p class="pairing-hint" data-webcam-status>Tracking…</p>
      </div>
    `;
    const video = pairingPanel.querySelector('#webcam-preview') as HTMLVideoElement;
    video.srcObject = cameraAdapter.getStream();
    const statusEl = pairingPanel.querySelector('[data-webcam-status]') as HTMLElement;

    const poll = () => {
      const status = cameraAdapter.getStatus();
      statusEl.textContent = status.detail ?? '';
      statusPollId = requestAnimationFrame(poll);
    };
    poll();
  }

  function renderPhonePanel(): void {
    pairingPanel.innerHTML = `<div class="pairing-card"><p class="pairing-hint">Generating room code…</p></div>`;

    phoneAdapter.onRoomCode = (roomCode) => renderQr(roomCode);

    router.start('phone')?.catch(() => {
      pairingPanel.innerHTML = `
        <div class="pairing-card pairing-error">
          <p>Couldn't reach the relay server.</p>
          <p class="pairing-hint">Run <code>pnpm relay</code> alongside the game, then try again.</p>
          <button class="bs-btn" data-action="retry-phone">Retry</button>
        </div>
      `;
      pairingPanel.querySelector('[data-action="retry-phone"]')?.addEventListener('click', () => renderPhonePanel(), {
        once: true
      });
    });

    const existingRoom = phoneAdapter.getRoomCode();
    if (existingRoom) renderQr(existingRoom);
  }

  function renderQr(roomCode: string): void {
    pairingPanel.innerHTML = `
      <div class="pairing-card">
        <canvas id="qr-canvas"></canvas>
        <p class="pairing-room-code">${roomCode}</p>
        <p class="pairing-hint" data-phone-status>Scan with your phone's camera, or visit the controller URL and enter the code.</p>
      </div>
    `;
    const canvas = pairingPanel.querySelector('#qr-canvas') as HTMLCanvasElement;
    QRCode.toCanvas(canvas, controllerUrl(roomCode), { width: 200, margin: 1, color: { dark: '#14101d', light: '#ffffff' } }).catch(
      () => {
        /* QR is a convenience -- the room code text still works for manual entry */
      }
    );

    const statusEl = pairingPanel.querySelector('[data-phone-status]') as HTMLElement;
    const poll = () => {
      const status = phoneAdapter.getStatus();
      if (status.connected) statusEl.textContent = 'Phone connected!';
      statusPollId = requestAnimationFrame(poll);
    };
    poll();
  }

  el.querySelector('[data-action="start"]')!.addEventListener('click', () => {
    callbacks.onStart(mode);
  });

  const gamepadStatus = el.querySelector('[data-gamepad-status]') as HTMLElement;
  function refreshGamepad(): void {
    const pads = navigator.getGamepads?.() ?? [];
    const connected = Array.from(pads).some((p) => p && p.connected);
    gamepadStatus.textContent = connected ? 'Gamepad — connected' : 'Gamepad — not detected';
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
      cancelAnimationFrame(statusPollId);
      window.removeEventListener('gamepadconnected', refreshGamepad);
      window.removeEventListener('gamepaddisconnected', refreshGamepad);
      el.remove();
    }
  };
}
