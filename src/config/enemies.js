import { CRS } from './combat.js';

// Les fantassins, tous pilotés par la même IA (game/actors/Enemy.js) avec leurs réglages :
//   sprite : perso de l'atlas          scale : agrandissement (la télé géante)
//   walk/run : vitesses (px/s)         range : il s'arrête et tire à cette distance
//   melee : portée du corps à corps    burst/reload : rafale puis recharge
//   ammo/pick/bullet : projectile tiré (type, effet, vitesse)
//   grenade : il lance aussi de loin (throwFx : son projectile, une grenade sinon ; throwFan :
//     combien à la fois ; throwRange : jusqu'où ; throwEvery : s entre deux)  score : points au K.O.
//   wear : il se dégrade en perdant de la vie (fumée, étincelles, flammes ; les télés)
//   freed : battu, il redevient un habitant qui s'enfuit en courant (le zombie du téléphone)
export const ENEMIES = {
  crs: { ...CRS, sprite: 'crs', grenade: true, score: 100 },
  hommetv: {
    id: 'hommetv', sprite: 'hommetv', name: 'HOMME-TV', color: '#8fb0d8',
    side: 'enemy', ammo: 'zap', pick: 'zap', bullet: 220, muzzleFlash: false,
    hp: 18, fireEvery: 1.1, burst: 1, reload: 1.6,
    walk: 60, run: 95, range: 190, melee: 40, score: 150, wear: true,
  },
  // le bagarreur du niveau 2 (Metal Slug) : il fonce au contact et lance des bouteilles de loin
  skinhead: {
    id: 'skinhead', sprite: 'skinhead', name: 'SKINHEAD', color: '#c8a070',
    side: 'enemy', ammo: 'bullet', pick: 'bullet', bullet: 300, muzzleFlash: false,
    hp: 30, fireEvery: 1, burst: 1, reload: 2,
    walk: 70, run: 130, range: 0, melee: 46, grenade: true, score: 120,
    throwFx: 'bottle', throwRange: 220, throwEvery: 5,
  },
  // Les autres méchants de l'atlas (ressources/prompts/ennemis.md) : chacun son arme de jet
  masculiniste: {
    id: 'masculiniste', sprite: 'masculiniste', name: 'MASCULINISTE', color: '#e8a070',
    side: 'enemy', hp: 34, walk: 60, run: 110, range: 0, melee: 48, score: 150,
    grenade: true, throwFx: 'dumbbell', throwRange: 230, throwEvery: 4,
  },
  affairiste: {
    id: 'affairiste', sprite: 'affairiste', name: 'AFFAIRISTE', color: '#d8c070',
    side: 'enemy', hp: 22, walk: 75, run: 120, range: 0, melee: 42, score: 200,
    grenade: true, throwFx: 'banknote', throwFan: 3, throwRange: 260, throwEvery: 3.5,
  },
  mutant: {
    id: 'mutant', sprite: 'mutant', name: 'MUTANT', color: '#8fd860',
    side: 'enemy', hp: 36, walk: 40, run: 60, range: 0, melee: 50, score: 150,
    grenade: true, throwFx: 'spit', throwRange: 200, throwEvery: 3,
  },
  colosse: {
    id: 'colosse', sprite: 'colosse', name: 'COLOSSE', color: '#c87060',
    side: 'enemy', hp: 90, walk: 35, run: 45, range: 0, melee: 64, score: 600, heavy: 10,
    grenade: true, throwFx: 'barrel', throwRange: 280, throwEvery: 4,
  },
  cyberflic: {
    id: 'cyberflic', sprite: 'cyberflic', name: 'CYBER-FLIC', color: '#e06060',
    side: 'enemy', ammo: 'bullet', pick: 'laser', bullet: 360, muzzleFlash: false,
    hp: 40, fireEvery: 0.5, burst: 3, reload: 1.8,
    walk: 50, run: 80, range: 230, melee: 42, score: 250,
  },
  zombie: {
    id: 'zombie', sprite: 'zombie', name: 'ZOMBIE', color: '#a0b0a0',
    side: 'enemy', hp: 26, walk: 35, run: 55, range: 0, melee: 40, score: 100,
    grenade: true, throwFx: 'phone', throwRange: 200, throwEvery: 5,
    freed: true,                       // battu, il redevient humain et s'enfuit (World)
  },
  ninja: {
    id: 'ninja', sprite: 'ninja', name: 'NINJA', color: '#9090a8',
    side: 'enemy', hp: 15, walk: 110, run: 170, range: 0, melee: 44, score: 200,
    grenade: true, throwFx: 'card', throwFan: 3, throwRange: 250, throwEvery: 2.5,
  },
  // le mi-boss du niveau 1 : la télé géante « WALK STRAIGHT »
  tvgiant: {
    id: 'tvgiant', sprite: 'hommetv', name: 'WALK STRAIGHT', color: '#8fb0d8', scale: 2,
    side: 'enemy', ammo: 'zap', pick: 'zap', bullet: 260, muzzleFlash: false,
    hp: 160, fireEvery: 0.35, burst: 3, reload: 2.4, fan: [-0.25, 0, 0.25],
    walk: 32, run: 32, range: 260, melee: 70, score: 5000, heavy: 12, boss: true, wear: true,
  },
};
