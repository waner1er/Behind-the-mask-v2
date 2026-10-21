// clip.html : le clip de démo sur « Metal Slug » (écran de garde, sélection, niveau joué tout
// seul, paroles à l'écran). clip.html#export : sans son, à pas fixe, piloté par
// tools/record_clip.mjs qui capture chaque image (window.clipExport).
import { createGame } from '../createGame.js';
import { BootScene } from '../scenes/BootScene.js';
import { SplashScene } from '../scenes/SplashScene.js';
import { SelectScene } from '../scenes/SelectScene.js';
import { ClipGameScene } from '../scenes/ClipGameScene.js';
import { GameHudScene } from '../scenes/GameHudScene.js';
import { ClipScene } from '../scenes/ClipScene.js';
import { SCENES } from '../scenes/keys.js';

const FPS = 60;
const $ = (id) => document.getElementById(id);
const exporting = location.hash === '#export';

// la scène du clip en dernier : elle se dessine par-dessus les autres
function start() {
  $('play').disabled = true;
  const extra = exporting ? { audio: { noAudio: true }, render: { preserveDrawingBuffer: true } } : {};
  const game = createGame($('screen'), [
    new BootScene({ next: SCENES.clip, game: true }),
    SplashScene, SelectScene, ClipGameScene, GameHudScene, new ClipScene({ exporting }),
  ], { extra });
  game.events.once('clip-done', () => {
    window.clipDone = true;
    $('play').textContent = 'REJOUER';
    $('play').disabled = false;
    $('play').onclick = () => location.reload();
  });
  if (exporting) exportControls(game);
}

// L'export : dès que le clip démarre, la boucle du navigateur s'arrête ; chaque appel à
// frames(n) joue n images de 1/60 s et rend leurs captures (PNG en data URL) ; run(n) les joue
// sans capture (pour tester le clip de bout en bout) et rend l'heure du morceau.
function exportControls(game) {
  let time = 0;
  const ready = new Promise((resolve) => game.events.once('clip-ready', () => { game.loop.sleep(); resolve(); }));
  const step = () => { time += 1000 / FPS; game.step(time, 1000 / FPS); };
  window.clipExport = {
    fps: FPS,
    ready: () => ready,
    frames(n) {
      const out = [];
      for (let i = 0; i < n && !window.clipDone; i++) {
        step();
        out.push(game.canvas.toDataURL('image/png'));
      }
      return out;
    },
    run(n) {
      for (let i = 0; i < n && !window.clipDone; i++) step();
      return game.scene.getScene(SCENES.clip).clock.t;
    },
  };
}

if (exporting) start();
else $('play').addEventListener('click', start, { once: true });
