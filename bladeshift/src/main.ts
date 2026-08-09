import Phaser from 'phaser';
import { AudioDirector } from './audio/AudioDirector';
import { BootScene } from './game/scenes/BootScene';
import { GameScene, type GameSceneData } from './game/scenes/GameScene';
import { CameraHandAdapter } from './input/CameraHandAdapter';
import { GamepadAdapter } from './input/GamepadAdapter';
import { InputRouter } from './input/InputRouter';
import { PhoneAdapter } from './input/PhoneAdapter';
import { PointerAdapter } from './input/PointerAdapter';
import type { GameMode } from './sim/GameState';
import { attachHud } from './ui/hud';
import { attachMenu } from './ui/menu';

const gameRoot = document.getElementById('game-root')!;
const uiRoot = document.getElementById('ui-root')!;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: gameRoot,
  backgroundColor: '#0b0b13',
  banner: false,
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: gameRoot,
    width: '100%',
    height: '100%'
  },
  scene: [BootScene, GameScene]
};

const game = new Phaser.Game(config);
const audio = new AudioDirector();
game.registry.set('audio', audio);

function boot(): void {
  const router = new InputRouter();
  const cameraAdapter = new CameraHandAdapter();
  const phoneAdapter = new PhoneAdapter();
  router.register(new PointerAdapter(game.canvas));
  router.register(new GamepadAdapter());
  router.register(cameraAdapter);
  router.register(phoneAdapter);
  // Touch/mouse and gamepad are always live so there's never a dead-end if
  // webcam/phone setup fails or the player just wants to switch back --
  // camera and phone only connect once the player opts into them from the menu.
  router.start('pointer');
  router.start('gamepad');
  game.registry.set('inputRouter', router);

  const menu = attachMenu(
    uiRoot,
    { router, cameraAdapter, phoneAdapter },
    {
      onStart(mode: GameMode) {
        audio.unlock();
        menu.hide();
        startMatch(mode);
      }
    }
  );

  // ?seed=1234 forces a deterministic run -- used by the Playwright smoke
  // test and handy for manually reproducing a specific spawn sequence.
  const seedParam = new URLSearchParams(window.location.search).get('seed');
  const forcedSeed = seedParam ? Number(seedParam) : undefined;

  function startMatch(mode: GameMode): void {
    game.scene.start('GameScene', { mode, seed: forcedSeed } satisfies GameSceneData);
  }

  attachHud(uiRoot, game, router, {
    onPlayAgain: () => startMatch(lastMode),
    onBackToMenu: () => {
      game.scene.stop('GameScene');
      menu.show();
    }
  });

  let lastMode: GameMode = 'classic';
  game.events.on('hud:ready', (data: { mode: GameMode }) => {
    lastMode = data.mode;
  });
}

game.events.once(Phaser.Core.Events.READY, boot);
