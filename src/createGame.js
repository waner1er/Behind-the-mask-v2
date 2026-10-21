import Phaser from 'phaser';
import { W, H } from './config/screen.js';

// Un jeu Phaser réglé pour notre pixel art : rendu à la résolution native, sans lissage,
// pixels arrondis, agrandi dans son conteneur en gardant les proportions.
// scale : remplace le mode d'agrandissement (la parade suit la largeur de la page) ; extra : le
// reste de la configuration (l'export du clip : sans son, image conservée pour la capture).
export function createGame(parent, scenes, { width = W, height = H, scale = {}, extra = {} } = {}) {
  return new Phaser.Game({
    type: Phaser.WEBGL,
    parent,
    width,
    height,
    backgroundColor: '#000000',
    pixelArt: true,
    banner: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, expandParent: false, ...scale },
    // le pas de temps brut : la démo se rejoue à l'identique, image par image
    fps: { smoothStep: false },
    scene: scenes,
    ...extra,
  });
}
