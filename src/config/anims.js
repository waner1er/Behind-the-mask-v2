// Les anims attendues sur les planches des héros, et les remplacements tant qu'une anim manque.

// toutes les anims d'un héros, dans l'ordre des planches
export const ORDER = [
  'idle', 'walk', 'jump', 'crouch_down', 'crouch_idle', 'crouch_walk',
  'shoot_fwd', 'shoot_diagup', 'shoot_up', 'shoot_diagdown',
  'jump_shoot_diagdown', 'jump_shoot_down', 'crouch_shoot_fwd', 'jump_shoot_fwd',
  'throw', 'crouch_throw', 'melee', 'crouch_melee', 'hurt', 'death', 'victory',
];

// une anim absente prend la suivante dans cette chaîne
export const FALLBACK = {
  walk: 'idle', run: 'walk', jump: 'idle', crouch_idle: 'idle', crouch_down: 'crouch_idle', crouch_walk: 'crouch_idle',
  shoot_fwd: 'idle', shoot_diagup: 'shoot_fwd', shoot_up: 'shoot_diagup', shoot_diagdown: 'shoot_fwd',
  jump_shoot_fwd: 'shoot_fwd', jump_shoot_diagdown: 'shoot_diagdown', jump_shoot_down: 'jump_shoot_diagdown',
  jump_shoot_diagup: 'shoot_diagup', jump_shoot_up: 'shoot_up',
  crouch_shoot_fwd: 'crouch_idle', throw: 'shoot_fwd', crouch_throw: 'crouch_shoot_fwd',
  melee: 'shoot_fwd', crouch_melee: 'crouch_shoot_fwd', hurt: 'crouch_idle', death: 'idle', victory: 'shoot_up',
  special: 'idle',
};

// Le nom de l'anim à jouer pour `name` : la sienne, sinon son remplacement, sinon null.
export function resolveAnim(perso, name) {
  let n = name;
  while (n && !perso.anims[n]) n = FALLBACK[n];
  return n || null;
}

// les 5 directions de tir vers l'avant (l'image est retournée pour l'arrière)
export const DIRS = { fwd: [1, 0], diagup: [1, -1], up: [0, -1], diagdown: [1, 1], down: [0, 1] };
export const ARROW = { fwd: '→', diagup: '↗', up: '↑', diagdown: '↘', down: '↓' };
