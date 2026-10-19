import { CRS } from './combat.js';

// Les fantassins, tous pilotés par la même IA (game/actors/Enemy.js) avec leurs réglages :
//   sprite : perso de l'atlas          scale : agrandissement (la télé géante)
//   walk/run : vitesses (px/s)         range : il s'arrête et tire à cette distance
//   melee : portée du corps à corps    burst/reload : rafale puis recharge
//   ammo/pick/bullet : projectile tiré (type, effet, vitesse)
//   grenade : il lance aussi des grenades de loin     score : points au K.O.
//   wear : il se dégrade en perdant de la vie (fumée, étincelles, flammes ; les télés)
export const ENEMIES = {
  crs: { ...CRS, sprite: 'crs', grenade: true, score: 100 },
  hommetv: {
    id: 'hommetv', sprite: 'hommetv', name: 'HOMME-TV', color: '#8fb0d8',
    side: 'enemy', ammo: 'zap', pick: 'zap', bullet: 220, muzzleFlash: false,
    hp: 18, fireEvery: 1.1, burst: 1, reload: 1.6,
    walk: 60, run: 95, range: 190, melee: 40, score: 150, wear: true,
  },
  // le mi-boss du niveau 1 : la télé géante « WALK STRAIGHT »
  tvgiant: {
    id: 'tvgiant', sprite: 'hommetv', name: 'WALK STRAIGHT', color: '#8fb0d8', scale: 2,
    side: 'enemy', ammo: 'zap', pick: 'zap', bullet: 260, muzzleFlash: false,
    hp: 160, fireEvery: 0.35, burst: 3, reload: 2.4, fan: [-0.25, 0, 0.25],
    walk: 32, run: 32, range: 260, melee: 70, score: 5000, heavy: 12, boss: true, wear: true,
  },
};
