// L'atlas d'un niveau (public/assets/levels/{niveau}/niveau.*, écrit par tools/build_level.py) :
// décor, habitants, boss. Une anim : { fps, loop, frames: [[x, y, w, h, ax, ay]] }, et chaque
// image existe comme frame Phaser {anim}/{k} dans la texture LEVEL_ATLAS.

export const LEVEL_ATLAS = 'level';

let anims = null;

export function setLevelIndex(json) {
  anims = json.anims;
}

export function levelAnim(name) {
  if (!anims) throw new Error("L'atlas du niveau n'est pas chargé");
  const a = anims[name];
  if (!a) throw new Error(`Image de niveau inconnue : ${name}`);
  return a;
}

// la frame de l'anim à l'instant t (en boucle, ou figée sur la dernière image)
export function levelFrame(name, t = 0) {
  const a = levelAnim(name), n = a.frames.length;
  const k = Math.floor(t * a.fps);
  return { key: `${name}/${a.loop ? k % n : Math.min(n - 1, k)}`, fr: a.frames[a.loop ? k % n : Math.min(n - 1, k)] };
}

// durée d'une anim jouée une fois
export const animLength = (name) => levelAnim(name).frames.length / levelAnim(name).fps;
