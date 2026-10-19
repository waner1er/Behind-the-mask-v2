import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { KEYS_P1 } from '../config/controls.js';
import { DemoSession } from '../game/demo/DemoSession.js';
import { KeyboardPad } from '../input/KeyboardPad.js';
import { WorldView } from '../views/WorldView.js';

const MAX_DT = 0.05;   // au-delà (onglet en pause…), le jeu ralentit plutôt que de sauter

// touches de mise au point, en plus de la manette du joueur 1
const DEBUG_KEYS = { hurt: 'H', win: 'P', die: 'O', fight: 'E', auto: 'R', split: 'T', marks: 'G' };

// La démo de la rue : une DemoSession (la logique), affichée par une WorldView, avec le bandeau
// en scène parallèle. Une touche de jeu reprend la main au scénario ; R le relance.
// Le jeu émet 'demo-ready' (la session) pour les boutons de la page.
// En mode attraction (attract, depuis l'écran de garde du jeu), personne ne prend la main :
// Start ou tir ramène à l'écran de garde, et elle s'y arrête seule au bout d'ATTRACT_TIME.
const ATTRACT_TIME = 45;
export class DemoScene extends Phaser.Scene {
  constructor() {
    super(SCENES.demo);
  }

  init({ step = 0, manual = false, attract = false } = {}) {
    this.startStep = step;
    this.startManual = manual;
    this.attract = attract;
  }

  create() {
    this.session = new DemoSession({ onChange: () => this.game.events.emit('demo-change') });
    this.session.goTo(this.session.script.steps[this.startStep] ? this.startStep : 0);
    if (this.startManual) this.session.auto = false;
    this.view = new WorldView(this, this.session.world);
    this.pad = new KeyboardPad(this.input.keyboard, KEYS_P1);
    this.dieHeld = false;
    this.session.attract = this.attract;
    if (!this.attract) this.#bindDebugKeys();
    this.attractT = 0;
    this.scene.launch(SCENES.hud, { session: this.session });
    this.game.events.emit('demo-ready', this.session);
  }

  #bindDebugKeys() {
    const kb = this.input.keyboard, s = this.session;
    this.debug = kb.addKeys({ hurt: DEBUG_KEYS.hurt, win: DEBUG_KEYS.win });
    const gameKeys = new Set([...this.pad.codes(), ...Object.values(this.debug).map((k) => k.keyCode)]);
    // une touche de jeu, en démo auto, rend la main au joueur
    kb.on('keydown', (e) => { if (gameKeys.has(e.keyCode)) s.takeOver(); });
    kb.on(`keydown-${DEBUG_KEYS.die}`, () => { s.takeOver(); this.dieHeld = !this.dieHeld; });
    kb.on(`keydown-${DEBUG_KEYS.fight}`, () => s.fight());
    kb.on(`keydown-${DEBUG_KEYS.auto}`, () => s.toggleAuto());
    kb.on(`keydown-${DEBUG_KEYS.split}`, () => s.toggle('split'));
    kb.on(`keydown-${DEBUG_KEYS.marks}`, () => s.toggle('marks'));
  }

  // la démo tourne seule ; Start (ou le temps) ramène à l'écran de garde
  #attract(dt) {
    this.attractT += dt;
    const { inp, press } = this.pad.read();
    this.session.update(dt, { inp: {}, press: {} });
    this.view.render({ marks: false });
    if ((press.start || inp.fire || this.attractT > ATTRACT_TIME) && !this.leaving) {
      this.leaving = true;
      this.cameras.main.fadeOut(300);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop(SCENES.hud);
        this.scene.start(SCENES.title);
      });
    }
  }

  // la manette du joueur, plus les touches de mise au point
  #manualInput() {
    const { inp, press } = this.pad.read();
    inp.win = this.debug.win.isDown;
    inp.die = this.dieHeld || this.session.hero.hp <= 0;
    press.hurt = Phaser.Input.Keyboard.JustDown(this.debug.hurt);
    return { inp, press };
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, MAX_DT);
    if (this.attract) return this.#attract(dt);
    this.session.update(dt, this.#manualInput());
    this.view.render({ marks: this.session.opts.marks });
  }
}
