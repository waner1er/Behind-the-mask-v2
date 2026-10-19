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

// L'écran de garde, à la manière de celui de Metal Slug : le logo VIGILANTE / BEHIND THE MASK
// en grand (tools/build_logo.py), PUSH START!, le copyright, les crédits ; la rue défile
// derrière. Start (ou tir) mène à la sélection des héros ; sans rien toucher, la démo prend le
// relais.
export class SplashScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }

  create() {
    const { width: W, height: H } = this.scale;
    // la rue, deux fois de suite pour défiler sans fin, assombrie
    this.street = [0, 1].map((i) => this.add.image(i * 2140, 0, 'rue').setOrigin(0));
    this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0);
    // le logo, avec son ombre portée
    this.add.image(W / 2 + 5, 15, 'title-logo').setOrigin(0.5, 0).setTint(0x000000).setAlpha(0.6);
    this.logo = this.add.image(W / 2, 10, 'title-logo').setOrigin(0.5, 0);
    this.press = this.add.text(W / 2, 270, 'PUSH START!', { fontFamily: FONT, fontSize: '14px', color: '#c8d0ff' })
      .setOrigin(0.5).setStroke('#1a1a40', 5);
    this.add.text(W / 2, 300, '© 2026 VIGILANTE', { ...TEXT_8, color: COLORS.text }).setOrigin(0.5).setStroke('#000000', 3);
    this.add.text(14, H - 8, 'CREDITS 99', { ...TEXT_8, color: '#c8d0ff' }).setOrigin(0, 1).setStroke('#000000', 3);
    this.add.text(W - 14, H - 8, 'CREDITS 99', { ...TEXT_8, color: '#c8d0ff' }).setOrigin(1, 1).setStroke('#000000', 3);
    this.pads = PLAYER_KEYS.map((k) => new KeyboardPad(this.input.keyboard, k));
    this.sfx = new SoundPlayer(this);
    this.t = 0;
    this.idle = 0;
    this.leaving = false;
    this.music = this.sound.get(MUSIC.title) ?? this.sound.add(MUSIC.title, { loop: true, volume: 0.6 });
    if (!this.music.isPlaying) this.music.play();
    this.input.keyboard.on('keydown', () => { this.idle = 0; });
    if (import.meta.env.DEV) window.title = this;     // pour la console et les tests
    this.cameras.main.fadeIn(300);
  }

  update(time, delta) {
    const dt = delta / 1000;
    this.t += dt;
    this.idle += dt;
    this.street.forEach((im, i) => im.setX(Math.round(i * 2140 - ((this.t * SCROLL) % 2140))));
    this.press.setVisible(blink(this.t));
    if (this.leaving) return;
    if (this.pads.some((p) => p.justDown('start') || p.justDown('fire'))) {
      this.sfx.play('pickup');
      this.#go(SCENES.select);
    } else if (this.idle > ATTRACT_AFTER) {
      this.music.stop();
      this.#go(SCENES.demo, { attract: true });
    }
  }

  #go(key, data) {
    this.leaving = true;
    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
