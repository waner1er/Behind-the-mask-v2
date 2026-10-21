import { GROUND } from '../../config/screen.js';
import { DIRS, resolveAnim } from '../../config/anims.js';
import { JUMP_V, GRAVITY, HIT_W, FIRE_EVERY, DEPTH } from '../../config/combat.js';
import { perso } from '../../data/sprites.js';
import { Terrain, STEP_MAX } from '../world/Terrain.js';

// un sol plat, tant que le monde n'a pas donné le sien
const FLAT = new Terrain({ ground: [[0, GROUND], [1, GROUND]] });

// actions qui prennent tout le corps et ne s'arrêtent pas d'elles-mêmes
const HELD_ACTS = ['death', 'victory'];
const THROWS = ['throw', 'crouch_throw'];

// Un perso de l'atlas, héros ou ennemi : il marche, saute, s'accroupit, vise dans 8 directions,
// tire, lance, frappe et encaisse. On le pilote avec une entrée (croix + boutons tenus) et des
// appuis (boutons pressés à cette image). Les images sont ancrées entre les pieds ; il regarde
// à droite, et l'image est retournée quand il regarde à gauche. (x, y) = ses pieds ; il se
// déplace sur le terrain du monde (sol, marches, blocs, plateformes traversables).
export class Actor {
  constructor(def, x, y = GROUND) {
    Object.assign(this, def);
    this.p = perso(def.sprite ?? def.id);
    this.scale ??= 1;
    this.terrain = FLAT;
    // qui tire quoi, à quelle cadence, à quelle vitesse il avance
    this.side ??= 'hero';
    this.ammo ??= 'pick';
    this.muzzleFlash ??= true;
    this.fireEvery ??= FIRE_EVERY;
    this.x = x;
    this.facing = 1;
    this.y = y; this.vy = 0; this.air = false; this.landT = 9;
    this.z = 0;                  // profondeur : < 0 vers le fond du trottoir, > 0 vers l'avant
    this.dropping = null;        // la plateforme qu'il traverse exprès (bas + saut)
    this.blocked = false;        // un mur l'a arrêté à cette image
    this.vx = 0; this.walkT = 0; this.t = 0;
    this.crouchT = -1;           // temps passé accroupi (-1 : debout)
    this.shotT = 9; this.fireCD = 0; this.aimT = 9;
    this.act = null;             // action qui prend tout le corps : throw, melee, hurt, death, victory
    this.dir = 'fwd';
    this.fired = this.spawn = null;
    this.hurtP = false;          // vient d'être touché : il encaisse au prochain tour
    this.pose = null;            // la dernière pose calculée (voir computePose)
  }

  alive() { return this.hp > 0; }

  // Encaisse un coup ; chaque sorte de perso décide de ce qui le fait tituber.
  takeHit(dmg) {
    if (this.alive()) this.hp = Math.max(0, this.hp - dmg);
  }

  // boîte de collision : la largeur des épaules, la hauteur du perso, les pieds en bas
  box() {
    const h = this.p.hauteur * this.scale, w = HIT_W * this.scale;
    return { x: this.x - w, y: Math.round(this.y) - h, w: w * 2, h };
  }

  // sur le sol du niveau (pas sur un bloc ni une plateforme) : là où l'on a de la profondeur
  onGround() {
    return !this.air && Math.abs(this.y - this.terrain.groundAt(this.x)) < 0.5;
  }

  // hauteur au-dessus de l'appui qui est sous lui (pour l'ombre)
  lift() {
    return this.terrain.floorBelow(this.x, this.y, this.z) - this.y;
  }

  touches(x, y) {
    const b = this.box();
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }

  // l'anim demandée, ou celle qui la remplace (exact = false) si la planche ne l'a pas encore
  anim(name) {
    const n = resolveAnim(this.p, name);
    return n ? { ...this.p.anims[n], name: n, exact: n === name, asked: name } : null;
  }

  startAct(name) {
    this.act = { name, t: 0 };
  }

  update(dt, input, press) {
    const inp = { ...input, x: input.x || 0, y: input.y || 0 };
    this.#depth(dt, inp);
    this.t += dt;
    this.fireCD -= dt; this.shotT += dt; this.aimT += dt; this.landT += dt;
    this.fired = this.spawn = null;
    this.#updateAct(dt, inp, press);
    const busy = this.act && !THROWS.includes(this.act.name);
    this.#move(dt, inp, press, busy);
    this.#aim(inp, busy);
  }

  // Sur le sol, haut et bas déplacent en profondeur (à l'arrêt comme en marchant) ; pour viser
  // vers le haut ou s'accroupir, on tient « viser sans bouger » (lock). Ailleurs (bloc,
  // plateforme), haut et bas visent comme avant, et il revient doucement sur la file du
  // milieu. En l'air, il garde sa file.
  #depth(dt, inp) {
    const busy = this.act && !['throw', 'crouch_throw'].includes(this.act.name);
    this.onFloor = this.onGround();
    this.depthWalking = this.onFloor && inp.y && !inp.lock && !busy;
    if (this.depthWalking) {
      this.z = this.#laneOk(Math.max(DEPTH.min, Math.min(DEPTH.max, this.z + inp.y * DEPTH.speed * dt)));
      inp.y = 0;
    } else if (!this.air && !this.onGround() && this.z) {
      const step = DEPTH.settle * dt;
      this.z = Math.abs(this.z) <= step ? 0 : this.z - Math.sign(this.z) * step;
    }
  }

  // Accroupi : bas, sauf sur le sol où bas déplace en profondeur (il faut alors tenir lock).
  #crouchInput(inp) {
    return !this.air && inp.y > 0 && (this.onFloor ? !!inp.lock : !inp.lock);
  }

  // le rapproche de la file z (IA), en marchant sur le sol
  followLane(z, dt, speed = DEPTH.speed * 0.6) {
    if (!this.onGround()) return;
    const d = Math.max(DEPTH.min, Math.min(DEPTH.max, z)) - this.z;
    this.z = this.#laneOk(this.z + Math.max(-speed * dt, Math.min(speed * dt, d)));
  }

  // On n'entre pas sur la file d'une caisse (ou d'un baril…) en étant à sa hauteur : on reste
  // juste à côté de sa file, au lieu de se retrouver dessus.
  #laneOk(z) {
    if (Math.abs(z) > DEPTH.block || this.terrain.solidAt(this.x, 0) >= this.y - STEP_MAX) return z;
    return Math.abs(this.z) > DEPTH.block ? Math.sign(this.z) * (DEPTH.block + 0.5) : z;
  }

  #updateAct(dt, inp, press) {
    const crouching = this.crouchT >= 0 || this.#crouchInput(inp);
    if (inp.die && this.act?.name !== 'death') this.startAct('death');
    else if (!inp.die && this.act?.name === 'death') this.act = null;
    if (inp.win && !this.act) this.startAct('victory');
    else if (!inp.win && this.act?.name === 'victory') this.act = null;
    if (press.hurt && this.act?.name !== 'death') this.startAct('hurt');
    if (press.bomb && !this.act) this.startAct(crouching ? 'crouch_throw' : 'throw');
    if (press.melee && !this.act) this.startAct(crouching ? 'crouch_melee' : 'melee');
    if (!this.act) return;
    const a = this.anim(this.act.name);
    const before = this.act.t;
    this.act.t += dt;
    const fps = a.fps || 10, len = a.frames.length / fps;
    // l'objet part (ou le coup porte) au passage de l'image 2
    if (before < 1 / fps && this.act.t >= 1 / fps) this.spawn = this.act.name;
    if (this.act.t >= len && !HELD_ACTS.includes(this.act.name)) this.act = null;
  }

  #move(dt, inp, press, busy) {
    if (inp.x && !busy) this.facing = inp.x;
    const crouch = this.#crouchInput(inp) && !busy;
    this.crouchT = crouch ? (this.crouchT < 0 ? 0 : this.crouchT + dt) : -1;
    const move = !busy && !inp.lock ? inp.x : 0;
    // accroupi, on avance deux fois moins vite
    if (!this.air) this.vx = move * (crouch ? this.speed / 2 : this.speed);
    if (press.jump && !this.air && !busy) {
      const under = this.terrain.platformAt(this.x, this.y);
      if (inp.y > 0 && under) { this.dropping = under; this.vy = 0; }     // bas + saut : on traverse
      else this.vy = -JUMP_V;
      this.air = true; this.crouchT = -1;
    }
    this.#walk(dt);
    this.#fall(dt);
    // la cadence des pas suit la distance parcourue, au rythme de l'anim (pace : son temps par
    // pixel, mesuré sur la planche, voir tools/build_sprites.py) : les pieds ne glissent pas
    const pace = this.anim(this.#gait(crouch))?.pace ?? 1 / 42;
    if (this.vx && !this.blocked) this.walkT += dt * Math.abs(this.vx) * pace;
    else if (this.depthWalking) this.walkT += dt * DEPTH.speed * pace;   // il marche vers le fond ou l'avant
    this.crouching = crouch;
  }

  // Avance, sauf contre un mur : une marche plus haute que STEP_MAX au sol, le flanc d'un bloc
  // en l'air.
  #walk(dt) {
    this.blocked = false;
    if (!this.vx) return;
    const nx = this.x + this.vx * dt, solid = this.terrain.solidAt(nx, this.z);
    if (solid < this.y - (this.air ? 0.5 : STEP_MAX)) this.blocked = true;
    else this.x = nx;
  }

  // En l'air : la gravité, et l'atterrissage sur le premier appui franchi. Au sol : il suit
  // les pentes et les marches, et tombe s'il n'a plus rien sous les pieds.
  #fall(dt) {
    if (this.air) {
      const prevY = this.y;
      this.vy += GRAVITY * dt;
      this.y += this.vy * dt;
      if (this.vy < 0) return;
      const land = this.terrain.landing(this.x, prevY, this.y, this.dropping, this.z);
      if (land !== null) {
        this.y = land; this.vy = 0; this.air = false; this.landT = 0; this.dropping = null;
      }
      return;
    }
    if (this.terrain.platformAt(this.x, this.y)) return;
    const solid = this.terrain.solidAt(this.x, this.z);
    if (solid > this.y + STEP_MAX) { this.air = true; this.vy = 0; }
    else this.y = solid;
  }

  // 8 directions : on regarde à droite ou à gauche, et l'image est retournée
  #aim(inp, busy) {
    const x = inp.x ? 1 : 0, y = inp.y;
    if (this.crouching) this.dir = 'fwd';
    else if (this.air) this.dir = y > 0 ? (x ? 'diagdown' : 'down') : y < 0 ? (x ? 'diagup' : 'up') : 'fwd';
    else this.dir = y < 0 ? (x ? 'diagup' : 'up') : (y > 0 && inp.lock && !this.onFloor) ? 'diagdown' : 'fwd';
    if (inp.fire && !busy) {
      this.aimT = 0;
      if (this.fireCD <= 0) { this.fireCD = this.fireEvery; this.shotT = 0; this.fired = this.dir; }
    }
    if (this.dir !== 'fwd') this.aimT = 0;
  }

  // Ce qu'il faut dessiner : une image entière, ou des jambes + un buste (haut et bas séparés,
  // si split). Renvoie aussi la bouche de l'arme et la main, d'où partent tirs et objets lancés.
  computePose(split) {
    const { full, legs, torso } = this.#pickFrames(split);
    return (this.pose = this.#place(full, legs, torso));
  }

  #frame(name, i, loop) {
    const a = this.anim(name);
    const n = a.frames.length;
    const k = loop ? ((Math.floor(i) % n) + n) % n : Math.max(0, Math.min(n - 1, Math.floor(i)));
    return { a, fr: a.frames[k], k };
  }

  #jumpFrame() {
    const n = this.anim('jump').frames.length;
    if (!this.air) return this.#frame('jump', n - 1);
    const p = Math.max(0, Math.min(0.999, (this.vy + JUMP_V) / (2 * JUMP_V)));
    // 8 images : 0 élan, 1-6 en l'air, 7 réception ; ancienne planche : toutes en l'air
    return n >= 8 ? this.#frame('jump', 1 + p * 6) : this.#frame('jump', p * n);
  }

  #loopFrame(name, clock) {
    return this.#frame(name, clock * this.anim(name).fps, true);
  }

  #pickFrames(split) {
    // images de tir : 1 visée, 2 tir, 3 recul
    const shot = this.shotT < 0.07 ? 1 : this.shotT < 0.18 ? 2 : 0;
    const aiming = this.aimT < 0.45;
    if (this.act) {
      const a = this.anim(this.act.name);
      return { full: this.#frame(this.act.name, this.act.t * (a.fps || 10), a.loop) };
    }
    // sur sa planche (attaque en skate) : accroupi, en équilibre
    if (this.riding) return { full: this.#loopFrame('crouch_idle', this.t) };
    if (this.crouchT >= 0) {
      if (aiming) return { full: this.#frame('crouch_shoot_fwd', shot) };
      if (this.crouchT < 0.16) return { full: this.#frame('crouch_down', this.crouchT * 12) };
      return { full: this.vx ? this.#loopFrame('crouch_walk', this.walkT) : this.#loopFrame('crouch_idle', this.t) };
    }
    if (this.air) {
      if (aiming && ['up', 'diagup'].includes(this.dir) && split) {
        return { legs: this.#jumpFrame(), torso: this.#frame('shoot_' + this.dir, shot) };
      }
      return { full: aiming ? this.#frame('jump_shoot_' + this.dir, shot) : this.#jumpFrame() };
    }
    if (aiming) {
      const shoot = this.#frame('shoot_' + this.dir, shot);
      if ((this.vx || this.depthWalking) && split) return { legs: this.#loopFrame('walk', this.walkT), torso: shoot };
      return { full: shoot };
    }
    if (this.vx || this.depthWalking) return { full: this.#loopFrame(this.#gait(false), this.walkT) };
    if (this.landT < 0.1) return { full: this.#jumpFrame() };
    return { full: this.#loopFrame('idle', this.t) };
  }

  // l'allure du moment : accroupi, en course (les ennemis ont une course ; les héros, non), en marche
  #gait(crouch) {
    if (crouch) return 'crouch_walk';
    return Math.abs(this.vx) > 60 && this.p.anims.run ? 'run' : 'walk';
  }

  // placement dans le niveau
  #place(full, legs, torso) {
    const sx = this.x, sy = Math.round(this.y), k = this.scale;
    const out = { parts: [], label: '', muzzle: null, rotate: 0, scale: k };
    const main = torso || full;
    if (full) {
      out.parts.push({ fr: full.fr, x: sx, y: sy, from: 0, to: full.fr[3] });
      out.label = full.a.asked + (full.a.exact ? '' : ' → ' + full.a.name);
      // pas encore d'image de K.O. : on couche l'idle
      if (full.a.asked === 'death' && !full.a.exact) out.rotate = Math.min(1, this.act.t / 0.4);
    } else {
      // le bas du corps vient de la marche (ou du saut), le haut du tir ; ils se raccordent aux hanches
      const hip = this.p.hanches;
      const L = legs.fr, T = torso.fr;
      const cutL = L[3] - hip, cutT = T[3] - hip;
      const ty = sy - L[5] + cutL - cutT + T[5];
      out.parts.push({ fr: L, x: sx, y: sy, from: cutL, to: L[3] });
      out.parts.push({ fr: T, x: sx, y: ty, from: 0, to: cutT + 1 });
      out.label = `${legs.a.asked} + ${torso.a.asked}` + (torso.a.exact ? '' : ' → ' + torso.a.name);
      out.split = { y: ty - T[5] + cutT };
    }
    // Bout de l'arme : celui de la première image de l'anim (la visée, la mieux repérée sur
    // les planches), s'il vise dans la bonne direction et n'est pas aberrant (trop bas) ;
    // sinon un point calculé devant le perso.
    const part = out.parts[out.parts.length - 1];
    const fr = part.fr, d = this.dir, [dx, dy] = DIRS[d];
    const sameDir = main.a.exact || main.a.name.endsWith('_' + d);
    const h = this.p.hauteur * k, ref = main.a.frames[0], ph = this.p.hauteur;
    // vraisemblable : au-dessus du bassin, et près de l'axe du perso pour un tir vers le haut
    const plausible = ref.length > 6 && ref[7] < -ph * 0.2 && (d !== 'up' || Math.abs(ref[6]) < ph * 0.3);
    if (sameDir && plausible) {
      out.muzzle = [part.x + this.facing * ref[6] * k, part.y + ref[7] * k];
    } else {
      const n = Math.hypot(dx, dy), body = this.crouchT >= 0 ? h * 0.6 : h;
      out.muzzle = [sx + this.facing * dx / n * h * 0.5, sy - body * 0.6 + dy / n * h * 0.5];
    }
    out.hand = fr.length > 6 ? [part.x + this.facing * fr[6] * k, part.y + fr[7] * k] : [sx + this.facing * 12 * k, sy - h * 0.7];
    return out;
  }
}
