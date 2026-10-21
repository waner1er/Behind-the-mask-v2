import { W } from '../../config/screen.js';

const REACH = 220;         // au-delà, il marche vers l'ennemi en tirant
const LANE_OK = 6;         // écart de profondeur toléré avant de changer de file
const RIGHT = 0.6;         // il ne va pas plus loin que 60 % de l'écran (la caméra le suit)
const BEHIND = 110;        // l'invité trop loin derrière celui qu'il suit le rattrape
const DODGE = { time: 1.5, lane: 28 };   // bloqué par une caisse : il passe devant elle (DEPTH.block)

// Le joueur automatique du clip : ce qu'il ferait avec une manette ({ inp, press }), comme
// l'Autopilot de la démo, mais face à la partie. Il avance en tirant par rafales, se met sur
// la file de l'ennemi le plus proche et le canarde, saute de temps en temps, lance ses vinyles,
// et sous le boss, se poste sous une pièce pour tirer vers le haut. Plus la frénésie
// (intensity, de 0 à 1) monte, plus il tire, saute et lance.
//   lane   : sa file de prédilection quand rien ne se passe
//   follow : le héros qu'il suit (l'invité suit le joueur 1, un peu en retrait)
//   rear   : il vise d'abord les ennemis derrière celui qu'il suit (il couvre ses arrières)
export class HeroPilot {
  constructor(hero, { lane = 0, follow = null, side = -1, rear = false } = {}) {
    this.hero = hero;
    this.lane = lane;
    this.follow = follow;
    this.rear = rear;
    this.side = side;              // sous le boss : à gauche (-1) ou à droite (1) de sa cible
    this.t = 0;
    this.jumpT = 2 + Math.random() * 2;
    this.bombT = 3;
    this.dodgeT = 0;
  }

  // hold : il attend sur place (le clip est en avance) ; push : il fonce vers la droite en
  // tirant (en retard) ; intensity : la frénésie, de 0 à 1
  next(dt, world, { hold = false, push = false, intensity = 0 } = {}) {
    const h = this.hero;
    this.t += dt; this.jumpT -= dt; this.bombT -= dt; this.dodgeT -= dt;
    if (h.blocked && !h.air) this.dodgeT = DODGE.time;
    this.intensity = intensity;
    const inp = { x: 0, y: 0, fire: false, lock: false }, press = {};
    if (!h.alive()) return { inp, press };
    const boss = world.boss;
    if (boss && boss.state !== 'enter' && !boss.defeated() && boss.fighting()) this.#boss(world, boss, inp, press);
    else {
      // l'invité à la traîne retient la caméra : il rattrape d'abord celui qu'il suit
      const lagging = this.follow && world.camLock === null && h.x < this.follow.x - BEHIND;
      const foe = lagging ? null : this.#nearestFoe(world);
      // pressé, il laisse les ennemis derrière lui, sauf dans une arène (il faut tous les battre)
      const skip = push && world.camLock === null && foe && foe.x < h.x - 30;
      if (foe && !skip) this.#fight(foe, inp, press, push);
      else this.#walk(world, hold, inp);
      // contre une caisse : il change de file pour passer devant
      if (this.dodgeT > 0 && Math.abs(DODGE.lane - h.z) > 2) inp.y = Math.sign(DODGE.lane - h.z);
      // pas plus loin que RIGHT : au-delà, il s'arrête et se tourne vers la droite
      if (inp.x > 0 && !inp.lock && h.x > world.cam + W * RIGHT) inp.lock = true;
    }
    // de temps en temps, un saut, pour la frime (et passer les ondes du mégaphone)
    if (this.jumpT <= 0 && !h.air) {
      press.jump = true;
      this.jumpT = (2.5 + Math.random() * 3) * (1 - intensity * 0.6);
    }
    return { inp, press };
  }

  #nearestFoe(world) {
    const h = this.hero, x0 = world.cam - 10, x1 = world.cam + W + 10;
    const behind = (e) => this.rear && this.follow && e.x < this.follow.x;
    let best = null;
    for (const e of world.enemies) {
      if (!e.alive() || e.x < x0 || e.x > x1) continue;
      if (best && behind(best) && !behind(e)) continue;
      if (!best || (behind(e) && !behind(best)) || Math.abs(e.x - h.x) < Math.abs(best.x - h.x)) best = e;
    }
    return best;
  }

  // le temps entre deux vinyles, de plus en plus court
  #bombed() { this.bombT = 3.5 - 2.6 * this.intensity; }

  #fight(foe, inp, press, push) {
    const h = this.hero, dx = foe.x - h.x, dir = Math.sign(dx) || 1, dz = foe.z - h.z;
    if (Math.abs(dz) > LANE_OK && h.onGround()) {
      // sur sa file d'abord, en tirant devant soi
      inp.y = Math.sign(dz);
      inp.fire = true;
      if (Math.abs(dx) > REACH) inp.x = dir;
      return;
    }
    if (Math.abs(dx) > REACH || push) { inp.x = dir; inp.fire = true; return; }
    // à portée : il se tourne vers lui sans avancer, et tire
    inp.lock = true;
    inp.x = dir;
    inp.fire = true;
    if (h.bombs > 0 && this.bombT <= 0 && Math.abs(dx) > 60 && Math.abs(dx) < 160) {
      press.bomb = true;
      this.#bombed();
    }
  }

  // Rien à l'écran : il avance (en tirant par rafales : les caisses cassent, les habitants sont
  // débranchés), ou attend, et revient sur sa file. L'invité reste près de celui qu'il suit.
  #walk(world, hold, inp) {
    const h = this.hero;
    const dz = this.lane - h.z;
    if (Math.abs(dz) > LANE_OK) inp.y = Math.sign(dz);
    let go = !hold;
    if (this.follow) {
      const gap = h.x - (this.follow.x - 45);
      go = gap < -20 || (!hold && gap < 30);
    }
    if (go) {
      inp.x = 1;
      inp.fire = this.intensity > 0.3 || this.t % 2.2 < 1.1;
    }
  }

  // Sous le boss : il se poste sous une pièce encore debout (le cockpit à la fin) et tire vers
  // le haut, en lançant ses vinyles vers le haut aussi.
  #boss(world, boss, inp, press) {
    const h = this.hero, pts = boss.aimPoints();
    if (!pts.length) return;
    const target = this.side < 0 ? pts[0] : pts[pts.length - 1];
    const lo = world.cam + 20, hi = world.cam + W - 20;
    const tx = Math.max(lo, Math.min(hi, target.x + this.side * 12));
    const dx = tx - h.x;
    if (Math.abs(dx) > 18 && !h.air) {
      inp.x = Math.sign(dx);
      inp.fire = this.t % 1.5 < 0.6;
      return;
    }
    inp.lock = true;
    inp.y = -1;
    inp.fire = true;
    if (h.bombs > 0 && this.bombT <= 0) {
      press.bomb = true;
      this.#bombed();
    }
  }
}
