import { W } from '../../config/screen.js';
import { HERO_WALK, DEPTH } from '../../config/combat.js';
import { WEAPONS } from '../../config/weapons.js';
import { GameSession } from '../session/GameSession.js';
import { HeroPilot } from './HeroPilot.js';
import { Shatter, WALL_FOOT } from './Shatter.js';

const HP_FLOOR = 40;        // les héros du clip ne tombent jamais
const ENEMY_HP = 0.6;       // les ennemis du clip encaissent moins, pour tenir le tempo
const LATE_HP = 0.3;        // et encore moins s'ils entrent quand le clip est en retard
const MIX = ['L', 'P', 'R'];
const MIX_EVERY = 4;        // s, 'mix' : l'arme change toutes les 4 s
const INTENSITY = [20, 105]; // la frénésie des héros monte de 0 à 1 entre ces deux heures
const WORD_LIFE = 1.8;      // s, un mot libéré monte et s'efface
const TV_KEEP = 0.62;       // la grosse TV reste à 62 % de l'écran tant que l'invité n'est pas sorti
const SCREEN = 0.72;        // le milieu de son écran, en part de sa hauteur (depuis le pied)
const BIG_TV_H = 202;       // sa hauteur dans l'atlas des TV
const SHARDS = Array.from({ length: 12 }, (_, k) => `shard${k + 1}`);

// la ligne de `table` en cours à l'heure t (tables triées par heure)
const at = (table, t) => table.findLast((row) => row[0] <= t);

// Le niveau du clip, sans rendu : une GameSession jouée par des HeroPilot, et calée sur le
// morceau. La caméra doit atteindre l'arène du boss vers pace.bossAt, et le Manager tomber
// vers pace.bossDown : en avance, les héros attendent (ou le vaisseau se blinde) ; en retard,
// ils foncent, les ennemis qui entrent ont moins de vie et le vaisseau encaisse plus. Seuls les
// vrais tirs des héros font des dégâts. Et ça monte : renforts de plus en plus serrés, armes de plus en plus grosses
// (config/clip.js), jusqu'au chaos sous le boss. Des petites TV cathodiques bordent la rue
// (tvs) ; vers 1:00, une grosse TV sur un échafaudage entre dans le champ (bigTv) et retient la
// caméra ; à guest.at, son écran éclate (shatter) et l'invité en sort. Ensuite il couvre les
// arrières de Pete, et aux
// heures de duo ils se tournent l'un vers l'autre, micro levé. Le Manager ne dit rien : ses
// répliques sont celles de Walk Straight.
// update(t, dt) : t = l'heure du morceau.
export class ClipDirector {
  // lyrics : les paroles du morceau (Lyrics), libérées mot à mot par les ennemis qui tombent
  constructor({ level, heroId, clip, start, lyrics = null }) {
    this.clip = clip;
    this.lyrics = lyrics;
    this.released = new Map();                   // ligne → n° des mots déjà libérés
    this.words = [];                             // { text, x, y, t } : les mots en l'air
    this.dead = new WeakSet();
    this.session = new GameSession({ level, players: [{ heroId }], intro: [{ text: level.mission, sub: level.name, time: 2.6 }] });
    this.world = this.session.world;
    this.start = start;                          // l'heure du morceau au début du niveau
    this.bossX = this.session.triggers.find((t) => t.boss)?.at ?? this.session.levelObj.width - W;
    this.pilots = [new HeroPilot(this.world.hero, { lane: 4, side: -1 })];
    this.seen = new WeakSet();
    this.reinforceT = 3;
    this.spawned = 0;
    this.fightStart = null;
    this.armor = 1;                              // sous le boss : la part des dégâts que prend le vaisseau
    this.guest = null;
    this.shatter = null;
    this.bigTv = null;                           // { x, broken }
    const { from, every } = clip.tvs;
    this.tvs = [];                               // { x, k } : les petites TV, variante k (1 à 5)
    for (let x = from, k = 0; x < this.bossX - 200; x += every, k++) this.tvs.push({ x, k: (k % 5) + 1 });
  }

  get heroes() { return this.world.heroes; }

  // où devrait en être la caméra à l'heure t
  #plannedCam(t) {
    const { bossAt } = this.clip.pace;
    return Math.max(0, Math.min(1, (t - this.start) / (bossAt - this.start))) * this.bossX;
  }

  update(t, dt) {
    const world = this.world;
    const { guest } = this.clip;
    if (!this.bigTv && t >= this.clip.bigTv.at) this.#bringTv();
    this.#holdOnTv();
    if (!this.shatter && this.bigTv && t >= guest.at - guest.breach) this.#breakScreen();
    this.shatter?.update(dt);
    if (!this.guest && t >= guest.at) this.#guestJoins();
    if (world.boss && !world.boss.armored) this.#armorBoss(world.boss);
    const ahead = world.cam - this.#plannedCam(t);
    const [i0, i1] = INTENSITY, intensity = Math.max(0, Math.min(1, (t - i0) / (i1 - i0)));
    const orders = { hold: ahead > 30, push: ahead < -60, intensity };
    this.late = ahead < -120;
    this.heroes.forEach((h) => (h.speed = HERO_WALK * (ahead < -150 ? 1.6 : 1)));
    const inputs = [];
    this.pilots.forEach((p) => (inputs[p.hero.slot] = p.next(dt, world, orders)));
    this.#duo(t, inputs);
    // les renforts entrent avant l'image : World.resolve leur donne une pose avant le dessin
    this.#reinforce(t, dt);
    this.session.update(dt, inputs);
    this.#tameEnemies();
    this.#words(t, dt);
    this.#arm(t);
    this.heroes.forEach((h) => { if (h.alive()) h.hp = Math.max(h.hp, HP_FLOOR); });
    if (world.boss) {
      world.boss.lineT = 0;                      // pas de réplique (le bandeau la lirait)
      this.#paceBoss(t);
      if (this.session.state === 'clear' && !this.wiped) this.#wipe();
    }
  }

  // La grosse TV : posée juste hors champ à droite, au pied du mur ; la rue l'amène à l'écran.
  #bringTv() {
    const x = Math.min(this.world.cam + W + 90, this.session.levelObj.width - 100);
    this.bigTv = { x, broken: false };
    this.tvs = this.tvs.filter((tv) => Math.abs(tv.x - x) > 120);
  }

  // Tant que l'invité n'est pas sorti, la caméra ne dépasse pas la grosse TV (elle reste vers la
  // droite de l'écran) ; une arène en cours garde son propre blocage.
  #holdOnTv() {
    const tv = this.bigTv, world = this.world;
    if (!tv) return;
    const stop = tv.x - W * TV_KEEP, arena = this.session.lock?.at ?? null;
    if (!tv.broken) world.camLock = arena === null ? stop : Math.min(arena, stop);
    else if (this.holding) world.camLock = arena;
    this.holding = !tv.broken;
  }

  // L'écran éclate : flash (la scène), secousse, verre qui vole, le souffle balaie les ennemis
  // tout près.
  #breakScreen() {
    const world = this.world, tv = this.bigTv, y = WALL_FOOT - BIG_TV_H * SCREEN;
    tv.broken = true;
    this.shatter = new Shatter(tv.x, y, SHARDS);
    world.explode(tv.x, y + 10, 'hero', world.hero, DEPTH.min);
    for (let i = 0; i < 6; i++) world.fx('zap', tv.x + (i - 2.5) * 14, y + (i % 2) * 12, 0, { life: 0.4 });
    world.shake = 1;
  }

  // Guillaume saute hors de l'écran brisé, retombe sur le trottoir, puis rejoint Pete.
  #guestJoins() {
    const { def } = this.clip.guest, world = this.world, tv = this.bigTv;
    this.session.join(1, def.id, def);
    const g = this.guest = this.session.players[1].hero;
    g.bombs = 10;
    if (tv) Object.assign(g, { x: tv.x, y: WALL_FOOT - DEPTH.min - BIG_TV_H * SCREEN + 30, z: DEPTH.min, air: true, vy: -160, facing: -1 });
    this.pilots.push(new HeroPilot(g, { lane: -14, follow: world.hero, side: 1, rear: true }));
  }

  // Les moments en duo : Pete et Guillaume se tournent l'un vers l'autre et lèvent le micro,
  // des notes s'envolent ; au premier, Guillaume lance à Pete l'arme qu'il apporte.
  #duo(t, inputs) {
    const duo = this.clip.duo, a = this.world.hero, b = this.guest;
    if (!b || !a.alive()) return;
    const k = duo.at.findIndex((d) => t >= d && t < d + duo.time);
    if (k < 0) { this.duoK = -1; return; }
    if (this.duoK !== k) {
      this.duoK = k;
      a.facing = Math.sign(b.x - a.x) || 1;
      b.facing = -a.facing;
      if (k === 0) this.world.dropPickup(duo.gift, a.x - 6, a.y - 70);
    }
    for (const h of [a, b]) {
      inputs[h.slot] = { inp: { win: true }, press: {} };
      if (Math.random() < 0.15) this.world.fx('notes', h.x + (Math.random() - 0.5) * 20, h.y - 80, h.z, { vy: -40 });
    }
  }

  // Un ennemi qui tombe pendant qu'une ligne est chantée libère le mot chanté (ou le premier
  // de la ligne pas encore libéré) : il sort de son corps et monte en s'effaçant.
  #words(t, dt) {
    for (const e of this.world.enemies) {
      if (e.alive() || this.dead.has(e)) continue;
      this.dead.add(e);
      const cur = this.lyrics?.at(t);
      if (!cur) continue;
      const done = this.released.get(cur.cue) ?? new Set();
      this.released.set(cur.cue, done);
      let k = 0;
      while (k <= cur.word + 1 && done.has(k)) k++;
      if (k > cur.word + 1 || k >= cur.cue.words.length) continue;
      done.add(k);
      const h = e.p.hauteur * e.scale;
      this.words.push({ text: cur.cue.words[k].toUpperCase(), x: e.x, y: e.y + e.z - h * 0.75, t: 0 });
    }
    for (const w of this.words) { w.t += dt; w.y -= 28 * dt; }
    this.words = this.words.filter((w) => w.t < WORD_LIFE);
  }

  // les ennemis du clip : moins de PV (encore moins quand le clip est en retard)
  #tameEnemies() {
    for (const e of this.world.enemies) {
      if (this.seen.has(e)) continue;
      this.seen.add(e);
      e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * (this.late ? LATE_HP : ENEMY_HP)));
    }
  }

  // Les renforts : des deux côtés de l'écran et du ciel, de plus en plus serrés. Le dernier
  // passage de chaque rangée est gardé tant que l'écran est plein. En retard, ou dans une arène
  // à vider avant le boss, pas de renfort : il faut avancer.
  #reinforce(t, dt) {
    const row = at(this.clip.reinforce, t);
    if (!row || this.session.state !== 'play' || this.late || (this.session.lock && !this.world.boss)) return;
    const [, every, cap] = row, world = this.world;
    if ((this.reinforceT -= dt) > 0) return;
    if (world.enemies.filter((e) => e.alive()).length >= cap) return;
    this.reinforceT = every;
    const types = this.clip.enemyTypes, type = types[this.spawned % types.length];
    const side = this.spawned % 3, cam = world.cam;
    const x = side === 0 ? cam + W + 30 : side === 1 ? cam - 30 : cam + 120 + ((this.spawned * 137) % (W - 240));
    const e = world.spawnEnemy(type, x, side === 2 ? -20 : undefined);
    if (side === 1) e.facing = 1;
    if (side === 2) e.air = true;
    this.spawned++;
  }

  // les armes : celle de l'heure, rechargée sans fin ; 'mix' les fait tourner (décalé par héros) ;
  // en retard, le larsen (la rafale) pour vider l'écran plus vite
  #arm(t) {
    let [, wanted] = at(this.clip.weapons, t);
    if (this.late && !this.world.boss && wanted === 'pick') wanted = 'L';
    this.heroes.forEach((h, k) => {
      const w = wanted === 'mix' ? MIX[(Math.floor(t / MIX_EVERY) + k) % MIX.length] : wanted;
      if (h.weapon !== w) {
        h.setWeapon(w);
        if (w !== 'pick') this.world.fx('flash', h.x, h.y - 40, h.z);
      }
      if (WEAPONS[w].ammo && h.weaponAmmo < WEAPONS[w].ammo / 2) h.weaponAmmo = WEAPONS[w].ammo;
      h.bombs = Math.max(h.bombs, t > 60 ? 5 : 0);
    });
  }

  // le boss à terre : tous les ennemis encore debout sautent avec lui, et les deux chanteurs se
  // tournent l'un vers l'autre pour la victoire
  #wipe() {
    this.wiped = true;
    if (this.guest) {
      this.world.hero.facing = Math.sign(this.guest.x - this.world.hero.x) || 1;
      this.guest.facing = -this.world.hero.facing;
    }
    for (const e of this.world.enemies) {
      if (!e.alive()) continue;
      this.world.explode(e.x, e.y, 'none', null, e.z);
      e.takeHit(e.hp, true, this.world.hero);
    }
  }

  // le vaisseau ne prend que `armor` fois les dégâts des héros
  #armorBoss(boss) {
    boss.armored = true;
    const hitAt = boss.hitAt.bind(boss);
    boss.hitAt = (x, y, dmg, ...rest) => hitAt(x, y, dmg * this.armor, ...rest);
  }

  // La vie du boss suit une droite, de pleine à son arrivée jusqu'à vide à pace.bossDown : trop
  // haute, il encaisse plus ; trop basse, il se blinde.
  #paceBoss(t) {
    const boss = this.world.boss;
    if (!boss.fighting()) return;
    this.fightStart ??= t;
    const span = this.clip.pace.bossDown - this.fightStart;
    const want = Math.max(0, Math.min(1, (this.clip.pace.bossDown - t) / span));
    const gap = boss.hp / boss.maxHp - want;
    this.armor = gap < -0.02 ? 0.05 : gap < 0.03 ? 0.5 : gap < 0.1 ? 2 : 4;
  }
}
