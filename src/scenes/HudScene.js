import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { ARROW } from '../config/anims.js';
import { COLORS, TEXT_8, hex } from '../config/theme.js';

const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const HP_X = 170, HP_W = 46;

// Le bandeau façon Metal Slug, au-dessus du jeu et hors caméra : le héros, le mode, ses PV
// pendant un combat, le passage en cours (ou la visée), l'avancée dans la rue ; et le fondu
// noir de fin de niveau, sous le bandeau. Lancée en parallèle de la scène de démo.
export class HudScene extends Phaser.Scene {
  constructor() {
    super(SCENES.hud);
  }

  init({ session }) {
    this.session = session;
  }

  create() {
    const { width: W, height: H } = this.scale;
    this.fade = this.add.rectangle(0, 0, W, H, 0x000000).setOrigin(0).setAlpha(0);
    this.add.rectangle(0, 0, W, 18, 0x000000, 0.67).setOrigin(0);
    this.bars = this.add.graphics();
    this.name = this.add.text(6, 5, '', TEXT_8);
    this.mode = this.add.text(92, 5, '', { ...TEXT_8, color: COLORS.accent });
    this.hpLabel = this.add.text(HP_X + HP_W + 6, 5, 'PV', TEXT_8);
    this.label = this.add.text(W - 6, 5, '', TEXT_8).setOrigin(1, 0);
    // en mode attraction (écran de garde du jeu), on rappelle comment jouer
    this.press = this.add.text(W / 2, H - 40, 'PRESS START', { fontFamily: '"Press Start 2P"', fontSize: '12px', color: '#ffffff' })
      .setOrigin(0.5).setStroke('#000000', 4).setVisible(false);
  }

  update() {
    const { session } = this, hero = session.hero, W = this.scale.width;
    this.fade.setAlpha(Math.min(1, session.fade));
    this.press.setVisible(!!session.attract && Math.floor(this.time.now / 500) % 2 === 0);
    this.name.setText(hero.name).setColor(hero.color);
    this.mode.setText(session.auto ? 'DEMO' : 'MANUEL');
    const label = session.label(ARROW[hero.dir]);
    this.label.setText(session.auto ? `${label}   ${mmss(session.autopilot.clock)}` : label);

    const g = this.bars.clear();
    const fighting = session.world.fighting();
    this.hpLabel.setVisible(fighting);
    if (fighting) {
      g.fillStyle(0x000000, 0.67).fillRect(HP_X - 1, 4, HP_W + 2, 9);
      g.fillStyle(hex(hero.hp > hero.maxHp * 0.34 ? COLORS.ok : COLORS.ko));
      g.fillRect(HP_X, 5, Math.round(HP_W * Math.max(0, hero.hp) / hero.maxHp), 7);
    }
    // l'avancée dans la rue
    g.fillStyle(0x000000, 0.5).fillRect(0, 18, W, 2);
    g.fillStyle(hex(COLORS.accent)).fillRect(0, 18, Math.round(W * session.script.progress(hero.x)), 2);
  }
}
