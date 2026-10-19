import { animLength } from '../../data/levelSprites.js';

const RUN = 110;   // px/s, il s'enfuit vers la gauche

// les étapes après la libération, dans l'ordre, avec leur anim (atlas du niveau)
const STEPS = [
  { state: 'freed', anim: 'hostage_freed' },
  { state: 'thanks', anim: 'hostage_thanks' },
  { state: 'gift', anim: 'hostage_gift' },
  { state: 'bye', anim: 'hostage_bye', time: 0.4 },
  { state: 'run', anim: 'hostage_run' },
];

// Un habitant branché à l'IA, comme les otages de Metal Slug : un tir ou un contact le
// débranche ; il remercie, tend un bonus (gift), puis s'enfuit en courant.
export class Hostage {
  constructor({ x, y, gift = 'V' }) {
    this.x = x; this.y = y;
    this.gift = gift;
    this.state = 'plugged';
    this.t = 0;
    this.gave = false;
  }

  get anim() {
    return this.state === 'plugged' ? 'hostage_idle' : STEPS.find((s) => s.state === this.state).anim;
  }

  plugged() { return this.state === 'plugged'; }

  box() {
    return { x: this.x - 14, y: this.y - 60, w: 28, h: 60 };
  }

  free() {
    if (!this.plugged()) return false;
    this.state = 'freed'; this.t = 0;
    return true;
  }

  // renvoie true à l'image où il tend son bonus
  update(dt) {
    this.t += dt;
    if (this.state === 'plugged') return false;
    if (this.state === 'run') { this.x -= RUN * dt; return false; }
    const i = STEPS.findIndex((s) => s.state === this.state), step = STEPS[i];
    if (this.t < (step.time ?? animLength(step.anim))) return false;
    this.state = STEPS[i + 1].state; this.t = 0;
    if (step.state === 'gift' && !this.gave) { this.gave = true; return true; }
    return false;
  }
}
