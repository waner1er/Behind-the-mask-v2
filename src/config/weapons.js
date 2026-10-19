// Les armes des héros (PLAN.md § 6). Le médiator est illimité ; les autres ont des munitions,
// et le héros revient au médiator quand elles sont vides. Ramasser la même lettre recharge.
//   every  : cadence (s entre deux tirs)     speed : vitesse du projectile (px/s)
//   dmg    : dégâts par projectile           spread : angles des projectiles d'un tir (rad)
//   jitter : écart aléatoire de l'angle      life : durée de vie (s), portée courte
//   fx     : effet de l'atlas (par joueur : l'orange du J1, le bleu du J2)
//   homing : missile à tête chercheuse (vire vers la cible la plus proche, explose au contact)
export const WEAPONS = {
  pick: { name: 'MEDIATOR', every: 0.2, speed: 330, dmg: 1, spread: [0], fx: ['pick_orange', 'pick_blue'] },
  L: { name: 'LARSEN', letter: 'L', ammo: 150, every: 0.07, speed: 440, dmg: 1, spread: [0], jitter: 0.06, fx: ['pick_orange', 'pick_blue'] },
  P: { name: 'POWER CHORD', letter: 'P', ammo: 25, every: 0.4, speed: 300, dmg: 3, spread: [-0.3, -0.15, 0, 0.15, 0.3], life: 0.45, fx: ['notes', 'notes'] },
  R: { name: 'AMPLI-ROQUETTE', letter: 'R', ammo: 15, every: 0.45, speed: 170, dmg: 0, spread: [0], homing: true, fx: ['bullet', 'bullet'] },
};

// les missiles : virage (rad/s), vitesse de croisière, durée de vie
// power : la force de son explosion, en part de celle d'un vinyle
export const ROCKET = { turn: 5, accel: 420, top: 360, life: 3, power: 0.4 };

// lettres qu'on peut ramasser : une arme, ou des vinyles en plus. weight : sa part dans les
// lettres tirées au sort (caisses, boss) ; les vinyles sortent plus souvent.
export const PICKUPS = {
  L: { weapon: 'L', color: '#e0605a', weight: 1 },
  P: { weapon: 'P', color: '#8fbf5a', weight: 1 },
  V: { bombs: 5, color: '#f5a524', weight: 2 },
  R: { weapon: 'R', color: '#4de3ff', weight: 1 },
};

// Les vinyles se gagnent : on part sans, on en ramasse (lettre V), et une vie perdue n'en rend pas.
export const START_BOMBS = 0;

// une lettre au hasard, selon les poids
export function randomLetter(rnd = Math.random()) {
  const entries = Object.entries(PICKUPS), total = entries.reduce((s, [, p]) => s + p.weight, 0);
  let r = rnd * total;
  for (const [letter, p] of entries) if ((r -= p.weight) < 0) return letter;
  return entries[0][0];
}
