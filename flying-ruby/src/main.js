import { GAME, PALETTE_CSS } from './config.js?v=20260717.2';
import { BootScene } from './scenes/BootScene.js?v=20260717.2';
import { StartScene } from './scenes/StartScene.js?v=20260717.2';
import { GameScene } from './scenes/GameScene.js?v=20260717.2';
import { GameOverScene } from './scenes/GameOverScene.js?v=20260717.2';

const MAX_HEIGHT = 1400;
function getGameHeight() {
  const aspectHeight = Math.round((GAME.width * window.innerHeight) / window.innerWidth);
  return Math.max(GAME.height, Math.min(MAX_HEIGHT, aspectHeight));
}

const config = {
  type: Phaser.AUTO,
  parent: 'game-canvas-wrap',
  backgroundColor: PALETTE_CSS.navy,
  // Crisp nearest-neighbor scaling for pixel-art sprites (pbot et al.)
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:  GAME.width,
    height: getGameHeight(),
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, StartScene, GameScene, GameOverScene],
};

// eslint-disable-next-line no-new
const game = new Phaser.Game(config);

let resizeFrame = null;
function handleResize() {
  if (resizeFrame) return;
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = null;
    const nextHeight = getGameHeight();
    if (game.scale.height !== nextHeight) {
      game.scale.setGameSize(GAME.width, nextHeight);
      game.scale.refresh();
    }
  });
}

window.addEventListener('resize', handleResize, { passive: true });
window.addEventListener('orientationchange', handleResize, { passive: true });
