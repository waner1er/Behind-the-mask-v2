import { Actor } from './Actor.js';
import { ENEMIES } from '../../config/enemies.js';

// Un fantassin (src/config/enemies.js) : il avance vers le héros le plus proche, s'arrête à
// portée de tir (rafales), frappe à bout portant, lance une grenade de loin s'il en a, saute
// quand un obstacle l'arrête. Il ne bouge plus pendant ses actions. Chaque coup reçu le fait
// encaisser ; à zéro, il tombe et son corps s'efface.
export class Enemy extends Actor {
  constructor(type, x, y, hp) {
    const cfg = ENEMIES[type];
    // ce qui sert au perso ; le reste ne sert qu'à l'IA
    const { burst, reload, walk, run, range, melee, grenade, score, fan, heavy, boss, ...perso } = cfg;
    super({ ...perso, hp: hp ?? cfg.hp, speed: walk }, x, y);
    this.type = type;
    this.cfg = cfg;
    this.maxHp = this.hp;
    this.burst = 0; this.reloadT = 0; this.meleeT = 1.2; this.grenadeT = 0.9 + Math.random() * 0.8;
    this.deadT = -1; this.fade = 1;
    this.stagger = 0;            // dégâts encaissés depuis le dernier coup qui l'a fait tituber
    this.lastHitBy = null;       // le héros qui l'a touché en dernier (pour le score)
    this.flashT = 0;             // touché : il flashe en blanc un instant
  }

  // fini, on peut le retirer du niveau
  gone() { return this.deadT > 3.4; }

  // le héros vivant le plus proche
  static nearest(from, targets) {
    let best = null;
    for (const t of targets) if (t.alive() && (!best || Math.abs(t.x - from.x) < Math.abs(best.x - from.x))) best = t;
    return best;
  }

  // L'IA : ce qu'il ferait avec une manette, face aux héros. view = { x0, x1 } : l'écran ;
  // hors de l'écran, il y revient avant d'attaquer (sinon on ne pourrait pas l'atteindre).
  think(dt, targets, view = null) {
    const c = this.cfg;
    const inp = { x: 0, y: 0, lock: false, fire: false, die: false };
    const press = {};
    this.reloadT -= dt; this.meleeT -= dt; this.grenadeT -= dt;
    // une rafale compte ses balles : il recharge après la dernière
    if (this.fired && --this.burst <= 0) this.reloadT = c.reload;
    if (!this.alive()) {
      inp.die = true;
      return { inp, press };
    }
    if (this.hurtP) {                        // touché : il encaisse (fini la rafale en cours)
      this.hurtP = false; press.hurt = true; this.burst = 0;
      this.reloadT = Math.max(this.reloadT, 0.25);
      return { inp, press };
    }
    const target = Enemy.nearest(this, targets);
    if (!target || this.act) return { inp, press };   // personne à viser, ou déjà occupé
    if (view && (this.x < view.x0 + 16 || this.x > view.x1 - 16)) {
      inp.x = this.x < view.x0 + 16 ? 1 : -1;
      this.speed = c.walk;
      if (this.blocked) press.jump = true;
      return { inp, press };
    }
    const dx = target.x - this.x, adx = Math.abs(dx);
    inp.x = dx >= 0 ? 1 : -1;
    this.followLane(target.z, dt);                           // il se met sur la file du héros
    // perché sur une plateforme, le héros en bas : il saute en bas (bas + saut)
    if (target.y > this.y + 30 && !this.air && this.terrain.platformAt(this.x, this.y)) {
      inp.y = 1; press.jump = true;
      return { inp, press };
    }
    if (adx < c.melee && this.meleeT <= 0) {                 // à bout portant : corps à corps
      inp.lock = true; press.melee = true; this.meleeT = 1.4;
    } else if (adx < c.range) {                              // à portée : il se poste et tire
      inp.lock = true;
      if (target.y < this.y - 40 * this.scale) inp.y = -1;  // héros perché : il vise en diagonale
      if (this.reloadT <= 0) {
        inp.fire = true;
        if (this.burst <= 0) this.burst = c.burst;
      }
    } else if (c.grenade && adx < c.range * 2.2 && this.grenadeT <= 0) {   // de loin : une grenade
      inp.lock = true; press.bomb = true;
      this.grenadeT = 7 + Math.random() * 4;
    } else {                                                 // sinon il avance (il court de loin)
      this.speed = adx > 240 ? c.run : c.walk;
      if (this.blocked) press.jump = true;                   // un obstacle : il saute
    }
    return { inp, press };
  }

  // la part de vie perdue, de 0 à 1
  damage() { return 1 - this.hp / this.maxHp; }

  update(dt, inp, press) {
    super.update(dt, inp, press);
    this.flashT = Math.max(0, this.flashT - dt);
    if (this.deadT >= 0) {
      this.deadT += dt;
      this.fade = this.deadT < 2.4 ? 1 : Math.max(0, 1 - (this.deadT - 2.4) / 1);
    }
  }

  // Les balles l'entament sans l'arrêter (sinon une pluie de tirs le figerait) ; un coup de
  // bâton, une explosion ou quelques médiators d'affilée le font tituber (les gros résistent).
  takeHit(dmg, heavy = false, by = null) {
    if (!this.alive()) return;
    super.takeHit(dmg);
    this.flashT = 0.06;
    if (by) this.lastHitBy = by;
    this.stagger += dmg;
    if (!this.alive()) this.deadT = 0;
    else if ((heavy && !this.cfg.heavy) || this.stagger >= (this.cfg.heavy ?? 4)) { this.stagger = 0; this.hurtP = true; }
  }
}
