// La géométrie d'un niveau, séparée de son image (PLAN.md § 10). y vers le bas, en pixels.
//   ground    : ligne de sol [[x, y], …] par x croissant ; deux points au même x font une marche
//   blocks    : rectangles pleins { id, x0, x1, top } posés sur le sol (caisses, perron…)
//   platforms : { id, x0, x1, y } traversables par le dessous (balcons, auvents, échafaudages)
// La « hauteur pleine » en x est le plus haut de la ligne de sol et des blocs : on y marche,
// on monte seul une marche de STEP_MAX au plus, au-delà c'est un mur.
export const STEP_MAX = 20;

export class Terrain {
  constructor({ ground, blocks = [], platforms = [], blockDepth = Infinity }) {
    this.ground = ground;
    this.blockDepth = blockDepth;
    this.blocks = blocks;
    this.platforms = platforms;
  }

  // la ligne de sol en x (interpolée ; à une marche, le haut de la marche)
  groundAt(x) {
    const g = this.ground;
    if (x <= g[0][0]) return g[0][1];
    for (let i = 1; i < g.length; i++) {
      const [x0, y0] = g[i - 1], [x1, y1] = g[i];
      if (x <= x1) {
        if (x1 === x0) continue;                        // marche : on prend le segment suivant
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return g[g.length - 1][1];
  }

  // La hauteur pleine en x : le sol ou le haut d'un bloc. z : la profondeur de qui la demande ;
  // un bloc (posé sur la file du milieu) ne compte que pour qui est assez près de cette file.
  solidAt(x, z = 0) {
    let y = this.groundAt(x);
    if (Math.abs(z) > this.blockDepth) return y;
    for (const b of this.blocks) if (x >= b.x0 && x <= b.x1 && b.top < y) y = b.top;
    return y;
  }

  // Où se pose un corps qui tombe de prevY à y en x : le plus haut appui franchi (une
  // plateforme seulement si on était au-dessus d'elle, et si on ne la traverse pas exprès).
  landing(x, prevY, y, dropping = null, z = 0) {
    let best = null;
    const solid = this.solidAt(x, z);
    if (y >= solid) best = solid;
    for (const p of this.platforms) {
      if (x < p.x0 || x > p.x1 || p === dropping) continue;
      if (prevY <= p.y + 0.01 && y >= p.y && (best === null || p.y < best)) best = p.y;
    }
    return best;
  }

  // la plateforme sur laquelle on se tient en (x, y), s'il y en a une
  platformAt(x, y) {
    return this.platforms.find((p) => x >= p.x0 && x <= p.x1 && Math.abs(p.y - y) < 0.5) || null;
  }

  // l'appui le plus haut à l'aplomb de x, sous y (pour l'ombre portée)
  floorBelow(x, y, z = 0) {
    let best = this.solidAt(x, z);
    for (const p of this.platforms) if (x >= p.x0 && x <= p.x1 && p.y >= y - 0.5 && p.y < best) best = p.y;
    return best;
  }

  removeBlocks(id) {
    this.blocks = this.blocks.filter((b) => b.id !== id);
  }
}
