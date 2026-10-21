import { HELD, PRESSED } from '../config/controls.js';

// Une manette qui joue toute seule : la même interface que KeyboardPad, mais les appuis viennent
// d'une liste [temps, action], lue sur une horloge (clock() en secondes). Sert au clip de démo
// pour passer l'écran de garde et choisir le héros. Rien n'est jamais tenu.
export class ScriptedPad {
  constructor(script, clock) {
    this.script = script.map(([t, action]) => ({ t, action, done: false }));
    this.clock = clock;
  }

  isDown() { return false; }

  // un appui dont l'heure est passée, une seule fois
  justDown(action) {
    const e = this.script.find((s) => !s.done && s.action === action && s.t <= this.clock());
    if (e) e.done = true;
    return !!e;
  }

  read() {
    const inp = { x: 0, y: 0 };
    HELD.forEach((a) => (inp[a] = false));
    return { inp, press: Object.fromEntries(PRESSED.map((a) => [a, this.justDown(a)])) };
  }

  codes() { return []; }
}
