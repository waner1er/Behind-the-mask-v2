// Couleurs et police du jeu (les mêmes que src/styles/base.css).
export const COLORS = {
  text: '#f1dcb4',
  muted: '#a8977a',
  accent: '#f5a524',
  ok: '#8fbf5a',
  ko: '#e0605a',
};

export const FONT = '"Press Start 2P"';
export const TEXT_8 = { fontFamily: FONT, fontSize: '8px', color: COLORS.text };

export const hex = (css) => parseInt(css.slice(1), 16);
