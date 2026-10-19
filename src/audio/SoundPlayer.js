import { VOLUMES, soundKey } from '../config/sounds.js';

// Joue les sons d'une scène : un nom de src/config/sounds.js, à son volume. Les sons demandés
// pendant une image passent par drain() : un même son n'y est joué qu'une fois (dix tirs à la
// même image font un seul « pick »).
export class SoundPlayer {
  constructor(scene) {
    this.scene = scene;
  }

  play(name) {
    if (!name) return;
    this.scene.sound.play(soundKey(name), { volume: VOLUMES[name] ?? 1 });
  }

  drain(names) {
    new Set(names).forEach((n) => this.play(n));
    names.length = 0;
  }
}
