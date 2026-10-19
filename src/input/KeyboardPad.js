import Phaser from 'phaser';
import { HELD, PRESSED } from '../config/controls.js';
import { virtualPad } from './VirtualPad.js';

const { JustDown } = Phaser.Input.Keyboard;

// Une manette au clavier : lit les touches d'un joueur et rend { inp, press }, le format que
// comprennent les acteurs (inp = croix + boutons tenus, press = boutons appuyés à cette image).
// touch : le joueur 1 lit aussi la manette virtuelle des commandes tactiles (téléphone).
export class KeyboardPad {
  constructor(keyboard, mapping, { touch = false } = {}) {
    this.keys = Object.fromEntries(Object.entries(mapping)
      .map(([action, codes]) => [action, codes.map((c) => keyboard.addKey(c, true, false))]));
    this.virtual = touch ? virtualPad : null;
  }

  isDown(action) {
    return this.keys[action].some((k) => k.isDown) || !!this.virtual?.isDown(action);
  }

  // à appeler une seule fois par image : JustDown consomme l'appui
  justDown(action) {
    const key = this.keys[action].map((k) => JustDown(k)).some(Boolean);
    const touch = !!this.virtual?.justDown(action);
    return key || touch;
  }

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
