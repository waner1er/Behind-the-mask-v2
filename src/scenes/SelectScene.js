import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { MUSIC } from './BootScene.js';
import { CAST } from '../config/cast.js';
import { PLAYER_KEYS } from '../config/controls.js';
import { COLORS, FONT, TEXT_8, hex } from '../config/theme.js';
import { KeyboardPad } from '../input/KeyboardPad.js';
import { ATLAS, frameName, perso } from '../data/sprites.js';
import { SoundPlayer } from '../audio/SoundPlayer.js';

const PANEL = { w: 126, h: 160, top: 64, gap: 20 };
const TIME = 30;                                   // s pour choisir, puis le choix se fait seul
const CURSOR = [COLORS.accent, '#6fa8dc'];         // J1 orange, J2 bleu (la couleur de leurs tirs)
const SHUTTER = 0.35;                              // s pour que le rideau de fer tombe
const ZOOM = 1.5;                                  // les sprites du jeu, une fois et demie plus grands
const GREY = 0x4a4740;                             // héros pas encore visé : dans l'ombre

// La sélection des héros, façon « SOLDIER SELECT » de Metal Slug : les quatre héros tels qu'on
// les voit en jeu, dans l'ombre sur un mur de métal ; celui sous le curseur s'éclaire et bouge, le compte à rebours, et à la validation
// le nom crié par l'annonceur pendant que les rideaux de fer tombent sur les autres.
// Les touches : ← → pour choisir, tir ou Start pour valider. Deux joueurs au plus.
export class SelectScene extends Phaser.Scene {
  constructor() {
    super(SCENES.select);
  }

  // clip : le clip de démo (scenes/ClipScene.js) choisit le héros et garde sa musique
  init({ clip = null } = {}) {
    this.clip = clip;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.add.image(0, 0, 'select-fond').setOrigin(0);
    this.#titlePlate(W);
    const left = (W - (PANEL.w * 4 + PANEL.gap * 3)) / 2;
    this.frames = this.add.graphics();
    this.panels = CAST.map((c, i) => {
      const x = left + i * (PANEL.w + PANEL.gap), y = PANEL.top;
      this.#panelFrame(x, y);
      return {
        cast: c, x, y, cx: x + PANEL.w / 2,
        back: this.add.graphics(),
        hero: this.add.image(0, 0, ATLAS).setScale(ZOOM),
        hop: 0,                                    // le petit saut à la validation, de 1 à 0
        shutter: 0,                                // hauteur du rideau, de 0 à 1
        name: this.#namePlate(c, x + PANEL.w / 2, y + PANEL.h + 14),
      };
    });
    this.shutters = this.add.graphics();
    this.#timerPlate(W / 2, H - 46);
    this.timer = this.add.text(W / 2, H - 46, String(TIME), { fontFamily: FONT, fontSize: '16px', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#000000', 4);
    this.add.text(W / 2, H - 14, 'FLECHES  CHOISIR      W / START  VALIDER', { ...TEXT_8, color: COLORS.muted }).setOrigin(0.5);
    this.players = [
      { slot: 0, index: 0, ready: false },
      { slot: 1, index: 1, ready: false, joined: false },
    ].slice(0, PLAYER_KEYS.length);
    this.players[0].joined = true;
    this.tags = this.players.map((pl) => this.add.text(0, 0, `P${pl.slot + 1}`, {
      fontFamily: FONT, fontSize: '10px', color: '#000000', backgroundColor: CURSOR[pl.slot], padding: { x: 4, y: 3 },
    }).setOrigin(0.5, 1));
    this.arrows = this.add.graphics();
    this.pads = this.clip?.pads ?? PLAYER_KEYS.map((k, i) => new KeyboardPad(this.input.keyboard, k, { touch: i === 0 }));
    this.sfx = new SoundPlayer(this);
    this.left = TIME;
    this.doneT = -1;
    this.t = 0;
    this.music = this.sound.get(MUSIC.title) ?? this.sound.add(MUSIC.title, { loop: true, volume: 0.6 });
    if (!this.clip) {
      if (!this.music.isPlaying) this.music.play();
      this.events.once('shutdown', () => this.music.stop());
    }
    if (import.meta.env.DEV) window.select = this;
    this.cameras.main.fadeIn(300);
  }

  // la plaque du titre, comme celle de Metal Slug
  #titlePlate(W) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.75).fillRect(W / 2 - 150, 4, 300, 32);
    g.lineStyle(2, 0x8a7a5c).strokeRect(W / 2 - 150, 4, 300, 32);
    g.lineStyle(1, 0x1a1712).strokeRect(W / 2 - 147, 7, 294, 26);
    this.add.text(W / 2, 20, 'PLAYER SELECT', { fontFamily: FONT, fontSize: '16px', color: COLORS.text })
      .setOrigin(0.5).setStroke('#3a2a10', 5);
  }

  // un cadre de métal autour d'une case : bord sombre, liseré clair, rivets aux coins
  #panelFrame(x, y) {
    const g = this.frames;
    g.fillStyle(0x0d0c0a).fillRect(x - 5, y - 5, PANEL.w + 10, PANEL.h + 10);
    g.fillStyle(0x6f6450).fillRect(x - 3, y - 3, PANEL.w + 6, PANEL.h + 6);
    g.fillStyle(0x1d1a14).fillRect(x - 1, y - 1, PANEL.w + 2, PANEL.h + 2);
    for (const [rx, ry] of [[x - 3, y - 3], [x + PANEL.w + 2, y - 3], [x - 3, y + PANEL.h + 2], [x + PANEL.w + 2, y + PANEL.h + 2]]) {
      g.fillStyle(0xb7a988).fillRect(rx - 1, ry - 1, 3, 3);
    }
  }

  // Le héros dans la case, en position de tir (l'image k : 0 en joue, 1 le coup part) : c'est
  // la pose où son instrument se voit en entier. Centré dans la case, les pieds au sol, levé de `up`.
  #pose(p, k, up) {
    const fr = perso(p.cast.id).anims.shoot_fwd.frames[k];
    const [, , w, , ax] = fr;
    p.hero.setFrame(frameName(fr)).setPosition(Math.round(p.cx - (w / 2 - ax) * ZOOM), p.y + PANEL.h - 10 - up);
  }

  // le fond de la case : sombre, ou éclairé de la couleur du héros, et son ombre au sol
  #backdrop(p, lit) {
    const g = p.back.clear(), { x, y } = p;
    g.fillStyle(0x15130f).fillRect(x, y, PANEL.w, PANEL.h);
    if (lit) {
      const c = hex(p.cast.color);
      for (let k = 0; k < 6; k++) g.fillStyle(c, 0.05 + k * 0.035).fillRect(x, y + k * 16, PANEL.w, PANEL.h - k * 16);
    }
    g.fillStyle(0x000000, 0.5).fillEllipse(p.cx, y + PANEL.h - 10, 64, 10);
  }

  #namePlate(c, cx, cy) {
    const g = this.add.graphics();
    g.fillStyle(0x2c2820).fillRect(cx - 52, cy - 9, 104, 18);
    g.lineStyle(1, 0x8a7a5c).strokeRect(cx - 52, cy - 9, 104, 18);
    return this.add.text(cx, cy + 1, c.name, { ...TEXT_8, color: COLORS.muted }).setOrigin(0.5);
  }

  #timerPlate(cx, cy) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.8).fillRect(cx - 26, cy - 15, 52, 30);
    g.lineStyle(2, 0x8a7a5c).strokeRect(cx - 26, cy - 15, 52, 30);
  }

  #taken(pl, index) {
    return this.players.some((o) => o !== pl && o.joined && o.ready && o.index === index);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.t += dt;
    if (this.doneT < 0) {
      this.left -= dt;
      this.players.forEach((pl, i) => this.#control(pl, this.pads[i]));
      // temps écoulé : chacun prend le héros sous son curseur
      if (this.left <= 0) this.players.filter((pl) => pl.joined && !pl.ready).forEach((pl) => this.#confirm(pl));
      if (this.players.filter((pl) => pl.joined).every((pl) => pl.ready)) this.doneT = 0;
    } else if ((this.doneT += dt) > 1.8 && !this.leaving) {
      this.leaving = true;
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(this.clip?.next ?? SCENES.game, {
        players: this.players.map((pl) => (pl.joined ? { heroId: CAST[pl.index].id } : null)),
        clip: this.clip,
      }));
    }
    this.timer.setText(String(Math.max(0, Math.ceil(this.left))));
    this.#draw(dt);
  }

  #control(pl, pad) {
    if (!pad) return;
    const ok = pad.justDown('fire') || pad.justDown('start');
    if (!pl.joined) {
      if (ok) { pl.joined = true; this.sfx.play('pickup'); }
      return;
    }
    if (pl.ready) return;
    const step = (pad.justDown('right') ? 1 : 0) - (pad.justDown('left') ? 1 : 0);
    if (step) {
      pl.index = (pl.index + step + CAST.length) % CAST.length;
      this.sfx.play('pick');
    }
    if (ok) this.#confirm(pl);
  }

  // validé : le nom crié par l'annonceur, le héros qui flashe et saute
  #confirm(pl) {
    if (this.#taken(pl, pl.index)) return;
    pl.ready = true;
    pl.flash = 0.18;
    this.panels[pl.index].hop = 1;
    this.sfx.play(CAST[pl.index].id);
  }

  #draw(dt) {
    const chosen = this.players.filter((pl) => pl.ready).map((pl) => pl.index);
    const g = this.shutters.clear();
    this.arrows.clear();
    this.panels.forEach((p, i) => {
      const owner = this.players.find((pl) => pl.joined && pl.index === i);
      const lit = !!owner;
      if (p.lit !== lit) { p.lit = lit; this.#backdrop(p, lit); }
      // visé : il respire ; validé : il fait un petit saut en jouant son coup
      p.hop = Math.max(0, p.hop - dt * 4);
      const breath = lit && !owner.ready ? Math.round((Math.sin(this.t * 4) + 1) / 2) : 0;
      this.#pose(p, p.hop > 0 ? 1 : 0, breath + Math.round(Math.sin(p.hop * Math.PI) * 12));
      const flash = owner?.ready && owner.flash > 0;
      if (flash) { owner.flash -= dt; p.hero.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL); } else if (lit) p.hero.clearTint();
      else p.hero.setTint(GREY).setTintMode(Phaser.TintModes.MULTIPLY);
      p.name.setColor(lit ? CAST[i].color : COLORS.muted);
      // les rideaux de fer tombent sur les héros que personne n'a pris
      if (this.doneT >= 0 && !chosen.includes(i)) p.shutter = Math.min(1, p.shutter + dt / SHUTTER);
      if (p.shutter > 0) this.#shutter(g, p);
    });
    // l'étiquette P1 (P2) au-dessus du héros visé, qui sautille tant que rien n'est validé
    this.players.forEach((pl, k) => {
      const p = this.panels[pl.index], bob = pl.ready ? 0 : Math.round(Math.sin(this.t * 8) * 2);
      const x = p.cx + (this.players.length > 1 ? (k ? 16 : -16) : 0), y = p.y - 10 + bob;
      this.tags[k].setVisible(pl.joined).setPosition(x, y - 6);
      if (!pl.joined) return;
      this.arrows.fillStyle(hex(CURSOR[pl.slot])).fillTriangle(x - 5, y - 6, x + 5, y - 6, x, y);
    });
  }

  // un rideau de fer (tôle ondulée) qui descend sur le héros
  #shutter(g, p) {
    const h = Math.round(PANEL.h * p.shutter);
    g.fillStyle(0x4c4a44).fillRect(p.x, p.y, PANEL.w, h);
    for (let y = p.y + 3; y < p.y + h; y += 6) {
      g.fillStyle(0x6c6a62).fillRect(p.x, y, PANEL.w, 2);
      g.fillStyle(0x2a2925).fillRect(p.x, y + 2, PANEL.w, 1);
    }
    g.fillStyle(0x1b1a17).fillRect(p.x, p.y + h - 3, PANEL.w, 3);
  }
}
