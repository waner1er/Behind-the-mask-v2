import Phaser from 'phaser';
import { ATLAS, frameName, fxAnim } from '../data/sprites.js';
import { LEVEL_ATLAS, levelFrame } from '../data/levelSprites.js';
import { PICKUPS } from '../config/weapons.js';
import { FONT } from '../config/theme.js';
import { ImagePool } from './ImagePool.js';

// plans d'affichage, du fond vers l'avant ; les acteurs et le décor posé sur le trottoir se
// trient entre eux selon leur profondeur z (lane)
const lane = (z) => DEPTH.actors + (z + 100) / 1000;
const DEPTH = {
  decor: 0, props: 1, boss: 2, hostages: 3, shadows: 4, actors: 5, gauges: 6,
  pickups: 7, marks: 8, shots: 9, fx: 10,
};
const DOOR_FPS = 6;

// l'image d'un effet de l'atlas principal à l'instant t
function fxFrame(e) {
  const a = fxAnim(e.name);
  const k = a.loop ? Math.floor(e.t * a.fps) % a.frames.length : Math.min(a.frames.length - 1, Math.floor(e.t * a.fps));
  return frameName(a.frames[k]);
}

// Affiche un World dans une scène Phaser : le décor en tronçons, les éléments de décor, le
// boss, les habitants, les acteurs dans la pose calculée par World.resolve (ombres, jauges),
// les bonus, les projectiles et les effets. La caméra de la scène suit world.cam (et sa
// secousse). Ne modifie jamais le monde. L'atlas du niveau n'est utilisé que s'il y en a un.
export class WorldView {
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
    this.#buildDecor(world.level);
    this.props = new ImagePool(scene, DEPTH.props, LEVEL_ATLAS);
    this.boss = new ImagePool(scene, DEPTH.boss, LEVEL_ATLAS);
    this.hostages = new ImagePool(scene, DEPTH.hostages, LEVEL_ATLAS);
    this.shadows = scene.add.graphics().setDepth(DEPTH.shadows);
    this.actors = new ImagePool(scene, DEPTH.actors, ATLAS);
    this.gauges = scene.add.graphics().setDepth(DEPTH.gauges);
    this.pickupBoxes = scene.add.graphics().setDepth(DEPTH.pickups);
    this.pickupLetters = [];
    this.marks = scene.add.graphics().setDepth(DEPTH.marks);
    this.markLabel = scene.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' })
      .setOrigin(0.5, 1).setDepth(DEPTH.marks);
    this.waves = scene.add.graphics().setDepth(DEPTH.shots);
    this.shots = new ImagePool(scene, DEPTH.shots, ATLAS);
    this.fx = new ImagePool(scene, DEPTH.fx, ATLAS);
  }

  // chaque tronçon : la bande [début, début + largeur] de l'image, posée bout à bout
  #buildDecor(level) {
    let x = 0;
    for (const [from, w] of level.segments) {
      this.scene.add.image(x - from, 0, level.image).setOrigin(0).setCrop(from, 0, w, this.scene.scale.height).setDepth(DEPTH.decor);
      x += w;
    }
  }

  // tout sauf le décor (l'éditeur dessine le niveau lui-même)
  setVisible(on) {
    this.hidden = !on;
    this.scene.children.list.forEach((o) => { if (o.depth > DEPTH.decor) o.setVisible(on); });
  }

  render({ marks = false } = {}) {
    if (this.hidden) return;
    const { world } = this;
    const [sx, sy] = world.shakeOffset || [0, 0];
    this.scene.cameras.main.setScroll(Math.round(world.cam) - sx, -sy);
    this.#props();
    this.#boss();
    this.#hostages();

    this.shadows.clear();
    this.gauges.clear();
    this.actors.begin();
    // du fond vers l'avant du trottoir ; à profondeur égale, les héros par-dessus les ennemis
    [...world.enemies, ...world.heroes].sort((a, b) => a.z - b.z).forEach((a) => this.#actor(a));
    this.actors.end();

    this.#pickups();
    this.marks.clear();
    this.markLabel.setVisible(marks);
    if (marks && world.hero) this.#marks(world.hero);
    this.#shots();

    this.fx.begin();
    world.effects.visible.forEach((e) => this.fx.take(fxFrame(e))
      .setPosition(Math.round(e.x), Math.round(e.y)).setRotation(e.angle).setFlipX(e.flip < 0));
    this.fx.end();
  }

  #props() {
    this.props.begin();
    for (const p of this.world.props) {
      if (!p.frame) continue;
      // une porte joue son ouverture ; les autres, leur image (cassée ou non)
      const key = p.cfg.door
        ? `${p.cfg.frame}/${p.doorT < 0 ? 0 : Math.min(2, Math.floor(p.doorT * DOOR_FPS))}`
        : levelFrame(p.frame).key;
      this.props.take(key).setPosition(Math.round(p.x), Math.round(p.y)).setDepth(lane(0) - 0.0005);
    }
    this.props.end();
  }

  #boss() {
    const pool = this.boss, b = this.world.boss;
    pool.begin();
    if (b) {
      // la coque s'assombrit et rougit avec la vie perdue
      const d = b.fighting() ? b.damage() : 0, c = Math.round(255 - 90 * d);
      const hull = pool.take(b.hullFrame().key).setPosition(Math.round(b.x), Math.round(b.y));
      if (d > 0) hull.setTint((Math.min(255, c + 20) << 16) | (Math.round(c * 0.85) << 8) | Math.round(c * 0.8));
      for (const part of b.weapons) {
        const f = part.frame(b.t);
        if (!f) continue;
        const img = pool.take(f.key).setPosition(Math.round(part.x), Math.round(part.y));
        if (part.hurtT > 0) img.setTint(0x707070).setTintMode(Phaser.TintModes.ADD);   // touché : éclairci
      }
      const pilot = b.pilotFrame();
      if (pilot) {
        const img = pool.take(pilot.key).setPosition(Math.round(b.core.x), Math.round(b.core.y));
        if (b.core.hurtT > 0) img.setTint(0x707070).setTintMode(Phaser.TintModes.ADD);
      }
      for (const d of b.debris) pool.take(`${d.name}/${d.k}`).setPosition(Math.round(d.x), Math.round(d.y)).setRotation(d.rot);
      if (b.pilot) pool.take(levelFrame(b.pilot.anim, b.pilot.t).key).setPosition(Math.round(b.pilot.x), Math.round(b.pilot.y));
    }
    pool.end();
  }

  #hostages() {
    this.hostages.begin();
    for (const h of this.world.hostages) this.hostages.take(levelFrame(h.anim, h.t).key).setPosition(Math.round(h.x), Math.round(h.y)).setDepth(lane(0));
    this.hostages.end();
  }

  // Un acteur : son ombre, son image (entière ou jambes + buste), et sa jauge s'il le faut.
  #actor(a) {
    const P = a.pose, k = P.scale ?? 1;
    let alpha = a.fade ?? 1;
    if (a.invulnT > 0 && Math.floor(a.invulnT * 12) % 2) alpha *= 0.35;      // il clignote
    // ombre portée sur l'appui en dessous, plus petite en l'air ; tout est décalé de la profondeur
    const z = Math.round(a.z);
    const lift = a.lift(), s = Math.max(0.3, 1 - lift / 90) * k, floor = Math.round(a.y + lift) + z;
    this.shadows.fillStyle(0x000000, 0.4 * alpha);
    this.shadows.fillRect(Math.round(a.x - 14 * s), floor - 2, Math.round(28 * s), 3);
    this.shadows.fillRect(Math.round(a.x - 10 * s), floor - 3, Math.round(20 * s), 5);
    // couché (rotate) : le retournement s'applique après la rotation, d'où le signe de facing
    const rotation = -P.rotate * Math.PI / 2 * a.facing;
    const ride = a.riding ? this.#skateboard(a, z) : 0;    // sur sa planche : un peu plus haut
    // touché : flash blanc ; une télé abîmée s'assombrit avec la vie perdue
    const flash = a.flashT > 0, dark = a.cfg?.wear ? Math.round(255 - 110 * a.damage()) : 255;
    for (const p of P.parts) {
      if (p.to <= p.from) continue;
      const img = this.actors.take(frameName(p.fr), a.atlas);
      if (flash) img.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      else if (dark < 255) img.setTint((dark << 16) | (Math.round(dark * 0.92) << 8) | Math.round(dark * 0.88));
      img
        .setPosition(Math.round(p.x), Math.round(p.y) + z - ride)
        .setDepth(lane(a.z))
        .setScale(k)
        .setFlipX(a.facing < 0)
        .setRotation(rotation)
        .setAlpha(alpha)
        .setCrop(0, p.from, p.fr[2], p.to - p.from);
    }
    // jauge : les gros ennemis en jeu, tous les ennemis dans la démo
    if (a.side !== 'hero' && a.alive() && (a.cfg?.boss || this.world.scrollBack)) this.#gauge(a, alpha, z);
  }

  // Le skate de l'attaque en glisse, sous les pieds (sur le calque des ombres, donc dessous), et
  // des traits de vitesse derrière. Renvoie de combien le héros est surélevé.
  #skateboard(a, z) {
    const g = this.shadows, x = Math.round(a.x), y = Math.round(a.y) + z, f = a.facing;
    g.fillStyle(0x1b1410).fillRect(x - 16, y - 6, 32, 3);           // la planche, vue de côté
    g.fillStyle(0xc0392b).fillRect(x - 15, y - 5, 30, 1);           // son liseré
    g.fillStyle(0x1b1410).fillRect(x + 15 * f - (f > 0 ? 2 : 0), y - 8, 3, 2);   // le nez relevé
    for (const wx of [x - 10, x + 8]) g.fillStyle(0xe8e0c8).fillRect(wx, y - 3, 3, 3);   // les roues
    g.fillStyle(0xffffff, 0.5);
    for (let k = 0; k < 3; k++) g.fillRect(x - f * (24 + k * 9) - (f > 0 ? 8 : 0), y - 20 - k * 12, 8, 1);
    return 5;
  }

  // Jauge de vie d'un ennemi : au-dessus de sa tête, elle se vide à mesure qu'il encaisse.
  #gauge(a, alpha, z) {
    const g = this.gauges, w = 26 * a.scale, x = Math.round(a.x - w / 2), y = Math.round(a.y - a.p.hauteur * a.scale - 13) + z;
    g.fillStyle(0x000000, 0.8 * alpha).fillRect(x - 1, y - 1, w + 2, 6);
    g.fillStyle(0x402828, alpha).fillRect(x, y, w, 4);
    g.fillStyle(a.hp > a.maxHp * 0.34 ? 0xe0605a : 0xf5a524, alpha);
    g.fillRect(x, y, Math.round(w * Math.max(0, a.hp) / a.maxHp), 4);
  }

  // Les bonus : une caisse de métal qui flotte, sa lettre dessus, qui clignote avant de partir.
  #pickups() {
    const g = this.pickupBoxes.clear();
    const list = this.world.pickups;
    while (this.pickupLetters.length < list.length) {
      this.pickupLetters.push(this.scene.add.text(0, 0, '', { fontFamily: FONT, fontSize: '8px', color: '#ffffff' })
        .setOrigin(0.5).setDepth(DEPTH.pickups));
    }
    this.pickupLetters.forEach((t, i) => t.setVisible(i < list.length));
    list.forEach((p, i) => {
      const bob = p.air ? 0 : Math.round(Math.sin(p.t * 5) * 2);
      const hidden = p.t > 11 && Math.floor(p.t * 8) % 2;
      const x = Math.round(p.x), y = Math.round(p.y) - 10 + bob;
      this.pickupLetters[i].setVisible(!hidden).setText(p.letter).setPosition(x, y).setColor(PICKUPS[p.letter].color);
      if (hidden) return;
      g.fillStyle(0x000000, 0.4).fillRect(x - 8, Math.round(p.y) - 1, 16, 2);
      g.fillStyle(0x1a1a20).fillRect(x - 10, y - 9, 20, 18);
      g.fillStyle(0x6b6b78).fillRect(x - 9, y - 8, 18, 16);
      g.fillStyle(0x2b2b33).fillRect(x - 7, y - 6, 14, 12);
    });
  }

  #shots() {
    const w = this.waves.clear();
    this.shots.begin();
    for (const p of this.world.visibleShots) {
      if (!p.fx) {
        // l'onde du mégaphone : des arcs qui roulent au ras du sol
        const x = Math.round(p.x), y = Math.round(p.y) + 10;
        w.lineStyle(2, 0xbfe9ff, 0.9);
        for (let r = 6; r <= 18; r += 6) w.strokeEllipse(x, y - r / 2, r * 0.9, r * 1.6);
        continue;
      }
      const img = this.shots.take(fxFrame({ name: p.fx, t: p.t })).setPosition(Math.round(p.x), Math.round(p.y + (p.z ?? 0))).setFlipX(p.vx < 0);
      if (p.tint) img.setTint(p.tint);
      // un missile : gros, orange, pointé dans le sens de sa course
      if (p.kind === 'rocket') img.setFlipX(false).setScale(2).setRotation(Math.atan2(p.vy, p.vx)).setTint(0xffb040);
    }
    this.shots.end();
  }

  // Repères : cadre de chaque image, raccord des hanches (jaune), ancrage (vert), bouche de
  // l'arme (rouge) et nom de l'anim jouée.
  #marks(a) {
    const g = this.marks, P = a.pose, sx = a.x, y = Math.round(a.y + a.z);
    g.lineStyle(1, 0xffffff, 0.5);
    for (const p of P.parts) {
      const left = a.facing > 0 ? p.fr[4] : p.fr[2] - p.fr[4];
      g.strokeRect(Math.round(p.x - left) + 0.5, Math.round(p.y - p.fr[5] + p.from) + 0.5, p.fr[2], p.to - p.from);
    }
    if (P.split) g.fillStyle(0xffff00).fillRect(sx - 14, Math.round(P.split.y), 28, 1);
    this.#cross(sx, y, 0x00ff00);
    this.#cross(P.muzzle[0], P.muzzle[1], 0xff0000);
    this.markLabel.setText(P.label).setPosition(Math.round(sx), y + 22);
  }

  #cross(x, y, color) {
    this.marks.fillStyle(color)
      .fillRect(Math.round(x) - 3, Math.round(y), 7, 1)
      .fillRect(Math.round(x), Math.round(y) - 3, 1, 7);
  }
}

