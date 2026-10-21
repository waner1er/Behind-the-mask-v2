import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { MUSIC } from './BootScene.js';
import { CLIP } from '../config/clip.js';
import { COLORS, FONT, TEXT_8 } from '../config/theme.js';
import { Lyrics } from '../game/clip/Lyrics.js';
import { ScriptedPad } from '../input/ScriptedPad.js';
import { addPersos } from '../data/sprites.js';

const BAND = 30;                       // la bande des paroles, en bas de l'écran
const LYRIC = { fontFamily: FONT, fontSize: '10px', color: '#ffffff' };
const CAPTION = [0.6, 4.8];            // le titre du morceau, sur l'écran de garde
const GUEST_TIME = 4;                  // le bandeau de l'invité reste 4 s

// Le clip de démo sur « Metal Slug » : il tient le morceau et l'horloge (clip.clock, l'heure
// du morceau), enchaîne l'écran de garde, la sélection et le niveau (config/clip.js) avec une
// manette qui joue seule, et affiche par-dessus les paroles en karaoké, le titre du morceau,
// l'arrivée de l'invité et le fondu final. Elle est la dernière scène du jeu : elle se dessine
// au-dessus des autres.
// exporting : pas de son, l'heure avance au pas du jeu (l'export vidéo pilote les images).
// Le jeu émet 'clip-done' à la fin du morceau.
export class ClipScene extends Phaser.Scene {
  constructor({ exporting = false } = {}) {
    super(SCENES.clip);
    this.exporting = exporting;
  }

  preload() {
    this.load.text('paroles', 'assets/audio/paroles.md');
    const { def, files } = CLIP.guest;
    this.load.atlas(def.atlas, `${files}.png`, `${files}.atlas.json`);
    this.load.json('guest-index', `${files}.json`);
  }

  create() {
    const { width: W, height: H } = this.scale;
    addPersos(this.cache.json.get('guest-index'));
    this.lyrics = new Lyrics(this.cache.text.get('paroles'), CLIP.section, CLIP.lyrics);
    const clock = { t: 0 };
    this.clock = clock;
    this.clip = { cfg: CLIP, clock, pads: [new ScriptedPad(CLIP.pads, () => clock.t)], next: SCENES.clipGame };
    this.#overlay(W, H);
    this.music = this.sound.get(MUSIC.title) ?? this.sound.add(MUSIC.title, { volume: 0.9 });
    if (!this.exporting) this.music.play({ loop: false, seek: 0 });
    this.done = false;
    this.scene.launch(SCENES.title, { clip: this.clip });
    if (import.meta.env.DEV) window.clip = this;
    this.game.events.emit('clip-ready');
  }

  #overlay(W, H) {
    this.band = this.add.rectangle(0, H - BAND, W, BAND, 0x000000, 0.6).setOrigin(0);
    this.line = this.add.text(W / 2, H - BAND / 2, '', LYRIC).setOrigin(0.5).setStroke('#000000', 4);
    this.sung = this.add.text(W / 2, H - BAND / 2, '', { ...LYRIC, color: COLORS.accent }).setOrigin(0.5).setStroke('#3a1a00', 4);
    const title = this.lyrics.title.toUpperCase();
    const [name, feat] = title.split(/\s*\((.*)\)/);
    this.caption = [
      this.add.text(10, 10, 'VIGILANTE', { ...TEXT_8, color: COLORS.muted }),
      this.add.text(10, 22, name, { fontFamily: FONT, fontSize: '12px', color: COLORS.accent }),
      this.add.text(10, 40, feat ?? '', { ...TEXT_8, color: COLORS.text }),
    ].map((t) => t.setStroke('#000000', 4).setAlpha(0));
    this.guest = [
      this.add.text(W / 2, 74, `FEAT. ${CLIP.guest.def.name}`, { fontFamily: FONT, fontSize: '16px', color: CLIP.guest.def.color }),
      this.add.text(W / 2, 96, `FROM ${CLIP.guest.band}`, { ...TEXT_8, color: COLORS.text }),
    ].map((t) => t.setOrigin(0.5).setStroke('#000000', 5).setVisible(false));
    this.black = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setAlpha(0);
  }

  update(time, delta) {
    // en direct, l'heure est celle du morceau ; à l'export, celle du jeu
    if (!this.exporting && this.music.isPlaying) this.clock.t = this.music.seek;
    else this.clock.t += delta / 1000;
    const t = this.clock.t;
    this.#lyrics(t);
    this.#caption(t);
    this.#guest(t);
    const fadeFrom = CLIP.duration - CLIP.fadeOut;
    this.black.setAlpha(Math.max(0, Math.min(1, (t - fadeFrom) / CLIP.fadeOut)));
    if (t >= CLIP.duration && !this.done) {
      this.done = true;
      this.game.events.emit('clip-done');
    }
  }

  // la ligne en cours, surlignée à mesure qu'elle est chantée ; elle apparaît et s'efface en fondu
  #lyrics(t) {
    const cur = this.lyrics.at(t);
    const show = !!cur;
    this.band.setVisible(show);
    this.line.setVisible(show);
    this.sung.setVisible(show);
    if (!show) return;
    const text = cur.text.toUpperCase();
    if (this.line.text !== text) { this.line.setText(text); this.sung.setText(text); }
    const alpha = Math.min(1, cur.age / 0.15, cur.left / 0.3);
    this.band.setAlpha(alpha);
    this.line.setAlpha(alpha);
    this.sung.setAlpha(alpha).setCrop(0, 0, this.sung.width * cur.progress, this.sung.height);
  }

  #caption(t) {
    const [a, b] = CAPTION;
    const alpha = Math.max(0, Math.min(1, (t - a) / 0.4, (b - t) / 0.4));
    this.caption.forEach((c) => c.setAlpha(alpha));
  }

  // l'invité arrive : son nom glisse depuis la droite, clignote un peu, puis s'en va
  #guest(t) {
    const age = t - CLIP.guest.at, on = age >= 0 && age < GUEST_TIME;
    this.guest.forEach((g, i) => {
      g.setVisible(on && (age > 0.8 || Math.floor(age * 8) % 2 === 0));
      const slide = Math.max(0, 1 - age / 0.35) * this.scale.width;
      g.setX(this.scale.width / 2 + (i ? -slide : slide));
    });
  }
}
