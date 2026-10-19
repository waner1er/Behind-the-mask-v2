import { GRAVITY } from '../../config/combat.js';

// Une lettre de bonus (src/config/weapons.js → PICKUPS) : elle saute hors de sa caisse, retombe
// sur le terrain, flotte, et disparaît au bout d'un moment si personne ne la prend.
export class Pickup {
  constructor(letter, x, y, terrain) {
    this.letter = letter;
    this.x = x; this.y = y;
    this.vy = -160; this.air = true;
    this.terrain = terrain;
    this.t = 0;
    this.taken = false;
  }

  box() {
    return { x: this.x - 10, y: this.y - 20, w: 20, h: 20 };
  }

  expired() { return this.taken || this.t > 14; }

  update(dt) {
    this.t += dt;
    if (!this.air) return;
    const prevY = this.y;
    this.vy += GRAVITY * dt;
    this.y += this.vy * dt;
    if (this.vy < 0) return;
    const land = this.terrain.landing(this.x, prevY, this.y);
    if (land !== null) { this.y = land; this.air = false; }
  }
}
