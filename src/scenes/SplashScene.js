import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { MUSIC } from './BootScene.js';
import { PLAYER_KEYS } from '../config/controls.js';
import { COLORS, FONT, TEXT_8 } from '../config/theme.js';
import { KeyboardPad } from '../input/KeyboardPad.js';
import { SoundPlayer } from '../audio/SoundPlayer.js';

const ATTRACT_AFTER = 25;     // s sans rien toucher : la démo tourne, comme sur une borne
const SCROLL = 18;            // px/s, la rue qui défile derrière le titre
const blink = (t, hz = 2) => Math.floor(t * hz) % 2 === 0;
const MENU_Y = 252, MENU_GAP = 22;
// le menu : la partie (sélection des héros), ou la démo, le clip sur Metal Slug (clip.html)
const MENU = [{ label: 'PUSH START!', scene: SCENES.select }, { label: 'DEMO', page: 'clip.html' }];

// L'écran de garde, à la manière de celui de Metal Slug : le logo VIGILANTE / BEHIND THE MASK
// en grand (tools/build_logo.py), le menu (PUSH START! ou DEMO), le copyright, les crédits ;
// la rue défile derrière. Haut et bas choisissent ; Start (ou tir) mène à la sélection des
// héros, ou à la page du clip de démo ; sans rien toucher, la démo de la rue prend le relais.
export class SplashScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }

  // clip : le clip de démo (scenes/ClipScene.js) mène l'écran : sa manette, sa musique
  init({ clip = null } = {}) {
    this.clip = clip;
  }

  create() {
    const { width: W, height: H } = this.scale;
    // la rue, deux fois de suite pour défiler sans fin, assombrie
    this.street = [0, 1].map((i) => this.add.image(i * 2140, 0, 'rue').setOrigin(0));
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);
    // le logo, avec son ombre portée
    this.add.image(W / 2 + 5, 15, 'title-logo').setOrigin(0.5, 0).setTint(0x000000).setAlpha(0.6);
    this.logo = this.add.image(W / 2, 10, 'title-logo').setOrigin(0.5, 0);
    // le clip ne montre que PUSH START!
    this.choice = 0;
    this.menu = (this.clip ? MENU.slice(0, 1) : MENU).map((m, i) => this.add.text(W / 2, MENU_Y + i * MENU_GAP, m.label, {
      fontFamily: FONT, fontSize: '14px', color: '#c8d0ff',
    }).setOrigin(0.5).setStroke('#1a1a40', 5));
    this.cursor = this.add.text(0, 0, '>', { fontFamily: FONT, fontSize: '14px', color: COLORS.accent })
      .setOrigin(0.5).setStroke('#1a1a40', 5).setVisible(this.menu.length > 1);
    this.add.text(W / 2, 300, '© 2026 VIGILANTE', { ...TEXT_8, color: COLORS.text }).setOrigin(0.5).setStroke('#000000', 3);
    // les crédits dans les coins, sauf sur téléphone où les commandes tactiles s'y trouvent
    if (!document.documentElement.classList.contains('is-touch')) {
      this.add.text(14, H - 8, 'CREDITS 99', { ...TEXT_8, color: '#c8d0ff' }).setOrigin(0, 1).setStroke('#000000', 3);
      this.add.text(W - 14, H - 8, 'CREDITS 99', { ...TEXT_8, color: '#c8d0ff' }).setOrigin(1, 1).setStroke('#000000', 3);
    }
    this.pads = this.clip?.pads ?? PLAYER_KEYS.map((k, i) => new KeyboardPad(this.input.keyboard, k, { touch: i === 0 }));
    this.sfx = new SoundPlayer(this);
    this.t = 0;
    this.idle = 0;
    this.leaving = false;
    this.music = this.sound.get(MUSIC.title) ?? this.sound.add(MUSIC.title, { loop: true, volume: 0.6 });
    if (!this.music.isPlaying && !this.clip) this.music.play();
    this.input.keyboard.on('keydown', () => { this.idle = 0; });
    if (import.meta.env.DEV) window.title = this;     // pour la console et les tests
    this.cameras.main.fadeIn(300);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.t += dt;
    this.idle += dt;
    if (this.pads.some((p) => ['left', 'right', 'up', 'down', 'fire'].some((a) => p.isDown(a)))) this.idle = 0;
    this.street.forEach((im, i) => im.setX(Math.round(i * 2140 - ((this.t * SCROLL) % 2140))));
    this.#drawMenu();
    if (this.leaving) return;
    const step = this.pads.reduce((d, p) => d + (p.justDown('down') ? 1 : 0) - (p.justDown('up') ? 1 : 0), 0);
    if (step && this.menu.length > 1) {
      this.choice = (this.choice + step + this.menu.length) % this.menu.length;
      this.sfx.play('pick');
    }
    if (this.pads.some((p) => p.justDown('start') || p.justDown('fire'))) {
      this.sfx.play('pickup');
      const item = MENU[this.choice];
      if (item.page) this.#open(item.page);
      else this.#go(item.scene, this.clip ? { clip: this.clip } : undefined);
    } else if (this.idle > ATTRACT_AFTER && !this.clip) {
      this.music.stop();
      this.#go(SCENES.demo, { attract: true });
    }
  }

  // l'entrée choisie clignote, le curseur la montre
  #drawMenu() {
    this.menu.forEach((m, i) => m.setVisible(i !== this.choice || blink(this.t)));
    const m = this.menu[this.choice];
    this.cursor.setPosition(Math.round(m.x - m.width / 2 - 16), m.y);
  }

  // une autre page du site (le clip de démo) : fondu, puis on y va
  #open(page) {
    this.leaving = true;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => { location.href = page; });
  }

  #go(key, data) {
    this.leaving = true;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
