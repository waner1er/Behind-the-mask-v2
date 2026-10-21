import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { FONT } from '../config/theme.js';
import { DECORS, LEVELS, TITLE_MUSIC } from '../config/levels.js';
import { ATLAS, setSpriteIndex } from '../data/sprites.js';
import { LEVEL_ATLAS, setLevelIndex } from '../data/levelSprites.js';
import { SFX, VOICES, soundKey, soundUrl } from '../config/sounds.js';

const INDEX = 'sprite-index';
const LEVEL_INDEX = 'level-index';
export const MUSIC = { title: 'music-title', level: (i) => `music-${i + 1}` };

// Charge ce qui sert à tout le jeu (atlas, index des sprites, décors, police), puis passe la
// main à la scène `next`. Avec `game: true`, charge aussi le niveau (atlas, morceau) et la
// musique du titre. Le jeu émet 'sprites-ready' (texture de l'atlas) pour les outils.
export class BootScene extends Phaser.Scene {
  constructor({ next, data, game = false } = {}) {
    super(SCENES.boot);
    this.next = next;
    this.nextData = data;
    this.withGame = game;
  }

  preload() {
    this.load.atlas(ATLAS, 'assets/sprites/sprites.png', 'assets/sprites/sprites.atlas.json');
    this.load.json(INDEX, 'assets/sprites/sprites.json');
    for (const [key, url] of Object.entries(DECORS)) this.load.image(key, url);
    if (!this.withGame) return;
    const level = LEVELS[0];
    this.load.atlas(LEVEL_ATLAS, `${level.atlas}.png`, `${level.atlas}.atlas.json`);
    this.load.json(LEVEL_INDEX, `${level.atlas}.json`);
    this.load.audio(MUSIC.level(0), level.music);
    this.load.audio(MUSIC.title, TITLE_MUSIC);
    for (const name of [...SFX, ...VOICES]) this.load.audio(soundKey(name), soundUrl(name));
    // le logo de Vigilante (tools/build_logo.py), pour l'écran de garde
    this.load.image('title-logo', 'assets/title/logo.png');
    // le mur de l'écran de sélection (tools/build_select.py)
    this.load.image('select-fond', 'assets/select/fond.png');
    this.#progressBar();
  }

  #progressBar() {
    const { width: W, height: H } = this.scale;
    const bar = this.add.rectangle(W / 2 - 100, H / 2, 0, 6, 0xf5a524).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2, 202, 8).setStrokeStyle(1, 0xa8977a);
    this.load.on('progress', (p) => bar.setSize(200 * p, 6));
  }

  async create() {
    setSpriteIndex(this.cache.json.get(INDEX));
    if (this.withGame) setLevelIndex(this.cache.json.get(LEVEL_INDEX));
    // le texte du jeu est dessiné en Press Start 2P : il doit être prêt avant le premier texte
    await document.fonts.load(`8px ${FONT}`);
    this.game.events.emit('sprites-ready', this.textures.get(ATLAS).getSourceImage());
    this.scene.start(this.next, this.nextData);
  }
}
