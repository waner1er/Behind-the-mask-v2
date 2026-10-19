import { CRS } from '../../config/combat.js';

// Le scénario de la démo : un passage « walk » avance d'une part de la rue (poids), un passage
// « dur » se joue sur place. x/y = croix directionnelle, lock = viser sans bouger ; les boutons
// de PRESS sont appuyés au début du passage, le reste est tenu. crs = un CRS entre (ses PV).
const STEPS = [
  { walk: 3, label: 'MARCHE', inp: { x: 1 } },
  { dur: 1.2, label: 'TIR →', inp: { fire: 1 } },
  { walk: 2, label: 'TIR EN MARCHANT', inp: { x: 1, fire: 1 } },
  { dur: 1.0, label: 'TIR ↗', inp: { lock: 1, x: 1, y: -1, fire: 1 } },
  { dur: 1.0, label: 'TIR ↑', inp: { lock: 1, y: -1, fire: 1 } },
  { walk: 2, label: 'VERS LE FOND + TIR', inp: { x: 1, y: -1, fire: 1 } },
  { walk: 1, label: 'MARCHE', inp: { x: 1 } },
  { dur: 1.2, label: 'VERS L\'AVANT', inp: { y: 1 } },
  { walk: 1, label: 'SAUT', inp: { x: 1, jump: 1 } },
  { walk: 1, label: 'MARCHE', inp: { x: 1 } },
  { dur: 1.0, label: 'SAUT + TIR ↓', inp: { jump: 1, y: 1, fire: 1 } },
  { dur: 1.0, label: 'SAUT + TIR ↘', inp: { jump: 1, x: 1, y: 1, fire: 1 } },
  { dur: 1.0, label: 'SAUT + TIR ↑', inp: { jump: 1, y: -1, fire: 1 } },
  { dur: 1.0, label: 'SAUT + TIR →', inp: { jump: 1, fire: 1 } },
  { walk: 3, label: 'MARCHE', inp: { x: 1 } },
  { dur: 1.4, label: 'ACCROUPI', inp: { lock: 1, y: 1 } },
  { dur: 1.2, label: 'TIR ACCROUPI', inp: { lock: 1, y: 1, fire: 1 } },
  { walk: 1, label: 'VERS LE FOND', inp: { y: -1, x: 1 } },
  { walk: 2, label: 'MARCHE', inp: { x: 1 } },
  { dur: 1.2, label: 'VINYLE', inp: { bomb: 1 } },
  { dur: 1.2, label: 'VINYLE ACCROUPI', inp: { lock: 1, y: 1, bomb: 1 } },
  { walk: 2, label: 'TIR EN MARCHANT', inp: { x: 1, fire: 1 } },
  { dur: 0.8, label: 'CORPS À CORPS', inp: { melee: 1 } },
  { dur: 0.8, label: 'CORPS À CORPS ACCROUPI', inp: { lock: 1, y: 1, melee: 1 } },
  { dur: 1.4, label: 'SKATE', inp: { skate: 1 } },
  { walk: 2, label: 'MARCHE', inp: { x: 1 } },
  { dur: 16, label: 'COMBAT', inp: { fire: 1 }, crs: CRS.hp },
  { dur: 1.0, label: 'TIR ↖', inp: { lock: 1, x: -1, y: -1, fire: 1 } },
  { dur: 1.0, label: 'TIR ←', inp: { lock: 1, x: -1, fire: 1 } },
  { walk: 2, label: 'VERS LE FOND + TIR', inp: { x: 1, y: -1, fire: 1 } },
  { dur: 0.8, label: 'TOUCHÉ', inp: { hurt: 1 } },
  { dur: 2.6, label: 'K.O.', inp: { die: 1 } },
  { dur: 0.8, label: 'DE RETOUR', inp: {} },
  { walk: 3, label: 'MARCHE', inp: { x: 1 } },
  { walk: 1, label: 'SAUT', inp: { x: 1, jump: 1 } },
  { walk: 2, label: 'TIR EN MARCHANT', inp: { x: 1, fire: 1 } },
  { dur: 1.2, label: 'VINYLE', inp: { bomb: 1 } },
  { walk: 2, label: 'MARCHE', inp: { x: 1 } },
  { dur: 3.5, label: 'VICTOIRE', inp: { win: 1 } },
];
const PRESS = ['jump', 'bomb', 'melee', 'hurt', 'skate'];

const crouched = (s) => s.inp.y > 0 && !!s.inp.lock;

// Le scénario posé sur une rue : chaque passage de marche reçoit ses bornes (from → to), et la
// vitesse de marche est calculée pour que l'ensemble dure `duration` secondes. Accroupi, on
// avance deux fois moins vite.
export class DemoScript {
  constructor(levelWidth, { start = 90, endMargin = 230, duration = 120 } = {}) {
    this.start = start;
    this.end = levelWidth - endMargin;
    const weights = STEPS.reduce((t, s) => t + (s.walk || 0), 0);
    let x = start;
    this.steps = STEPS.map((s) => {
      const from = x;
      if (s.walk) x += (this.end - start) * s.walk / weights;
      return { ...s, from, to: x };
    });
    const fixed = this.steps.reduce((t, s) => t + (s.dur || 0), 0);
    const slowDist = this.steps.reduce((t, s) => t + (s.walk ? (s.to - s.from) * (crouched(s) ? 2 : 1) : 0), 0);
    this.walkSpeed = slowDist / (duration - fixed);
  }

  get length() { return this.steps.length; }

  // durée prévue d'un passage
  stepDuration(s) {
    return s.dur || (s.to - s.from) / (crouched(s) ? this.walkSpeed / 2 : this.walkSpeed);
  }

  // l'heure de la démo au début du passage i
  clockAt(i) {
    return this.steps.slice(0, i).reduce((t, s) => t + this.stepDuration(s), 0);
  }

  // l'avancée dans la rue, de 0 à 1
  progress(x) {
    return Math.max(0, Math.min(1, (x - this.start) / (this.end - this.start)));
  }
}

// Joue le scénario passage par passage, comme une manette.
export class Autopilot {
  constructor(script) {
    this.script = script;
    this.goTo(0);
  }

  goTo(i) {
    this.step = i;
    this.stepT = 0;
    this.clock = this.script.clockAt(i);
    this.pressed = false;
  }

  get current() { return this.script.steps[this.step]; }

  // L'entrée de cette image ; ended = le dernier passage vient de finir.
  next(dt, world) {
    const s = this.current;
    const press = {};
    let ended = false;
    this.clock += dt;
    if (!this.pressed) {
      this.pressed = true;
      PRESS.forEach((k) => (press[k] = !!s.inp[k]));
      if (s.crs) world.startFight(s.crs);
    }
    this.stepT += dt;
    // un passage de marche finit quand le perso a atteint sa borne (ou au bout de 3× le temps
    // prévu) ; un combat, quand l'ennemi est à terre
    const done = s.walk ? world.hero.x >= s.to - 0.5 || this.stepT > 3 * (s.to - s.from) / this.script.walkSpeed + 2
      : s.crs ? (!world.enemiesStanding() && this.stepT > 1.5) || this.stepT >= s.dur
        : this.stepT >= s.dur;
    if (done) {
      if (this.step === this.script.length - 1) ended = true;
      else { this.step++; this.stepT = 0; this.pressed = false; }
    }
    return { inp: s.inp, press, ended };
  }
}
