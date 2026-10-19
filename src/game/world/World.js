import { W } from '../../config/screen.js';
import { DIRS } from '../../config/anims.js';
import {
  BOMB_GRAVITY, BULLET_DMG, MELEE_DMG, BOMB_DMG, BLAST_RADIUS, MELEE_REACH, DEPTH, SKATE,
} from '../../config/combat.js';
import { randomLetter, ROCKET } from '../../config/weapons.js';
import { SHOT_SOUNDS, PICKUP_VOICES } from '../../config/sounds.js';
import { Enemy } from '../actors/Enemy.js';
import { Pickup } from '../actors/Pickup.js';
import { Hostage } from '../actors/Hostage.js';
import { Effects } from './Effects.js';

const THROWS = ['throw', 'crouch_throw'];
const MELEES = ['melee', 'crouch_melee'];
const IDLE = { inp: {}, press: {} };
const EDGE = 12;                          // marge des héros au bord de l'écran
const isBomb = (p) => p.kind === 'vinyl' || p.kind === 'grenade';
const explodes = (p) => isBomb(p) || p.kind === 'rocket';      // éclate au contact
const inBox = (b, x, y) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
// même file : la profondeur d'un coup (z, ou null pour « toutes ») et celle de la cible
const sameLane = (a, z) => z == null || Math.abs((a.z ?? 0) - z) <= DEPTH.hit;

// Ce qui se passe dans le niveau : les héros (1 ou 2), les ennemis, le décor cassable, les
// habitants, les bonus, le boss, les projectiles, les effets, la caméra. Une image se joue en
// deux temps :
//   update(dt, inputs)  : tout le monde bouge, la caméra suit ;
//   resolve(dt, split)  : poses, tirs et coups qui partent, projectiles qui touchent.
// Les acteurs ont une profondeur z (quelques pixels vers le fond ou vers l'avant du trottoir) :
// un coup ne touche que ce qui est sur la même file (DEPTH.hit). La physique, elle, ignore z.
// Ce qui compte pour la partie (K.O., bonus, habitants libérés…) part dans `events`, les sons
// à jouer dans `sounds` : la session et la scène les vident à chaque image. Le dessin
// (views/WorldView) ne fait que lire cet état.
export class World {
  heroes = [];
  enemies = [];
  hostages = [];
  pickups = [];
  shots = [];        // { kind, fx, side, owner, dmg, x, y, z, vx, vy, t, life?, tint? }
  visibleShots = [];
  effects = new Effects();
  boss = null;
  events = [];
  sounds = [];
  cam = 0;
  camLock = null;    // la caméra ne dépasse pas ce x (arène, vague à finir)
  scrollBack = true; // la démo revient en arrière ; le jeu, jamais
  shake = 0;
  shakeOffset = null;  // [dx, dy] de la secousse à cette image, ou null

  constructor(level) {
    this.level = level;
    this.terrain = level.terrain;
    this.props = level.props;
    this.hostages = (level.def.hostages ?? []).map((h) => new Hostage(h));
  }

  get hero() { return this.heroes[0]; }

  play(sound) { this.sounds.push(sound); }

  // un effet, décalé de la profondeur de ce qui l'a produit
  fx(name, x, y, z = 0, opts = {}) {
    this.effects.add(name, x, y + (z ?? 0), opts);
  }

  // la démo : un seul héros, tout le reste vidé, caméra sur lui
  reset(hero) {
    this.heroes = [];
    this.addHero(hero);
    this.enemies.length = this.shots.length = this.visibleShots.length = this.pickups.length = 0;
    this.effects.clear();
    this.cam = this.camTarget();
  }

  addHero(hero) {
    hero.terrain = this.terrain;
    this.heroes.push(hero);
  }

  spawnEnemy(type, x, y, hp) {
    const e = new Enemy(type, x, y ?? this.terrain.solidAt(x), hp);
    e.terrain = this.terrain;
    e.facing = -1;
    e.z = Math.round(DEPTH.min + Math.random() * (DEPTH.max - DEPTH.min));
    this.enemies.push(e);
    return e;
  }

  // Un combat (démo) : le héros reprend des forces, et un CRS entre par la droite de l'écran.
  startFight(hp) {
    this.hero.heal();
    this.enemies.length = 0;
    this.spawnEnemy('crs', Math.min(this.level.width - 26, Math.max(this.cam + W + 24, this.hero.x + 150)), undefined, hp);
  }

  fighting() { return this.enemies.length > 0; }
  enemiesStanding() { return this.enemies.some((e) => e.alive()); }
  heroesAlive() { return this.heroes.filter((h) => h.alive()); }

  // la caméra vise le héros le plus avancé, sans perdre de vue le plus en retard
  camTarget() {
    const alive = this.heroesAlive().length ? this.heroesAlive() : this.heroes;
    const xs = alive.map((h) => h.x);
    let target = Math.max(...xs) - W * 0.38;
    target = Math.min(target, Math.min(...xs) - EDGE * 2);
    const max = Math.min(this.level.width - W, this.camLock ?? Infinity);
    return Math.max(0, Math.min(max, target));
  }

  update(dt, inputs = []) {
    this.heroes.forEach((h, i) => this.#updateHero(h, dt, inputs[i] ?? IDLE));
    // les ennemis jouent leur tour, et leur corps s'efface une fois mort
    const view = this.scrollBack ? null : { x0: this.cam, x1: this.cam + W };
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const { inp, press } = e.think(dt, this.heroes, view);
      e.update(dt, inp, press);
      e.x = this.level.clamp(e.x);
      if (e.cfg.wear && e.alive()) this.#wear(e, dt);
      // laissé loin derrière la caméra : il disparaît (sans points)
      if (view && e.alive() && e.x < this.cam - 150) { e.hp = 0; e.deadT = 99; e.scored = true; }
      if (e.gone()) this.enemies.splice(i, 1);
    }
    this.boss?.update(dt, this);
    this.props.forEach((p) => p.update(dt));
    this.#updateHostages(dt);
    this.#updatePickups(dt);
    // la caméra suit en douceur, sans sortir du niveau
    const target = this.camTarget();
    const next = this.cam + (target - this.cam) * Math.min(1, dt * 4);
    this.cam = this.scrollBack ? next : Math.max(this.cam, Math.min(next, target));
    if (this.camLock !== null) this.cam = Math.min(this.cam, this.camLock);
    this.shakeOffset = null;
    if (this.shake > 0) {
      this.shake -= dt;
      this.shakeOffset = [Math.round((Math.random() - 0.5) * 4), Math.round((Math.random() - 0.5) * 3)];
    }
  }

  // Une télé abîmée fume par le haut de son écran, crache des étincelles, puis prend feu.
  #wear(e, dt) {
    const d = e.damage(), k = e.scale;
    const x = () => e.x + (Math.random() - 0.5) * 22 * k, y = e.y - e.p.hauteur * k * 0.82;
    if (d > 0.25 && Math.random() < d * 10 * dt) this.fx('dust', x(), y, e.z, { vy: -30 - Math.random() * 20, vx: 10 });
    if (d > 0.45 && Math.random() < d * 6 * dt) this.fx('zap', x(), y + 10 * k, e.z, { life: 0.3 });
    if (d > 0.65 && k > 1 && Math.random() < d * 5 * dt) this.fx('fire', x(), y, e.z, { vy: -10, life: 0.5 });
  }

  #updateHero(h, dt, { inp, press }) {
    if (h.hurtP) { press = { ...press, hurt: true }; h.hurtP = false; }
    // comme dans Metal Slug : tirer au contact d'un ennemi donne un coup de corps à corps
    if (inp.fire && h.fireCD - dt <= 0 && !h.act
      && this.enemies.some((e) => e.alive() && Math.abs(e.x - h.x) < 34 && Math.abs(e.y - h.y) < 60 && sameLane(e, h.z))) {
      press = { ...press, melee: true };
      inp = { ...inp, fire: false };
      h.fireCD = 0.45;
    }
    const hp = h.hp;
    h.update(dt, { ...inp, die: inp.die || h.hp <= 0 }, press);
    // dans le niveau, et dans l'écran quand la caméra ne revient pas en arrière
    const lo = this.scrollBack ? 20 : Math.max(20, this.cam + EDGE);
    const hi = this.scrollBack ? this.level.width - 20 : Math.min(this.level.width - 20, this.cam + W - EDGE);
    h.x = Math.max(lo, Math.min(hi, h.x));
    if (h.hp <= 0) h.downT += dt;
    if (h.hp < hp) this.play('hit');
    if (h.startedSkate) this.play('skate');
    if (h.riding) this.#skateHits(h);
  }

  // L'attaque en skate renverse ce qu'elle touche, une fois par glisse : ennemis (repoussés),
  // caisses, habitants. La poussière vole derrière la planche.
  #skateHits(h) {
    const near = (x, y) => Math.abs(x - h.x) < SKATE.reach && Math.abs(y - h.y) < 50;
    for (const e of this.enemies) {
      if (!e.alive() || h.skated.has(e) || !near(e.x, e.y) || !sameLane(e, h.z)) continue;
      h.skated.add(e);
      e.takeHit(SKATE.dmg, true, h);
      e.x += h.facing * SKATE.push;
      this.fx('impact', e.x, e.y - 30, e.z);
      this.play('melee');
    }
    for (const p of this.props) {
      // une caisse se casse dès que la planche arrive contre elle (on compte sa demi-largeur)
      const reach = SKATE.reach + p.box().w / 2 + 4;
      if (p.breakable() && !h.skated.has(p) && Math.abs(p.x - h.x) < reach && Math.abs(h.z) <= DEPTH.block) { h.skated.add(p); this.#hitProp(p, SKATE.dmg * 2, h); }
    }
    this.hostages.forEach((x) => { if (near(x.x, x.y) && sameLane(h, 0)) this.#free(x, h); });
    if (Math.random() < 0.5) this.fx('dust', h.x - h.facing * 12, h.y - 3, h.z, { vx: -h.facing * 30 });
  }

  #updateHostages(dt) {
    for (let i = this.hostages.length - 1; i >= 0; i--) {
      const h = this.hostages[i];
      // un héros qui le touche le libère aussi
      if (h.plugged() && this.heroesAlive().some((hero) => Math.abs(hero.x - h.x) < 18 && Math.abs(hero.y - h.y) < 30 && sameLane(hero, 0))) this.#free(h, null);
      if (h.update(dt)) this.dropPickup(h.gift, h.x - 16, h.y - 20);
      if (h.state === 'run' && h.x < this.cam - 80) this.hostages.splice(i, 1);
    }
  }

  #updatePickups(dt) {
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.update(dt);
      const taker = this.heroesAlive().find((h) => sameLane(h, 0) && (inBox(p.box(), h.x, h.y - 10) || inBox(p.box(), h.x, h.y - 40)));
      if (taker) {
        taker.pickUp(p.letter);
        p.taken = true;
        this.events.push({ type: 'pickup', by: taker, letter: p.letter });
        this.play('pickup');
        this.play(PICKUP_VOICES[p.letter]);
      }
      if (p.expired()) this.pickups.splice(i, 1);
    }
  }

  dropPickup(letter, x, y) {
    this.pickups.push(new Pickup(letter, x, y, this.terrain));
  }

  #free(h, by) {
    if (!h.free()) return;
    this.events.push({ type: 'hostage', by });
    this.play('thank_you');
  }

  resolve(dt, split) {
    // les ennemis d'abord, les héros ensuite (ils sont dessinés par-dessus)
    this.enemies.forEach((e) => this.#act(e, dt, false));
    this.heroes.forEach((h) => this.#act(h, dt, split));
    this.#scoreKills();
    this.#moveShots(dt);
    this.effects.update(dt);
  }

  // les ennemis qui viennent de tomber rapportent des points au dernier héros qui les a touchés
  #scoreKills() {
    for (const e of this.enemies) {
      if (e.alive() || e.scored) continue;
      e.scored = true;
      this.events.push({ type: 'kill', by: e.lastHitBy, score: e.cfg.score, enemy: e });
      this.play('hit');
    }
  }

  // Ce que l'acteur vient de faire à cette image : tirer, lancer, frapper, atterrir, marcher.
  #act(a, dt, split) {
    const P = a.computePose(split);
    if (a.fired) this.#fire(a, P);
    if (THROWS.includes(a.spawn)) {
      const [mx, my] = P.hand;
      // en visant vers le haut (S + ↑, ou ↑ en l'air), le vinyle monte haut : jusqu'au vaisseau du boss
      const high = a.dir === 'up' ? [0, -430] : a.dir === 'diagup' ? [a.facing * 110, -400] : null;
      const [vx, vy] = high ?? [a.facing * 150, a.spawn === 'throw' ? -170 : -120];
      if (a.side === 'hero') this.shots.push({ kind: 'vinyl', fx: 'vinyl', side: a.side, owner: a, x: mx, y: my, z: a.z, vx, vy, t: 0 });
      else this.shots.push({ kind: 'grenade', fx: 'grenade', side: a.side, x: mx, y: my, z: a.z, vx: a.facing * 175, vy: -180, t: 0 });
      this.play('throw');
    }
    if (MELEES.includes(a.spawn)) this.#melee(a, P);
    if (a.landT === 0) this.fx('dust', a.x, a.y - 5, a.z);
    if (a.vx && !a.air && !a.blocked && Math.random() < dt * 4) this.fx('dust', a.x - a.facing * 8, a.y - 4, a.z, { vx: -a.facing * 15 });
  }

  // Un tir part de la bouche de l'arme : un projectile, ou un éventail (power chord, télé géante).
  #fire(a, P) {
    const [dx, dy] = DIRS[a.fired], n = Math.hypot(dx, dy);
    const base = Math.atan2(dy / n, a.facing * dx / n);
    const [mx, my] = P.muzzle;
    const hero = a.side === 'hero';
    const w = hero ? a.weaponDef : null;
    const angles = w ? w.spread : (a.cfg?.fan ?? [0]);
    const speed = w ? w.speed : a.bullet;
    this.play(SHOT_SOUNDS[hero ? a.weapon : a.ammo] ?? 'enemy_shot');
    for (const da of angles) {
      // l'angle part de la direction de tir, côté où regarde le tireur
      const ang = base + da * a.facing + (w?.jitter ? (Math.random() - 0.5) * w.jitter : 0);
      // un ennemi entre le tireur et le bout de son arme prend le tir tout de suite
      if (hero && this.#pointBlank(a, mx, my, w.dmg)) continue;
      // les missiles ne choisissent pas de file : ils vont chercher leur cible où qu'elle soit
      this.shots.push({
        kind: w?.homing ? 'rocket' : a.ammo, fx: a.pick, side: a.side, owner: hero ? a : null,
        dmg: w ? w.dmg : BULLET_DMG, life: w?.homing ? ROCKET.life : w?.life,
        x: mx, y: my, z: w?.homing ? null : a.z, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, t: 0,
      });
    }
    if (hero) a.spendAmmo();
    const vx = Math.cos(base), vy = Math.sin(base);
    if (a.muzzleFlash) this.fx('flash', mx, my, a.z, { angle: Math.atan2(vy, Math.abs(vx)) * Math.sign(a.facing || 1), flip: a.facing });
  }

  #pointBlank(a, mx, my, dmg) {
    for (let x = a.x; Math.abs(x - a.x) <= Math.abs(mx - a.x); x += 6 * Math.sign(mx - a.x || 1)) {
      const e = this.enemies.find((e) => e.alive() && sameLane(e, a.z) && e.touches(x, my));
      if (e) {
        e.takeHit(dmg, false, a);
        this.fx('impact', x, my, a.z);
        return true;
      }
      if (mx === a.x) break;
    }
    return false;
  }

  #melee(a, P) {
    const [hx, hy] = P.hand;
    this.fx('impact', hx, hy, a.z);
    this.play('melee');
    if (a.side !== 'hero') {
      const reach = a.cfg?.melee ?? MELEE_REACH;
      this.heroes.forEach((h) => { if (Math.abs(h.x - a.x) < reach && Math.abs(h.y - a.y) < 40 && sameLane(h, a.z)) h.takeHit(MELEE_DMG * (a.scale ?? 1), true); });
      return;
    }
    const near = (x, y) => Math.abs(x - hx) < MELEE_REACH && Math.abs(y - a.y) < 50;
    this.enemies.forEach((e) => { if (e.alive() && near(e.x, e.y) && sameLane(e, a.z)) e.takeHit(MELEE_DMG * 2, true, a); });
    this.props.forEach((p) => { if (p.breakable() && near(p.x, p.y)) this.#hitProp(p, MELEE_DMG, a); });
    this.hostages.forEach((h) => { if (near(h.x, h.y) && sameLane(a, 0)) this.#free(h, a); });
    this.boss?.hitAt(hx, hy, MELEE_DMG * 2, a, this);
  }

  #hitProp(p, dmg, by) {
    if (!p.hit(dmg)) return;
    this.terrain.removeBlocks(p.id);
    this.fx('impact', p.x, p.y - 20);
    this.fx('dust', p.x, p.y - 6);
    this.events.push({ type: 'prop', by, score: p.cfg.score ?? 0 });
    if (p.cfg.explodes) this.explode(p.x, p.y, 'hero', by);
    else this.play('crate');
    const letter = p.drop ?? (p.cfg.drop && Math.random() < 0.7 ? randomLetter() : null);
    if (letter) this.dropPickup(letter, p.x, p.y - 20);
  }

  // Les projectiles touchent un adversaire, sinon s'arrêtent au sol ou sortent de l'écran.
  #moveShots(dt) {
    const ox = Math.round(this.cam);
    this.visibleShots = [];
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const p = this.shots[i], bomb = isBomb(p), boom = explodes(p), prevY = p.y;
      p.t += dt;
      if (bomb || p.gravity) p.vy += (p.gravity ?? BOMB_GRAVITY) * dt;
      if (p.kind === 'rocket') this.#steer(p, dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      const hit = p.side === 'hero' ? this.#heroShotHits(p, boom) : this.#enemyShotHits(p, boom);
      // un vinyle, une grenade, un missile explosent au contact : c'est l'explosion qui fait les dégâts
      if (hit && boom) {
        // un missile (sans file) explose sur la file de ce qu'il a touché
        const z = p.z ?? p.hitZ ?? 0;
        this.explode(p.x, p.y + 20 - (p.z == null ? z : 0), p.side, p.owner, z, p.kind === 'rocket' ? ROCKET.power : 1);
        this.shots.splice(i, 1);
        continue;
      }
      const land = bomb || p.gravity ? this.terrain.landing(p.x, prevY, p.y, null, p.z ?? 0) : (p.y >= this.terrain.solidAt(p.x, p.z ?? 0) ? p.y : null);
      if (land !== null && p.kind === 'rocket') {
        this.explode(p.x, land, p.side, p.owner, 0, ROCKET.power);
        this.shots.splice(i, 1);
        continue;
      }
      if (hit) {
        this.fx('impact', p.x, p.y, p.z);
        this.shots.splice(i, 1);
      } else if (land !== null) {
        if (bomb) this.explode(p.x, land, p.side, p.owner, p.z);
        else this.fx('impact', p.x, land - 3, p.z);
        this.shots.splice(i, 1);
      } else if (p.x < ox - 20 || p.x > ox + W + 20 || p.y < -40 || (p.life && p.t > p.life)) {
        this.shots.splice(i, 1);
      } else {
        this.visibleShots.push(p);
      }
    }
  }

  // Un missile vire vers la cible la plus proche (ennemi debout, ou pièce du boss), accélère,
  // et laisse une traînée de fumée.
  #steer(p, dt) {
    const target = this.#rocketTarget(p);
    const speed = Math.min(ROCKET.top, Math.hypot(p.vx, p.vy) + ROCKET.accel * dt);
    let ang = Math.atan2(p.vy, p.vx);
    if (target) {
      const want = Math.atan2(target.y - p.y, target.x - p.x);
      const d = Math.atan2(Math.sin(want - ang), Math.cos(want - ang));
      ang += Math.max(-ROCKET.turn * dt, Math.min(ROCKET.turn * dt, d));
    }
    p.vx = Math.cos(ang) * speed; p.vy = Math.sin(ang) * speed;
    if (Math.random() < dt * 25) this.fx('dust', p.x - p.vx * 0.02, p.y - p.vy * 0.02, 0, { vy: -10 });
  }

  #rocketTarget(p) {
    const points = [
      ...this.enemies.filter((e) => e.alive()).map((e) => ({ x: e.x, y: e.y - e.p.hauteur * e.scale * 0.55 + e.z })),
      ...(this.boss?.aimPoints() ?? []),
    ];
    let best = null, bd = Infinity;
    for (const t of points) {
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }

  // Un tir de héros : ennemi (sur sa file), boss, caisse ou habitant sur sa route. Un vinyle
  // ou un missile ne fait que toucher (il explose ensuite) : ses dégâts viennent de l'explosion.
  #heroShotHits(p, bomb) {
    const dmg = bomb ? 0 : p.dmg;
    const e = this.enemies.find((e) => e.alive() && sameLane(e, p.z) && e.touches(p.x, p.y - (p.z == null ? e.z : 0)));
    if (e) { if (!bomb) e.takeHit(dmg, false, p.owner); p.hitZ = e.z; return true; }
    if (bomb ? this.boss?.touches(p.x, p.y) : this.boss?.hitAt(p.x, p.y, dmg, p.owner, this)) return true;
    if (bomb) return false;
    const prop = this.props.find((q) => q.breakable() && inBox(q.box(), p.x, p.y));
    if (prop) { this.#hitProp(prop, dmg, p.owner); return true; }
    const h = this.hostages.find((h) => h.plugged() && inBox(h.box(), p.x, p.y));
    if (h) { this.#free(h, p.owner); return true; }
    return false;
  }

  // un tir ennemi (sur sa file) ; ceux du boss (z absent) touchent toutes les files
  #enemyShotHits(p, bomb) {
    const h = this.heroes.find((h) => h.alive() && h.invulnT <= 0 && sameLane(h, p.z) && h.touches(p.x, p.y));
    if (!h) return false;
    if (!bomb) h.takeHit(p.dmg ?? BULLET_DMG, !!p.heavy);
    return true;
  }

  // power : la force de l'explosion (1 pour un vinyle ; moins pour un missile)
  explode(x, y, side = 'hero', by = null, z = 0, power = 1) {
    this.fx('explosion', x, y - 30, z);
    this.fx('dust', x - 14, y - 6, z, { vx: -20 });
    this.fx('dust', x + 14, y - 6, z, { vx: 20 });
    for (let i = 0; i < 4; i++) {
      this.fx('notes', x + (Math.random() - 0.5) * 50, y - 40 - Math.random() * 30, z, { vy: -30 - Math.random() * 20, delay: 0.15 + i * 0.08 });
    }
    this.shake = 0.25;
    this.play('explosion');
    // le souffle touche qui n'a pas lancé l'engin ('none' : une explosion de décor, sans dégâts)
    if (side === 'none') return;
    const near = (a) => Math.abs(a.x - x) < BLAST_RADIUS && Math.abs(a.y - y) < BLAST_RADIUS && Math.abs((a.z ?? 0) - (z ?? 0)) < DEPTH.blast;
    if (side === 'hero') {
      const dmg = BOMB_DMG * power;
      this.enemies.forEach((e) => { if (near(e)) e.takeHit(dmg, true, by); });
      this.props.forEach((p) => { if (p.breakable() && near(p)) this.#hitProp(p, dmg, by); });
      this.boss?.hitAt(x, y - 20, dmg * 2, by, this, BLAST_RADIUS);   // les explosions font mal au vaisseau
    } else {
      this.heroes.forEach((h) => { if (near(h)) h.takeHit(BOMB_DMG, true); });
    }
  }
}
