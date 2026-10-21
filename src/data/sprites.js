// L'index de l'atlas (public/assets/sprites/sprites.json, écrit par tools/build_sprites.py) :
// pour chaque perso, ses anims, sa hauteur, ses hanches ; pour chaque effet, ses images.
// Une image : [x, y, w, h, ax, ay, mx?, my?] ; (ax, ay) = ancrage entre les pieds, (mx, my) =
// bout de l'arme, relatif à l'ancrage. Les persos regardent à droite.
//
// Les mêmes images existent comme frames Phaser dans sprites.atlas.json (tools/phaser_atlas.py),
// nommées persos/{perso}/{anim}/{k} et fx/{effet}/{k} : frameName() retrouve ce nom.

export const ATLAS = 'atlas';

let index = null;
const names = new WeakMap();

export function setSpriteIndex(json) {
  index = json;
  nameFrames(json.persos);
  for (const [name, a] of Object.entries(json.fx)) a.frames.forEach((f, k) => names.set(f, `fx/${name}/${k}`));
}

// Des persos venus d'un autre atlas (l'invité du clip, tools/build_guest.py) : ils rejoignent
// l'index ; leurs frames portent les mêmes noms, dans la texture de leur atlas.
export function addPersos(json) {
  Object.assign(sprites().persos, json.persos);
  nameFrames(json.persos);
}

function nameFrames(persos) {
  for (const [who, p] of Object.entries(persos)) {
    for (const [anim, a] of Object.entries(p.anims)) a.frames.forEach((f, k) => names.set(f, `persos/${who}/${anim}/${k}`));
  }
}

export function sprites() {
  if (!index) throw new Error("L'index des sprites n'est pas chargé (BootScene)");
  return index;
}

export const perso = (id) => sprites().persos[id];
export const fxAnim = (name) => sprites().fx[name];
export const frameName = (fr) => names.get(fr);
