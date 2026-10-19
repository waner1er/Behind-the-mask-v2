import { virtualPad } from './VirtualPad.js';

const DEAD_ZONE = 0.18;              // part de la largeur du stick, au centre, qui ne fait rien
const ARROWS = ['left', 'right', 'up', 'down'];

// Garde le doigt sur l'élément même s'il en sort (certains navigateurs refusent : tant pis, on
// suit alors le doigt par son identifiant).
function capture(el, e) {
  try { el.setPointerCapture(e.pointerId); } catch { /* pas grave */ }
}

// Les commandes tactiles du téléphone (reprises du premier jeu) : un stick à gauche dont le
// bouton suit le pouce, des boutons d'arcade à droite ([data-action]), START. Elles appuient
// sur la manette virtuelle du joueur 1.
//   <div data-touch-stick><span class="touch-stick__knob"></span></div>
//   <button data-action="fire">…</button>
export class TouchControls {
  constructor(root = document) {
    this.root = root;
    this.finger = null;
  }

  bind() {
    const stick = this.root.querySelector('[data-touch-stick]');
    if (stick) this.#bindStick(stick);
    this.root.querySelectorAll('[data-action]').forEach((b) => this.#bindButton(b));
    // l'application passe en arrière-plan : on relâche tout
    addEventListener('blur', () => virtualPad.releaseAll());
    document.addEventListener('visibilitychange', () => virtualPad.releaseAll());
  }

  #bindButton(b) {
    const action = b.dataset.action;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      capture(b, e);
      b.classList.add('is-pressed');
      virtualPad.press(action);
    });
    const up = () => { b.classList.remove('is-pressed'); virtualPad.release(action); };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('lostpointercapture', up);
  }

  #bindStick(stick) {
    stick.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.finger = e.pointerId;
      capture(stick, e);
      this.#steer(stick, e);
    });
    addEventListener('pointermove', (e) => { if (e.pointerId === this.finger) this.#steer(stick, e); }, { passive: true });
    const release = (e) => {
      if (e.pointerId !== this.finger) return;
      this.finger = null;
      ARROWS.forEach((a) => virtualPad.release(a));
      stick.style.setProperty('--kx', '0px');
      stick.style.setProperty('--ky', '0px');
    };
    addEventListener('pointerup', release);
    addEventListener('pointercancel', release);
  }

  // la position du pouce par rapport au centre devient des directions (8 directions)
  #steer(stick, e) {
    const box = stick.getBoundingClientRect();
    const dx = e.clientX - (box.left + box.width / 2), dy = e.clientY - (box.top + box.height / 2);
    const knob = stick.querySelector('.touch-stick__knob');
    const max = box.width / 2 - (knob?.offsetWidth ?? 0) / 2;
    const k = Math.min(1, max / (Math.hypot(dx, dy) || 1));
    stick.style.setProperty('--kx', `${dx * k}px`);
    stick.style.setProperty('--ky', `${dy * k}px`);
    const dead = box.width * DEAD_ZONE;
    const want = { left: dx < -dead, right: dx > dead, up: dy < -dead, down: dy > dead };
    ARROWS.forEach((a) => (want[a] ? virtualPad.press(a) : virtualPad.release(a)));
  }
}
