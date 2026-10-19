import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { GROUND } from '../config/screen.js';
import { resolveAnim } from '../config/anims.js';
import { COLORS, TEXT_8 } from '../config/theme.js';
import { ATLAS, perso, frameName } from '../data/sprites.js';
import { roster } from '../devtools/roster.js';

const SLOT = 96, ROW_H = 170, ROW_GROUND = 140, COLS = 6;   // 6 persos par rangée
const DECOR = 'rue';
export const PARADE_PICKS = ['AUTO', 'idle', 'walk', 'run', 'shoot_fwd', 'throw', 'melee', 'special', 'hurt', 'death', 'victory'];

// durée d'un passage en mode AUTO : deux tours pour une boucle, un tour + une pause sinon
function passLength(a) {
  const one = a.frames.length / (a.fps || 8);
  return Math.max(1.2, a.loop ? one * 2 : one + 0.8);
}

// La parade : tous les persos de l'atlas côte à côte sur le trottoir de la rue. Chacun passe en
// revue ses anims (AUTO), ou joue celle choisie, sinon son remplacement (nom en orange).
// Le jeu se redimensionne au nombre de persos. Émet 'parade-ready' (la scène) pour les boutons.
export class ParadeScene extends Phaser.Scene {
  constructor() {
    super(SCENES.parade);
  }

  create() {
    this.shown = roster();
    const cols = Math.min(this.shown.length, COLS), rows = Math.ceil(this.shown.length / COLS);
    this.scale.setGameSize(SLOT * cols, ROW_H * rows);
    this.pick = 'AUTO';
    // le décor : une tranche de la rue par rangée, trottoir aligné sur la ligne de sol, assombrie
    const width = SLOT * cols, decorW = this.textures.get(DECOR).getSourceImage().width;
    for (let r = 0; r < rows; r++) {
      const sx = (r * 400) % (decorW - width);
      this.add.image(-sx, r * ROW_H - (GROUND - ROW_GROUND), DECOR).setOrigin(0)
        .setCrop(sx, GROUND - ROW_GROUND, width, ROW_H);
    }
    this.add.rectangle(0, 0, width, ROW_H * rows, 0x000000, 0.44).setOrigin(0);
    this.slots = this.shown.map((who, k) => this.#slot(who, k));
    this.game.events.emit('parade-ready', this);
  }

  #slot({ id, name, color }, k) {
    const cx = (k % COLS) * SLOT + SLOT / 2;
    const gy = Math.floor(k / COLS) * ROW_H + ROW_GROUND;
    this.add.rectangle(cx - 16, gy, 33, 3, 0x000000, 0.4).setOrigin(0);
    const p = perso(id);
    return {
      p, i: 0, t: 0,
      sprite: this.add.image(cx, gy, ATLAS, frameName(p.anims[Object.keys(p.anims)[0]].frames[0])),
      anim: this.add.text(cx, gy + 19, '', TEXT_8).setOrigin(0.5, 0),
      label: this.add.text(cx, gy + 7, name, { ...TEXT_8, color: color || COLORS.text }).setOrigin(0.5, 0),
    };
  }

  play(pick) {
    this.pick = pick;
    this.slots.forEach((s) => { s.i = 0; s.t = 0; });
  }

  update(time, delta) {
    const dt = Math.min(0.1, delta / 1000);
    this.slots.forEach((s) => this.#animate(s, dt));
  }

  #animate(s, dt) {
    const names = Object.keys(s.p.anims);
    const asked = this.pick === 'AUTO' ? names[s.i % names.length] : this.pick;
    const an = resolveAnim(s.p, asked) ?? names[0], a = s.p.anims[an];
    s.t += dt;
    if (this.pick === 'AUTO' && s.t >= passLength(a)) { s.i++; s.t = 0; }
    const n = a.frames.length, step = Math.floor(s.t * (a.fps || 8));
    s.sprite.setFrame(frameName(a.frames[a.loop ? step % n : Math.min(n - 1, step)]));
    s.anim.setText(an).setColor(an === asked ? COLORS.muted : COLORS.accent);   // orange : remplacement
  }
}
