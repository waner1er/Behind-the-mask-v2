import { fxAnim } from '../../data/sprites.js';

// Effets jetables (éclairs, impacts, poussière, explosions, notes) : ils jouent leur anim de
// l'atlas (S.fx) une fois, ou en boucle, en dérivant à leur vitesse. delay = départ retardé ;
// life = durée de vie (s), indispensable pour un effet qui boucle (flammes, étincelles).
export class Effects {
  list = [];
  visible = [];      // ceux qui ont joué à cette image, à dessiner

  add(name, x, y, opts = {}) {
    if (fxAnim(name)) this.list.push({ name, x, y, t: 0, angle: 0, flip: 1, vx: 0, vy: 0, ...opts });
  }

  clear() { this.list.length = this.visible.length = 0; }

  update(dt) {
    this.visible = [];
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      if (e.delay > 0) { e.delay -= dt; continue; }
      e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt;
      if (Effects.done(e)) this.list.splice(i, 1);
      else this.visible.push(e);
    }
  }

  static done(e) {
    if (e.life) return e.t >= e.life;
    const a = fxAnim(e.name);
    return !a.loop && e.t * a.fps >= a.frames.length;
  }
}
