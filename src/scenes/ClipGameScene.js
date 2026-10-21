import Phaser from 'phaser';
import { SCENES } from './keys.js';
import { ClipDirector } from '../game/clip/ClipDirector.js';
import { WorldView } from '../views/WorldView.js';
import metalSlug from '../data/levels/02-metal-slug.json' with { type: 'json' };

// Le niveau du clip : un ClipDirector (la partie jouée toute seule, calée sur le morceau),
// affiché par une WorldView, avec le bandeau du jeu (GameHudScene) en parallèle. Pas de
// bruitages : le morceau seul. L'heure vient de l'horloge du clip (clip.clock).
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
    this.director = new ClipDirector({ level: structuredClone(metalSlug), heroId: this.heroId, clip: this.clip.cfg, start: clock.t });
    this.session = this.director.session;
    this.paused = false;                       // lu par le bandeau
    this.view = new WorldView(this, this.session.world);
    this.scene.launch(SCENES.gameHud, { game: this });
    if (import.meta.env.DEV) window.clipGame = this;
    this.cameras.main.fadeIn(300);
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.director.update(this.clip.clock.t, dt);
    this.session.world.sounds.length = 0;
    this.view.render();
  }
}
