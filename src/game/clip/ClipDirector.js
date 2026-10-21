import { W } from '../../config/screen.js';
import { HERO_WALK } from '../../config/combat.js';
import { WEAPONS } from '../../config/weapons.js';
import { GameSession } from '../session/GameSession.js';
import { HeroPilot } from './HeroPilot.js';

const HP_FLOOR = 40;        // les héros du clip ne tombent jamais
const ENEMY_HP = 0.6;       // les ennemis du clip encaissent moins, pour tenir le tempo
const ASSIST_EVERY = 0.15;  // s entre deux coups de pouce (retard sur une arène, ou sur le boss)
const MIX = ['L', 'P', 'R'];
const MIX_EVERY = 4;        // s, 'mix' : l'arme change toutes les 4 s
const INTENSITY = [20, 105]; // la frénésie des héros monte de 0 à 1 entre ces deux heures

// la ligne de `table` en cours à l'heure t (tables triées par heure)
const at = (table, t) => table.findLast((row) => row[0] <= t);

// Le niveau du clip, sans rendu : une GameSession jouée par des HeroPilot, et calée sur le
// morceau. La caméra doit atteindre l'arène du boss vers pace.bossAt, et le Manager tomber
// vers pace.bossDown : en avance, les héros attendent (ou le vaisseau se blinde) ; en retard,
// ils foncent, et les ennemis à l'écran prennent des coups en plus, comme si les tirs portaient
// mieux. Et ça monte : renforts de plus en plus serrés, armes de plus en plus grosses
// (config/clip.js), jusqu'au chaos sous le boss. L'invité entre à guest.at. Le Manager ne dit
// rien : ses répliques sont celles de Walk Straight.
// update(t, dt) : t = l'heure du morceau.
export class ClipDirector {
  constructor({ level, heroId, clip, start }) {
    this.clip = clip;
    this.session = new GameSession({ level, players: [{ heroId }], intro: [{ text: level.mission, sub: level.name, time: 2.6 }] });
    this.world = this.session.world;
    this.start = start;                          // l'heure du morceau au début du niveau
    this.bossX = this.session.triggers.find((t) => t.boss)?.at ?? this.session.levelObj.width - W;
    this.pilots = [new HeroPilot(this.world.hero, { lane: 4, side: -1 })];
    this.seen = new WeakSet();
    this.assistT = 0;
    this.reinforceT = 3;
    this.spawned = 0;
    this.fightStart = null;
    this.armor = 1;                              // sous le boss : la part des dégâts que prend le vaisseau
    this.guest = null;
  }

  get heroes() { return this.world.heroes; }

  // où devrait en être la caméra à l'heure t
  #plannedCam(t) {
    const { bossAt } = this.clip.pace;
    return Math.max(0, Math.min(1, (t - this.start) / (bossAt - this.start))) * this.bossX;
  }

  update(t, dt) {
    const world = this.world;
    if (!this.guest && t >= this.clip.guest.at) this.#guestJoins();
    if (world.boss && !world.boss.armored) this.#armorBoss(world.boss);
    const ahead = world.cam - this.#plannedCam(t);
    const [i0, i1] = INTENSITY, intensity = Math.max(0, Math.min(1, (t - i0) / (i1 - i0)));
    const orders = { hold: ahead > 30, push: ahead < -60, intensity };
    this.heroes.forEach((h) => (h.speed = HERO_WALK * (ahead < -150 ? 1.6 : 1)));
    const inputs = [];
    this.pilots.forEach((p) => (inputs[p.hero.slot] = p.next(dt, world, orders)));
    // les renforts entrent avant l'image : World.resolve leur donne une pose avant le dessin
    this.#reinforce(t, dt);
    this.session.update(dt, inputs);
    this.#tameEnemies();
    this.#arm(t);
    this.heroes.forEach((h) => { if (h.alive()) h.hp = Math.max(h.hp, HP_FLOOR); });
    this.assistT -= dt;
    if (world.boss) {
      world.boss.lineT = 0;                      // pas de réplique (le bandeau la lirait)
      this.#paceBoss(t);
      if (this.session.state === 'clear' && !this.wiped) this.#wipe();
    } else if (ahead < -120 && this.assistT <= 0) this.#assist();
  }

  #guestJoins() {
    const { def } = this.clip.guest;
    this.session.join(1, def.id, def);
    this.guest = this.session.players[1].hero;
    this.guest.bombs = 10;
    this.pilots.push(new HeroPilot(this.guest, { lane: -14, follow: this.world.hero, side: 1 }));
  }

  // les ennemis du clip : moins de PV
  #tameEnemies() {
    for (const e of this.world.enemies) {
      if (this.seen.has(e)) continue;
      this.seen.add(e);
      e.hp = e.maxHp = Math.max(1, Math.round(e.maxHp * ENEMY_HP));
    }
  }

  // Les renforts : des deux côtés de l'écran et du ciel, de plus en plus serrés. Le dernier
  // passage de chaque rangée est gardé tant que l'écran est plein.
  #reinforce(t, dt) {
    const row = at(this.clip.reinforce, t);
    if (!row || this.session.state !== 'play') return;
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

  // les armes : celle de l'heure, rechargée sans fin ; 'mix' les fait tourner (décalé par héros)
  #arm(t) {
    const [, wanted] = at(this.clip.weapons, t);
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

  // en retard : l'ennemi le plus proche des héros, à l'écran, prend un coup de plus
  #assist() {
    const world = this.world, hero = world.hero;
    const foe = world.enemies.find((e) => e.alive() && e.x > world.cam && e.x < world.cam + W);
    if (!foe) return;
    foe.takeHit(3, false, hero);
    world.fx('impact', foe.x, foe.y - foe.p.hauteur * foe.scale * 0.6, foe.z);
    this.assistT = ASSIST_EVERY;
  }

  // le boss à terre : tous les ennemis encore debout sautent avec lui
  #wipe() {
    this.wiped = true;
    for (const e of this.world.enemies) {
      if (!e.alive()) continue;
      this.world.explode(e.x, e.y, 'none', null, e.z);
      e.takeHit(e.hp, true, this.world.hero);
    }
  }

  // le vaisseau ne prend que `armor` des dégâts des héros (les coups de pouce passent à côté)
  #armorBoss(boss) {
    boss.armored = true;
    const hitAt = boss.hitAt.bind(boss);
    this.bossHit = hitAt;
    boss.hitAt = (x, y, dmg, ...rest) => hitAt(x, y, dmg * this.armor, ...rest);
  }

  // La vie du boss suit une droite, de pleine à son arrivée jusqu'à vide à pace.bossDown : trop
  // haute, il prend des coups en plus sur la pièce visée ; trop basse, il se blinde.
  #paceBoss(t) {
    const boss = this.world.boss;
    if (!boss.fighting()) return;
    this.fightStart ??= t;
    const span = this.clip.pace.bossDown - this.fightStart;
    const want = Math.max(0, Math.min(1, (this.clip.pace.bossDown - t) / span));
    const gap = boss.hp / boss.maxHp - want;
    this.armor = gap < -0.02 ? 0.05 : gap < 0.03 ? 0.4 : 1;
    if (gap > 0.04 && this.assistT <= 0) {
      const [p] = boss.aimPoints();
      if (p) this.bossHit(p.x, p.y, 2, this.world.hero, this.world);
      this.assistT = ASSIST_EVERY;
    }
  }
}
