import { PROPS } from '../../config/props.js';
import { levelAnim } from '../../data/levelSprites.js';

// Un élément de décor posé dans le niveau (src/config/props.js), ancré au milieu de son bas.
// Il donne ses formes au terrain (blocs, plateformes) ; s'il a des PV, il se casse sous les
// coups ; une porte s'ouvre pour laisser sortir des ennemis.
export class Prop {
  constructor({ id, type, x, y, drop }) {
    this.id = id;
    this.type = type;
    this.cfg = PROPS[type];
    this.x = x; this.y = y;
    this.drop = drop ?? null;             // la lettre lâchée (sinon : au hasard si cfg.drop)
    this.hp = this.cfg.hp ?? Infinity;
    this.broken = false;
    this.doorT = -1;                      // temps depuis l'ouverture de la porte (-1 : fermée)
  }

  breakable() { return !this.broken && this.hp !== Infinity; }

  // son image ; null s'il a été détruit sans laisser de débris (un baril qui explose)
  get frame() { return this.broken ? this.cfg.broken ?? null : this.cfg.frame; }

  blocks() {
    if (this.broken) return [];
    return (this.cfg.blocks ?? []).map(([x0, x1, h]) => ({ id: this.id, x0: this.x + x0, x1: this.x + x1, top: this.y - h }));
  }

  platforms() {
    return (this.cfg.platforms ?? []).map(([x0, x1, dy]) => ({ id: this.id, x0: this.x + x0, x1: this.x + x1, y: this.y + dy }));
  }

  // la boîte de l'image entière (pour les tirs)
  box() {
    const [, , w, h, ax, ay] = levelAnim(this.cfg.frame).frames[0];
    return { x: this.x - ax, y: this.y - ay, w, h };
  }

  // renvoie true au coup qui le casse
  hit(dmg) {
    if (!this.breakable()) return false;
    this.hp -= dmg;
    if (this.hp > 0) return false;
    this.broken = true;
    return true;
  }

  open() { if (this.doorT < 0) this.doorT = 0; }

  update(dt) {
    if (this.doorT >= 0) this.doorT += dt;
  }
}
