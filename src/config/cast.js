// Les 4 héros, dans l'ordre de l'écran de sélection : Pete (chant), Bapt' (guitare),
// Arnold (basse), Ewan (batterie). id : le nom de leurs images et de leur voix ; color : leur
// nom dans le HUD et la galerie ; pick : l'effet de leur médiator dans le banc d'essai (en jeu,
// il dépend du joueur : orange J1, bleu J2).
export const CAST = [
  { id: 'pierre',   name: 'PETE',     color: '#e0605a', pick: 'pick_blue' },
  { id: 'baptiste', name: "BAPT'",    color: '#6fa8dc', pick: 'pick_blue' },
  { id: 'arnaud',   name: 'ARNOLD',   color: '#8fbf5a', pick: 'pick_orange' },
  { id: 'erwan',    name: 'EWAN',     color: '#d9a066', pick: 'pick_orange' },
];

export const isHero = (id) => CAST.some((c) => c.id === id);
