import { GROUND } from '../../config/screen.js';
import { Terrain } from './Terrain.js';
import { DEPTH } from '../../config/combat.js';
import { Prop } from './Prop.js';

// Un niveau, tel que décrit par son JSON (src/data/levels/, édité dans le jeu) :
//   decor     : { image, segments : [[début dans l'image, largeur], …] } mis bout à bout
//   ground    : ligne de sol [[x, y], …] (par défaut : plat, au niveau du trottoir)
//   blocks, platforms : géométrie libre { x0, x1, top } et { x0, x1, y }
//   props     : éléments de décor { id, type, x, y } (leurs formes rejoignent le terrain)
//   hostages, triggers, boss : lus par la session de jeu
// Un Level neuf repart de zéro (caisses entières…) : on en refait un à chaque partie.
export class Level {
  constructor(def) {
    this.def = def;
    this.image = def.decor.image;                         // clé de texture du décor
    this.segments = def.decor.segments;
    this.width = this.segments.reduce((s, [, w]) => s + w, 0);
    this.props = (def.props ?? []).map((p) => new Prop(p));
    const id = (prefix, i) => `${prefix}${i}`;
    this.terrain = new Terrain({
      blockDepth: DEPTH.block,
      ground: def.ground ?? [[0, GROUND], [this.width, GROUND]],
      blocks: [...(def.blocks ?? []).map((b, i) => ({ id: id('b', i), ...b })), ...this.props.flatMap((p) => p.blocks())],
      platforms: [...(def.platforms ?? []).map((p, i) => ({ id: id('p', i), ...p })), ...this.props.flatMap((p) => p.platforms())],
    });
  }

  // garde un x dans le niveau, à `margin` des bords
  clamp(x, margin = 20) {
    return Math.max(margin, Math.min(this.width - margin, x));
  }
}
