// index.html : le jeu. Écran de garde (PRESS START, démo en attraction), sélection des héros
// façon Metal Slug, puis le niveau 1. En dev, F2 en jeu ouvre l'éditeur de niveau.
import { createGame } from '../createGame.js';
import { BootScene } from '../scenes/BootScene.js';
import { SplashScene } from '../scenes/SplashScene.js';
import { SelectScene } from '../scenes/SelectScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { GameHudScene } from '../scenes/GameHudScene.js';
import { DemoScene } from '../scenes/DemoScene.js';
import { HudScene } from '../scenes/HudScene.js';
import { SCENES } from '../scenes/keys.js';
import { TouchControls } from '../input/TouchControls.js';
import { MobileGuard } from '../input/MobileGuard.js';

const scenes = [
  new BootScene({ next: SCENES.title, game: true }),
  SplashScene, SelectScene, GameScene, GameHudScene, DemoScene, HudScene,
];
if (import.meta.env.DEV) scenes.push((await import('../devtools/EditorScene.js')).EditorScene);
createGame(document.getElementById('screen'), scenes);
// sur téléphone : stick et boutons tactiles, ni zoom ni défilement, plein écran en paysage
new TouchControls().bind();
new MobileGuard().bind();
