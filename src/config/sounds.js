// Les sons (public/assets/audio/sfx/, fabriqués par tools/build_sounds.py depuis tools/sons.json).
// Bruitages synthétisés, et voix de l'annonceur façon Metal Slug (« HEAVY LARSEN! »).

export const SFX = [
  'pick', 'feedback', 'chord', 'enemy_shot', 'zap', 'hit', 'explosion', 'big_explosion',
  'throw', 'melee', 'pickup', 'crate', 'door', 'water', 'skate',
];
export const VOICES = [
  'mission_1', 'mission_complete', 'game_over', 'continue', 'okay', 'go',
  'larsen', 'power_chord', 'vinyl', 'arnaud', 'baptiste', 'erwan', 'pierre',
  'thank_you', 'back_to_work', 'work_to_survive', 'rocket',
];

export const soundKey = (name) => `sfx-${name}`;
export const soundUrl = (name) => `assets/audio/sfx/${name}.mp3`;

// volume de chaque son (1 par défaut) : les tirs, répétés, restent discrets
export const VOLUMES = {
  pick: 0.3, feedback: 0.25, chord: 0.45, enemy_shot: 0.35, zap: 0.3, hit: 0.5,
  explosion: 0.7, big_explosion: 0.9, throw: 0.4, melee: 0.5, pickup: 0.5, crate: 0.5, door: 0.5, water: 0.25,
};

// le son du tir de chaque arme (héros) ou de chaque munition (ennemis)
export const SHOT_SOUNDS = { pick: 'pick', L: 'feedback', P: 'chord', R: 'throw', bullet: 'enemy_shot', zap: 'zap' };
// l'annonceur, quand on ramasse une lettre
export const PICKUP_VOICES = { L: 'larsen', P: 'power_chord', V: 'vinyl', R: 'rocket' };
