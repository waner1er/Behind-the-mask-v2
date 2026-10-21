import { GROUND } from '../../config/screen.js';
import { DEPTH } from '../../config/combat.js';

const BRICKS = 30;
const GRAVITY = 640;
// le pied du mur : le fond du trottoir (la file la plus au fond)
export const WALL_FOOT = GROUND + DEPTH.min;

// Un mur qui explose (l'arrivée de l'invité du clip) : un trou aux bords en escalier de briques,
// au pied du mur en x, et des briques qui volent vers l'avant, rebondissent et se posent sur le
// trottoir. Sans rendu : ClipGameScene le dessine. rnd : le hasard (pour des tests rejouables).
export class WallBreach {
  constructor(x, rnd = Math.random) {
    this.x = x;
    this.w = 46;
    this.h = 72;
    this.t = 0;
    this.outline = this.#outline(rnd);
    this.bricks = Array.from({ length: BRICKS }, () => ({
      x: x + (rnd() - 0.5) * this.w,
      y: WALL_FOOT - rnd() * this.h,
      vx: (rnd() - 0.5) * 260,
      vy: -60 - rnd() * 240,
      rot: rnd() * Math.PI,
      vr: (rnd() - 0.5) * 16,
      floor: WALL_FOOT + 4 + rnd() * (GROUND + DEPTH.max - WALL_FOOT - 4),
      big: rnd() < 0.5,
      rest: false,
    }));
  }

  // le bord du trou : une arche, cassée en marches de la taille d'une brique
  #outline(rnd) {
    const pts = [], steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = Math.PI * i / steps;
      const rx = this.w / 2 + (rnd() - 0.5) * 8, ry = this.h + (rnd() - 0.5) * 10;
      const x = Math.round((this.x - Math.cos(a) * rx) / 4) * 4;
      const y = Math.round((WALL_FOOT - Math.sin(a) * ry) / 3) * 3;
      pts.push(x, y);
    }
    return pts;
  }

  update(dt) {
    this.t += dt;
    for (const b of this.bricks) {
      if (b.rest) continue;
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (b.y < b.floor) continue;
      b.y = b.floor;
      // un rebond mou, puis la brique se couche à plat
      if (b.vy > 140) { b.vy *= -0.3; b.vx *= 0.5; b.vr *= 0.5; }
      else { b.rest = true; b.rot = Math.round(b.rot / (Math.PI / 2)) * (Math.PI / 2); }
    }
  }
}
