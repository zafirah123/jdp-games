import Phaser from 'phaser';
import BootScene     from './scenes/BootScene';
import PreloadScene  from './scenes/PreloadScene';
import StartScene    from './scenes/StartScene';
import GameScene     from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';
import { GAME_W, GAME_H } from './config/gameConfig';

const config = {
  type: Phaser.AUTO,
  width:  GAME_W,
  height: GAME_H,
  backgroundColor: '#0d1b2e',
  pixelArt: true,
  render: { antialias: false, pixelArt: true, roundPixels: true },
  scale: {
    parent:     'game',
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug:   false,
    },
  },
  scene: [BootScene, PreloadScene, StartScene, GameScene, GameOverScene],
};

export default new Phaser.Game(config);
