// galerie.html : la galerie, tous les persos de l'atlas en action sur le trottoir.
import Phaser from 'phaser';
import { createGame } from '../createGame.js';
import { BootScene } from '../scenes/BootScene.js';
import { ParadeScene, PARADE_PICKS } from '../scenes/ParadeScene.js';
import { SCENES } from '../scenes/keys.js';
import { ButtonBar } from '../devtools/ButtonBar.js';

const bar = new ButtonBar();
const game = createGame(document.getElementById('parade'), [new BootScene({ next: SCENES.parade }), ParadeScene], {
  scale: { mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT, autoCenter: Phaser.Scale.NO_CENTER },
});
game.events.once('parade-ready', (scene) => {
  PARADE_PICKS.forEach((n) => bar.add('anims', n.toUpperCase(), () => scene.play(n), () => scene.pick === n));
  bar.refresh();
});
