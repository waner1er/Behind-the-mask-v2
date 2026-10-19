import { Actor } from './Actor.js';
import { HERO_HP, PICK_SPEED, SKATE } from '../../config/combat.js';
import { WEAPONS, PICKUPS, START_BOMBS } from '../../config/weapons.js';

// Un membre du groupe : il tire (médiator ou arme ramassée) et lance des vinyles.
// slot : 0 pour le joueur 1, 1 pour le joueur 2 (la couleur de ses tirs).
export class Hero extends Actor {
  constructor(def, x, { speed, y, slot = 0 }) {
    super({ bullet: PICK_SPEED, hp: HERO_HP, speed, ...def }, x, y);
    this.slot = slot;
    this.maxHp = this.hp;
    this.downT = 0;              // temps passé au sol, une fois à court de points de vie
    this.invulnT = 0;            // de retour en jeu : il clignote et ne craint rien
    this.bombs = START_BOMBS;
    this.skateT = 0;             // temps restant de l'attaque en skate
    this.skateCD = 0;            // attente avant la suivante
    this.skated = new Set();     // ce qu'il a déjà renversé pendant cette glisse
    this.setWeapon('pick');
  }

  // sur sa planche (l'Actor prend alors la pose accroupie, la vue dessine le skate)
  get riding() { return this.skateT > 0; }

  // L'attaque en skate du premier jeu : seulement au sol (ou sur une plateforme), hors action.
  #startSkate() {
    if (this.skateCD > 0 || this.air || this.act || !this.alive()) return false;
    this.skateT = SKATE.duration;
    this.skated.clear();
    return true;
  }

  get weaponDef() { return WEAPONS[this.weapon]; }

  setWeapon(id) {
    const w = WEAPONS[id];
    this.weapon = id;
    this.weaponAmmo = w.ammo ?? Infinity;
    this.fireEvery = w.every;
    this.pick = w.fx[this.slot];
  }

  // un tir est parti : une munition de moins ; à vide, retour au médiator
  spendAmmo() {
    if (this.weaponAmmo !== Infinity && --this.weaponAmmo <= 0) this.setWeapon('pick');
  }

  // une lettre ramassée : la même arme recharge, une autre la remplace
  pickUp(letter) {
    const p = PICKUPS[letter];
    if (p.bombs) this.bombs += p.bombs;
    if (!p.weapon) return;
    if (this.weapon === p.weapon) this.weaponAmmo += WEAPONS[p.weapon].ammo;
    else this.setWeapon(p.weapon);
  }

  update(dt, input, press) {
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.skateCD = Math.max(0, this.skateCD - dt);
    this.startedSkate = press.skate && this.#startSkate();
    if (this.riding) return this.#skate(dt, input);
    // plus de vinyle : pas de lancer
    super.update(dt, input, this.bombs > 0 ? press : { ...press, bomb: false });
    if (this.spawn === 'throw' || this.spawn === 'crouch_throw') this.bombs--;
  }

  // Il fonce droit devant, invulnérable ; haut et bas changent encore de file ; rien d'autre.
  #skate(dt, input) {
    this.skateT -= dt;
    this.invulnT = Math.max(this.invulnT, 0.05);
    const walk = this.speed;
    this.speed = SKATE.speed;
    super.update(dt, { x: this.facing, y: input.y || 0 }, {});
    this.speed = walk;
    if (this.skateT <= 0) { this.skateT = 0; this.skateCD = SKATE.cooldown; }
  }

  // Les balles entament sans sonner : le « hurt » du héros (une image de l'ancienne planche,
  // 1,3 s) le figerait sous les rafales. Les coups lourds (bâton, explosion) le font tituber.
  takeHit(dmg, heavy = false) {
    if (!this.alive() || this.invulnT > 0) return;
    super.takeHit(dmg);
    if (heavy || !this.alive()) this.hurtP = true;
    if (!this.alive()) this.downT = 0;
  }

  // de retour au combat, en pleine forme
  heal() {
    this.hp = this.maxHp; this.downT = 0; this.hurtP = false;
  }

  // Une nouvelle vie : il retombe du haut de l'écran en (x, y), invulnérable un moment, avec
  // le médiator ; il garde les vinyles qui lui restaient.
  respawn(x, y) {
    this.heal();
    this.act = null;
    this.x = x; this.y = y; this.vy = 0; this.air = true;
    this.invulnT = 2.5;
    this.skateT = 0;
    this.z = 0;
    this.setWeapon('pick');
  }
}
