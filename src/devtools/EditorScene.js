import Phaser from 'phaser';
import { SCENES } from '../scenes/keys.js';
import { W } from '../config/screen.js';
import { PROPS, PROP_TYPES } from '../config/props.js';
import { FONT } from '../config/theme.js';
import { LEVEL_ATLAS, levelFrame } from '../data/levelSprites.js';
import { Prop } from '../game/world/Prop.js';

const SCROLL = 420;      // px/s aux flèches
const SNAP_Y = 6;        // un élément lâché à moins de 6 px du sol s'y pose
const HELP = [
  'EDITEUR  F2 JOUER ICI  S ENREGISTRER  FLECHES/MOLETTE DEFILER',
  PROP_TYPES.slice(0, 5).map((t, i) => `${i + 1} ${t}`).join('  '),
  PROP_TYPES.slice(5).map((t, i) => `${i + 6} ${t}`).join('  '),
  'H HABITANT  F PLATEFORME  T DECLENCHEUR  SUPPR EFFACER  [ ] LARGEUR',
];

// L'éditeur de niveau (dev seulement), par-dessus la partie figée : on voit le décor, la
// géométrie (sol, blocs, plateformes), les éléments, les habitants et les déclencheurs ; on
// les déplace à la souris, on en ajoute au clavier, on enregistre le JSON du niveau
// (src/data/levels/, via le serveur de dev), puis F2 rejoue depuis l'endroit édité.
export class EditorScene extends Phaser.Scene {
  constructor() {
    super(SCENES.editor);
  }

  init({ game, def, cam }) {
    this.gameScene = game;
    this.def = def;
    this.cam = cam;
    this.sel = null;          // { kind : prop | hostage | platform | trigger, item }
    this.drag = null;
  }

  create() {
    this.g = this.add.graphics();
    this.images = [];
    this.labels = [];
    this.ui = this.add.text(6, 4, HELP.join('\n'), { fontFamily: FONT, fontSize: '8px', color: '#ffffff', backgroundColor: '#000000c0', padding: { x: 4, y: 3 }, lineSpacing: 3 })
      .setScrollFactor(0).setDepth(10);
    this.status = this.add.text(6, 330, '', { fontFamily: FONT, fontSize: '8px', color: '#f5a524', backgroundColor: '#000000c0', padding: { x: 4, y: 2 } })
      .setScrollFactor(0).setDepth(10).setOrigin(0, 1);
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT');
    this.input.keyboard.on('keydown', (e) => this.#key(e));
    this.input.on('wheel', (p, objs, dx, dy) => { this.cam += (dx || dy) * 0.8; });
    this.input.on('pointerdown', (p) => this.#press(p));
    this.input.on('pointermove', (p) => this.#move(p));
    this.input.on('pointerup', () => { this.drag = null; });
    this.say('');
  }

  say(text) { this.flash = text; this.flashT = 2.5; }

  get width() { return this.def.decor.segments.reduce((s, [, w]) => s + w, 0); }

  update(time, delta) {
    const dt = delta / 1000;
    if (this.keys.LEFT.isDown) this.cam -= SCROLL * dt;
    if (this.keys.RIGHT.isDown) this.cam += SCROLL * dt;
    this.cam = Math.max(0, Math.min(this.width - W, this.cam));
    this.gameScene.cameras.main.setScroll(Math.round(this.cam), 0);
    this.cameras.main.setScroll(Math.round(this.cam), 0);
    this.flashT -= dt;
    this.#draw();
  }

  // --- souris : choisir, glisser -----------------------------------------------------------
  #world(p) { return { x: Math.round(p.x + this.cam), y: Math.round(p.y) }; }

  #pick(x, y) {
    const d = this.def;
    const inBox = (b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    const trig = (d.triggers ?? []).find((t) => Math.abs(t.at - x) < 8 && y > 40 && y < 70);
    if (trig) return { kind: 'trigger', item: trig };
    const plat = (d.platforms ?? []).find((p) => x >= p.x0 && x <= p.x1 && Math.abs(p.y - y) < 5);
    if (plat) return { kind: 'platform', item: plat };
    const host = (d.hostages ?? []).find((h) => inBox({ x: h.x - 14, y: h.y - 60, w: 28, h: 60 }));
    if (host) return { kind: 'hostage', item: host };
    const prop = [...(d.props ?? [])].reverse().find((p) => inBox(new Prop(p).box()));
    if (prop) return { kind: 'prop', item: prop };
    return null;
  }

  // on retient où on a attrapé l'objet, pour qu'il suive la souris sans sauter
  #press(p) {
    const { x, y } = this.#world(p);
    this.sel = this.#pick(x, y);
    if (!this.sel) return;
    const it = this.sel.item;
    this.drag = { ox: x - (it.at ?? it.x0 ?? it.x), oy: y - (it.y ?? 0) };
  }

  #move(p) {
    this.mouse = this.#world(p);
    if (!this.drag || !this.sel || !p.isDown) return;
    const it = this.sel.item, x = this.mouse.x - this.drag.ox, y = this.mouse.y - this.drag.oy;
    if (this.sel.kind === 'trigger') it.at = Math.max(0, x);
    else if (this.sel.kind === 'platform') { const w = it.x1 - it.x0; it.x0 = x; it.x1 = x + w; it.y = y; }
    else {
      const ground = this.def.ground?.[0]?.[1] ?? 292;
      it.x = x;
      it.y = Math.abs(y - ground) < SNAP_Y ? ground : y;
    }
  }

  // --- clavier : ajouter, effacer, enregistrer, jouer ---------------------------------------
  #key(e) {
    const d = this.def, m = this.mouse ?? { x: Math.round(this.cam + W / 2), y: 292 };
    const n = Number(e.key);
    if (n >= 1 && n <= PROP_TYPES.length) {
      const type = PROP_TYPES[n - 1];
      const item = { id: this.#newId(type), type, x: m.x, y: PROPS[type].platforms && !PROPS[type].blocks ? m.y : 292 };
      (d.props ??= []).push(item);
      this.sel = { kind: 'prop', item };
    } else if (e.key === 'h' || e.key === 'H') {
      const item = { x: m.x, y: 292, gift: 'V' };
      (d.hostages ??= []).push(item);
      this.sel = { kind: 'hostage', item };
    } else if (e.key === 'f' || e.key === 'F') {
      const item = { x0: m.x - 40, x1: m.x + 40, y: m.y };
      (d.platforms ??= []).push(item);
      this.sel = { kind: 'platform', item };
    } else if (e.key === 't' || e.key === 'T') {
      const item = { at: Math.round(this.cam), spawn: [{ type: 'hommetv', from: 'right' }] };
      (d.triggers ??= []).push(item);
      d.triggers.sort((a, b) => a.at - b.at);
      this.sel = { kind: 'trigger', item };
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel) {
      const list = { prop: d.props, hostage: d.hostages, platform: d.platforms, trigger: d.triggers }[this.sel.kind];
      list.splice(list.indexOf(this.sel.item), 1);
      this.sel = null;
    } else if ((e.key === '[' || e.key === ']') && this.sel?.kind === 'platform') {
      const k = e.key === ']' ? 8 : -8;
      this.sel.item.x0 -= k / 2; this.sel.item.x1 += k / 2;
    } else if (e.key === 's' || e.key === 'S') {
      this.#save();
    } else if (e.key === 'F2') {
      this.#play();
    }
  }

  #newId(type) {
    const ids = new Set((this.def.props ?? []).map((p) => p.id));
    let i = 1;
    while (ids.has(`${type}${i}`)) i++;
    return `${type}${i}`;
  }

  // le JSON à enregistrer : les déclencheurs dans l'ordre de la caméra
  #clean() {
    const def = structuredClone(this.def);
    def.triggers?.sort((a, b) => a.at - b.at);
    return def;
  }

  async #save() {
    try {
      const res = await fetch('/__level', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.#clean()),
      });
      this.say(res.ok ? `ENREGISTRÉ : src/data/levels/${this.def.id}.json` : `ERREUR ${res.status}`);
    } catch (err) {
      this.say(`ERREUR : ${err.message}`);
    }
  }

  #play() {
    const game = this.gameScene, def = this.#clean(), start = Math.round(this.cam);
    this.scene.stop();
    game.replay(def, start);
  }

  // --- dessin ------------------------------------------------------------------------------
  #draw() {
    const g = this.g.clear(), d = this.def;
    let used = 0, labels = 0;
    const image = (key, x, y, alpha = 1) => {
      let img = this.images[used++];
      if (!img) this.images.push(img = this.add.image(0, 0, LEVEL_ATLAS, key));
      return img.setFrame(key).setPosition(x, y).setAlpha(alpha).setVisible(true);
    };
    const label = (text, x, y, color = '#ffffff') => {
      let t = this.labels[labels++];
      if (!t) this.labels.push(t = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '8px', backgroundColor: '#000000a0', padding: { x: 2, y: 1 } }).setDepth(5));
      return t.setText(text).setPosition(x, y).setColor(color).setVisible(true);
    };
    // le sol
    g.lineStyle(2, 0xffe14d, 0.9).beginPath();
    (d.ground ?? [[0, 292], [this.width, 292]]).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokePath();
    // les éléments, leurs blocs (orange) et leurs plateformes (cyan)
    for (const p of d.props ?? []) {
      const prop = new Prop(p);
      image(levelFrame(prop.cfg.frame).key, p.x, p.y);
      for (const b of prop.blocks()) g.lineStyle(1, 0xff9a3c).strokeRect(b.x0, b.top, b.x1 - b.x0, p.y - b.top);
      for (const q of prop.platforms()) g.lineStyle(2, 0x4de3ff).lineBetween(q.x0, q.y, q.x1, q.y);
      label(p.id + (p.drop ? ` →${p.drop}` : ''), p.x - 20, p.y + 4, '#cfcfcf');
      if (this.sel?.item === p) { const b = prop.box(); g.lineStyle(2, 0xffffff).strokeRect(b.x, b.y, b.w, b.h); }
    }
    for (const q of d.platforms ?? []) {
      g.lineStyle(this.sel?.item === q ? 4 : 2, 0x4de3ff).lineBetween(q.x0, q.y, q.x1, q.y);
    }
    for (const h of d.hostages ?? []) {
      image(levelFrame('hostage_idle').key, h.x, h.y);
      label(`→${h.gift}`, h.x - 8, h.y + 4, '#8fbf5a');
      if (this.sel?.item === h) g.lineStyle(2, 0xffffff).strokeRect(h.x - 14, h.y - 60, 28, 60);
    }
    // les déclencheurs : où est la caméra quand ils partent, et le bord droit de l'écran à ce moment
    (d.triggers ?? []).forEach((t, i) => {
      const color = t.boss ? 0xff4d4d : t.lock ? 0xff9a3c : 0x8fbf5a;
      g.lineStyle(this.sel?.item === t ? 3 : 1, color, 0.9).lineBetween(t.at, 40, t.at, 342);
      g.lineStyle(1, color, 0.35).lineBetween(t.at + W, 40, t.at + W, 342);
      const what = t.boss ? `BOSS ${t.boss}` : `${(t.spawn ?? []).map((s) => s.type).join(' ')}`;
      label(`T${i + 1}${t.lock ? ' LOCK' : ''} ${what}`, t.at + 3, 48, Phaser.Display.Color.IntegerToColor(color).rgba);
    });
    this.images.slice(used).forEach((im) => im.setVisible(false));
    this.labels.slice(labels).forEach((t) => t.setVisible(false));
    const m = this.mouse;
    const sel = this.sel ? `${this.sel.kind} ${this.sel.item.id ?? ''}` : '';
    this.status.setText(this.flashT > 0 ? this.flash : `x ${m?.x ?? '-'}  y ${m?.y ?? '-'}  caméra ${Math.round(this.cam)}  ${sel}`);
  }
}
