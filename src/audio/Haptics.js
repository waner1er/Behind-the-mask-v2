// Les vibrations du téléphone (navigator.vibrate, Android), sur les sons qui frappent fort.
// Rien là où rien ne sait vibrer (ordinateur, iPhone dans Safari).
const PATTERNS = {
  hit: 15,
  explosion: 35,
  big_explosion: [90, 50, 220],
  mission_complete: [60, 40, 60, 40, 160],
};

export function vibrateFor(sounds) {
  if (!navigator.vibrate) return;
  const strongest = Object.keys(PATTERNS).reverse().find((s) => sounds.includes(s));
  if (strongest) navigator.vibrate(PATTERNS[strongest]);
}
