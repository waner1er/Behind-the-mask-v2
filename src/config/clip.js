// Le clip de démo sur « Metal Slug » (piste 2, feat. Guillaume / Circles) : l'écran de garde,
// la sélection, puis la mission METAL SLUG jouée toute seule, calée sur le morceau.
// Tous les temps sont en secondes depuis le début du morceau.
export const CLIP = {
  music: 'assets/audio/02.mp3',
  section: '02.',                     // sa section de paroles.md (le titre)
  duration: 124.16,
  // les touches appuyées sur l'écran de garde et à la sélection : [temps, action]
  pads: [
    [5.2, 'start'],
    [6.6, 'right'], [7.2, 'right'], [7.8, 'right'], [8.6, 'left'], [9.2, 'left'], [9.8, 'left'],
    [10.6, 'fire'],
  ],
  // l'invité, en joueur 2, quand il se met à chanter (1:09) : l'écran de la grosse TV éclate
  // (breach s avant), et il en sort d'un bond. Son atlas à part (tools/build_guest.py) :
  // tee-shirt noir, micro à la main.
  guest: {
    at: 69.5,
    breach: 0.7,
    def: { id: 'guillaume', atlas: 'guest-guillaume', name: 'GUILLAUME', color: '#4de3ff' },
    files: 'assets/sprites/guest/guillaume',      // .png, .json, .atlas.json
    band: 'CIRCLES',
  },
  // Les TV cathodiques (atlas tools/build_clip_props.py), dans la vitrine du vidéoclub du décor
  // (shop : son cadre dans l'image de la rue, à la place de l'affiche Double Dragon). La rue
  // répète le décor : la vitrine revient à chaque tronçon. Dans celle n° bigTv.window, la grosse
  // TV (surmontée de deux petites) retient la caméra jusqu'à l'arrivée de l'invité, qui sort de
  // son écran ; dans les autres, des petites TV empilées.
  tvs: { atlas: 'assets/clip/props', shop: { x: 1409, y: 130, w: 88, h: 102 } },
  bigTv: { window: 1 },
  // Pete et Guillaume ensemble : à ces heures, ils se tournent l'un vers l'autre et lèvent le
  // micro (duo s) ; à son arrivée, Guillaume lance à Pete l'arme qu'il apporte (gift).
  duo: { at: [70.4, 80.8, 91.8], time: 1.3, gift: 'R' },
  // l'allure : la caméra atteint l'arène du boss vers `bossAt`, le Manager tombe vers `bossDown`
  pace: { bossAt: 86, bossDown: 110 },
  // La montée en chaos : de plus en plus d'ennemis en renfort, et des armes de plus en plus
  // fournies, jusqu'au chaos du boss.
  //   reinforce : [heure, un renfort toutes les n s, au plus m ennemis debout]
  //   weapons   : [heure, arme] (munitions toujours rechargées ; 'mix' = L, P et R à tour de rôle)
  reinforce: [[24, 6, 3], [40, 3.5, 5], [60, 2.2, 7], [75, 1.4, 9], [93, 1.1, 10], [108, 0.7, 14]],
  weapons: [[0, 'pick'], [30, 'L'], [52, 'P'], [70, 'R'], [93, 'mix']],
  enemyTypes: ['skinhead', 'skinhead', 'crs'],
  fadeOut: 2,                         // fondu au noir sur la fin du morceau
  // Les paroles : [temps, n° de ligne dans la section] (lignes non vides, à partir de 0),
  // calées sur le morceau avec faster-whisper (horodatage des mots), à ±0,3 s. Pas de karaoké :
  // de temps en temps, un ennemi qui tombe pendant qu'une ligne est chantée la libère en entier.
  lyrics: [
    [17.9, 0], [20.4, 1], [23.6, 2], [25.5, 3],
    [31.9, 4], [35.4, 5],
    [37.2, 0], [39.5, 1], [42.3, 2], [44.3, 3],
    [47.5, 4], [51.0, 5], [54.5, 4], [58.0, 5],
    [69.5, 6], [72.6, 7], [75.9, 8], [78.1, 9],
    [81.0, 10], [83.8, 11], [86.6, 12], [89.4, 13],
    [92.1, 14], [94.9, 15], [98.2, 16], [100.7, 17],
    [103.4, 14], [106.1, 15], [109.2, 16], [111.9, 17],
    [122.6, 17],
  ],
};
