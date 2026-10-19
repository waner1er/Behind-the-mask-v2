// demo.html : la démo jouable de la rue, et ses outils (galerie, inspecteur des images).
// demo.html#manuel : commence au clavier ; demo.html#12 : démarre la démo au passage 12.
import Phaser from 'phaser';
import { createGame } from '../createGame.js';
import { CAST } from '../config/cast.js';
import { BootScene } from '../scenes/BootScene.js';
import { DemoScene } from '../scenes/DemoScene.js';
import { HudScene } from '../scenes/HudScene.js';
import { ParadeScene, PARADE_PICKS } from '../scenes/ParadeScene.js';
import { SCENES } from '../scenes/keys.js';
import { ButtonBar } from '../devtools/ButtonBar.js';
import { Inspector } from '../devtools/Inspector.js';
import { roster } from '../devtools/roster.js';

const $ = (id) => document.getElementById(id);
const bar = new ButtonBar();

const hash = location.hash.slice(1);
const start = { step: /^\d+$/.test(hash) ? +hash : 0, manual: hash === 'manuel' };
const game = createGame($('screen'), [new BootScene({ next: SCENES.demo, data: start }), DemoScene, HudScene]);

game.events.on('demo-change', () => bar.refresh());
game.events.once('demo-ready', (session) => {
  if (import.meta.env.DEV) window.demo = session;      // pour la console et les tests
  bar.add('steps', 'DEPUIS LE DEBUT', () => session.play(0));
  session.script.steps.forEach((s, i) => {
    if (s.label === 'MARCHE' || s.label === 'DE RETOUR') return;
    bar.add('steps', s.label, () => session.play(i), () => session.auto && session.autopilot.step === i);
  });
  CAST.forEach((c) => bar.add('cast', c.name, () => session.playAs(c.id), () => session.who === c.id));
  bar.add('options', 'TORSE / JAMBES', () => session.toggle('split'), () => session.opts.split);
  bar.add('options', 'REPERES', () => session.toggle('marks'), () => session.opts.marks);
  bar.add('options', 'COMBAT CONTRE UN CRS', () => session.fight(), () => session.world.fighting());
  bar.refresh();
});

// l'inspecteur, dès que l'atlas est chargé
game.events.once('sprites-ready', (atlas) => {
  const everyone = roster();
  const inspector = new Inspector({ status: $('status'), rows: $('anims'), atlas, list: everyone });
  everyone.forEach(({ id, name }) => bar.add('who', name, () => inspector.show(id), () => inspector.shown === id));
  inspector.render();
  bar.refresh();
});

// la galerie : son propre jeu, en pause quand son tiroir est fermé
const parade = createGame($('parade'), [new BootScene({ next: SCENES.parade }), ParadeScene], {
  scale: { mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT, autoCenter: Phaser.Scale.NO_CENTER },
});
parade.events.once('parade-ready', (scene) => {
  PARADE_PICKS.forEach((n) => bar.add('gallery-anims', n.toUpperCase(), () => scene.play(n), () => scene.pick === n));
  bar.refresh();
});
$('gallery').addEventListener('toggle', (e) => (e.target.open ? parade.loop.wake() : parade.loop.sleep()));
