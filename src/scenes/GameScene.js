import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { MUSIC } from './BootScene.js';
import { LEVELS } from '../config/levels.js';
import { PLAYER_KEYS } from '../config/controls.js';
import { GameSession } from '../game/session/GameSession.js';
import { KeyboardPad } from '../input/KeyboardPad.js';
import { WorldView } from '../views/WorldView.js';
import { SoundPlayer } from '../audio/SoundPlayer.js';

const MAX_DT = 0.05;   // au-delà (onglet en pause…), le jeu ralentit plutôt que de sauter

// Une partie : une GameSession (la logique), affichée par une WorldView, avec le bandeau en
// scène parallèle et le morceau du niveau en fond. Start (ou Échap) met en pause. En dev, F2 ouvre
// l'éditeur de niveau sur le passage en cours. À la fin (mission accomplie, ou plus de
// crédit), retour à l'écran titre.
export class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENES.game);
  }

  // def : le niveau édité (sinon celui de config/levels.js) ; start : x de départ (éditeur)
  init({ players, level = 0, def, start = 0 }) {
    this.players = players;
    this.levelIndex = level;
    this.def = def ?? structuredClone(LEVELS[level].def);
    this.start = start;
  }

  create() {
    const def = this.def;
    const intro = this.start ? [] : [
      { text: def.mission, sub: def.name, time: 2.6 },
      { text: def.lyrics[0], sub: def.lyrics[1], time: 3 },
    ];
    this.session = new GameSession({ level: def, players: this.players, intro, start: this.start });
    this.view = new WorldView(this, this.session.world);
    this.sfx = new SoundPlayer(this);
    this.pads = PLAYER_KEYS.map((k) => new KeyboardPad(this.input.keyboard, k));
    this.paused = false;
    this.leaving = false;
    this.music = this.sound.add(MUSIC.level(this.levelIndex), { loop: true, volume: 0.7 });
    this.music.play();
    this.events.once('shutdown', () => this.music.stop());
    this.input.keyboard.on('keydown-ESC', () => this.#togglePause());
    if (import.meta.env.DEV) {
      this.input.keyboard.on('keydown-F2', () => this.#openEditor());
      window.game = this;                       // pour la console et les tests
    }
    this.scene.launch(SCENES.gameHud, { game: this });
    this.cameras.main.fadeIn(300);
  }

  #togglePause() {
    this.paused = !this.paused;
    this.paused ? this.music.pause() : this.music.resume();
  }

  // l'éditeur prend la main sur la scène figée, et la relance au passage édité
  #openEditor() {
    this.music.pause();
    this.view.setVisible(false);
    this.scene.pause();
    this.scene.launch(SCENES.editor, { game: this, def: this.def, cam: this.session.world.cam });
  }

  // appelé par l'éditeur en sortant : on rejoue depuis la caméra de l'éditeur
  replay(def, start) {
    this.scene.stop(SCENES.gameHud);
    this.scene.restart({ players: this.players, level: this.levelIndex, def, start });
  }

  update(time, delta) {
    const inputs = this.pads.map((p) => p.read());
    // Start : pause en jeu (au game over, il sert à continuer : c'est la session qui le lit)
    if (inputs.some((i) => i.press.start) && this.session.state === 'play') this.#togglePause();
    if (this.paused) return;
    const dt = Math.min(delta / 1000, MAX_DT);
    this.session.update(dt, inputs);
    this.view.render();
    this.sfx.drain(this.session.world.sounds);
    if (this.session.finished() && !this.leaving) this.#leave();
  }

  #leave() {
    this.leaving = true;
    this.cameras.main.fadeOut(800);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop(SCENES.gameHud);
      this.scene.start(SCENES.title);
    });
  }
}
