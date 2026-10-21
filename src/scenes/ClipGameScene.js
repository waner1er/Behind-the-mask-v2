import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { ClipDirector } from '../game/clip/ClipDirector.js';
import { Lyrics } from '../game/clip/Lyrics.js';
import { COLORS, FONT } from '../config/theme.js';
import { WorldView } from '../views/WorldView.js';
import { ImagePool } from '../views/ImagePool.js';
import metalSlug from '../data/levels/02-metal-slug.json' with { type: 'json' };

export const PROPS = 'clip-props';     // l'atlas des TV (tools/build_clip_props.py), chargé par ClipScene
// plans, entre ceux de WorldView : les vitrines sur la façade (derrière les éléments posés),
// les éclats au sol sous les persos, les éclats en vol et les mots devant tout
const DEPTH = { shop: 0.3, tvs: 0.4, glass: 0.5, rest: 4.5, flying: 9.5, words: 9.8 };
const SHOP_BACK = 0x0d1018, GLASS = 0xa8dcff;
// les petites TV d'une vitrine : [variante, dx depuis le milieu, hauteur du pied depuis le bas]
const STACK = [[2, -21, 0], [3, 20, 0], [4, -20, 31], [1, 19, 31], [5, 0, 62]];
const ON_BIG = [[3, -20, 44], [2, 20, 44]];       // les deux sur la grosse TV
const PHRASE = { fontFamily: FONT, fontSize: '10px', color: COLORS.accent };
const FLICKER = 0.09;                  // s entre deux grésillements des écrans

// Le niveau du clip : un ClipDirector (la partie jouée toute seule, calée sur le morceau),
// affiché par une WorldView, avec le bandeau du jeu (GameHudScene) en parallèle, les TV
// cathodiques (dont la grosse d'où sort l'invité, et ses éclats de verre) et les phrases des
// paroles que libèrent, de temps en temps, les ennemis qui tombent. Pas de bruitages : le morceau seul. L'heure
// vient de l'horloge du clip (clip.clock).
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
    const cfg = this.clip.cfg;
    const lyrics = new Lyrics(this.cache.text.get('paroles'), cfg.section, cfg.lyrics);
    this.director = new ClipDirector({ level: structuredClone(metalSlug), heroId: this.heroId, clip: cfg, start: clock.t, lyrics });
    this.session = this.director.session;
    this.paused = false;                       // lu par le bandeau
    this.view = new WorldView(this, this.session.world);
    this.#buildWindows();
    this.shards = new ImagePool(this, DEPTH.flying, PROPS);
    this.flickerT = 0;
    this.phraseTexts = [];
    this.scene.launch(SCENES.gameHud, { game: this });
    if (import.meta.env.DEV) window.clipGame = this;
    this.cameras.main.fadeIn(300);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const had = !!this.director.shatter;
    this.director.update(this.clip.clock.t, dt);
    if (this.director.guest && this.clip.guestAt == null) this.clip.guestAt = this.clip.clock.t;
    if (!had && this.director.shatter) this.cameras.main.flash(180, 220, 235, 255);
    this.session.world.sounds.length = 0;
    this.view.render();
    this.#tvs(dt);
    this.#phrases();
  }

  // Les vitrines du vidéoclub : l'intérieur sombre (il cache l'affiche du décor), les TV
  // empilées, la vitre et ses reflets par-dessus. Celle de la grosse TV en a deux de moins.
  #buildWindows() {
    const big = this.director.bigTv;
    this.screens = [];
    this.glass = [];
    for (const w of this.director.windows) {
      const g = this.add.graphics().setDepth(DEPTH.shop);
      g.fillStyle(SHOP_BACK).fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
      const foot = w.y + w.h - 2, cx = w.x + w.w / 2, isBig = big?.window === w;
      for (const [k, dx, up] of isBig ? ON_BIG : STACK) {
        this.screens.push(this.add.image(cx + dx, foot - up, PROPS, `tv${k}`).setDepth(DEPTH.tvs));
      }
      if (isBig) this.bigTv = this.add.image(big.x, big.y - 1, PROPS, 'shop_tv').setDepth(DEPTH.tvs);
      const glass = this.add.graphics().setDepth(DEPTH.glass);
      glass.fillStyle(GLASS, 0.1).fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
      for (const [x, wd] of [[12, 6], [22, 2], [58, 4]]) {
        glass.fillStyle(0xffffff, 0.12);
        for (let y = 0; y < w.h - 6; y++) glass.fillRect(w.x + x + Math.round(y * 0.35), w.y + 3 + y, wd, 1);
      }
      this.glass.push({ g: glass, big: isBig });
    }
  }

  // Les écrans grésillent (une TV au hasard s'éclaire un instant) ; la grosse passe à l'écran
  // brisé et sa vitre disparaît ; les éclats volent devant tout, puis se couchent sous les persos.
  #tvs(dt) {
    if ((this.flickerT -= dt) <= 0) {
      this.flickerT = FLICKER;
      for (const img of this.screens) {
        if (Math.random() < 0.3) img.setTint(0xdde6ff);
        else img.clearTint();
      }
    }
    const big = this.director.bigTv;
    if (big?.broken && this.bigTv.frame.name !== 'shop_tv_broken') {
      this.bigTv.setFrame('shop_tv_broken');
      this.glass.filter((gl) => gl.big).forEach((gl) => gl.g.setVisible(false));
    }
    this.shards.begin();
    for (const p of this.director.shatter?.pieces ?? []) {
      this.shards.take(p.frame).setPosition(Math.round(p.x), Math.round(p.y)).setRotation(p.rot)
        .setScale(p.scale).setDepth(p.rest ? DEPTH.rest : DEPTH.flying);
    }
    this.shards.end();
  }

  // les phrases libérées : elles grossissent d'un coup en sortant, puis montent en s'effaçant,
  // toujours entières à l'écran
  #phrases() {
    const list = this.director.phrases, cam = this.session.world.cam, W = this.scale.width;
    while (this.phraseTexts.length < list.length) {
      this.phraseTexts.push(this.add.text(0, 0, '', PHRASE).setOrigin(0.5).setStroke('#2a1000', 4).setDepth(DEPTH.words));
    }
    this.phraseTexts.forEach((tx, i) => {
      const w = list[i];
      tx.setVisible(!!w);
      if (!w) return;
      if (tx.text !== w.text) tx.setText(w.text);
      const half = tx.width / 2 + 6, x = Math.max(cam + half, Math.min(cam + W - half, w.x));
      tx.setPosition(Math.round(x), Math.round(w.y)).setScale(w.t < 0.12 ? 1.4 - w.t * 3.3 : 1).setAlpha(Math.min(1, (2.6 - w.t) / 0.6));
    });
  }
}
