import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { ClipDirector } from '../game/clip/ClipDirector.js';
import { WALL_FOOT } from '../game/clip/Shatter.js';
import { Lyrics } from '../game/clip/Lyrics.js';
import { COLORS, FONT } from '../config/theme.js';
import { WorldView } from '../views/WorldView.js';
import { ImagePool } from '../views/ImagePool.js';
import metalSlug from '../data/levels/02-metal-slug.json' with { type: 'json' };

export const PROPS = 'clip-props';     // l'atlas des TV (tools/build_clip_props.py), chargé par ClipScene
// plans, entre ceux de WorldView : les TV devant le décor et ses éléments posés (derrière le boss), les
// éclats au sol sous les persos, les éclats en vol et les mots devant tout
const DEPTH = { tvs: 1.2, bigTv: 1.5, rest: 4.5, flying: 9.5, words: 9.8 };
const WORD = { fontFamily: FONT, fontSize: '12px', color: COLORS.accent };
const FLICKER = 0.09;                  // s entre deux grésillements des écrans

// Le niveau du clip : un ClipDirector (la partie jouée toute seule, calée sur le morceau),
// affiché par une WorldView, avec le bandeau du jeu (GameHudScene) en parallèle, les TV
// cathodiques (dont la grosse d'où sort l'invité, et ses éclats de verre) et les mots des
// paroles que libèrent les ennemis qui tombent. Pas de bruitages : le morceau seul. L'heure
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
    this.tvs = this.director.tvs.map((tv) => ({ tv, img: this.add.image(tv.x, WALL_FOOT, PROPS, `tv${tv.k}`).setDepth(DEPTH.tvs) }));
    this.bigTv = this.add.image(0, WALL_FOOT, PROPS, 'bigtv').setDepth(DEPTH.bigTv).setVisible(false);
    this.shards = new ImagePool(this, DEPTH.flying, PROPS);
    this.flickerT = 0;
    this.wordTexts = [];
    this.scene.launch(SCENES.gameHud, { game: this });
    if (import.meta.env.DEV) window.clipGame = this;
    this.cameras.main.fadeIn(300);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const had = !!this.director.shatter;
    this.director.update(this.clip.clock.t, dt);
    if (!had && this.director.shatter) this.cameras.main.flash(180, 220, 235, 255);
    this.session.world.sounds.length = 0;
    this.view.render();
    this.#tvs(dt);
    this.#words();
  }

  // Les TV : les écrans grésillent (une TV au hasard s'éclaire un instant) ; la grosse passe à
  // l'écran brisé ; ses éclats volent devant tout, puis se couchent sous les persos.
  #tvs(dt) {
    if ((this.flickerT -= dt) <= 0) {
      this.flickerT = FLICKER;
      for (const { img } of this.tvs) {
        if (Math.random() < 0.3) img.setTint(0xffffff).setTintMode(Phaser.TintModes.ADD).setAlpha(0.15 + Math.random() * 0.1);
        else img.clearTint().setAlpha(1);
      }
    }
    this.tvs.forEach(({ tv, img }) => img.setVisible(this.director.tvs.includes(tv)));
    const big = this.director.bigTv;
    if (big) this.bigTv.setVisible(true).setPosition(big.x, WALL_FOOT).setFrame(big.broken ? 'bigtv_broken' : 'bigtv');
    this.shards.begin();
    for (const p of this.director.shatter?.pieces ?? []) {
      this.shards.take(p.frame).setPosition(Math.round(p.x), Math.round(p.y)).setRotation(p.rot)
        .setScale(p.scale).setDepth(p.rest ? DEPTH.rest : DEPTH.flying);
    }
    this.shards.end();
  }

  // les mots libérés : ils grossissent d'un coup en sortant, puis montent en s'effaçant
  #words() {
    const words = this.director.words;
    while (this.wordTexts.length < words.length) {
      this.wordTexts.push(this.add.text(0, 0, '', WORD).setOrigin(0.5).setStroke('#2a1000', 4).setDepth(DEPTH.words));
    }
    this.wordTexts.forEach((tx, i) => {
      const w = words[i];
      tx.setVisible(!!w);
      if (!w) return;
      if (tx.text !== w.text) tx.setText(w.text);
      tx.setPosition(Math.round(w.x), Math.round(w.y)).setScale(w.t < 0.12 ? 1.6 - w.t * 5 : 1).setAlpha(Math.min(1, (1.8 - w.t) / 0.5));
    });
  }
}
