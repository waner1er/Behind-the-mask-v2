import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { ClipDirector } from '../game/clip/ClipDirector.js';
import { WALL_FOOT } from '../game/clip/WallBreach.js';
import { WorldView } from '../views/WorldView.js';
import metalSlug from '../data/levels/02-metal-slug.json' with { type: 'json' };

// plans de la brèche, entre ceux de WorldView : le trou sur le mur (devant le décor, derrière
// les éléments posés), les briques au sol (sous les persos), les briques en vol (devant tout)
const DEPTH = { hole: 0.5, rubble: 4.5, flying: 9.5 };
const BRICK = 0x9a4a32, BRICK_DARK = 0x5c2a1c, MORTAR = 0x2a1a14;

// Le niveau du clip : un ClipDirector (la partie jouée toute seule, calée sur le morceau),
// affiché par une WorldView, avec le bandeau du jeu (GameHudScene) en parallèle, et la brèche
// d'où sort l'invité. Pas de bruitages : le morceau seul. L'heure vient de l'horloge du clip
// (clip.clock).
export class ClipGameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.clipGame);
  }

  init({ players, clip }) {
    this.heroId = players[0]?.heroId ?? 'pierre';
    this.clip = clip;
  }

  create() {
    const clock = this.clip.clock;
    this.director = new ClipDirector({ level: structuredClone(metalSlug), heroId: this.heroId, clip: this.clip.cfg, start: clock.t });
    this.session = this.director.session;
    this.paused = false;                       // lu par le bandeau
    this.view = new WorldView(this, this.session.world);
    this.hole = this.add.graphics().setDepth(DEPTH.hole);
    this.rubble = this.add.graphics().setDepth(DEPTH.rubble);
    this.flying = this.add.graphics().setDepth(DEPTH.flying);
    this.scene.launch(SCENES.gameHud, { game: this });
    if (import.meta.env.DEV) window.clipGame = this;
    this.cameras.main.fadeIn(300);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const had = !!this.director.breach;
    this.director.update(this.clip.clock.t, dt);
    if (!had && this.director.breach) this.cameras.main.flash(180, 255, 240, 200);
    this.session.world.sounds.length = 0;
    this.view.render();
    this.#breach();
  }

  // le trou (sombre, bordé de briques cassées, un tas de gravats au pied) et les briques
  #breach() {
    const b = this.director.breach;
    if (!b) return;
    const hole = this.hole.clear(), pts = b.outline, poly = [];
    for (let i = 0; i < pts.length; i += 2) poly.push({ x: pts[i], y: pts[i + 1] });
    hole.fillStyle(MORTAR).fillPoints(poly, true);
    hole.fillStyle(0x0c0806).fillPoints(poly.map((p) => ({ x: b.x + (p.x - b.x) * 0.82, y: WALL_FOOT - (WALL_FOOT - p.y) * 0.88 })), true);
    // les briques cassées du bord
    for (let i = 2; i < pts.length - 2; i += 2) hole.fillStyle(i % 4 ? BRICK : BRICK_DARK).fillRect(pts[i] - 3, pts[i + 1] - 2, 6, 3);
    // les gravats au pied du trou
    for (let k = 0; k < 9; k++) hole.fillStyle(k % 2 ? BRICK : BRICK_DARK).fillRect(b.x - 20 + k * 5, WALL_FOOT - 3 - (k % 3), 5, 3);
    const rubble = this.rubble.clear(), flying = this.flying.clear();
    for (const r of b.bricks) brick(r.rest ? rubble : flying, r);
  }
}

// une brique tournée : un rectangle de 6 × 3 (ou 4 × 3), joint de mortier sombre en dessous
function brick(g, r) {
  const w = r.big ? 6 : 4, h = 3, c = Math.cos(r.rot), s = Math.sin(r.rot);
  const corner = (dx, dy) => ({ x: Math.round(r.x + dx * c - dy * s), y: Math.round(r.y + dx * s + dy * c) });
  const quad = (o) => [corner(-w / 2 + o, -h / 2 + o), corner(w / 2 + o, -h / 2 + o), corner(w / 2 + o, h / 2 + o), corner(-w / 2 + o, h / 2 + o)];
  g.fillStyle(MORTAR).fillPoints(quad(1), true);
  g.fillStyle(BRICK).fillPoints(quad(0), true);
}
