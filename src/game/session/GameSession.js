import { W } from '../../config/screen.js';
import { CAST } from '../../config/cast.js';
import { HERO_WALK, LIVES, RESPAWN_AFTER } from '../../config/combat.js';
import { Hero } from '../actors/Hero.js';
import { World } from '../world/World.js';
import { Level } from '../world/Level.js';
import { ManagerBoss } from '../bosses/ManagerBoss.js';

const BOSSES = { manager: ManagerBoss };
const HOSTAGE_SCORE = 500;
const CONTINUE_TIME = 9;

// Une partie d'un niveau, sans rendu ni clavier : les joueurs (2 au plus), leurs vies et
// leurs scores, les déclencheurs du niveau (vagues, portes, arènes, mi-boss, boss), les
// messages à l'écran, la fin de mission et le game over. La scène Phaser lui passe les
// entrées des joueurs et dessine son état.
//
// Déclencheurs (JSON du niveau, `triggers`) : quand la caméra atteint `at`, ils lâchent leurs
// ennemis `spawn` : [{ type, from : right | left | drop | <id d'une porte>, x?, delay? }].
// `lock` bloque la caméra jusqu'à ce qu'ils soient tous à terre. `boss` fait entrer un boss.
export class GameSession {
  // start : x de la caméra au départ (l'éditeur fait tester un passage) ; les déclencheurs
  // d'avant sont sautés.
  constructor({ level, players, intro = [], start = 0 }) {
    this.def = level;
    this.levelObj = new Level(level);
    this.world = new World(this.levelObj);
    this.world.scrollBack = false;
    this.world.cam = Math.max(0, Math.min(start, this.levelObj.width - W));
    this.triggers = (level.triggers ?? []).map((t) => ({ ...t, fired: t.at < this.world.cam, spawned: [], pending: [] }))
      .sort((a, b) => a.at - b.at);
    this.players = [0, 1].map((slot) => ({ slot, heroId: null, lives: 0, score: 0, hero: null, active: false, out: false }));
    this.state = 'play';
    this.t = 0;
    this.messages = [];               // { text, sub?, t, time, big? }
    this.go = 0;                      // flèche GO! après une arène (temps restant)
    this.lock = null;                 // le déclencheur qui bloque la caméra
    this.continueT = 0;
    players.forEach((p, slot) => p && this.join(slot, p.heroId));
    intro.forEach((m) => this.say(m.text, m.sub, m.time ?? 3, true));
    if (intro.length) this.world.play('mission_1');
  }

  get boss() { return this.world.boss; }
  activePlayers() { return this.players.filter((p) => p.active); }

  say(text, sub = '', time = 2.5, big = false) {
    this.messages.push({ text, sub, t: 0, time, big });
  }

  // Un joueur entre dans la partie (au début, ou en cours : il tombe du haut de l'écran).
  join(slot, heroId) {
    const p = this.players[slot];
    if (p.active) return;
    const taken = this.players.filter((q) => q.active).map((q) => q.heroId);
    heroId = heroId && !taken.includes(heroId) ? heroId : CAST.find((c) => !taken.includes(c.id)).id;
    const def = CAST.find((c) => c.id === heroId);
    const x = this.world.cam + 70 + slot * 40;
    const hero = new Hero(def, x, { speed: HERO_WALK, slot, y: this.world.heroes.length ? 40 : this.world.terrain.solidAt(x) });
    if (this.world.heroes.length) hero.air = true;
    Object.assign(p, { heroId, hero, lives: LIVES, active: true, out: false });
    this.world.addHero(hero);
  }

  // inputs[slot] = { inp, press } de chaque joueur
  update(dt, inputs) {
    this.t += dt;
    this.#tickMessages(dt);
    if (this.state === 'over') return;
    if (this.state === 'gameover') return this.#gameOver(dt, inputs);
    const world = this.world;
    // le héros d'un joueur sans vie ne bouge plus
    world.update(dt, world.heroes.map((h) => (this.state === 'clear' ? { inp: { win: true }, press: {} } : inputs[h.slot] ?? { inp: {}, press: {} })));
    if (this.state === 'play') this.#runTriggers(dt);
    world.resolve(dt, true);
    this.#handleEvents();
    this.#lives(dt, inputs);
    this.go = Math.max(0, this.go - dt);
  }

  #tickMessages(dt) {
    const m = this.messages[0];
    if (m && (m.t += dt) >= m.time) this.messages.shift();
  }

  #runTriggers(dt) {
    const world = this.world;
    for (const t of this.triggers) {
      if (!t.fired && world.cam >= t.at - 1) this.#fire(t);
      // les ennemis en attente (délai, porte qui s'ouvre)
      for (let i = t.pending.length - 1; i >= 0; i--) {
        const s = t.pending[i];
        if ((s.delay -= dt) > 0) continue;
        t.pending.splice(i, 1);
        t.spawned.push(this.#spawn(s));
      }
    }
    // l'arène est finie quand tout ce qu'elle a lâché est à terre
    const lock = this.lock;
    if (lock && !lock.pending.length && lock.spawned.every((e) => !e.alive()) && (!lock.boss || world.boss?.defeated())) {
      this.lock = null;
      world.camLock = null;
      if (!lock.boss) { this.go = 3; world.play('go'); }
    }
  }

  #fire(t) {
    const world = this.world;
    t.fired = true;
    if (t.lock) { this.lock = t; world.camLock = t.at; }
    if (t.say) this.say(t.say, t.sub ?? '', 2.5);
    for (const s of t.spawn ?? []) {
      const door = world.props.find((p) => p.id === s.from);
      if (door && door.doorT < 0) { door.open(); world.play('door'); }
      t.pending.push({ ...s, delay: (s.delay ?? 0) + (door ? 0.6 : 0), door });
    }
    if (t.boss) {
      const hpScale = this.activePlayers().length > 1 ? 1.5 : 1;
      world.boss = new BOSSES[t.boss](t.at, { hpScale });
      this.say(world.boss.name, '', 2.5, true);
    }
  }

  #spawn(s) {
    const world = this.world, cam = world.cam;
    const x = s.door ? s.door.x : s.from === 'left' ? cam - 30 : s.from === 'drop' ? s.x : s.x ?? cam + W + 30;
    const y = s.from === 'drop' ? -20 : undefined;
    const two = this.activePlayers().length > 1;
    const e = world.spawnEnemy(s.type, x, y, s.hp ? Math.round(s.hp * (two ? 1.3 : 1)) : undefined);
    if (s.from === 'drop') e.air = true;
    if (s.from === 'left') e.facing = 1;
    if (e.cfg.boss) this.say(e.cfg.name, '', 2.5, true);
    return e;
  }

  #handleEvents() {
    for (const ev of this.world.events) {
      const player = ev.by ? this.players[ev.by.slot] : null;
      if (ev.type === 'hostage') { if (player) player.score += HOSTAGE_SCORE; this.say('THANK YOU!', '', 1.2); }
      else if (ev.type === 'bossDefeated') this.#clear();
      else if (player && ev.score) player.score += ev.score;
    }
    this.world.events.length = 0;
  }

  #clear() {
    this.state = 'clear';
    this.clearT = 0;
    this.say('MISSION COMPLETE!', 'WALK STRAIGHT', 6, true);
    this.world.play('mission_complete');
  }

  // K.O. : une vie de moins, retour en jeu ; plus de vie, il est hors jeu (game over à deux
  // hors jeu, ou seul hors jeu).
  #lives(dt, inputs) {
    if (this.state === 'clear') { this.clearT += dt; return; }
    for (const p of this.activePlayers()) {
      const h = p.hero;
      if (h.alive() || h.downT < RESPAWN_AFTER || p.out) continue;
      if (p.lives > 1) {
        p.lives--;
        const other = this.world.heroesAlive()[0];
        h.respawn(other ? other.x : this.world.cam + 80, 30);
      } else {
        p.lives = 0;
        p.out = true;
      }
    }
    // le joueur 2 qui appuie sur start entre (ou revient) dans la partie
    this.players.forEach((p) => {
      if (inputs[p.slot]?.press.start && (!p.active || p.out) && this.state === 'play') {
        if (p.out) this.#revive(p);
        else this.join(p.slot);
      }
    });
    if (this.activePlayers().every((p) => p.out)) {
      this.state = 'gameover';
      this.continueT = CONTINUE_TIME;
      this.world.play('game_over');
    }
  }

  #revive(p) {
    p.out = false; p.lives = LIVES; p.score = 0;
    p.hero.respawn(this.world.cam + 80, 30);
  }

  // CONTINUE ? 9… : start pour repartir (vies et score remis à zéro), sinon fin de partie
  #gameOver(dt, inputs) {
    this.continueT -= dt;
    const back = this.players.find((p) => p.active && inputs[p.slot]?.press.start);
    if (back) {
      this.activePlayers().forEach((p) => this.#revive(p));
      this.state = 'play';
      return;
    }
    if (this.continueT <= 0) this.state = 'over';
  }

  finished() { return this.state === 'over' || (this.state === 'clear' && this.clearT > 7); }
}
