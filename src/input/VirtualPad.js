// La manette virtuelle du joueur 1 : les commandes tactiles (TouchControls) y appuient et y
// relâchent des actions (left, fire, skate…), et la KeyboardPad du joueur 1 la lit en plus du
// clavier. held : actions tenues ; pressed : appuis pas encore lus (avec leur heure, un appui
// trop vieux, fait pendant un fondu, est oublié).
const FRESH = 300;   // ms

class VirtualPad {
  held = new Set();
  #pressed = new Map();

  press(action) {
    if (!this.held.has(action)) this.#pressed.set(action, performance.now());
    this.held.add(action);
  }

  release(action) {
    this.held.delete(action);
  }

  releaseAll() {
    this.held.clear();
  }

  isDown(action) { return this.held.has(action); }

  // l'appui compte une fois : celui qui le lit le consomme
  justDown(action) {
    const at = this.#pressed.get(action);
    if (at === undefined) return false;
    this.#pressed.delete(action);
    return performance.now() - at < FRESH;
  }
}

export const virtualPad = new VirtualPad();
