// Physique, tirs et dégâts. Repère : le CRS a 40 PV et un médiator lui en retire 1.

export const JUMP_V = 310;
export const GRAVITY = 720;          // pour les sauts : 67 px de haut, 0,86 s en l'air
export const BOMB_GRAVITY = 480;     // pour les vinyles et les grenades

export const HERO_HP = 100;
export const HIT_W = 13;             // demi-largeur de la boîte de collision
export const FIRE_EVERY = 0.2;
export const PICK_SPEED = 330;
// La profondeur : sur le sol, on se décale vers le fond (min) ou vers l'avant (max) du trottoir,
// jusque sur la chaussée, en marchant avec haut ou bas. Un coup ne touche que ce qui est à moins
// de `hit` pixels de profondeur ; une explosion, à moins de `blast`. Les éléments de décor
// pleins (caisses, barils…) n'arrêtent que ce qui est à moins de `block` de leur file (z = 0).
export const DEPTH = { min: -24, max: 40, speed: 60, hit: 16, blast: 34, block: 14, settle: 90 };
// L'attaque en skate (reprise du premier jeu) : il fonce droit devant pendant `duration` s,
// invulnérable, renverse ce qu'il touche (dmg, une fois par adversaire), puis attend `cooldown`.
export const SKATE = { duration: 0.6, speed: 230, cooldown: 1.2, dmg: 8, reach: 26, push: 22 };
export const HERO_WALK = 78;         // px/s, la marche des héros en jeu
export const LIVES = 3;
export const RESPAWN_AFTER = 2;     // s au sol avant de revenir (s'il reste une vie)

export const PICK_DMG = 1;
export const BULLET_DMG = 4;
export const MELEE_DMG = 5;
export const BOMB_DMG = 8;
export const BLAST_RADIUS = 70;
export const MELEE_REACH = 46;

export const CRS = {
  id: 'crs', name: 'CRS', color: '#8fb0d8',
  side: 'crs', pick: 'bullet', ammo: 'bullet', bullet: 430, muzzleFlash: false,
  hp: 40, fireEvery: 0.5,
  burst: 3, reload: 2.2,             // une rafale de 3 balles, puis il recharge
  walk: 78, run: 124,
  range: 150, melee: 48,             // il se poste à portée de tir, frappe à bout portant
};
