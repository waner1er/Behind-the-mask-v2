import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { WEAPONS } from '../config/weapons.js';
import { TWO_PLAYERS } from '../config/controls.js';
import { COLORS, FONT, TEXT_8, hex } from '../config/theme.js';

const BAND = 24, HP_W = 46;
const BIG = { fontFamily: FONT, fontSize: '16px', color: COLORS.accent };
const blink = (t, hz = 2) => Math.floor(t * hz) % 2 === 0;

// Le bandeau du jeu, au-dessus de la partie et hors caméra : un panneau par joueur (nom,
// score, PV, vies, arme et munitions, vinyles), la jauge du boss, les grands messages
// (MISSION 1, GO!, MISSION COMPLETE, GAME OVER, PAUSE). Lit la session à chaque image.
export class GameHudScene extends Phaser.Scene {
  constructor() {
    super(SCENES.gameHud);
  }

  init({ game }) {
    this.game_ = game;
  }

  create() {
    const { width: W } = this.scale;
    this.add.rectangle(0, 0, W, BAND, 0x000000, 0.6).setOrigin(0);
    this.bars = this.add.graphics();
    this.panels = [0, 1].map((slot) => this.#panel(slot));
    this.bossName = this.add.text(W / 2, BAND + 4, '', TEXT_8).setOrigin(0.5, 0);
    this.message = this.add.text(W / 2, 120, '', BIG).setOrigin(0.5).setStroke('#000000', 5);
    this.sub = this.add.text(W / 2, 146, '', TEXT_8).setOrigin(0.5).setStroke('#000000', 4);
    this.go = this.add.text(W - 40, 150, 'GO! →', BIG).setOrigin(0.5).setStroke('#000000', 5);
    this.t = 0;
  }

  // un panneau de joueur : à gauche pour J1, à droite pour J2
  #panel(slot) {
    const { width: W } = this.scale;
    const left = slot === 0, x = left ? 6 : W - 6, ox = left ? 0 : 1;
    return {
      slot, left, x,
      name: this.add.text(x, 4, '', TEXT_8).setOrigin(ox, 0),
      score: this.add.text(left ? x + 196 : x - 196, 4, '', TEXT_8).setOrigin(left ? 1 : 0, 0),
      info: this.add.text(left ? x + HP_W + 6 : x - HP_W - 6, 14, '', { ...TEXT_8, color: COLORS.muted }).setOrigin(ox, 0),
      join: this.add.text(x, 9, 'J2 : APPUIE SUR START', { ...TEXT_8, color: '#6fa8dc' }).setOrigin(ox, 0),
    };
  }

  update(time, delta) {
    this.t += delta / 1000;
    const scene = this.game_, session = scene.session;
    const g = this.bars.clear();
    this.panels.forEach((p) => this.#drawPanel(p, session.players[p.slot], g));
    this.#drawBoss(session, g);
    this.#drawMessages(session, scene.paused);
  }

  #drawPanel(panel, player, g) {
    const on = player.active;
    panel.join.setVisible(!on && TWO_PLAYERS && blink(this.t, 1.5));
    panel.name.setVisible(on); panel.score.setVisible(on); panel.info.setVisible(on);
    if (!on) return;
    const h = player.hero, w = WEAPONS[h.weapon];
    panel.name.setText(h.name).setColor(h.color);
    panel.score.setText(String(player.score).padStart(7, '0'));
    const ammo = w.ammo ? `${w.letter} ${h.weaponAmmo}` : 'MEDIATOR';
    const out = player.out ? (blink(this.t) ? 'GAME OVER' : '') : `x${player.lives}  ${ammo}  V${h.bombs}`;
    panel.info.setText(out);
    // les PV
    const bx = panel.left ? panel.x : panel.x - HP_W;
    g.fillStyle(0x000000, 0.8).fillRect(bx - 1, 14, HP_W + 2, 8);
    g.fillStyle(hex(h.hp > h.maxHp * 0.34 ? COLORS.ok : COLORS.ko));
    const fill = Math.round(HP_W * Math.max(0, h.hp) / h.maxHp);
    g.fillRect(panel.left ? bx : bx + HP_W - fill, 15, fill, 6);
  }

  #drawBoss(session, g) {
    // le gros ennemi du moment : le boss, ou la télé géante
    const boss = session.boss?.fighting() ? session.boss : session.world.enemies.find((e) => e.cfg.boss && e.alive());
    this.bossName.setVisible(!!boss);
    if (!boss) return;
    const W = this.scale.width, bw = 220, x = (W - bw) / 2, y = BAND + 15;
    this.bossName.setText(boss.name ?? boss.cfg.name);
    g.fillStyle(0x000000, 0.8).fillRect(x - 1, y - 1, bw + 2, 7);
    g.fillStyle(0x402828).fillRect(x, y, bw, 5);
    g.fillStyle(hex(COLORS.ko)).fillRect(x, y, Math.round(bw * boss.hp / boss.maxHp), 5);
  }

  #drawMessages(session, paused) {
    const m = session.messages[0];
    let text = m?.text ?? '', sub = m?.sub ?? '';
    // la réplique du boss, s'il parle
    const boss = session.boss;
    if (!m && boss?.fighting() && boss.lineT > 0) { text = ''; sub = `« ${boss.line} »`; }
    if (session.state === 'gameover') {
      text = 'GAME OVER';
      sub = `CONTINUE ? ${Math.max(0, Math.ceil(session.continueT))}   (START)`;
    }
    if (paused) { text = 'PAUSE'; sub = 'START POUR REPRENDRE'; }
    this.message.setText(text);
    this.sub.setText(sub).setY(text ? 146 : 120);
    this.go.setVisible(session.go > 0 && blink(this.t, 3));
  }
}
