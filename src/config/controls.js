// Les touches de chaque joueur (noms de Phaser.Input.Keyboard.KeyCodes). Une action peut avoir
// plusieurs touches. Clavier AZERTY : les 6 boutons sont le pavé Q S D / W X C, comme les
// boutons d'une borne (rangée du bas = A B C de Metal Slug : tir, saut, vinyle).
export const KEYS_P1 = {
  left: ['LEFT'], right: ['RIGHT'], up: ['UP'], down: ['DOWN'],
  fire: ['W'], jump: ['X'], bomb: ['C'],
  melee: ['Q'], lock: ['S'],          // lock : viser sans bouger
  skate: ['D'],                       // l'attaque en skate du premier jeu : on fonce en renversant tout
  start: ['ENTER'],                   // titre : valider ; en jeu : pause ; game over : continuer
};

// Le joueur 2 viendra plus tard (le jeu sait déjà en gérer deux) : ses touches, et l'interrupteur.
export const TWO_PLAYERS = false;
export const KEYS_P2 = {
  left: ['J'], right: ['L'], up: ['I'], down: ['K'],
  fire: ['NUMPAD_ONE'], jump: ['NUMPAD_TWO'], bomb: ['NUMPAD_THREE'],
  melee: ['NUMPAD_FOUR'], lock: ['NUMPAD_FIVE'], skate: ['NUMPAD_SIX'],
  start: ['NUMPAD_ZERO'],
};

export const PLAYER_KEYS = TWO_PLAYERS ? [KEYS_P1, KEYS_P2] : [KEYS_P1];

// actions qu'on tient, actions qu'on appuie (comptées une fois par appui)
export const HELD = ['fire', 'lock'];
export const PRESSED = ['jump', 'bomb', 'melee', 'skate', 'start'];
