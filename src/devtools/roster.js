import { sprites } from '../data/sprites.js';
import { CAST, isHero } from '../config/cast.js';
import { CRS } from '../config/combat.js';

// Tous les persos de l'atlas, pour les outils : les héros, le CRS, puis les méchants découpés
// par tools/build_sprites.py (ressources/prompts/ennemis.md), dans l'ordre de l'atlas.
export function roster() {
  const { persos } = sprites();
  const villains = Object.keys(persos)
    .filter((id) => !isHero(id) && id !== CRS.id)
    .map((id) => ({ id, name: id.toUpperCase(), color: CRS.color }));
  return [...CAST, CRS, ...villains].filter(({ id }) => persos[id]);
}
