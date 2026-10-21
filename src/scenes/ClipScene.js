import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { MUSIC } from './BootScene.js';
import { CLIP } from '../config/clip.js';
import { COLORS, FONT, TEXT_8 } from '../config/theme.js';
import { ScriptedPad } from '../input/ScriptedPad.js';
import { addPersos } from '../data/sprites.js';
import { PROPS } from './ClipGameScene.js';

const CAPTION = [0.6, 4.8];            // le titre du morceau, sur l'écran de garde
const GUEST_TIME = 4;                  // le bandeau de l'invité reste 4 s

// le titre du morceau : l'en-tête de sa section dans paroles.md (« ## 02. Metal Slug (feat. …) »)
function songTitle(markdown, section) {
  const line = markdown.split('\n').find((l) => l.startsWith(`## ${section}`)) ?? '';
  return line.replace(/^##\s*\d+\.\s*/, '').trim();
}

// Le clip de démo sur « Metal Slug » : il tient le morceau et l'horloge (clip.clock, l'heure
// du morceau), enchaîne l'écran de garde, la sélection et le niveau (config/clip.js) avec une
// manette qui joue seule, et affiche par-dessus le titre du morceau, l'arrivée de l'invité et
// le fondu final. Elle est la dernière scène du jeu : elle se dessine
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
    const props = CLIP.tvs.atlas;
    this.load.atlas(PROPS, `${props}.png`, `${props}.atlas.json`);
  }

  create() {
    const { width: W, height: H } = this.scale;
    addPersos(this.cache.json.get('guest-index'));
    const clock = { t: 0 };
    this.clock = clock;
    this.clip = { cfg: CLIP, clock, pads: [new ScriptedPad(CLIP.pads, () => clock.t)], next: SCENES.clipGame };
    this.#overlay(W, H);
    this.music = this.sound.get(MUSIC.title) ?? this.sound.add(MUSIC.title, { volume: 0.9 });
    if (!this.exporting) this.music.play({ loop: false, seek: 0 });
    // C'est un clip : il continue quand la fenêtre perd le focus (curseur ailleurs, autre
    // fenêtre). Seul un onglet caché l'arrête (le navigateur ne dessine plus) : le morceau se met
    // alors en pause avec lui, pour repartir ensemble.
    this.sound.pauseOnBlur = false;
    this.game.events.on(Phaser.Core.Events.HIDDEN, () => this.music.isPlaying && this.music.pause());
    this.game.events.on(Phaser.Core.Events.VISIBLE, () => this.music.isPaused && this.music.resume());
    this.done = false;
    this.scene.launch(SCENES.title, { clip: this.clip });
    if (import.meta.env.DEV) window.clip = this;
    this.game.events.emit('clip-ready');
  }

  #overlay(W, H) {
    const title = songTitle(this.cache.text.get('paroles'), CLIP.section).toUpperCase();
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
    else if (!this.music.isPaused) this.clock.t += delta / 1000;
    const t = this.clock.t;
    this.#caption(t);
    this.#guest(t);
    const fadeFrom = CLIP.duration - CLIP.fadeOut;
    this.black.setAlpha(Math.max(0, Math.min(1, (t - fadeFrom) / CLIP.fadeOut)));
    if (t >= CLIP.duration && !this.done) {
      this.done = true;
      this.game.events.emit('clip-done');
    }
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
