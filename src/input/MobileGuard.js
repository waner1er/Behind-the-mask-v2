// Sur téléphone (repris du premier jeu) : seuls les commandes et les liens réagissent au doigt,
// sans zoom au double-tap, ni pincement, ni défilement. Au premier appui : plein écran et
// paysage, si le navigateur l'accepte.
export class MobileGuard {
  static CONTROLS = '[data-action], [data-touch-stick], a';

  bind(root = document) {
    root.addEventListener('touchstart', (e) => { if (!e.target.closest('a')) e.preventDefault(); }, { passive: false });
    root.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    root.addEventListener('dblclick', (e) => e.preventDefault());
    root.addEventListener('gesturestart', (e) => e.preventDefault());       // pincement sur iPhone
    root.addEventListener('contextmenu', (e) => { if (!e.target.closest(MobileGuard.CONTROLS)) e.preventDefault(); });
    if (matchMedia('(pointer: coarse)').matches) addEventListener('pointerdown', () => this.#landscape(), { once: true });
  }

  #landscape() {
    Promise.resolve(document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }))
      .then(() => screen.orientation?.lock?.('landscape'))
      .catch(() => {});
  }
}
