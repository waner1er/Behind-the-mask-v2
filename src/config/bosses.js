// Les boss : un vaisseau (la coque) et ses pièces, chacune avec ses PV et ses images (atlas du
// niveau). Positions en pixels, relatives à l'ancrage de la coque (milieu de son bas) ; le
// vaisseau regarde à gauche.
//   hull   : images de la coque par phase (intacte, abîmée, épave)
//   parts  : { frame, fire?, broken?, dx, dy, hp, box : [x0, y0, x1, y1] relative à la pièce }
//   core   : la pièce à détruire pour gagner ; on ne peut la toucher qu'une fois les armes détruites
export const BOSSES = {
  manager: {
    name: 'THE MANAGER',
    line: 'WORK TO SURVIVE!',
    rage: 'BACK TO WORK!',
    score: 10000,
    partScore: 1000,
    dropEvery: 40,                     // une lettre tombe tous les 40 PV perdus
    dmgFactor: 1.6,                    // chaque coup lui fait 60 % de dégâts en plus
    damagedAt: 0.6,                    // sous 60 % de vie, la coque est abîmée (fumée, flammes)
    hull: { intact: 'manager_hull', damaged: 'manager_hull_damaged', wrecked: 'manager_hull_wrecked', debris: 'manager_debris' },
    hover: { y: 212, amp: 70, speed: 0.35, bob: 5 },     // altitude du bas de la coque, balancement
    parts: {
      cannon: { frame: 'cannon', fire: 'cannon_fire', broken: 'cannon_broken', dx: -112, dy: 24, hp: 45, box: [-40, -58, 34, -10] },
      megaphone: { frame: 'megaphone', fire: 'megaphone_blast', broken: 'megaphone_broken', dx: 6, dy: 24, hp: 45, box: [-38, -58, 34, -6] },
      printer: { frame: 'printer', fire: 'printer_open', dx: 104, dy: 30, hp: 35, box: [-38, -62, 38, -4] },
      pilot: {
        frame: 'manager_idle', order: 'manager_order', hurt: 'manager_hurt', rage: 'manager_rage',
        // le cockpit encaisse aussi les tirs qui montent sous lui, jusqu'au bas de la coque
        dx: -140, dy: -120, hp: 90, box: [-34, -44, 34, 120], core: true,
      },
    },
  },
};
