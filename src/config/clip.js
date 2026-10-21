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
  // l'invité, en joueur 2, quand il se met à chanter (1:09) : un mur explose devant Pete
  // (breach s avant), les briques volent, et il sort du trou. Son atlas à part
  // (tools/build_guest.py) : tee-shirt noir, micro à la main.
  guest: {
    at: 69.5,
    breach: 0.7,
    def: { id: 'guillaume', atlas: 'guest-guillaume', name: 'GUILLAUME', color: '#4de3ff' },
    files: 'assets/sprites/guest/guillaume',      // .png, .json, .atlas.json
    band: 'CIRCLES',
  },
  // Pete et Guillaume ensemble : à ces heures, ils se tournent l'un vers l'autre et lèvent le
  // micro (duo s) ; à son arrivée, Guillaume lance à Pete l'arme qu'il apporte (gift).
  duo: { at: [70.4, 80.8, 91.8], time: 1.3, gift: 'R' },
  // l'allure : la caméra atteint l'arène du boss vers `bossAt`, le Manager tombe vers `bossDown`
  pace: { bossAt: 91, bossDown: 110 },
  // La montée en chaos : de plus en plus d'ennemis en renfort, et des armes de plus en plus
  // fournies, jusqu'au chaos du boss.
  //   reinforce : [heure, un renfort toutes les n s, au plus m ennemis debout]
  //   weapons   : [heure, arme] (munitions toujours rechargées ; 'mix' = L, P et R à tour de rôle)
  reinforce: [[24, 6, 3], [40, 3.5, 5], [60, 2.2, 7], [75, 1.4, 9], [93, 1.1, 10], [108, 0.7, 14]],
  weapons: [[0, 'pick'], [30, 'L'], [52, 'P'], [70, 'R'], [93, 'mix']],
  enemyTypes: ['skinhead', 'skinhead', 'crs'],
  fadeOut: 2,                         // fondu au noir sur la fin du morceau
};
