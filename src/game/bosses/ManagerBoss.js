import { W } from '../../config/screen.js';
import { BOSSES } from '../../config/bosses.js';
import { levelAnim, levelFrame } from '../../data/levelSprites.js';
import { BossPart } from './BossPart.js';
import { randomLetter } from '../../config/weapons.js';

const CFG = BOSSES.manager;
const inBox = (b, x, y, r = 0) => x >= b.x - r && x <= b.x + b.w + r && y >= b.y - r && y <= b.y + b.h + r;
const WATER = { kind: 'water', fx: 'spit', tint: 0x9fd8ff, dmg: 5 };
const PAPER = { kind: 'paper', fx: 'card', gravity: 320, dmg: 6 };
const PHONE = { kind: 'phone', fx: 'phone', gravity: 380, dmg: 8 };
const WAVE = { kind: 'wave', fx: null, dmg: 10, heavy: true, life: 3.2 };

// THE MANAGER dans son open-space volant (PLAN.md § 3, niveau 1). Il entre par la droite et
// plane au-dessus de l'arène en se balançant.
//   Phase 1 : canon à eau (jets vers le héros), mégaphone (« BACK TO WORK! » : une onde au
//   ras du sol, à sauter), imprimante (lettres de licenciement en cloche). Le cockpit est
//   blindé tant qu'il reste une arme.
//   Phase 2 (rage) : coque abîmée, il bouge plus vite et lance des téléphones ; le cockpit
//   encaisse enfin.
//   Fin : explosions en chaîne, débris, le Manager éjecté s'écrase, K.O.
// hpScale : PV multipliés à deux joueurs.
export class ManagerBoss {
  constructor(arenaX, { hpScale = 1 } = {}) {
    this.cfg = CFG;
    this.name = CFG.name;
    this.arenaX = arenaX;                 // x de la caméra bloquée : l'arène fait un écran
    this.x = arenaX + W + 220;            // il arrive de la droite
    this.y = CFG.hover.y;
    this.t = 0;
    this.state = 'enter';
    this.parts = Object.fromEntries(Object.entries(CFG.parts).map(([id, c]) => [id, new BossPart(id, c, hpScale)]));
    this.timers = { cannon: 1.5, megaphone: 3.5, printer: 2.5, phone: 1, burst: 0 };
    this.debris = [];                     // { name, k, x, y, vx, vy, rot, vr }
    this.pilot = null;                    // le Manager éjecté : { x, y, vx, vy, anim, t }
    this.dropEvery = CFG.dropEvery;       // il lâche une lettre tous les `dropEvery` PV perdus
    this.nextDrop = this.dropEvery;
    this.line = CFG.line;                 // sa réplique du moment (le HUD l'affiche)
    this.lineT = 3;
    this.placeParts();
  }

  get weapons() { return Object.values(this.parts).filter((p) => !p.cfg.core); }
  get core() { return this.parts.pilot; }
  get hp() { return Object.values(this.parts).reduce((s, p) => s + p.hp, 0); }
  get maxHp() { return Object.values(this.parts).reduce((s, p) => s + p.maxHp, 0); }
  fighting() { return this.state === 'fight' || this.state === 'rage'; }
  defeated() { return this.state === 'done'; }

  // la part de vie perdue, de 0 (intact) à 1
  damage() { return 1 - this.hp / this.maxHp; }

  // La coque se dégrade avec la vie perdue : abîmée sous `damagedAt` (ou en rage), épave à la fin.
  hullFrame() {
    const h = CFG.hull;
    const dying = this.state === 'dying' || this.state === 'ejected' || this.state === 'done';
    const name = dying ? h.wrecked : this.state === 'rage' || this.damage() > 1 - CFG.damagedAt ? h.damaged : h.intact;
    return levelFrame(name, this.t);
  }

  // où visent les missiles : les armes encore debout, puis le cockpit
  aimPoints() {
    if (!this.fighting()) return [];
    const live = this.weapons.filter((w) => w.alive());
    const parts = live.length ? live : [this.core];
    return parts.map((p) => { const b = p.box(); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; });
  }

  pilotFrame() {
    const c = this.core.cfg;
    if (this.state === 'dying' || this.state === 'ejected' || this.state === 'done') return null;
    const name = this.core.hurtT > 0 ? c.hurt : this.state === 'rage' ? c.rage : this.weapons.some((w) => w.firing > 0) ? c.order : c.frame;
    return levelFrame(name, this.t);
  }

  placeParts() {
    Object.values(this.parts).forEach((p) => p.place(this.x, this.y));
  }

  // la coque, pour les tirs qui s'y écrasent
  hullBox() {
    return { x: this.x - 175, y: this.y - 200, w: 345, h: 185 };
  }

  // un vinyle qui le touche : la coque ou une pièce (il explose alors au contact)
  touches(x, y) {
    if (this.state === 'done') return false;
    return inBox(this.hullBox(), x, y) || Object.values(this.parts).some((p) => p.alive() && inBox(p.box(), x, y));
  }

  // À force d'encaisser, il perd des morceaux : une lettre tombe du vaisseau.
  #drops(world, part) {
    const lost = this.maxHp - this.hp;
    while (lost >= this.nextDrop) {
      this.nextDrop += this.dropEvery;
      world.dropPickup(randomLetter(), part.x + (Math.random() - 0.5) * 40, part.y - 10);
    }
  }

  say(line, time = 2.5) { this.line = line; this.lineT = time; }

  update(dt, world) {
    this.t += dt;
    if (this.voice) { world.play(this.voice); this.voice = null; }
    this.lineT -= dt;
    Object.values(this.parts).forEach((p) => p.update(dt));
    this.#move(dt);
    this.placeParts();
    if (this.state === 'fight' || this.state === 'rage') this.#attack(dt, world);
    if (this.state === 'dying') this.#dying(dt, world);
    if (this.fighting()) this.#wear(dt, world);
    if (this.state === 'ejected') this.#ejected(dt, world);
    this.#moveDebris(dt);
  }

  #move(dt) {
    const h = CFG.hover, home = this.arenaX + W * 0.7;
    if (this.state === 'enter') {
      this.x -= 120 * dt;
      this.y = h.y + Math.sin(this.t * 3) * h.bob;
      if (this.x <= home) { this.state = 'fight'; this.t = 0; this.say(CFG.line); this.voice = 'work_to_survive'; }
      return;
    }
    if (this.state === 'dying') { this.y += 18 * dt; this.x += Math.sin(this.t * 20) * 0.6; return; }
    if (this.state === 'ejected' || this.state === 'done') { this.y += 160 * dt; return; }
    const speed = h.speed * (this.state === 'rage' ? 1.8 : 1);
    this.x = home - h.amp + Math.cos(this.t * speed) * h.amp;
    this.y = h.y + Math.sin(this.t * 3) * h.bob;
  }

  #attack(dt, world) {
    const T = this.timers, P = this.parts;
    for (const k of Object.keys(T)) T[k] -= dt;
    const target = world.heroesAlive().sort((a, b) => Math.abs(a.x - this.x) - Math.abs(b.x - this.x))[0];
    if (!target) return;
    // le canon à eau : une salve de jets vers le héros
    if (P.cannon.alive() && T.cannon <= 0) {
      if (T.burst <= 0) T.burst = 1.1;
      P.cannon.firing = 0.15;
      const mx = P.cannon.x - 40, my = P.cannon.y - 32;
      const ang = Math.atan2(target.y - 40 - my, target.x - mx);
      world.shots.push({ ...WATER, side: 'boss', x: mx, y: my, vx: Math.cos(ang) * 260, vy: Math.sin(ang) * 260, t: 0 });
      world.play('water');
      T.cannon = 0.1;
      if (T.burst - 0.1 <= 0) { T.cannon = this.state === 'rage' ? 1.2 : 2.2; T.burst = 0; }
    }
    // le mégaphone : « BACK TO WORK! », une onde de choc au ras du sol, des deux côtés
    if (P.megaphone.alive() && T.megaphone <= 0) {
      P.megaphone.firing = 0.7;
      this.say(CFG.rage, 1.5);
      world.play('back_to_work');
      const gy = world.terrain.solidAt(P.megaphone.x) - 12;
      for (const dir of [-1, 1]) world.shots.push({ ...WAVE, side: 'boss', x: P.megaphone.x, y: gy, vx: dir * 170, vy: 0, t: 0 });
      T.megaphone = 4.5;
    }
    // l'imprimante : trois lettres de licenciement en cloche
    if (P.printer.alive() && T.printer <= 0) {
      P.printer.firing = 0.8;
      world.play('throw');
      for (let i = 0; i < 3; i++) {
        world.shots.push({ ...PAPER, side: 'boss', x: P.printer.x - 30, y: P.printer.y - 30, vx: -60 - i * 45 - Math.random() * 20, vy: -140 - i * 20, t: 0 });
      }
      T.printer = 3.2;
    }
    // en rage : il lance des téléphones sur le héros
    if (this.state === 'rage' && T.phone <= 0) {
      const p = this.core, dx = target.x - p.x;
      world.shots.push({ ...PHONE, side: 'boss', x: p.x - 20, y: p.y - 20, vx: dx * 0.9, vy: -200, t: 0 });
      T.phone = 1.1;
    }
  }

  // Plus il a perdu de vie, plus il fume, crache des étincelles et prend feu, à des endroits
  // pris au hasard sur la coque.
  #wear(dt, world) {
    const d = this.damage(), hb = this.hullBox();
    const at = () => [hb.x + 20 + Math.random() * (hb.w - 40), hb.y + 20 + Math.random() * (hb.h - 40)];
    if (Math.random() < d * 14 * dt) { const [x, y] = at(); world.effects.add('dust', x, y, { vy: -35 - Math.random() * 25, vx: 25 }); }
    if (d > 0.33 && Math.random() < d * 6 * dt) { const [x, y] = at(); world.effects.add('zap', x, y, { life: 0.35 }); }
    if (d > 0.6 && Math.random() < d * 5 * dt) { const [x, y] = at(); world.effects.add('fire', x, y, { vy: -12, life: 0.6 }); }
  }

  // Un coup en (x, y), rayon r pour une explosion. Renvoie true si le vaisseau l'a pris.
  hitAt(x, y, dmg, by, world, r = 0) {
    dmg *= CFG.dmgFactor;
    if (this.state === 'enter' || this.state === 'done') return inBox(this.hullBox(), x, y, r) && this.state !== 'done';
    if (!this.fighting()) return inBox(this.hullBox(), x, y, r);
    let touched = false;
    for (const part of this.weapons) {
      if (!part.alive() || !inBox(part.box(), x, y, r)) continue;
      touched = true;
      if (part.hit(dmg)) this.#partDestroyed(part, by, world);
      this.#drops(world, part);
    }
    const core = this.core;
    if (inBox(core.box(), x, y, r)) {
      touched = true;
      if (this.state === 'rage') {
        if (core.hit(dmg)) this.#coreDestroyed(by, world);
        else this.#drops(world, core);
      } else world.effects.add('impact', x, y);      // blindé tant qu'il reste une arme
    }
    return touched || inBox(this.hullBox(), x, y, r);
  }

  #partDestroyed(part, by, world) {
    world.explode(part.x, part.y, 'none');
    world.dropPickup('V', part.x, part.y - 10);   // une pièce détruite lâche toujours des vinyles
    world.events.push({ type: 'bossPart', by, score: CFG.partScore });
    if (this.weapons.every((w) => !w.alive())) {
      this.state = 'rage';
      this.say(CFG.rage, 3);
      world.shake = 0.6;
    }
  }

  #coreDestroyed(by, world) {
    this.state = 'dying';
    this.t = 0;
    this.timers.boom = 0;
    world.events.push({ type: 'bossPart', by, score: CFG.score });
    world.play('big_explosion');
    this.say('NOOOON ! MES ACTIONNAIRES !', 3);
  }

  // explosions en chaîne sur la coque, débris qui volent, puis le Manager est éjecté
  #dying(dt, world) {
    this.timers.boom -= dt;
    if (this.timers.boom <= 0) {
      this.timers.boom = 0.14;
      const hb = this.hullBox();
      world.effects.add('explosion', hb.x + Math.random() * hb.w, hb.y + 30 + Math.random() * (hb.h - 30));
      world.shake = 0.3;
      if (Math.random() < 0.3) world.play('explosion');
      const frames = levelAnim(CFG.hull.debris).frames.length;
      this.debris.push({
        name: CFG.hull.debris, k: Math.floor(Math.random() * frames),
        x: this.x + (Math.random() - 0.5) * 300, y: this.y - 100 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 260, vy: -180 - Math.random() * 160, rot: 0, vr: (Math.random() - 0.5) * 8,
      });
    }
    if (this.t > 2.6) {
      this.state = 'ejected';
      const p = this.core;
      this.pilot = { x: p.x, y: p.y - 20, vx: -90, vy: -260, anim: 'manager_ejected', t: 0, ground: null };
    }
  }

  #ejected(dt, world) {
    const b = this.pilot;
    b.t += dt;
    if (b.anim === 'manager_ko') return;
    b.vy += 520 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    const floor = world.terrain.solidAt(b.x);
    if (b.vy > 0 && b.y >= floor) {
      b.y = floor; b.anim = 'manager_ko'; b.t = 0;
      world.effects.add('dust', b.x, b.y - 6);
      world.shake = 0.3;
      this.state = 'done';
      world.events.push({ type: 'bossDefeated' });
    }
  }

  #moveDebris(dt) {
    for (const d of this.debris) {
      d.vy += 520 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt;
    }
    this.debris = this.debris.filter((d) => d.y < 500);
  }
}
