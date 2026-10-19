// Les éléments de décor du niveau (atlas du niveau, ancrés au milieu de leur bas). Leur forme
// pour la physique, en pixels relatifs à l'ancrage :
//   blocks    : [x0, x1, hauteur] pleins : on marche dessus, ils arrêtent (une marche basse se monte)
//   platforms : [x0, x1, dy] traversables par le dessous : on y monte en sautant
// hp : il se casse sous les tirs (broken : son image cassée) ; drop : il lâche un bonus ;
// explodes : il explose ; door : porte d'où sortent des ennemis (anim d'ouverture).
export const PROPS = {
  crate: { frame: 'crate', hp: 5, broken: 'crate_broken', blocks: [[-22, 22, 40]], drop: true, score: 50 },
  crates: { frame: 'crates', hp: 9, broken: 'crate_broken', blocks: [[-23, 23, 82]], drop: true, score: 80 },
  barrel: { frame: 'barrel', hp: 4, explodes: true, blocks: [[-19, 19, 60]], score: 50 },
  dumpster: { frame: 'dumpster', platforms: [[-46, 46, -64]] },
  balcony: { frame: 'balcony', platforms: [[-50, 50, -44]] },
  awning: { frame: 'awning', platforms: [[-46, 50, -40]] },
  scaffold: { frame: 'scaffold', platforms: [[-48, 48, -94], [-48, 48, -50]] },
  stoop: { frame: 'stoop', blocks: [[-51, -17, 18], [-17, 17, 36], [17, 51, 54]] },
  garage: { frame: 'garage', door: true },
};

export const PROP_TYPES = Object.keys(PROPS);
