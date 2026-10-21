import { GROUND } from '../../config/screen.js';
import { DEPTH } from '../../config/combat.js';

const GRAVITY = 640;
// le pied du mur : le fond du trottoir (la file la plus au fond), où sont posées les TV
export const WALL_FOOT = GROUND + DEPTH.min;

// Un écran qui éclate (l'arrivée de l'invité du clip) : des éclats de verre partent du point
// (x, y), volent vers l'avant, rebondissent et se couchent sur le trottoir. Sans rendu :
// ClipGameScene les dessine (frames : les noms des éclats de l'atlas). rnd : le hasard.
export class Shatter {
  constructor(x, y, frames, { count = 26, rnd = Math.random } = {}) {
    this.x = x;
    this.y = y;
    this.t = 0;
    this.pieces = Array.from({ length: count }, (_, k) => ({
      frame: frames[k % frames.length],
      x: x + (rnd() - 0.5) * 60,
      y: y + (rnd() - 0.5) * 40,
      vx: (rnd() - 0.5) * 320,
      vy: -220 + rnd() * 200,
      rot: rnd() * Math.PI,
      vr: (rnd() - 0.5) * 18,
      scale: 0.5 + rnd() * 0.6,
      floor: WALL_FOOT + 4 + rnd() * (GROUND + DEPTH.max - WALL_FOOT - 4),
      rest: false,
    }));
  }

  update(dt) {
    this.t += dt;
    for (const b of this.pieces) {
      if (b.rest) continue;
      b.vy += GRAVITY * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (b.y < b.floor) continue;
      b.y = b.floor;
      // un petit rebond, puis l'éclat se couche à plat
      if (b.vy > 140) { b.vy *= -0.25; b.vx *= 0.4; b.vr *= 0.4; }
      else { b.rest = true; b.rot = Math.round(b.rot / Math.PI) * Math.PI + Math.PI / 2; }
    }
  }
}
