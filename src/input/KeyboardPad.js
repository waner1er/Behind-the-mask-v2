import Phaser from 'phaser';
import { HELD, PRESSED } from '../config/controls.js';

const { JustDown } = Phaser.Input.Keyboard;

// Une manette au clavier : lit les touches d'un joueur et rend { inp, press }, le format que
// comprennent les acteurs (inp = croix + boutons tenus, press = boutons appuyés à cette image).
export class KeyboardPad {
  constructor(keyboard, mapping) {
    this.keys = Object.fromEntries(Object.entries(mapping)
      .map(([action, codes]) => [action, codes.map((c) => keyboard.addKey(c, true, false))]));
  }

  isDown(action) { return this.keys[action].some((k) => k.isDown); }
  // à appeler une seule fois par image : JustDown consomme l'appui
  justDown(action) { return this.keys[action].map((k) => JustDown(k)).some(Boolean); }

  read() {
    const inp = {
      x: (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0),
      y: (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0),
    };
    HELD.forEach((a) => (inp[a] = this.isDown(a)));
    const press = Object.fromEntries(PRESSED.map((a) => [a, this.justDown(a)]));
    return { inp, press };
  }

  // toutes les touches de cette manette, en codes
  codes() {
    return Object.values(this.keys).flat().map((k) => k.keyCode);
  }
}
