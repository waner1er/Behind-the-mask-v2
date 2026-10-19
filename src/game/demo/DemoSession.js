import { CAST } from '../../config/cast.js';
import { STREET } from '../../config/levels.js';
import { Hero } from '../actors/Hero.js';
import { World } from '../world/World.js';
import { Level } from '../world/Level.js';
import { DemoScript, Autopilot } from './DemoScript.js';

// La démo de la rue, sans rendu ni clavier : le scénario pilote le héros (auto), ou une
// manette (manuel). En fin de niveau ou après un K.O., fondu et retour au début.
// La scène Phaser lui passe l'entrée du joueur et dessine son état.
export class DemoSession {
  constructor({ onChange = () => {} } = {}) {
    this.onChange = onChange;      // l'état affiché par les boutons a changé
    this.world = new World(new Level(STREET));
    this.script = new DemoScript(this.world.level.width);
    this.autopilot = new Autopilot(this.script);
    this.opts = { split: true, marks: false };
    this.who = 'pierre';
    this.auto = true;
    this.fade = 0;
  }

  get hero() { return this.world.hero; }

  // (re)commence au passage i : le perso est posé là où ce passage commence
  goTo(i = 0) {
    const def = CAST.find((c) => c.id === this.who);
    this.autopilot.goTo(i);
    const hero = new Hero(def, this.script.steps[i].from, { speed: this.script.walkSpeed });
    hero.bombs = Infinity;                       // le banc d'essai lance autant de vinyles qu'il veut
    this.world.reset(hero);
    this.onChange();
  }

  play(i = 0) { this.auto = true; this.goTo(i); }
  playAs(id) { this.who = id; this.goTo(this.auto ? this.autopilot.step : 0); }
  fight() { this.auto = false; this.world.startFight(); this.onChange(); }
  toggle(opt) { this.opts[opt] = !this.opts[opt]; this.onChange(); }

  // le joueur reprend la main
  takeOver() {
    if (!this.auto) return;
    this.auto = false;
    this.fade = 0;
    this.onChange();
  }

  toggleAuto() {
    this.auto = !this.auto;
    if (this.auto) this.goTo(0);
    this.onChange();
  }

  // Une image de jeu. manual = { inp, press } du joueur, lu seulement en mode manuel.
  update(dt, manual) {
    let inp, press;
    if (this.auto) {
      let ended;
      ({ inp, press, ended } = this.autopilot.next(dt, this.world));
      if (ended) this.fade ||= 0.001;
    } else {
      ({ inp, press } = manual);
    }
    if (this.fade) {
      this.fade += dt;
      if (this.fade >= 1) inp = {};
      if (this.fade > 2) { this.fade = 0; this.goTo(0); }
    }
    this.world.update(dt, [{ inp, press }]);
    // à court de points de vie, le héros reste au sol, puis la partie repart
    if (this.hero.hp <= 0 && this.hero.downT > 3 && !this.fade) this.fade = 0.001;
    this.world.resolve(dt, this.opts.split);
  }

  // le texte de droite du bandeau
  label(arrow) {
    return this.auto ? this.autopilot.current.label : 'VISEE ' + arrow;
  }
}
