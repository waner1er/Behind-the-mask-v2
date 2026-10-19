import { levelFrame } from '../../data/levelSprites.js';

// Une pièce d'un boss : un canon, une trappe, le cockpit. Elle suit le vaisseau à son décalage,
// a ses PV, une image au repos / en tir / détruite, et une boîte où les tirs la touchent.
export class BossPart {
  constructor(id, cfg, hpScale = 1) {
    this.id = id;
    this.cfg = cfg;
    this.hp = this.maxHp = Math.round(cfg.hp * hpScale);
    this.firing = 0;        // temps restant de l'image de tir
    this.hurtT = 0;         // temps restant du clignotement « touché »
    this.x = 0; this.y = 0;
  }

  alive() { return this.hp > 0; }

  place(x, y) {
    this.x = x + this.cfg.dx;
    this.y = y + this.cfg.dy;
  }

  box() {
    const [x0, y0, x1, y1] = this.cfg.box;
    return { x: this.x + x0, y: this.y + y0, w: x1 - x0, h: y1 - y0 };
  }

  // renvoie true au coup qui la détruit
  hit(dmg) {
    if (!this.alive()) return false;
    this.hp = Math.max(0, this.hp - dmg);
    this.hurtT = 0.08;
    return this.hp === 0;
  }

  update(dt) {
    this.firing = Math.max(0, this.firing - dt);
    this.hurtT = Math.max(0, this.hurtT - dt);
  }

  // l'image à afficher (le pilote a la sienne, voir ManagerBoss)
  frame(t) {
    const c = this.cfg;
    const name = !this.alive() ? c.broken : this.firing > 0 && c.fire ? c.fire : c.frame;
    return name ? levelFrame(name, t) : null;
  }
}
